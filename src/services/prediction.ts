import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { chisinauDay, isFutureChisinauDay } from "../lib/time";
import { newsEventRepo } from "../repositories/news-event.repo";
import { priceRepo } from "../repositories/price.repo";
import { recommendationService } from "./recommendation";
import type { OfficialPrice } from "../types/price";

function hoursUntil(date?: Date) {
  if (!date) {
    return 24;
  }
  const diff = date.getTime() - Date.now();
  return Math.max(6, Math.min(36, Math.round(diff / 3600000) || 24));
}

/**
 * Предиктивные алерты:
 * MD — официальный потолок ANRE / новость «завтра подорожает»;
 * PMR — то же событие: короткое «лучше заправиться сегодня».
 */
export const predictionService = {
  async ingestCeiling(bot: Bot<BotContext>, ceilings: OfficialPrice[]) {
    let mdHike = false;

    for (const price of ceilings) {
      if (price.kind !== "CEILING") {
        continue;
      }

      const externalId = `ceiling:${price.country}:${price.fuel}:${price.amount}:${chisinauDay(price.effectiveFrom ?? price.observedAt)}`;
      if (await newsEventRepo.alreadyProcessed("API", externalId)) {
        continue;
      }

      const prevCeiling = await priceRepo.latestCeiling(price.country, price.fuel);
      const spot = await priceRepo.latestSpot(price.country, price.fuel);
      const baseline = prevCeiling
        ? Number(prevCeiling.amount)
        : spot
          ? Number(spot.amount)
          : undefined;
      const isHike = baseline !== undefined && price.amount > baseline + 0.009;
      const isDrop = baseline !== undefined && price.amount < baseline - 0.009;
      const future = isFutureChisinauDay(price.effectiveFrom);

      await newsEventRepo.save({
        source: "API",
        externalId,
        rawText: `${price.fuel} ${price.amount} ${price.currencyCode}`,
        extracted: price,
        country: price.country,
      });

      await priceRepo.insert({
        country: price.country,
        fuel: price.fuel,
        amount: price.amount,
        currencyCode: price.currencyCode,
        source: "API",
        sourceRef: "CEILING",
        publishedAt: price.effectiveFrom ?? price.observedAt,
      });

      if (!isHike && !isDrop) {
        continue;
      }

      if (isHike && price.country === "MD") {
        mdHike = true;
      }

      await recommendationService.consider(bot, {
        source: "ceiling",
        kind: isDrop ? "PRICE_DOWN" : future ? "PREDICTED_HIKE" : "PRICE_UP",
        country: price.country,
        fuel: price.fuel,
        amount: price.amount,
        currencyCode: price.currencyCode,
        previousAmount: baseline,
        windowHours: hoursUntil(price.effectiveFrom),
      });
    }

    if (mdHike) {
      await this.pmrHeadsUp(bot);
    }
  },

  async pmrHeadsUp(bot: Bot<BotContext>) {
    const externalId = `pmr-heads-up:${chisinauDay()}`;
    if (await newsEventRepo.alreadyProcessed("API", externalId)) {
      return;
    }
    await newsEventRepo.save({
      source: "API",
      externalId,
      rawText: "md-ceiling-hike",
      country: "PMR",
    });

    const current95 = await priceRepo.latestSpot("PMR", "AI95");
    await recommendationService.consider(bot, {
      source: "ceiling",
      kind: "PREDICTED_HIKE",
      country: "PMR",
      fuel: "AI95",
      amount: current95 ? Number(current95.amount) : 0,
      currencyCode: "PRB",
      windowHours: 24,
      advisory: true,
    });
  },
};
