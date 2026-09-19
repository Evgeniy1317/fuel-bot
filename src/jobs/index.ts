import cron from "node-cron";
import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { env } from "../config/env";
import { newsIngestService } from "../services/news-ingest";
import { priceProvider } from "../services/price-provider";
import { guaranteeService } from "../services/guarantee";

export function startJobs(bot: Bot<BotContext>) {
  // Официальные API — запасной канал, новости идут live через channel_post.
  cron.schedule(
    "*/15 * * * *",
    async () => {
      const prices = await priceProvider.fetchAll();
      await newsIngestService.ingestOfficial(bot, prices);
    },
    { timezone: env.TZ },
  );

  // TODO: парсинг NEWS_SITE_URLS, затем newsIngestService.ingest(source: NEWS_SITE)
  cron.schedule(
    "*/10 * * * *",
    async () => {
      for (const url of env.NEWS_SITE_URLS) {
        void url;
        // TODO: fetch + extract + ingest
      }
    },
    { timezone: env.TZ },
  );

  cron.schedule(
    "0 * * * *",
    async () => {
      await guaranteeService.evaluateDue(bot);
    },
    { timezone: env.TZ },
  );

  // TODO: ежедневный снимок экономии → SavingsRecord → рейтинг
  cron.schedule(
    "5 21 * * *",
    async () => {
      // await savingsService.recordDaily(...)
    },
    { timezone: env.TZ },
  );
}
