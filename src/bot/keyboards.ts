import { InlineKeyboard, Keyboard } from "grammy";
import { ALL_FUELS, FUEL_LABELS } from "../config/constants";
import type { FuelKind, Locale } from "../types";
import { t } from "./i18n";

export function languageKeyboard() {
  return new InlineKeyboard()
    .text("Русский", "lang:ru")
    .text("Română", "lang:ro");
}

export function countryKeyboard(locale: Locale) {
  return new InlineKeyboard()
    .text(t(locale, "onboarding.countryPmr"), "country:PMR")
    .text(t(locale, "onboarding.countryMd"), "country:MD");
}

export function propulsionKeyboard(locale: Locale) {
  return new InlineKeyboard()
    .text(t(locale, "onboarding.gasoline"), "prop:GASOLINE")
    .text(t(locale, "onboarding.lpg"), "prop:LPG");
}

export function fillGradeKeyboard(locale: Locale) {
  const kb = new InlineKeyboard();
  kb.text(FUEL_LABELS.AI92[locale], "grade:AI92")
    .text(FUEL_LABELS.AI95[locale], "grade:AI95")
    .text(FUEL_LABELS.AI98[locale], "grade:AI98");
  return kb;
}

export function watchFuelsKeyboard(locale: Locale, selected: FuelKind[]) {
  const kb = new InlineKeyboard();
  for (const fuel of ALL_FUELS) {
    const mark = selected.includes(fuel) ? "✓ " : "";
    kb.text(`${mark}${FUEL_LABELS[fuel][locale]}`, `watch:${fuel}`).row();
  }
  kb.text(t(locale, "onboarding.watchDone"), "watch:done");
  return kb;
}

export function menuKeyboard(locale: Locale) {
  return new Keyboard()
    .text(t(locale, "menu.savings"))
    .text(t(locale, "menu.budget"))
    .row()
    .text(t(locale, "menu.subscribe"))
    .text(t(locale, "menu.leaderboard"))
    .row()
    .text(t(locale, "menu.settings"))
    .resized();
}
