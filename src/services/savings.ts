import { money } from "../config/currency";
import { fillIntentRepo } from "../repositories/fill-intent.repo";
import { priceRepo } from "../repositories/price.repo";
import { savingsRepo } from "../repositories/savings.repo";
import type { CountryCode, FuelKind, Locale } from "../types";
import { t } from "../bot/i18n";
import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { menuKeyboard } from "../bot/keyboards";

export interface SavingsEstimate {
  litersPerDay: number;
  costPerDay: number;
  costPerMonth: number;
  currencyCode: string;
}

export const savingsService = {
  litersPerDay(dailyKm: number, litersPer100km: number) {
    return (dailyKm * litersPer100km) / 100;
  },

  async settleFills(
    bot: Bot<BotContext>,
    input: {
      country: CountryCode;
      fuel: FuelKind;
      amount: number;
      currencyCode: string;
    },
  ) {
    const intents = await fillIntentRepo.findConfirmed(input.country, input.fuel);
    for (const intent of intents) {
      await fillIntentRepo.resolve(intent.id);
      const oldPrice = Number(intent.priceAtFill);
      if (!(input.amount > oldPrice + 0.009)) {
        continue;
      }

      const user = intent.user;
      const locale = user.locale as Locale;
      const dailyKm = user.dailyKm === null ? null : Number(user.dailyKm);
      const consumption =
        user.vehicle?.litersPer100km == null
          ? null
          : Number(user.vehicle.litersPer100km);

      if (dailyKm === null || consumption === null) {
        await bot.api.sendMessage(user.telegramId, t(locale, "savings.needNumbers"), {
          reply_markup: menuKeyboard(locale),
        });
        continue;
      }

      const liters = this.litersPerDay(dailyKm, consumption);
      const saved = (input.amount - oldPrice) * liters;
      if (saved <= 0) {
        continue;
      }

      const now = new Date();
      await savingsRepo.add({
        userId: user.id,
        amount: saved,
        currencyCode: input.currencyCode,
        liters,
        periodStart: intent.createdAt,
        periodEnd: now,
        meta: {
          fuel: input.fuel,
          oldPrice,
          newPrice: input.amount,
        },
      });

      await bot.api.sendMessage(
        user.telegramId,
        t(locale, "savings.congrats", {
          amount: `<b>${money(saved, input.currencyCode, locale)}</b>`,
        }),
        {
          parse_mode: "HTML",
          reply_markup: menuKeyboard(locale),
        },
      );
    }
  },
};
