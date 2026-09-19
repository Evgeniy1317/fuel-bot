import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { env } from "../config/env";
import { newsEventRepo } from "../repositories/news-event.repo";
import { priceRepo } from "../repositories/price.repo";
import { alertService } from "./alerts";
import { priceExtractor } from "./price-extractor";
import type { OfficialPrice } from "./price-provider";
import type { AlertKind } from "../types";

export interface NewsIngestInput {
  source: "TG_CHANNEL" | "NEWS_SITE" | "API";
  externalId: string;
  rawText: string;
  channelId?: string;
}

/**
 * Точка входа live-пайплайна:
 * новость → дедуп → извлечь цены → сохранить → сразу разослать алерты.
 */
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

    for (const price of extracted) {
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
        windowHours: kind === "PREDICTED_HIKE" ? 24 : undefined,
      });
    }

    return { skipped: false as const, extracted };
  },

  /** Официальные API: цены уже структурированы, экстрактор не нужен. */
  async ingestOfficial(bot: Bot<BotContext>, prices: OfficialPrice[]) {
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
        source: "API",
        publishedAt: price.observedAt,
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
  },
};

function inferKind(amount: number, previous?: number): AlertKind {
  // TODO: отдельный классификатор «прогноз повышения» vs факт
  // (слова «с завтра», «подорожает», время публикации vs вступления в силу)
  if (previous === undefined) {
    return "PRICE_UP";
  }
  if (amount < previous) {
    return "PRICE_DOWN";
  }
  return "PRICE_UP";
}
