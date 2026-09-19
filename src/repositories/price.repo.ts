import { prisma } from "../lib/prisma";
import type { CountryCode, FuelKind } from "../types";
import type { PriceSource } from "@prisma/client";

export const priceRepo = {
  async latest(country: CountryCode, fuel: FuelKind) {
    return prisma.priceHistory.findFirst({
      where: { region: { country }, fuel },
      orderBy: { observedAt: "desc" },
    });
  },

  async insert(input: {
    country: CountryCode;
    fuel: FuelKind;
    amount: number;
    currencyCode: string;
    source: PriceSource;
    sourceRef?: string;
    publishedAt?: Date;
  }) {
    const region = await prisma.region.findUniqueOrThrow({
      where: { country: input.country },
    });

    return prisma.priceHistory.create({
      data: {
        regionId: region.id,
        fuel: input.fuel,
        amount: input.amount,
        currencyCode: input.currencyCode,
        source: input.source,
        sourceRef: input.sourceRef,
        publishedAt: input.publishedAt,
      },
    });
  },
};
