import type { Bot } from "grammy";
import { newsIngestService } from "../../services/news-ingest";
import type { BotContext } from "../context";

/**
 * Live-ingest: channel_post приходит сразу, как только в канале появляется новость.
 * Бот должен быть администратором каналов из NEWS_CHANNEL_IDS.
 */
export function registerChannelIngest(bot: Bot<BotContext>) {
  bot.on("channel_post:text", async (ctx) => {
    const chatId = String(ctx.chat.id);
    if (!newsIngestService.isWatchedChannel(chatId)) {
      return;
    }

    const post = ctx.channelPost;
    await newsIngestService.ingest(bot, {
      source: "TG_CHANNEL",
      externalId: `${chatId}:${post.message_id}`,
      rawText: post.text,
      channelId: ctx.chat.username ?? chatId,
    });
  });
}
