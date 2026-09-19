import type { CountryCode, FuelKind } from "../types";

export interface OfficialPrice {
  country: CountryCode;
  fuel: FuelKind;
  amount: number;
  currencyCode: "MDL" | "PRB";
  observedAt: Date;
}

/**
 * Официальные API, если появятся для MD/PMR.
 * Пока заглушки: вызываются из крона как fallback к новостям.
 */
export const priceProvider = {
  async fetchMoldova(): Promise<OfficialPrice[]> {
    // TODO: подключить API, когда будет известен endpoint
    return [];
  },

  async fetchPmr(): Promise<OfficialPrice[]> {
    // TODO: подключить API / официальный источник ПМР
    return [];
  },

  async fetchAll(): Promise<OfficialPrice[]> {
    const [md, pmr] = await Promise.all([this.fetchMoldova(), this.fetchPmr()]);
    return [...md, ...pmr];
  },
};
