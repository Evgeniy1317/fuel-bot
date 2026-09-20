import { prisma } from "../lib/prisma";
import type { CountryCode, FuelKind, Locale } from "../types";

export const userRepo = {
  async findByTelegramId(telegramId: string) {
    return prisma.user.findUnique({
      where: { telegramId },
      include: { vehicle: true, subscription: true },
    });
  },

  async upsertFromTelegram(input: {
    telegramId: string;
    username?: string;
    firstName?: string;
    locale?: Locale;
  }) {
    return prisma.user.upsert({
      where: { telegramId: input.telegramId },
      create: {
        telegramId: input.telegramId,
        username: input.username,
        firstName: input.firstName,
        locale: input.locale ?? "ru",
      },
      update: {
        username: input.username,
        firstName: input.firstName,
        ...(input.locale ? { locale: input.locale } : {}),
      },
    });
  },

  async completeOnboarding(input: {
    telegramId: string;
    locale: Locale;
    country: CountryCode;
    city: string;
    dailyKm: number | null;
    watchFuels: FuelKind[];
  }) {
    return prisma.user.update({
      where: { telegramId: input.telegramId },
      data: {
        locale: input.locale,
        country: input.country,
        city: input.city,
        dailyKm: input.dailyKm,
        watchFuels: input.watchFuels,
        onboardedAt: new Date(),
      },
    });
  },

  async findWatchers(country: CountryCode, fuel: FuelKind) {
    return prisma.user.findMany({
      where: {
        country,
        onboardedAt: { not: null },
        watchFuels: { has: fuel },
      },
      include: { subscription: true },
    });
  },

  async findOnboardedByCountry(country: CountryCode) {
    return prisma.user.findMany({
      where: { country, onboardedAt: { not: null } },
      include: { subscription: true },
    });
  },
};
