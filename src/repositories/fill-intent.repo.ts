import { prisma } from "../lib/prisma";
import type { CountryCode, FuelKind } from "../types";

export const fillIntentRepo = {
  async replaceOffer(input: {
    userId: string;
    fuel: FuelKind;
    country: CountryCode;
    priceAtFill: number;
    currencyCode: string;
  }) {
    await prisma.fillIntent.updateMany({
      where: { userId: input.userId, status: "OFFERED" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    return prisma.fillIntent.create({
      data: {
        userId: input.userId,
        fuel: input.fuel,
        country: input.country,
        priceAtFill: input.priceAtFill,
        currencyCode: input.currencyCode,
        status: "OFFERED",
      },
    });
  },

  async latestOffered(userId: string) {
    return prisma.fillIntent.findFirst({
      where: { userId, status: "OFFERED" },
      orderBy: { createdAt: "desc" },
    });
  },

  async confirmLatest(userId: string) {
    const offered = await this.latestOffered(userId);
    if (!offered) {
      return null;
    }
    return prisma.fillIntent.update({
      where: { id: offered.id },
      data: { status: "CONFIRMED" },
    });
  },

  async declineLatest(userId: string) {
    const offered = await this.latestOffered(userId);
    if (!offered) {
      return null;
    }
    return prisma.fillIntent.update({
      where: { id: offered.id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  },

  async findConfirmed(country: CountryCode, fuel: FuelKind) {
    return prisma.fillIntent.findMany({
      where: { country, fuel, status: "CONFIRMED" },
      include: {
        user: { include: { vehicle: true } },
      },
    });
  },

  async resolve(id: string) {
    return prisma.fillIntent.update({
      where: { id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  },
};
