import { FuelKind } from "../types/fuel";

export const PRODUCT_NAME = {
  ru: "Заправься умно",
  ro: "Alimentează-te inteligent",
} as const;

export const FUEL_LABELS: Record<FuelKind, { ru: string; ro: string }> = {
  AI92: { ru: "АИ-92", ro: "A-92" },
  AI95: { ru: "АИ-95", ro: "A-95" },
  AI98: { ru: "АИ-98", ro: "A-98" },
  DIESEL: { ru: "ДТ", ro: "Motorină" },
  LPG: { ru: "Газ (СУГ)", ro: "GPL" },
};

export const GASOLINE_GRADES: FuelKind[] = ["AI92", "AI95", "AI98"];
export const ALL_FUELS: FuelKind[] = ["AI92", "AI95", "AI98", "DIESEL", "LPG"];
