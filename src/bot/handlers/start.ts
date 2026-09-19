import type { Bot } from "grammy";
import { languageKeyboard } from "../keyboards";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { userRepo } from "../../repositories/user.repo";

export function registerStart(bot: Bot<BotContext>) {
  bot.command("start", async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      return;
    }

    await userRepo.upsertFromTelegram({
      telegramId,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
    });

    const locale = ctx.session.locale;
    ctx.session.onboarding = { step: "language" };

    await ctx.reply(t(locale, "start.welcome"));
    await ctx.reply(t(locale, "start.language"), {
      reply_markup: languageKeyboard(),
    });
  });
}
