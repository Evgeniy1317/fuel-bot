import type { Bot } from "grammy";
import { languageKeyboard } from "../keyboards";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { userRepo } from "../../repositories/user.repo";
import type { Locale } from "../../types";

export function registerSettings(bot: Bot<BotContext>) {
  bot.command("language", async (ctx) => {
    await ctx.reply(t(ctx.session.locale, "start.language"), {
      reply_markup: languageKeyboard(),
    });
  });

  bot.hears(/Настройки|Setări/, async (ctx) => {
    await ctx.reply(t(ctx.session.locale, "menu.settings"), {
      reply_markup: languageKeyboard(),
    });
  });

  // Повторный выбор языка после онбординга — только если визард уже закрыт.
  bot.callbackQuery(/^lang:(ru|ro)$/, async (ctx, next) => {
    if (ctx.session.onboarding && ctx.session.onboarding.step !== "done") {
      await next();
      return;
    }
    const locale = ctx.match[1] as Locale;
    ctx.session.locale = locale;
    const telegramId = ctx.from?.id.toString();
    if (telegramId) {
      await userRepo.upsertFromTelegram({ telegramId, locale });
    }
    await ctx.answerCallbackQuery();
    await ctx.reply(t(locale, "menu.title"));
  });
}
