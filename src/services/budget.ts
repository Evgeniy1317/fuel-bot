import { savingsService } from "./savings";
import type { CountryCode, VehicleInput } from "../types";

/**
 * Топливный бюджет на месяц для водителя / подработчика.
 */
export const budgetService = {
  async monthlyForecast(input: {
    country: CountryCode;
    dailyKm: number;
    vehicle: VehicleInput;
    days?: number;
  }) {
    const estimate = await savingsService.estimate(input);
    if (!estimate) {
      return null;
    }

    const days = input.days ?? 30;
    return {
      days,
      liters: estimate.litersPerDay * days,
      amount: estimate.costPerDay * days,
      currencyCode: estimate.currencyCode,
      // TODO: сценарии «если цена вырастет на X» для такси/доставки
    };
  },
};
