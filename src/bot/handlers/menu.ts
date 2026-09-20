import type { Bot } from "grammy";
import { money } from "../../config/currency";
import { leaderboardService } from "../../services/leaderboard";
import { sendAllPrices, sendTodayPrices } from "../../services/today-prices";
import { savingsRepo } from "../../repositories/savings.repo";
import { userRepo } from "../../repositories/user.repo";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { menuKeyboard, needProfileKeyboard } from "../keyboards";
import { startCalculator } from "./calculator";

function wizardOpen(ctx: BotContext) {
  return Boolean(ctx.session.onboarding && ctx.session.onboarding.step !== "done");
}

function clearCalc(ctx: BotContext) {
  ctx.session.calc = undefined;
}

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

function labels(...keys: string[]) {
  return keys.flatMap((key) => [t("ru", key), t("ro", key)]);
}

export function registerMenu(bot: Bot<BotContext>) {
  bot.command("menu", async (ctx) => {
    await ctx.reply(t(ctx.session.locale, "menu.title"), {
      reply_markup: menuKeyboard(ctx.session.locale),
    });
  });

  bot.hears(labels("menu.allPrices"), async (ctx) => {
    if (wizardOpen(ctx)) {
      return;
    }
    clearCalc(ctx);
    await sendAllPrices(ctx);
  });

  bot.hears(labels("menu.myCity"), async (ctx) => {
    if (wizardOpen(ctx)) {
      return;
    }
    clearCalc(ctx);
    await sendTodayPrices(ctx);
  });

  bot.hears(labels("menu.calc"), async (ctx) => {
    if (wizardOpen(ctx)) {
      return;
    }
    await startCalculator(ctx);
  });

  bot.command("top", showSavingsRating);
  bot.hears(/Экономия|Economie/i, async (ctx) => {
    if (wizardOpen(ctx)) {
      return;
    }
    clearCalc(ctx);
    await showSavingsRating(ctx);
  });
}
