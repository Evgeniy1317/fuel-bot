import { prisma } from "../lib/prisma";
import type { AlertKind, AlertPayload, CountryCode, FuelKind } from "../types";
import type { AlertOutcome, Prisma } from "@prisma/client";

export const alertRepo = {
  async create(input: {
    userId: string;
    kind: AlertKind;
    fuel: FuelKind;
    country: CountryCode;
    payload: AlertPayload;
    currencyCode: string;
    predictedAmount?: number;
    predictionWindowEndsAt?: Date;
  }) {
    return prisma.alert.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        fuel: input.fuel,
        country: input.country,
        payload: input.payload as unknown as Prisma.InputJsonValue,
        currencyCode: input.currencyCode,
        predictedAmount: input.predictedAmount,
        predictionWindowEndsAt: input.predictionWindowEndsAt,
      },
    });
  },

  async pendingWindows(now = new Date()) {
    return prisma.alert.findMany({
      where: {
        outcome: "PENDING",
        predictionWindowEndsAt: { lte: now },
      },
    });
  },

  async markOutcome(id: string, outcome: AlertOutcome, actualAmount?: number) {
    return prisma.alert.update({
      where: { id },
      data: { outcome, actualAmount, resolvedAt: new Date() },
    });
  },
};
