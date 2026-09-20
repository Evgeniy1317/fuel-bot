import type { BotContext } from "./context";
import {
  cityExamples,
  cityLabel,
  findCity,
} from "../config/cities";
import {
  FUEL_LABELS,
  GASOLINE_GRADES,
} from "../config/constants";
import type {
  CountryCode,
  FuelKind,
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
  watchFuelsInline,
} from "./keyboards";

function fold(value: string) {
  return value
    .replace(/^✓\s*/, "")
    .replace(/^⬅️\s*/, "")
    .replace(/^←\s*/, "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/[\p{S}\p{P}\p{C}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
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
  if (
    same(text, "Русский") ||
    same(text, "🇷🇺 Русский") ||
    same(text, "Russian") ||
    fold(text) === "ru"
  ) {
    return "ru";
  }
  if (
    same(text, "Română") ||
    same(text, "🇷🇴 Română") ||
    same(text, "Romana") ||
    fold(text) === "ro"
  ) {
    return "ro";
  }
  return null;
}

export function matchCountry(text: string): CountryCode | null {
  if (
    same(text, t("ru", "onboarding.countryPmr")) ||
    same(text, t("ro", "onboarding.countryPmr")) ||
    ["pmr", "пмр"].includes(fold(text))
  ) {
    return "PMR";
  }
  if (
    same(text, t("ru", "onboarding.countryMd")) ||
    same(text, t("ro", "onboarding.countryMd")) ||
    ["md"].includes(fold(text))
  ) {
    return "MD";
  }
  return null;
}

export function matchPropulsion(text: string): VehiclePropulsion | null {
  if (
    same(text, t("ru", "onboarding.gasoline")) ||
    same(text, t("ro", "onboarding.gasoline"))
  ) {
    return "GASOLINE";
  }
  if (
    same(text, t("ru", "onboarding.diesel")) ||
    same(text, t("ro", "onboarding.diesel"))
  ) {
    return "DIESEL";
  }
  if (same(text, t("ru", "onboarding.lpg")) || same(text, t("ro", "onboarding.lpg"))) {
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

export function matchTrial(text: string): "yes" | "no" | null {
  if (same(text, t("ru", "onboarding.trialYes")) || same(text, t("ro", "onboarding.trialYes"))) {
    return "yes";
  }
  if (same(text, t("ru", "onboarding.trialNo")) || same(text, t("ro", "onboarding.trialNo"))) {
    return "no";
  }
  return null;
}

export function matchFillToday(text: string): "yes" | "no" | null {
  if (same(text, t("ru", "alert.fillYes")) || same(text, t("ro", "alert.fillYes"))) {
    return "yes";
  }
  if (same(text, t("ru", "alert.fillNo")) || same(text, t("ro", "alert.fillNo"))) {
    return "no";
  }
  return null;
}

export function matchNeedProfile(text: string): "yes" | "back" | null {
  if (same(text, t("ru", "savings.needYes")) || same(text, t("ro", "savings.needYes"))) {
    return "yes";
  }
  if (isBack(text)) {
    return "back";
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
    case "propulsion":
      return "city";
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

export function defaultWatchFuels(fillGrade?: FuelKind): FuelKind[] {
  return fillGrade ? [fillGrade] : [];
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

export function watchListText(locale: Locale, fuels: FuelKind[]) {
  if (!fuels.length) {
    return t(locale, "onboarding.watchNone");
  }
  const list = fuels.map((fuel) => FUEL_LABELS[fuel][locale]).join(", ");
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
      await ctx.reply(t(locale, "onboarding.watchFuels"), {
        reply_markup: watchFuelsInline(locale, draft.watchFuels ?? []),
      });
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
