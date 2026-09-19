import { FUEL_LABELS } from "../config/constants";
import { prisma } from "../lib/prisma";
import { alertRepo } from "../repositories/alert.repo";
import { userRepo } from "../repositories/user.repo";
import type { AlertKind, AlertPayload, CountryCode, FuelKind, Locale } from "../types";
import { t } from "../bot/i18n";
import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { subscriptionService } from "./subscription";

const recent = new Map<string, number>();
const DEDUP_MS = 6 * 60 * 60 * 1000;

function alreadySent(key: string) {
  const prev = recent.get(key);
  const now = Date.now();
  if (prev && now - prev < DEDUP_MS) {
    return true;
  }
  recent.set(key, now);
  return false;
}

function renderAlert(locale: Locale, payload: AlertPayload, regionName: string) {
  const fuel = FUEL_LABELS[payload.fuel][locale];
  const key = payload.advisory
    ? "alert.hikeNeighbor"
    : payload.kind === "PREDICTED_HIKE"
      ? "alert.hikeToday"
      : payload.kind === "PRICE_DOWN"
        ? "alert.down"
        : "alert.up";

  return t(locale, key, {
    fuel,
    region: regionName,
    amount: payload.amount,
    currency: payload.currencyCode,
  });
}

export const alertService = {
  async dispatch(input: {
    bot: Bot<BotContext>;
    kind: AlertKind;
    country: CountryCode;
    fuel: FuelKind;
    amount: number;
    currencyCode: string;
    previousAmount?: number;
    windowHours?: number;
    advisory?: boolean;
  }) {
    const dedupKey = `${input.country}:${input.fuel}:${input.kind}:${input.advisory ? "adv" : input.amount}`;
    if (alreadySent(dedupKey)) {
      return;
    }

    const region = await prisma.region.findUniqueOrThrow({
      where: { country: input.country },
    });

    const payload: AlertPayload = {
      kind: input.kind,
      country: input.country,
      fuel: input.fuel,
      amount: input.amount,
      currencyCode: input.currencyCode,
      previousAmount: input.previousAmount,
      delta:
        input.previousAmount !== undefined
          ? input.amount - input.previousAmount
          : undefined,
      windowHours: input.windowHours,
      advisory: input.advisory,
    };

    const users = input.advisory
      ? await userRepo.findOnboardedByCountry(input.country)
      : await userRepo.findWatchers(input.country, input.fuel);

    const windowEnds =
      input.kind === "PREDICTED_HIKE" && !input.advisory
        ? new Date(Date.now() + (input.windowHours ?? 24) * 3600 * 1000)
        : undefined;

    for (const user of users) {
      if (!subscriptionService.hasAccess(user.subscription)) {
        continue;
      }

      await alertRepo.create({
        userId: user.id,
        kind: input.kind,
        fuel: input.fuel,
        country: input.country,
        payload,
        currencyCode: input.currencyCode,
        predictedAmount:
          input.kind === "PREDICTED_HIKE" && !input.advisory
            ? input.amount
            : undefined,
        predictionWindowEndsAt: windowEnds,
      });

      const locale = user.locale as Locale;
      const regionName = locale === "ro" ? region.nameRo : region.nameRu;
      await input.bot.api.sendMessage(
        user.telegramId,
        renderAlert(locale, payload, regionName),
      );
    }
  },
};
