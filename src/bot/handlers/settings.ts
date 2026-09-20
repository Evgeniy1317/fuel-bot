import type { Bot } from "grammy";
import { languageKeyboard, menuKeyboard } from "../keyboards";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { userRepo } from "../../repositories/user.repo";
import type { Locale } from "../../types";
import { matchLanguage } from "../onboarding-flow";

function wizardOpen(ctx: BotContext) {
  return Boolean(ctx.session.onboarding && ctx.session.onboarding.step !== "done");
}

export function registerSettings(bot: Bot<BotContext>) {
  bot.command("language", async (ctx) => {
    await ctx.reply(t(ctx.session.locale, "start.language"), {
      reply_markup: languageKeyboard(),
    });
  });

  bot.hears(/Настройки|Setări/, async (ctx) => {
    await ctx.reply(t(ctx.session.locale, "start.language"), {
      reply_markup: languageKeyboard(),
    });
  });

  bot.on("message:text", async (ctx, next) => {
    if (wizardOpen(ctx)) {
      await next();
      return;
    }
    const locale = matchLanguage(ctx.message.text);
    if (!locale) {
      await next();
      return;
    }
    await applyLocale(ctx, locale);
  });

  bot.callbackQuery(/^lang:(ru|ro)$/, async (ctx, next) => {
    if (wizardOpen(ctx)) {
      await next();
      return;
    }
    await ctx.answerCallbackQuery();
    await applyLocale(ctx, ctx.match[1] as Locale);
  });
}

async function applyLocale(ctx: BotContext, locale: Locale) {
  ctx.session.locale = locale;
  const telegramId = ctx.from?.id.toString();
  if (telegramId) {
    await userRepo.upsertFromTelegram({ telegramId, locale });
  }
  await ctx.reply(t(locale, "menu.title"), {
    reply_markup: menuKeyboard(locale),
  });
}
