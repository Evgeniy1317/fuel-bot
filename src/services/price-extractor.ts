import type { CountryCode, ExtractedPrice, FuelKind } from "../types";
import { FUEL_TOPIC_RE } from "../config/news-sources";

const FUTURE_RE =
  /завтра|с\s+завтрашн|подорожает|повысится|вырастет|начиная с завтра|aplicabil pentru|mâine|maine|se va scumpi|va (?:crește|scumpi)|începând de mâine/i;

const FUELS: { fuel: FuelKind; re: RegExp }[] = [
  { fuel: "AI98", re: /(?:аи[-\s]?|a[-\s]?|бензин(?:а|ă)?\s*)98/i },
  { fuel: "AI95_PREMIUM", re: /95\s*(?:п|премиум|premium|p\b)/i },
  { fuel: "AI95", re: /(?:аи[-\s]?|a[-\s]?|cor\s*|бензин(?:а|ă)?\s*)95/i },
  { fuel: "AI92", re: /(?:аи[-\s]?|a[-\s]?|бензин(?:а|ă)?\s*)92/i },
  { fuel: "DIESEL_EURO", re: /дте|д\/?т\s*евро|евро[-\s]?d[tт]|euro\s*d|euro\s*diesel|motorin[aă]\s*euro/i },
  { fuel: "DIESEL", re: /дизель|(?<![еe]вро\s*)д\/?т(?!\s*евро)|motorin[aă]|diesel/i },
  { fuel: "LPG", re: /\bgpl\b|\bгаз\b|суг|личефиат|lichefiat/i },
];

export interface ExtractHint {
  country?: CountryCode;
  channel?: string;
}

function parseAmount(raw: string): number | null {
  const value = Number(raw.replace(",", "."));
  if (!Number.isFinite(value) || value < 8 || value > 80) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

function countriesOf(text: string, hint?: ExtractHint): CountryCode[] {
  const pmr = /приднестров|пмр|шериф|sheriff|тираспол|бендер|рыбниц|dniester|transnistr/i.test(text);
  const md = /\banre\b|молдов|chi[sș]in[aă]u|кишин[её]в|лей(?!\w)|(?:\blei\b)|нарэ/i.test(text);
  if (pmr && !md) {
    return ["PMR"];
  }
  if (md && !pmr) {
    return ["MD"];
  }
  if (pmr && md) {
    return ["PMR", "MD"];
  }
  if (/руб/.test(text) && !/лей|lei/i.test(text)) {
    return ["PMR"];
  }
  if (/лей|lei/i.test(text)) {
    return ["MD"];
  }
  return hint?.country ? [hint.country] : [];
}

function currencyOf(country: CountryCode): "MDL" | "PRB" {
  return country === "MD" ? "MDL" : "PRB";
}

function normalizeFuel(country: CountryCode, fuel: FuelKind): FuelKind | null {
  if (country === "MD" && fuel === "AI92") {
    return null;
  }
  if (country === "MD" && fuel === "DIESEL") {
    return "DIESEL_EURO";
  }
  return fuel;
}

function amountNear(text: string, index: number) {
  const window = text.slice(Math.max(0, index - 12), index + 90);
  const match = window.match(/(\d{1,2}[.,]\d{1,2})/);
  return match ? parseAmount(match[1]!) : null;
}

/**
 * Достаёт цены из поста. Текст новости наружу не уходит.
 */
export const priceExtractor = {
  isFuelTopic(text: string) {
    return FUEL_TOPIC_RE.test(text);
  },

  isPredicted(text: string) {
    return FUTURE_RE.test(text);
  },

  isMoldova(text: string, hint?: ExtractHint) {
    return countriesOf(text, hint).includes("MD");
  },

  isMoldovaTomorrowHike(text: string, hint?: ExtractHint) {
    const fromAnre = /anre/i.test(hint?.channel ?? "");
    return this.isPredicted(text) && (this.isMoldova(text, hint) || fromAnre);
  },

  extract(rawText: string, hint?: ExtractHint): ExtractedPrice[] {
    const text = rawText.replace(/\u00a0/g, " ");
    if (!this.isFuelTopic(text)) {
      return [];
    }

    const countries = countriesOf(text, hint);
    if (!countries.length) {
      return [];
    }

    const predicted = this.isPredicted(text);
    const found: ExtractedPrice[] = [];
    const seen = new Set<string>();

    for (const { fuel, re } of FUELS) {
      const copy = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
      let match: RegExpExecArray | null;
      while ((match = copy.exec(text))) {
        const amount = amountNear(text, match.index);
        if (amount === null) {
          continue;
        }
        for (const country of countries) {
          const kind = normalizeFuel(country, fuel);
          if (!kind) {
            continue;
          }
          const key = `${country}:${kind}:${amount}:${predicted ? 1 : 0}`;
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          found.push({
            country,
            fuel: kind,
            amount,
            currencyCode: currencyOf(country),
            confidence: predicted ? 0.72 : 0.86,
            predicted,
          });
        }
      }
    }

    return found;
  },
};
