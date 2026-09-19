import type { CountryCode, FuelKind } from "../types";

export type PriceKind = "SPOT" | "CEILING";

export interface OfficialPrice {
  country: CountryCode;
  fuel: FuelKind;
  amount: number;
  currencyCode: "MDL" | "PRB";
  observedAt: Date;
  kind?: PriceKind;
  /** С какого момента потолок/прогноз действует (для ANRE «на завтра»). */
  effectiveFrom?: Date;
}
