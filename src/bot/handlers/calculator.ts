import type { Bot } from "grammy";
import { ALL_FUELS, FUEL_LABELS } from "../../config/constants";
import { money } from "../../config/currency";
import { userRepo } from "../../repositories/user.repo";
import { currentFuelPrice, liveFuelKinds } from "../../services/today-prices";
import type { CountryCode, FuelKind } from "../../types";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { blocks } from "../format";
import { calcFuelKeyboard, menuKeyboard } from "../keyboards";
import { isBack } from "../onboarding-flow";

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

async function showFuelList(ctx: BotContext, country: CountryCode, resetMenu = false) {
  const locale = ctx.session.locale;
  const fuels = await liveFuelKinds(country);
  if (!fuels.length) {
    ctx.session.calc = undefined;
    await ctx.reply(t(locale, "calc.noPrice"), {
      reply_markup: menuKeyboard(locale),
    });
    return;
  }
  ctx.session.calc = { step: "fuel", country };
  if (resetMenu) {
    await ctx.reply(t(locale, "menu.calc"), {
      reply_markup: menuKeyboard(locale),
    });
  }
  await ctx.reply(blocks(t(locale, "menu.calc"), t(locale, "calc.ask")), {
    reply_markup: calcFuelKeyboard(locale, country, fuels),
  });
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

  await showFuelList(ctx, user.country);
}

export function registerCalculator(bot: Bot<BotContext>) {
  bot.callbackQuery(/^calc:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (wizardOpen(ctx)) {
      return;
    }

    const locale = ctx.session.locale;
    const token = ctx.match[1];
    if (token === "back") {
      const country = ctx.session.calc?.country;
      if (country) {
        await showFuelList(ctx, country, true);
      } else {
        await startCalculator(ctx);
      }
      return;
    }
    if (!isFuelKind(token)) {
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

    const price = await currentFuelPrice(country, token);
    if (!price) {
      await ctx.reply(t(locale, "calc.noPrice"), {
        reply_markup: calcFuelKeyboard(locale, country),
      });
      return;
    }

    ctx.session.calc = {
      step: "amount",
      fuel: token,
      country,
      price: price.amount,
      currencyCode: price.currencyCode,
    };

    await ctx.reply(
      blocks(
        `🧮  <b>${FUEL_LABELS[token][locale]}</b>`,
        t(locale, "calc.priceNow", {
          price: `<code>${money(price.amount, price.currencyCode, locale)}</code>`,
        }),
        t(locale, "calc.amount"),
      ),
      { parse_mode: "HTML", reply_markup: menuKeyboard(locale, { back: true }) },
    );
  });

  bot.on("message:text", async (ctx, next) => {
    if (wizardOpen(ctx) || ctx.session.calc?.step !== "amount") {
      await next();
      return;
    }

    const locale = ctx.session.locale;
    const text = ctx.message.text.trim();
    if (isBack(text)) {
      const country = ctx.session.calc.country;
      if (country) {
        await showFuelList(ctx, country, true);
      } else {
        await startCalculator(ctx);
      }
      return;
    }

    const amount = parseAmount(text);
    const calc = ctx.session.calc;
    if (!amount || !calc.fuel || !calc.price || !calc.currencyCode) {
      await ctx.reply(t(locale, "errors.number"));
      return;
    }

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
        reply_markup: menuKeyboard(locale, { back: true }),
      },
    );
  });
}
