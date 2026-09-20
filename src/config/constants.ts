import type { CountryCode, FuelKind, FuelWatchGroup } from "../types";

export const PRODUCT_NAME = {
  ru: "Заправься умно",
  ro: "Alimentează-te inteligent",
} as const;

export const FUEL_LABELS: Record<FuelKind, { ru: string; ro: string }> = {
  AI92: { ru: "АИ-92", ro: "A-92" },
  AI95: { ru: "АИ-95", ro: "A-95" },
  AI98: { ru: "АИ-98", ro: "A-98" },
  DIESEL: { ru: "Дизель", ro: "Motorină" },
  LPG: { ru: "Газ", ro: "GPL" },
};

export const WATCH_GROUP_LABELS: Record<FuelWatchGroup, { ru: string; ro: string }> = {
  GASOLINE: { ru: "Бензин", ro: "Benzină" },
  DIESEL: { ru: "Дизель", ro: "Motorină" },
  LPG: { ru: "Газ", ro: "GPL" },
};

export const WATCH_GROUP_FUELS: Record<FuelWatchGroup, FuelKind[]> = {
  GASOLINE: ["AI92", "AI95", "AI98"],
  DIESEL: ["DIESEL"],
  LPG: ["LPG"],
};

export const WATCH_GROUPS: FuelWatchGroup[] = ["GASOLINE", "DIESEL", "LPG"];

export const GASOLINE_GRADES: FuelKind[] = ["AI92", "AI95", "AI98"];
export const ALL_FUELS: FuelKind[] = ["AI92", "AI95", "AI98", "DIESEL", "LPG"];

export function expandWatchGroups(groups: FuelWatchGroup[]): FuelKind[] {
  return groups.flatMap((group) => WATCH_GROUP_FUELS[group]);
}

export function groupsFromFuels(fuels: FuelKind[]): FuelWatchGroup[] {
  const groups: FuelWatchGroup[] = [];
  if (fuels.some((fuel) => GASOLINE_GRADES.includes(fuel))) {
    groups.push("GASOLINE");
  }
  if (fuels.includes("DIESEL")) {
    groups.push("DIESEL");
  }
  if (fuels.includes("LPG")) {
    groups.push("LPG");
  }
  return groups;
}
