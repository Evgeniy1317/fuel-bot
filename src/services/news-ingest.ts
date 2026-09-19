import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { env } from "../config/env";
import { newsEventRepo } from "../repositories/news-event.repo";
import { priceRepo } from "../repositories/price.repo";
import { alertService } from "./alerts";
import { priceExtractor } from "./price-extractor";
import { predictionService } from "./prediction";
import type { OfficialPrice } from "../types/price";
import type { AlertKind } from "../types";

export interface NewsIngestInput {
  source: "TG_CHANNEL" | "NEWS_SITE" | "API";
  externalId: string;
  rawText: string;
  channelId?: string;
  skipAlerts?: boolean;
}

export const newsIngestService = {
  isWatchedChannel(channelId: string) {
    return env.NEWS_CHANNEL_IDS.includes(channelId);
  },

  async ingest(bot: Bot<BotContext>, input: NewsIngestInput) {
    const source =
      input.source === "TG_CHANNEL"
        ? "TG_CHANNEL"
        : input.source === "API"
          ? "API"
          : "NEWS_SITE";

    if (await newsEventRepo.alreadyProcessed(source, input.externalId)) {
      return { skipped: true as const };
    }

    const extracted = priceExtractor.extract(input.rawText);
    await newsEventRepo.save({
      source,
      externalId: input.externalId,
      rawText: input.rawText,
      extracted,
    });

    if (input.skipAlerts) {
      return { skipped: true as const, extracted };
    }

    for (const price of extracted) {
      if (price.predicted) {
        await alertService.dispatch({
          bot,
          kind: "PREDICTED_HIKE",
          country: price.country,
          fuel: price.fuel,
          amount: price.amount,
          currencyCode: price.currencyCode,
          windowHours: 24,
        });
        continue;
      }

      const previous = await priceRepo.latest(price.country, price.fuel);
      await priceRepo.insert({
        country: price.country,
        fuel: price.fuel,
        amount: price.amount,
        currencyCode: price.currencyCode,
        source,
        sourceRef: input.externalId,
        publishedAt: price.publishedAt,
      });

      const kind: AlertKind = inferKind(
        price.amount,
        previous ? Number(previous.amount) : undefined,
      );

      await alertService.dispatch({
        bot,
        kind,
        country: price.country,
        fuel: price.fuel,
        amount: price.amount,
        currencyCode: price.currencyCode,
        previousAmount: previous ? Number(previous.amount) : undefined,
      });
    }

    if (priceExtractor.isMoldovaTomorrowHike(input.rawText, input.channelId)) {
      await predictionService.pmrHeadsUp(bot);
    }

    return { skipped: false as const, extracted };
  },

  async ingestSpot(bot: Bot<BotContext>, prices: OfficialPrice[]) {
    for (const price of prices) {
      const previous = await priceRepo.latest(price.country, price.fuel);
      if (previous && Number(previous.amount) === price.amount) {
        continue;
      }

      await priceRepo.insert({
        country: price.country,
        fuel: price.fuel,
        amount: price.amount,
        currencyCode: price.currencyCode,
        source: price.country === "MD" ? "API" : "NEWS_SITE",
        sourceRef: price.kind ?? "SPOT",
        publishedAt: price.observedAt,
      });

      if (!previous) {
        continue;
      }

      const kind: AlertKind = inferKind(
        price.amount,
        previous ? Number(previous.amount) : undefined,
      );

      await alertService.dispatch({
        bot,
        kind,
        country: price.country,
        fuel: price.fuel,
        amount: price.amount,
        currencyCode: price.currencyCode,
        previousAmount: previous ? Number(previous.amount) : undefined,
      });
    }
  },

  async ingestCeiling(bot: Bot<BotContext>, prices: OfficialPrice[]) {
    await predictionService.ingestCeiling(bot, prices);
  },
};

function inferKind(amount: number, previous?: number): AlertKind {
  if (previous === undefined) {
    return "PRICE_UP";
  }
  if (amount < previous) {
    return "PRICE_DOWN";
  }
  return "PRICE_UP";
}
