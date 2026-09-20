import { InlineKeyboard, Keyboard } from "grammy";
import {
  FUEL_LABELS,
  dieselGradesFor,
  fuelsForCountry,
  gasolineGradesFor,
} from "../config/constants";
import type { CountryCode, FuelKind, Locale, VehiclePropulsion } from "../types";
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

export function hideReplyKeyboard() {
  return { remove_keyboard: true as const };
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

export function fillGradeKeyboard(
  locale: Locale,
  country?: CountryCode | null,
  propulsion?: VehiclePropulsion,
) {
  const kb = new Keyboard();
  const grades =
    propulsion === "DIESEL" ? dieselGradesFor(country) : gasolineGradesFor(country);
  for (const grade of grades) {
    kb.text(FUEL_LABELS[grade][locale]);
  }
  return navRow(kb, locale, { back: true });
}

export function watchFuelsInline(
  locale: Locale,
  selected: FuelKind[],
  prefix = "watch",
  country?: CountryCode | null,
) {
  const kb = new InlineKeyboard();
  for (const fuel of fuelsForCountry(country)) {
    const label = FUEL_LABELS[fuel][locale];
    const text = selected.includes(fuel) ? `✓ ${label}` : label;
    kb.text(text, `${prefix}:${fuel}`).row();
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

export function menuKeyboard(locale: Locale, opts?: { back?: boolean }) {
  const kb = new Keyboard();
  if (opts?.back) {
    kb.text(t(locale, "onboarding.back")).row();
  }
  return kb
    .text(t(locale, "menu.allPrices"))
    .text(t(locale, "menu.myCity"))
    .row()
    .text(t(locale, "menu.calc"))
    .row()
    .text(t(locale, "menu.savings"))
    .row()
    .text(t(locale, "menu.subscribe"))
    .text(t(locale, "menu.settings"))
    .resized();
}

export function calcFuelKeyboard(
  locale: Locale,
  country?: CountryCode | null,
  fuels?: FuelKind[],
) {
  const kb = new InlineKeyboard();
  for (const fuel of fuels ?? fuelsForCountry(country)) {
    kb.text(FUEL_LABELS[fuel][locale], `calc:${fuel}`).row();
  }
  return kb;
}
