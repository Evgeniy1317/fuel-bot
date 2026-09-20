import { InlineKeyboard, Keyboard } from "grammy";
import {
  ALL_FUELS,
  FUEL_LABELS,
  GASOLINE_GRADES,
} from "../config/constants";
import type { CountryCode, FuelKind, Locale } from "../types";
import { citiesIn } from "../config/cities";
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

export function pmrCityKeyboard(locale: Locale) {
  const kb = new Keyboard();
  const cities = citiesIn("PMR");
  cities.forEach((entry, index) => {
    kb.text(locale === "ro" ? entry.nameRo : entry.nameRu);
    if (index % 2 === 1) {
      kb.row();
    }
  });
  if (cities.length % 2 === 1) {
    kb.row();
  }
  return navRow(kb, locale, { back: true });
}

export function backKeyboard(locale: Locale) {
  return new Keyboard().text(t(locale, "onboarding.back")).resized();
}

export function cityKeyboard(locale: Locale, country: CountryCode) {
  return country === "PMR" ? pmrCityKeyboard(locale) : backKeyboard(locale);
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

export function watchFuelsInline(locale: Locale, selected: FuelKind[], prefix = "watch") {
  const kb = new InlineKeyboard();
  for (const fuel of ALL_FUELS) {
    const mark = selected.includes(fuel) ? "✅" : "⬜️";
    kb.text(`${mark} ${FUEL_LABELS[fuel][locale]}`, `${prefix}:${fuel}`).row();
  }
  kb.text(t(locale, "onboarding.watchDone"), `${prefix}:done`).row();
  kb.text(t(locale, "onboarding.back"), `${prefix}:back`);
  return kb;
}

export function settingsEditKeyboard(locale: Locale) {
  return new InlineKeyboard()
    .text(t(locale, "settings.language"), "set:language")
    .text(t(locale, "settings.country"), "set:country")
    .row()
    .text(t(locale, "settings.city"), "set:city")
    .text(t(locale, "settings.fuel"), "set:fuel")
    .row()
    .text(t(locale, "settings.consumption"), "set:consumption")
    .text(t(locale, "settings.dailyKm"), "set:daily_km")
    .row()
    .text(t(locale, "settings.alerts"), "set:alerts")
    .row()
    .text(t(locale, "settings.close"), "set:close");
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
