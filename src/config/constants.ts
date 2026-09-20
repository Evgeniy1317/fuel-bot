import type { CountryCode, FuelKind, FuelWatchGroup } from "../types";

export const PRODUCT_NAME = {
  ru: "Заправься умно",
  ro: "Alimentează-te inteligent",
} as const;

export const FUEL_LABELS: Record<FuelKind, { ru: string; ro: string }> = {
  AI92: { ru: "АИ-92", ro: "A-92" },
  AI95: { ru: "АИ-95", ro: "A-95" },
  AI95_PREMIUM: { ru: "АИ-95 Premium", ro: "A-95 Premium" },
  AI98: { ru: "АИ-98", ro: "A-98" },
  DIESEL: { ru: "ДТ", ro: "DT" },
  DIESEL_EURO: { ru: "ДТ Евро", ro: "DT Euro" },
  LPG: { ru: "Газ", ro: "GPL" },
};

export const WATCH_GROUP_LABELS: Record<FuelWatchGroup, { ru: string; ro: string }> = {
  GASOLINE: { ru: "Бензин", ro: "Benzină" },
  DIESEL: { ru: "Дизель", ro: "Motorină" },
  LPG: { ru: "Газ", ro: "GPL" },
};

export const WATCH_GROUP_FUELS: Record<FuelWatchGroup, FuelKind[]> = {
  GASOLINE: ["AI95", "AI95_PREMIUM", "AI98"],
  DIESEL: ["DIESEL", "DIESEL_EURO"],
  LPG: ["LPG"],
};

export const WATCH_GROUPS: FuelWatchGroup[] = ["GASOLINE", "DIESEL", "LPG"];

export const GASOLINE_GRADES: FuelKind[] = ["AI95", "AI95_PREMIUM", "AI98"];
export const DIESEL_GRADES: FuelKind[] = ["DIESEL", "DIESEL_EURO"];
export const ALL_FUELS: FuelKind[] = [
  "AI95",
  "AI95_PREMIUM",
  "AI98",
  "DIESEL",
  "DIESEL_EURO",
  "LPG",
];

/** ПМР Sheriff: 95 / 95 Premium / 98 / ДТ / ДТ Евро. Молдова: 95 / Premium / 98 / ДТ Евро / GPL. */
export function fuelsForCountry(country?: CountryCode | null): FuelKind[] {
  if (country === "PMR") {
    return ["AI95", "AI95_PREMIUM", "AI98", "DIESEL", "DIESEL_EURO"];
  }
  return ["AI95", "AI95_PREMIUM", "AI98", "DIESEL_EURO", "LPG"];
}

export function gasolineGradesFor(_country?: CountryCode | null): FuelKind[] {
  return ["AI95", "AI95_PREMIUM", "AI98"];
}

export function dieselGradesFor(country?: CountryCode | null): FuelKind[] {
  if (country === "MD") {
    return ["DIESEL_EURO"];
  }
  return ["DIESEL", "DIESEL_EURO"];
}

export function toggleFuel(
  selected: FuelKind[],
  fuel: FuelKind,
  country?: CountryCode | null,
): FuelKind[] {
  const allowed = fuelsForCountry(country);
  const set = new Set(selected);
  if (set.has(fuel)) {
    set.delete(fuel);
  } else if (allowed.includes(fuel)) {
    set.add(fuel);
  }
  return allowed.filter((item) => set.has(item));
}

export function groupsFromFuels(fuels: FuelKind[]): FuelWatchGroup[] {
  const groups: FuelWatchGroup[] = [];
  if (fuels.some((fuel) => GASOLINE_GRADES.includes(fuel))) {
    groups.push("GASOLINE");
  }
  if (fuels.some((fuel) => DIESEL_GRADES.includes(fuel))) {
    groups.push("DIESEL");
  }
  if (fuels.includes("LPG")) {
    groups.push("LPG");
  }
  return groups;
}
