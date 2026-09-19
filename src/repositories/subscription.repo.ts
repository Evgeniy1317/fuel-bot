import { prisma } from "../lib/prisma";
import type { SubscriptionStatus } from "../types";

export const subscriptionRepo = {
  async getByUserId(userId: string) {
    return prisma.subscription.findUnique({ where: { userId } });
  },

  async startTrial(userId: string, trialEndsAt: Date) {
    return prisma.subscription.upsert({
      where: { userId },
      create: { userId, status: "TRIAL", trialEndsAt },
      update: { status: "TRIAL", trialEndsAt },
    });
  },

  async activatePaid(userId: string, currentPeriodEndsAt: Date, starsChargeId: string) {
    return prisma.subscription.update({
      where: { userId },
      data: {
        status: "ACTIVE",
        currentPeriodEndsAt,
        starsChargeId,
        complimentaryReason: null,
      },
    });
  },

  async grantComplimentary(userId: string, periodEndsAt: Date, internalReason: string) {
    return prisma.subscription.update({
      where: { userId },
      data: {
        status: "COMPLIMENTARY",
        currentPeriodEndsAt: periodEndsAt,
        complimentaryReason: internalReason,
      },
    });
  },

  async setStatus(userId: string, status: SubscriptionStatus) {
    return prisma.subscription.update({
      where: { userId },
      data: { status },
    });
  },
};
