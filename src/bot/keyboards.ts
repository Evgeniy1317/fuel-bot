import { Keyboard } from "grammy";
import {
  FUEL_LABELS,
  GASOLINE_GRADES,
  WATCH_GROUP_LABELS,
  WATCH_GROUPS,
} from "../config/constants";
import type { FuelWatchGroup, Locale } from "../types";
import { t } from "./i18n";

function navRow(kb: Keyboard, locale: Locale, opts: { skip?: boolean; back?: boolean }) {
  if (opts.skip) {
    kb.row().text(t(locale, "onboarding.skip"));
  }
  if (opts.back) {
    kb.row().text(t(locale, "onboarding.back"));
  }
  return kb.resized();
}

export function languageKeyboard() {
  return new Keyboard().text("🇷🇺 Русский").text("🇷🇴 Română").resized();
}

export function countryKeyboard(locale: Locale) {
  return navRow(
    new Keyboard()
      .text(t(locale, "onboarding.countryPmr"))
      .text(t(locale, "onboarding.countryMd")),
    locale,
    { back: true },
  );
}

export function backKeyboard(locale: Locale) {
  return new Keyboard().text(t(locale, "onboarding.back")).resized();
}

export function skipBackKeyboard(locale: Locale) {
  return new Keyboard()
    .text(t(locale, "onboarding.skip"))
    .row()
    .text(t(locale, "onboarding.back"))
    .resized();
}

export function propulsionKeyboard(locale: Locale) {
  return navRow(
    new Keyboard()
      .text(t(locale, "onboarding.gasoline"))
      .text(t(locale, "onboarding.diesel"))
      .text(t(locale, "onboarding.lpg")),
    locale,
    { back: true },
  );
}

export function fillGradeKeyboard(locale: Locale) {
  const kb = new Keyboard();
  for (const grade of GASOLINE_GRADES) {
    kb.text(FUEL_LABELS[grade][locale]);
  }
  return navRow(kb, locale, { back: true });
}

export function watchGroupsKeyboard(locale: Locale, selected: FuelWatchGroup[]) {
  const kb = new Keyboard();
  for (const group of WATCH_GROUPS) {
    const mark = selected.includes(group) ? "✓ " : "";
    kb.text(`${mark}${WATCH_GROUP_LABELS[group][locale]}`).row();
  }
  kb.text(t(locale, "onboarding.watchDone"));
  return navRow(kb, locale, { back: true });
}

export function trialKeyboard(locale: Locale) {
  return navRow(
    new Keyboard()
      .text(t(locale, "onboarding.trialYes"))
      .row()
      .text(t(locale, "onboarding.trialNo")),
    locale,
    { back: true },
  );
}

export function trialChoiceKeyboard(locale: Locale) {
  return new Keyboard()
    .text(t(locale, "onboarding.trialYes"))
    .row()
    .text(t(locale, "onboarding.trialNo"))
    .resized();
}

export function fillTodayKeyboard(locale: Locale) {
  return new Keyboard()
    .text(t(locale, "alert.fillYes"))
    .text(t(locale, "alert.fillNo"))
    .resized();
}

export function needProfileKeyboard(locale: Locale) {
  return new Keyboard()
    .text(t(locale, "savings.needYes"))
    .row()
    .text(t(locale, "onboarding.back"))
    .resized();
}

export function menuKeyboard(locale: Locale) {
  return new Keyboard()
    .text(t(locale, "menu.savings"))
    .row()
    .text(t(locale, "menu.subscribe"))
    .text(t(locale, "menu.settings"))
    .resized();
}
