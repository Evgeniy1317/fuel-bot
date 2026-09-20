import type { Bot } from "grammy";
import { ALL_FUELS, FUEL_LABELS } from "../../config/constants";
import { money } from "../../config/currency";
import { userRepo } from "../../repositories/user.repo";
import { currentFuelPrice, liveFuelKinds } from "../../services/today-prices";
import type { FuelKind } from "../../types";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { blocks } from "../format";
import { calcFuelKeyboard, menuKeyboard } from "../keyboards";

function wizardOpen(ctx: BotContext) {
  return Boolean(ctx.session.onboarding && ctx.session.onboarding.step !== "done");
}

function parseAmount(text: string) {
  const value = Number(text.replace(",", ".").trim());
  return Number.isFinite(value) && value > 0 ? value : null;
}

function isFuelKind(value: string): value is FuelKind {
  return (ALL_FUELS as string[]).includes(value);
}

function roundLiters(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export async function startCalculator(ctx: BotContext) {
  const locale = ctx.session.locale;
  ctx.session.editing = undefined;
  ctx.session.awaitingProfile = false;

  const user = await userRepo.findByTelegramId(String(ctx.from?.id));
  if (!user?.country) {
    ctx.session.calc = undefined;
    await ctx.reply(t(locale, "prices.needCity"), {
      reply_markup: menuKeyboard(locale),
    });
    return;
  }

  ctx.session.calc = { step: "fuel", country: user.country };
  const fuels = await liveFuelKinds(user.country);
  if (!fuels.length) {
    await ctx.reply(t(locale, "calc.noPrice"), {
      reply_markup: menuKeyboard(locale),
    });
    return;
  }
  await ctx.reply(blocks(t(locale, "menu.calc"), t(locale, "calc.ask")), {
    reply_markup: calcFuelKeyboard(locale, user.country, fuels),
  });
}

export function registerCalculator(bot: Bot<BotContext>) {
  bot.callbackQuery(/^calc:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (wizardOpen(ctx)) {
      return;
    }

    const locale = ctx.session.locale;
    const fuel = ctx.match[1];
    if (!isFuelKind(fuel)) {
      return;
    }

    const user = await userRepo.findByTelegramId(String(ctx.from?.id));
    const country = user?.country ?? ctx.session.calc?.country;
    if (!country) {
      ctx.session.calc = undefined;
      await ctx.reply(t(locale, "prices.needCity"), {
        reply_markup: menuKeyboard(locale),
      });
      return;
    }

    const price = await currentFuelPrice(country, fuel);
    if (!price) {
      await ctx.reply(t(locale, "calc.noPrice"), {
        reply_markup: calcFuelKeyboard(locale, country),
      });
      return;
    }

    ctx.session.calc = {
      step: "amount",
      fuel,
      country,
      price: price.amount,
      currencyCode: price.currencyCode,
    };

    await ctx.reply(
      blocks(
        `🧮  <b>${FUEL_LABELS[fuel][locale]}</b>`,
        t(locale, "calc.priceNow", {
          price: `<code>${money(price.amount, price.currencyCode, locale)}</code>`,
        }),
        t(locale, "calc.amount"),
      ),
      { parse_mode: "HTML", reply_markup: menuKeyboard(locale) },
    );
  });

  bot.on("message:text", async (ctx, next) => {
    if (wizardOpen(ctx) || ctx.session.calc?.step !== "amount") {
      await next();
      return;
    }

    const locale = ctx.session.locale;
    const amount = parseAmount(ctx.message.text);
    const calc = ctx.session.calc;
    if (!amount || !calc.fuel || !calc.price || !calc.currencyCode) {
      await ctx.reply(t(locale, "errors.number"));
      return;
    }

    const fuels = calc.country ? await liveFuelKinds(calc.country) : undefined;
    await ctx.reply(
      blocks(
        `🧮  <b>${FUEL_LABELS[calc.fuel][locale]}</b>`,
        t(locale, "calc.result", {
          money: `<b>${money(amount, calc.currencyCode, locale)}</b>`,
          got: roundLiters(amount / calc.price),
        }),
      ),
      {
        parse_mode: "HTML",
        reply_markup: calcFuelKeyboard(locale, calc.country, fuels),
      },
    );
  });
}
