import type { CountryCode, ExtractedPrice, FuelKind } from "../types";

const FUTURE_RE =
  /завтра|с\s+завтрашн|подорожает|подорожание|повыс|вырастет|mâine|maine|majorare|scump(?:ește|este|ire)|aplicabil pentru/i;

const PMR_RE = /приднестров|пмр|шериф|sheriff|тиraspол|тираспол|бендер|рыбниц/i;
const MD_RE = /\banre\b|молдов|chi[sș]in[aă]u|кишин[её]в|лей(?!\w)|(?:\blei\b)/i;

type FuelPattern = { fuel: FuelKind; re: RegExp };

const FUELS: FuelPattern[] = [
  { fuel: "AI98", re: /(?:аи[-\s]?|a[-\s]?|бензин(?:а|ă)?\s*)98/i },
  { fuel: "AI95_PREMIUM", re: /95\s*п|премиум|premium|95p/i },
  { fuel: "AI95", re: /(?:аи[-\s]?|a[-\s]?|бензин(?:а|ă)?\s*|cor\s*)95/i },
  { fuel: "AI92", re: /(?:аи[-\s]?|a[-\s]?|бензин(?:а|ă)?\s*)92/i },
  { fuel: "DIESEL_EURO", re: /дте|д\/?т\s*евро|евро[-\s]?d[tт]|euro\s*d|motorin[aă]\s*euro/i },
  { fuel: "DIESEL", re: /дизель|(?<![еe]вро\s*)д\/?т(?!\s*евро)|motorin[aă]/i },
  { fuel: "LPG", re: /\bgpl\b|\bгаз\b|суг|личефиат/i },
];

function parseAmount(raw: string): number | null {
  const value = Number(raw.replace(",", "."));
  if (!Number.isFinite(value)) {
    return null;
  }
  if (value < 8 || value > 80) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

function countriesOf(text: string): CountryCode[] {
  const pmr = PMR_RE.test(text);
  const md = MD_RE.test(text);
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
  return [];
}

function currencyOf(country: CountryCode): "MDL" | "PRB" {
  return country === "MD" ? "MDL" : "PRB";
}

/**
 * Достаёт цены из поста. Текст новости наружу не уходит.
 */
export const priceExtractor = {
  isPredicted(text: string) {
    return FUTURE_RE.test(text);
  },

  isMoldova(text: string) {
    return countriesOf(text).includes("MD") || MD_RE.test(text);
  },

  isMoldovaTomorrowHike(text: string, channelId?: string) {
    const fromAnre = /anre/i.test(channelId ?? "");
    return this.isPredicted(text) && (this.isMoldova(text) || fromAnre);
  },

  extract(rawText: string): ExtractedPrice[] {
    const text = rawText.replace(/\u00a0/g, " ");
    const countries = countriesOf(text);
    if (!countries.length) {
      return [];
    }

    const predicted = this.isPredicted(text);
    const found: ExtractedPrice[] = [];

    for (const { fuel, re } of FUELS) {
      const fuelMatch = text.match(re);
      if (!fuelMatch || fuelMatch.index === undefined) {
        continue;
      }
      const window = text.slice(fuelMatch.index, fuelMatch.index + 80);
      const amountMatch = window.match(/(\d{1,2}[.,]\d{1,2})/);
      if (!amountMatch) {
        continue;
      }
      const amount = parseAmount(amountMatch[1]!);
      if (amount === null) {
        continue;
      }

      for (const country of countries) {
        if (country === "MD" && (fuel === "AI92" || fuel === "DIESEL")) {
          if (fuel === "DIESEL") {
            found.push({
              country,
              fuel: "DIESEL_EURO",
              amount,
              currencyCode: currencyOf(country),
              confidence: predicted ? 0.7 : 0.85,
              predicted,
            });
          }
          continue;
        }
        found.push({
          country,
          fuel,
          amount,
          currencyCode: currencyOf(country),
          confidence: predicted ? 0.7 : 0.85,
          predicted,
        });
      }
    }

    return found;
  },
};
