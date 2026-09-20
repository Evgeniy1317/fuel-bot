import type { Bot } from "grammy";
import { savingsService } from "../../services/savings";
import { budgetService } from "../../services/budget";
import { userRepo } from "../../repositories/user.repo";
import type { VehicleInput } from "../../types";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { menuKeyboard } from "../keyboards";

function vehicleFromUser(user: NonNullable<Awaited<ReturnType<typeof userRepo.findByTelegramId>>>) {
  if (
    !user.vehicle ||
    !user.country ||
    user.dailyKm === null ||
    user.vehicle.litersPer100km === null
  ) {
    return null;
  }
  const vehicle: VehicleInput = {
    brand: user.vehicle.brand,
    model: user.vehicle.model,
    litersPer100km: Number(user.vehicle.litersPer100km),
    propulsion: user.vehicle.propulsion,
    fillGrade: user.vehicle.fillGrade,
  };
  return { vehicle, country: user.country, dailyKm: Number(user.dailyKm) };
}

export function registerMenu(bot: Bot<BotContext>) {
  bot.command("menu", async (ctx) => {
    await ctx.reply(t(ctx.session.locale, "menu.title"), {
      reply_markup: menuKeyboard(ctx.session.locale),
    });
  });

  bot.hears(/Моя экономия|Economia mea/, async (ctx) => {
    const locale = ctx.session.locale;
    const user = await userRepo.findByTelegramId(String(ctx.from?.id));
    if (!user) {
      await ctx.reply(t(locale, "savings.empty"));
      return;
    }
    const input = vehicleFromUser(user);
    if (!input) {
      await ctx.reply(t(locale, "savings.empty"));
      return;
    }
    const estimate = await savingsService.estimate(input);
    if (!estimate) {
      await ctx.reply(t(locale, "savings.empty"));
      return;
    }
    await ctx.reply(
      t(locale, "savings.summary", {
        amount: estimate.costPerMonth.toFixed(0),
        currency: estimate.currencyCode,
        liters: (estimate.litersPerDay * 30).toFixed(0),
      }),
    );
  });

  bot.hears(/Бюджет на месяц|Buget lunar/, async (ctx) => {
    const locale = ctx.session.locale;
    const user = await userRepo.findByTelegramId(String(ctx.from?.id));
    const input = user ? vehicleFromUser(user) : null;
    if (!input) {
      await ctx.reply(t(locale, "savings.empty"));
      return;
    }
    const forecast = await budgetService.monthlyForecast(input);
    if (!forecast) {
      await ctx.reply(t(locale, "savings.empty"));
      return;
    }
    await ctx.reply(
      t(locale, "savings.summary", {
        amount: forecast.amount.toFixed(0),
        currency: forecast.currencyCode,
        liters: forecast.liters.toFixed(0),
      }),
    );
  });
}
