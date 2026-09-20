import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { env } from "../config/env";
import { telegramMeta } from "../config/news-sources";
import { newsEventRepo } from "../repositories/news-event.repo";
import { priceRepo } from "../repositories/price.repo";
import { priceExtractor } from "./price-extractor";
import { predictionService } from "./prediction";
import { recommendationService } from "./recommendation";
import type { OfficialPrice } from "../types/price";
import type { AlertKind, CountryCode } from "../types";

export interface NewsIngestInput {
  source: "TG_CHANNEL" | "NEWS_SITE" | "API";
  externalId: string;
  rawText: string;
  channelId?: string;
  countryHint?: CountryCode;
  skipAlerts?: boolean;
}

function inferKind(amount: number, previous?: number): AlertKind {
  if (previous !== undefined && amount < previous) {
    return "PRICE_DOWN";
  }
  return "PRICE_UP";
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

    const hint = {
      country: input.countryHint ?? telegramMeta(input.channelId ?? "")?.country,
      channel: input.channelId,
    };
    const extracted = priceExtractor.extract(input.rawText, hint);
    await newsEventRepo.save({
      source,
      externalId: input.externalId,
      rawText: input.rawText,
      extracted,
      country: hint.country,
    });

    if (input.skipAlerts) {
      return { skipped: true as const, extracted };
    }

    const origin = input.channelId || source;
    if (!extracted.length && priceExtractor.isFuelTopic(input.rawText) && priceExtractor.isPredicted(input.rawText)) {
      const country = hint.country ?? (priceExtractor.isMoldova(input.rawText, hint) ? "MD" : undefined);
      if (country) {
        await recommendationService.hikeWithoutPrice(bot, {
          source: origin,
          country,
          advisory: true,
        });
      }
    }

    for (const price of extracted) {
      if (price.predicted) {
        await recommendationService.consider(bot, {
          source: origin,
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
      await recommendationService.consider(bot, {
        source: origin,
        kind: inferKind(price.amount, previous ? Number(previous.amount) : undefined),
        country: price.country,
        fuel: price.fuel,
        amount: price.amount,
        currencyCode: price.currencyCode,
        previousAmount: previous ? Number(previous.amount) : undefined,
      });
    }

    if (priceExtractor.isMoldovaTomorrowHike(input.rawText, hint)) {
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

      await recommendationService.consider(bot, {
        source: price.country === "MD" ? "API" : "sheriff",
        kind: inferKind(price.amount, Number(previous.amount)),
        country: price.country,
        fuel: price.fuel,
        amount: price.amount,
        currencyCode: price.currencyCode,
        previousAmount: Number(previous.amount),
      });
    }
  },

  async ingestCeiling(bot: Bot<BotContext>, prices: OfficialPrice[]) {
    await predictionService.ingestCeiling(bot, prices);
  },
};
