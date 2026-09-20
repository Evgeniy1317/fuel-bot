import type { Bot } from "grammy";
import { money } from "../../config/currency";
import { leaderboardService } from "../../services/leaderboard";
import { savingsRepo } from "../../repositories/savings.repo";
import { userRepo } from "../../repositories/user.repo";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { menuKeyboard, needProfileKeyboard } from "../keyboards";

function profileReady(
  user: NonNullable<Awaited<ReturnType<typeof userRepo.findByTelegramId>>>,
) {
  return user.dailyKm !== null && user.vehicle?.litersPer100km != null;
}

export async function showSavingsRating(ctx: BotContext) {
  const locale = ctx.session.locale;
  const user = await userRepo.findByTelegramId(String(ctx.from?.id));
  if (!user) {
    await ctx.reply(t(locale, "savings.empty"), {
      reply_markup: menuKeyboard(locale),
    });
    return;
  }

  if (!profileReady(user)) {
    ctx.session.awaitingProfile = true;
    await ctx.reply(t(locale, "savings.needProfile"), {
      reply_markup: needProfileKeyboard(locale),
    });
    return;
  }

  const totals = await savingsRepo.sumByUser(user.id);
  const rows = await leaderboardService.top();
  const currency = user.country === "MD" ? "MDL" : "PRB";
  const lines = [
    t(locale, "savings.summary", {
      amount: money(Number(totals.amount ?? 0), currency, locale),
      liters: Number(totals.liters ?? 0).toFixed(0),
    }),
    "",
    t(locale, "leaderboard.title"),
  ];

  if (!rows.length) {
    lines.push(t(locale, "leaderboard.empty"));
  } else {
    for (const [index, row] of rows.entries()) {
      lines.push(
        t(locale, "leaderboard.line", {
          place: index + 1,
          name: row.displayName,
          amount: money(row.amount, row.currencyCode, locale),
        }),
      );
    }
  }

  await ctx.reply(lines.join("\n"), {
    reply_markup: menuKeyboard(locale),
  });
}

export function registerMenu(bot: Bot<BotContext>) {
  bot.command("menu", async (ctx) => {
    await ctx.reply(t(ctx.session.locale, "menu.title"), {
      reply_markup: menuKeyboard(ctx.session.locale),
    });
  });

  bot.command("top", showSavingsRating);
  bot.hears(/Экономия|Economie|рейтинг|Clasament/i, showSavingsRating);
}
