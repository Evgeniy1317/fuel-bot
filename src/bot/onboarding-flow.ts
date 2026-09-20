import type { BotContext } from "./context";
import {
  cityExamples,
  cityLabel,
  findCity,
} from "../config/cities";
import {
  FUEL_LABELS,
  GASOLINE_GRADES,
  WATCH_GROUP_LABELS,
  WATCH_GROUPS,
} from "../config/constants";
import type {
  CountryCode,
  FuelKind,
  FuelWatchGroup,
  Locale,
  OnboardingDraft,
  OnboardingStep,
  VehiclePropulsion,
} from "../types";
import { t } from "./i18n";
import {
  backKeyboard,
  countryKeyboard,
  fillGradeKeyboard,
  languageKeyboard,
  propulsionKeyboard,
  skipBackKeyboard,
  trialKeyboard,
  watchGroupsKeyboard,
} from "./keyboards";

function fold(value: string) {
  return value
    .replace(/^✓\s*/, "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function same(a: string, b: string) {
  return fold(a) === fold(b);
}

export function isBack(text: string) {
  return same(text, t("ru", "onboarding.back")) || same(text, t("ro", "onboarding.back"));
}

export function isSkip(text: string) {
  return same(text, t("ru", "onboarding.skip")) || same(text, t("ro", "onboarding.skip"));
}

export function matchLanguage(text: string): Locale | null {
  const n = fold(text);
  if (n === "русский" || n === "russian" || n === "ru") {
    return "ru";
  }
  if (n === "romana" || n === "ro") {
    return "ro";
  }
  return null;
}

export function matchCountry(text: string): CountryCode | null {
  const n = fold(text);
  if (["приднестровье", "transnistria", "pmr", "пмр"].includes(n)) {
    return "PMR";
  }
  if (["молдова", "moldova", "md"].includes(n)) {
    return "MD";
  }
  return null;
}

export function matchPropulsion(text: string): VehiclePropulsion | null {
  const n = fold(text);
  if (["бензин", "benzina", "gasoline"].includes(n)) {
    return "GASOLINE";
  }
  if (["дизель", "motorina", "diesel", "дт"].includes(n)) {
    return "DIESEL";
  }
  if (["газ", "gpl", "lpg"].includes(n)) {
    return "LPG";
  }
  return null;
}

export function matchFillGrade(text: string): FuelKind | null {
  const n = fold(text);
  for (const grade of GASOLINE_GRADES) {
    if (fold(FUEL_LABELS[grade].ru) === n || fold(FUEL_LABELS[grade].ro) === n) {
      return grade;
    }
  }
  if (n === "ai92" || n === "a92" || n === "92") {
    return "AI92";
  }
  if (n === "ai95" || n === "a95" || n === "95") {
    return "AI95";
  }
  if (n === "ai98" || n === "a98" || n === "98") {
    return "AI98";
  }
  return null;
}

export function matchWatchAction(
  text: string,
): FuelWatchGroup | "done" | null {
  if (same(text, t("ru", "onboarding.watchDone")) || same(text, t("ro", "onboarding.watchDone"))) {
    return "done";
  }
  const n = fold(text);
  for (const group of WATCH_GROUPS) {
    if (n === fold(WATCH_GROUP_LABELS[group].ru) || n === fold(WATCH_GROUP_LABELS[group].ro)) {
      return group;
    }
  }
  return null;
}

export function matchTrial(text: string): "yes" | "no" | null {
  if (same(text, t("ru", "onboarding.trialYes")) || same(text, t("ro", "onboarding.trialYes"))) {
    return "yes";
  }
  if (same(text, t("ru", "onboarding.trialNo")) || same(text, t("ro", "onboarding.trialNo"))) {
    return "no";
  }
  return null;
}

export function previousStep(draft: OnboardingDraft): OnboardingStep {
  switch (draft.step) {
    case "country":
      return "language";
    case "city":
      return "country";
    case "car":
      return "city";
    case "propulsion":
      return "car";
    case "fill_grade":
      return "propulsion";
    case "consumption":
      return draft.propulsion === "GASOLINE" ? "fill_grade" : "propulsion";
    case "daily_km":
      return "consumption";
    case "watch_fuels":
      return "daily_km";
    case "trial_consent":
      return "watch_fuels";
    default:
      return "language";
  }
}

export function defaultWatchGroups(propulsion?: VehiclePropulsion): FuelWatchGroup[] {
  if (propulsion === "DIESEL") {
    return ["DIESEL"];
  }
  if (propulsion === "LPG") {
    return ["LPG"];
  }
  return ["GASOLINE"];
}

export function fillGradeForPropulsion(propulsion: VehiclePropulsion): FuelKind | undefined {
  if (propulsion === "DIESEL") {
    return "DIESEL";
  }
  if (propulsion === "LPG") {
    return "LPG";
  }
  return undefined;
}

export function watchListText(locale: Locale, groups: FuelWatchGroup[]) {
  if (!groups.length) {
    return t(locale, "onboarding.watchNone");
  }
  const list = groups.map((group) => WATCH_GROUP_LABELS[group][locale]).join(", ");
  return t(locale, "onboarding.watchSelected", { list });
}

export async function promptOnboarding(ctx: BotContext, draft: OnboardingDraft) {
  const locale = draft.locale ?? ctx.session.locale;
  ctx.session.locale = locale;
  ctx.session.onboarding = draft;

  switch (draft.step) {
    case "language":
      await ctx.reply(t(locale, "start.language"), {
        reply_markup: languageKeyboard(),
      });
      return;
    case "country":
      await ctx.reply(t(locale, "onboarding.country"), {
        reply_markup: countryKeyboard(locale),
      });
      return;
    case "city": {
      const examples = draft.country
        ? cityExamples(draft.country, locale)
        : "";
      await ctx.reply(t(locale, "onboarding.city", { examples }), {
        reply_markup: backKeyboard(locale),
      });
      return;
    }
    case "car":
      await ctx.reply(t(locale, "onboarding.car"), {
        reply_markup: skipBackKeyboard(locale),
      });
      return;
    case "propulsion":
      await ctx.reply(t(locale, "onboarding.propulsion"), {
        reply_markup: propulsionKeyboard(locale),
      });
      return;
    case "fill_grade":
      await ctx.reply(t(locale, "onboarding.fillGrade"), {
        reply_markup: fillGradeKeyboard(locale),
      });
      return;
    case "consumption":
      await ctx.reply(t(locale, "onboarding.consumption"), {
        reply_markup: skipBackKeyboard(locale),
      });
      return;
    case "daily_km":
      await ctx.reply(t(locale, "onboarding.dailyKm"), {
        reply_markup: skipBackKeyboard(locale),
      });
      return;
    case "watch_fuels":
      await ctx.reply(
        `${t(locale, "onboarding.watchFuels")}\n${watchListText(locale, draft.watchGroups ?? [])}`,
        { reply_markup: watchGroupsKeyboard(locale, draft.watchGroups ?? []) },
      );
      return;
    case "trial_consent":
      await ctx.reply(t(locale, "onboarding.trialAsk"), {
        reply_markup: trialKeyboard(locale),
      });
      return;
    default:
      return;
  }
}

export function resolveCity(text: string, country: CountryCode, locale: Locale) {
  const city = findCity(text, country);
  if (city) {
    return { ok: true as const, city, label: cityLabel(city.slug, locale) };
  }
  return {
    ok: false as const,
    examples: cityExamples(country, locale),
  };
}
