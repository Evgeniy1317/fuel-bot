import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export const savingsRepo = {
  async add(input: {
    userId: string;
    amount: number;
    currencyCode: string;
    liters: number;
    periodStart: Date;
    periodEnd: Date;
    meta?: Record<string, unknown>;
  }) {
    return prisma.savingsRecord.create({
      data: {
        ...input,
        meta: input.meta as Prisma.InputJsonValue | undefined,
      },
    });
  },

  async sumByUser(userId: string) {
    const result = await prisma.savingsRecord.aggregate({
      where: { userId },
      _sum: { amount: true, liters: true },
    });
    return result._sum;
  },

  async ranking(limit = 10) {
    // TODO: группировка по пользователю за текущий месяц, валюта региона
    return prisma.savingsRecord.groupBy({
      by: ["userId", "currencyCode"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: limit,
    });
  },
};
