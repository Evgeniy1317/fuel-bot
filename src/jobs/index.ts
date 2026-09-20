import cron from "node-cron";
import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { env } from "../config/env";
import { SITE_SOURCES, telegramMeta } from "../config/news-sources";
import { newsIngestService } from "../services/news-ingest";
import { priceProvider } from "../services/price-provider";
import { guaranteeService } from "../services/guarantee";
import { fetchTelegramPreview } from "../providers/telegram-preview";
import { fetchNewsSite } from "../providers/news-sites";

async function safe(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error) {
    console.error(`[job ${name}]`, error);
  }
}

let tgCursor = 0;
let siteCursor = 0;

function nextBatch<T>(list: T[], cursor: number, size: number) {
  if (!list.length) {
    return { items: [] as T[], cursor };
  }
  const items: T[] = [];
  let index = cursor;
  for (let i = 0; i < Math.min(size, list.length); i += 1) {
    items.push(list[index]!);
    index = (index + 1) % list.length;
  }
  return { items, cursor: index };
}

export function startJobs(bot: Bot<BotContext>) {
  cron.schedule(
    "7,27,47 * * * *",
    () =>
      safe("anre-stations", async () => {
        const prices = await priceProvider.fetchMoldova();
        await newsIngestService.ingestSpot(bot, prices);
      }),
    { timezone: env.TZ },
  );

  cron.schedule(
    "11,41 * * * *",
    () =>
      safe("anre-ceiling", async () => {
        const prices = await priceProvider.fetchMoldovaCeiling();
        await newsIngestService.ingestCeiling(bot, prices);
      }),
    { timezone: env.TZ },
  );

  cron.schedule(
    "19,49 * * * *",
    () =>
      safe("sheriff", async () => {
        const prices = await priceProvider.fetchPmr();
        await newsIngestService.ingestSpot(bot, prices);
      }),
    { timezone: env.TZ },
  );

  cron.schedule(
    "8,20,32,44,56 * * * *",
    () =>
      safe("tg-preview", async () => {
        const { items, cursor } = nextBatch(env.TELEGRAM_PREVIEW_CHANNELS, tgCursor, 1);
        tgCursor = cursor;
        for (const channel of items) {
          const posts = await fetchTelegramPreview(channel);
          const meta = telegramMeta(channel);
          for (const post of posts) {
            const ageMs = post.at ? Date.now() - post.at.getTime() : Number.POSITIVE_INFINITY;
            await newsIngestService.ingest(bot, {
              source: "TG_CHANNEL",
              externalId: `preview:${post.channel}:${post.messageId}`,
              rawText: post.text,
              channelId: post.channel,
              countryHint: meta?.country,
              skipAlerts: ageMs > 90 * 60 * 1000,
            });
          }
        }
      }),
    { timezone: env.TZ },
  );

  cron.schedule(
    "5,35 * * * *",
    () =>
      safe("news-sites", async () => {
        const urls = env.NEWS_SITE_URLS.length
          ? env.NEWS_SITE_URLS
          : SITE_SOURCES.map((item) => item.url);
        const { items, cursor } = nextBatch(urls, siteCursor, 1);
        siteCursor = cursor;
        for (const url of items) {
          const articles = await fetchNewsSite(url);
          for (const article of articles) {
            const ageMs = article.at ? Date.now() - article.at.getTime() : Number.POSITIVE_INFINITY;
            await newsIngestService.ingest(bot, {
              source: "NEWS_SITE",
              externalId: article.externalId,
              rawText: article.text,
              channelId: url,
              countryHint: article.country,
            skipAlerts: !article.at || (Number.isFinite(ageMs) && ageMs > 12 * 60 * 60 * 1000),
            });
          }
        }
      }),
    { timezone: env.TZ },
  );

  cron.schedule(
    "0 * * * *",
    () =>
      safe("guarantee", async () => {
        await guaranteeService.evaluateDue(bot);
      }),
    { timezone: env.TZ },
  );
}
