import { fetchAnreCeiling } from "../providers/anre-ceiling";
import { fetchAnreStations } from "../providers/anre-stations";
import { fetchSheriffPrices } from "../providers/sheriff";
import type { OfficialPrice } from "../types/price";

export type { OfficialPrice } from "../types/price";

export const priceProvider = {
  async fetchMoldova(): Promise<OfficialPrice[]> {
    return fetchAnreStations();
  },

  async fetchMoldovaCeiling(): Promise<OfficialPrice[]> {
    return fetchAnreCeiling();
  },

  async fetchPmr(): Promise<OfficialPrice[]> {
    return fetchSheriffPrices();
  },

  async fetchSpot(): Promise<OfficialPrice[]> {
    const [md, pmr] = await Promise.all([
      this.fetchMoldova(),
      this.fetchPmr(),
    ]);
    return [...md, ...pmr];
  },
};
