import { FUEL_LABELS } from "../config/constants";
import { prisma } from "../lib/prisma";
import { alertRepo } from "../repositories/alert.repo";
import { userRepo } from "../repositories/user.repo";
import type { AlertKind, AlertPayload, CountryCode, FuelKind, Locale } from "../types";
import { t } from "../bot/i18n";
import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { subscriptionService } from "./subscription";

function renderAlert(locale: Locale, payload: AlertPayload, regionName: string) {
  const fuel = FUEL_LABELS[payload.fuel][locale];
  const key =
    payload.kind === "PREDICTED_HIKE"
      ? "alert.hike"
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

/**
 * Живая рассылка: вызывается сразу после ingest новости, не из крона.
 */
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
  }) {
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
    };

    const users = await userRepo.findWatchers(input.country, input.fuel);
    const windowEnds =
      input.kind === "PREDICTED_HIKE"
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
        predictedAmount: input.kind === "PREDICTED_HIKE" ? input.amount : undefined,
        predictionWindowEndsAt: windowEnds,
      });

      const locale = user.locale as Locale;
      const regionName = locale === "ro" ? region.nameRo : region.nameRu;
      const text = renderAlert(locale, payload, regionName);

      // TODO: не слать дубли, если тот же fuel+amount уже уходил за N минут
      await input.bot.api.sendMessage(user.telegramId, text);
    }
  },
};
