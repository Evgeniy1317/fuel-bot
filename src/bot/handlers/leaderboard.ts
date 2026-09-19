import type { Bot } from "grammy";
import { leaderboardService } from "../../services/leaderboard";
import type { BotContext } from "../context";
import { t } from "../i18n";

export function registerLeaderboard(bot: Bot<BotContext>) {
  bot.command("top", show);
  bot.hears(/Рейтинг|Clasament/, show);
}

async function show(ctx: BotContext) {
  const locale = ctx.session.locale;
  const rows = await leaderboardService.top();
  if (!rows.length) {
    await ctx.reply(t(locale, "leaderboard.empty"));
    return;
  }

  const lines = [
    t(locale, "leaderboard.title"),
    ...rows.map((row, index) =>
      t(locale, "leaderboard.line", {
        place: index + 1,
        name: row.displayName,
        amount: row.amount.toFixed(0),
        currency: row.currencyCode,
      }),
    ),
  ];
  await ctx.reply(lines.join("\n"));
}
