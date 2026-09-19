import { env } from "../config/env";
import { subscriptionRepo } from "../repositories/subscription.repo";
import type { AccessSnapshot, StarsInvoice } from "../types";
import type { Subscription } from "@prisma/client";

const MS_DAY = 24 * 60 * 60 * 1000;

export const subscriptionService = {
  trialEndsAt(from = new Date()) {
    return new Date(from.getTime() + env.TRIAL_DAYS * MS_DAY);
  },

  hasAccess(sub: Subscription | null | undefined): boolean {
    if (!sub) {
      return false;
    }
    if (sub.status === "TRIAL") {
      return sub.trialEndsAt.getTime() > Date.now();
    }
    if (sub.status === "ACTIVE" || sub.status === "COMPLIMENTARY") {
      if (!sub.currentPeriodEndsAt) {
        return true;
      }
      return sub.currentPeriodEndsAt.getTime() > Date.now();
    }
    return false;
  },

  snapshot(sub: Subscription): AccessSnapshot {
    return {
      hasAccess: this.hasAccess(sub),
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEndsAt: sub.currentPeriodEndsAt,
    };
  },

  async startTrial(userId: string) {
    return subscriptionRepo.startTrial(userId, this.trialEndsAt());
  },

  invoice(): StarsInvoice {
    return {
      title: env.SUBSCRIPTION_TITLE,
      description: "1 month",
      payload: env.SUBSCRIPTION_PAYLOAD,
      currency: "XTR",
      stars: env.SUBSCRIPTION_STARS,
    };
  },

  async activateFromStars(userId: string, telegramChargeId: string) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    return subscriptionRepo.activatePaid(userId, periodEnd, telegramChargeId);
  },

  async expireIfNeeded(userId: string, sub: Subscription) {
    if (this.hasAccess(sub)) {
      return sub;
    }
    return subscriptionRepo.setStatus(userId, "EXPIRED");
  },
};
