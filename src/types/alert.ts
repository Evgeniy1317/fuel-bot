import type { CountryCode, FuelKind } from "./fuel";

export type AlertKind = "PRICE_UP" | "PRICE_DOWN" | "PREDICTED_HIKE";

/** Структурированный алерт: подставляем цифры из новости, текст новости не копируем. */
export interface AlertPayload {
  kind: AlertKind;
  country: CountryCode;
  fuel: FuelKind;
  amount: number;
  currencyCode: string;
  previousAmount?: number;
  delta?: number;
  windowHours?: number;
  /** Соседний рынок / мягкий намёк — без суммы в гарантии. */
  advisory?: boolean;
}

export interface ExtractedPrice {
  country: CountryCode;
  fuel: FuelKind;
  amount: number;
  currencyCode: "MDL" | "PRB";
  confidence: number;
  publishedAt?: Date;
  predicted?: boolean;
}
