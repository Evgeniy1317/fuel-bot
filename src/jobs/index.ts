import cron from "node-cron";
import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { env } from "../config/env";
import { newsIngestService } from "../services/news-ingest";
import { priceProvider } from "../services/price-provider";
import { guaranteeService } from "../services/guarantee";
import { fetchTelegramPreview } from "../providers/telegram-preview";

async function safe(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error) {
    console.error(`[job ${name}]`, error);
  }
}

export function startJobs(bot: Bot<BotContext>) {
  // Молдова: официальный JSON, не HTML.
  cron.schedule(
    "7,27,47 * * * *",
    () =>
      safe("anre-stations", async () => {
        const prices = await priceProvider.fetchMoldova();
        await newsIngestService.ingestSpot(bot, prices);
      }),
    { timezone: env.TZ },
  );

  // Потолок ANRE на завтра — редкий GET главной страницы.
  cron.schedule(
    "11,41 * * * *",
    () =>
      safe("anre-ceiling", async () => {
        const prices = await priceProvider.fetchMoldovaCeiling();
        await newsIngestService.ingestCeiling(bot, prices);
      }),
    { timezone: env.TZ },
  );

  // ПМР: одна страница Шерифа, не чаще 30 мин, со сдвигом от ANRE.
  cron.schedule(
    "19,49 * * * *",
    () =>
      safe("sheriff", async () => {
        const prices = await priceProvider.fetchPmr();
        await newsIngestService.ingestSpot(bot, prices);
      }),
    { timezone: env.TZ },
  );

  // Публичные t.me/s/… по одному каналу, редко. Для «завтра подорожает» в ПМР.
  cron.schedule(
    "23,53 * * * *",
    () =>
      safe("tg-preview", async () => {
        for (const channel of env.TELEGRAM_PREVIEW_CHANNELS) {
          const posts = await fetchTelegramPreview(channel);
          for (const post of posts) {
            const ageMs = post.at ? Date.now() - post.at.getTime() : Number.POSITIVE_INFINITY;
            await newsIngestService.ingest(bot, {
              source: "TG_CHANNEL",
              externalId: `preview:${post.channel}:${post.messageId}`,
              rawText: post.text,
              channelId: post.channel,
              skipAlerts: ageMs > 3 * 60 * 60 * 1000,
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
