import { prisma } from "../lib/prisma";

export const statsRepo = {
  async snapshot() {
    const now = new Date();
    const [total, onboarded, pmr, md, trial, paid, complimentary, expired] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { onboardedAt: { not: null } } }),
        prisma.user.count({ where: { country: "PMR" } }),
        prisma.user.count({ where: { country: "MD" } }),
        prisma.subscription.count({
          where: { status: "TRIAL", trialEndsAt: { gt: now } },
        }),
        prisma.subscription.count({
          where: { status: "ACTIVE", currentPeriodEndsAt: { gt: now } },
        }),
        prisma.subscription.count({
          where: { status: "COMPLIMENTARY" },
        }),
        prisma.subscription.count({
          where: { status: { in: ["EXPIRED", "CANCELED"] } },
        }),
      ]);

    return {
      total,
      onboarded,
      pmr,
      md,
      trial,
      paid,
      complimentary,
      expired,
    };
  },
};
