import { priceRepo } from "../repositories/price.repo";
import type { CountryCode, FuelKind, VehicleInput } from "../types";

export interface SavingsEstimate {
  litersPerDay: number;
  costPerDay: number;
  costPerMonth: number;
  currencyCode: string;
  vsPrevious?: number;
}

/**
 * Персональный расчёт: расход авто × км/день × цена топлива в регионе.
 */
export const savingsService = {
  litersPerDay(dailyKm: number, litersPer100km: number) {
    return (dailyKm * litersPer100km) / 100;
  },

  async estimate(input: {
    country: CountryCode;
    dailyKm: number;
    vehicle: VehicleInput;
  }): Promise<SavingsEstimate | null> {
    const latest = await priceRepo.latest(input.country, input.vehicle.fillGrade);
    if (!latest) {
      return null;
    }

    const liters = this.litersPerDay(input.dailyKm, input.vehicle.litersPer100km);
    const price = Number(latest.amount);
    const costPerDay = liters * price;

    return {
      litersPerDay: liters,
      costPerDay,
      costPerMonth: costPerDay * 30,
      currencyCode: latest.currencyCode,
      // TODO: сравнить с предыдущей ценой / «если заправился вчера vs сегодня»
      vsPrevious: undefined,
    };
  },

  /**
   * TODO: зафиксировать дневную экономию в SavingsRecord для рейтинга.
   * Экономия = (цена без алерта − цена после алерта) × литры.
   */
  async recordDaily(_userId: string): Promise<void> {
    throw new Error("TODO: daily savings snapshot");
  },
};
