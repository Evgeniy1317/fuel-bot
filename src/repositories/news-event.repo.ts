import { prisma } from "../lib/prisma";
import type { PriceSource, Prisma } from "@prisma/client";

export const newsEventRepo = {
  async alreadyProcessed(source: PriceSource, externalId: string) {
    const existing = await prisma.newsEvent.findUnique({
      where: { source_externalId: { source, externalId } },
    });
    return Boolean(existing);
  },

  async save(input: {
    source: PriceSource;
    externalId: string;
    rawText: string;
    extracted?: unknown;
    country?: "PMR" | "MD";
  }) {
    return prisma.newsEvent.create({
      data: {
        ...input,
        extracted:
          input.extracted === undefined
            ? undefined
            : (input.extracted as Prisma.InputJsonValue),
      },
    });
  },
};
