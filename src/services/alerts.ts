import { FUEL_LABELS } from "../config/constants";
import { money } from "../config/currency";
import { prisma } from "../lib/prisma";
import { alertRepo } from "../repositories/alert.repo";
import { fillIntentRepo } from "../repositories/fill-intent.repo";
import { priceRepo } from "../repositories/price.repo";
import { userRepo } from "../repositories/user.repo";
import type { AlertKind, AlertPayload, CountryCode, FuelKind, Locale } from "../types";
import { t } from "../bot/i18n";
import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { fillTodayKeyboard } from "../bot/keyboards";
import { savingsService } from "./savings";
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
  const fuel = esc(FUEL_LABELS[payload.fuel][locale]);
  const amount = esc(money(payload.amount, payload.currencyCode, locale));
  const previous =
    payload.previousAmount != null
      ? esc(money(payload.previousAmount, payload.currencyCode, locale))
      : "";
  const region = esc(regionName);
  const boldAmount = `<b>${amount}</b>`;

  if (payload.kind === "PRICE_UP" || payload.kind === "PRICE_DOWN") {
    const change = previous
      ? t(locale, "alert.wasNow", { previous, amount: boldAmount })
      : boldAmount;
    return t(locale, payload.kind === "PRICE_DOWN" ? "alert.down" : "alert.up", {
      fuel: `<b>${fuel}</b>`,
      amount: change,
      region,
    });
  }

  const key = payload.advisory ? "alert.hikeNeighbor" : "alert.hikeToday";
  const body = t(locale, key, {
    fuel,
    region,
    amount: boldAmount,
  });
  return `${body}\n\n${esc(t(locale, "alert.fillAsk"))}`;
}

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

    const askFill = input.kind === "PREDICTED_HIKE";
    const spot = askFill ? await priceRepo.latest(input.country, input.fuel) : null;
    const fillPrice = spot ? Number(spot.amount) : input.amount;

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
        {
          parse_mode: "HTML",
          ...(askFill && fillPrice > 0
            ? { reply_markup: fillTodayKeyboard(locale) }
            : {}),
        },
      );

      if (askFill && fillPrice > 0) {
        await fillIntentRepo.replaceOffer({
          userId: user.id,
          fuel: input.fuel,
          country: input.country,
          priceAtFill: fillPrice,
          currencyCode: input.currencyCode,
        });
      }
    }

    if (input.kind === "PRICE_UP" || input.kind === "PRICE_DOWN") {
      await savingsService.settleFills(input.bot, {
        country: input.country,
        fuel: input.fuel,
        amount: input.amount,
        currencyCode: input.currencyCode,
      });
    }
  },
};
