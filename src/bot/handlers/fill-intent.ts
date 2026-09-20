import type { Bot } from "grammy";
import { fillIntentRepo } from "../../repositories/fill-intent.repo";
import { userRepo } from "../../repositories/user.repo";
import type { OnboardingDraft } from "../../types";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { menuKeyboard } from "../keyboards";
import {
  matchFillToday,
  matchNeedProfile,
  promptOnboarding,
} from "../onboarding-flow";
import { showSavingsRating } from "./menu";

export function registerFillIntent(bot: Bot<BotContext>) {
  bot.on("message:text", async (ctx, next) => {
    const wizard = ctx.session.onboarding;
    if (wizard && wizard.step !== "done") {
      await next();
      return;
    }

    const text = ctx.message.text.trim();
    const locale = ctx.session.locale;

    if (ctx.session.awaitingProfile) {
      const choice = matchNeedProfile(text);
      if (choice === "back") {
        ctx.session.awaitingProfile = false;
        await ctx.reply(t(locale, "menu.title"), {
          reply_markup: menuKeyboard(locale),
        });
        return;
      }
      if (choice === "yes") {
        ctx.session.awaitingProfile = false;
        const started = await resumeMissingProfile(ctx);
        if (!started) {
          await showSavingsRating(ctx);
        }
        return;
      }
      await next();
      return;
    }

    const fill = matchFillToday(text);
    if (!fill) {
      await next();
      return;
    }

    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      return;
    }
    const user = await userRepo.findByTelegramId(telegramId);
    if (!user) {
      await ctx.reply(t(locale, "alert.fillMissing"), {
        reply_markup: menuKeyboard(locale),
      });
      return;
    }

    if (fill === "no") {
      await fillIntentRepo.declineLatest(user.id);
      await ctx.reply(t(locale, "alert.fillSkipped"), {
        reply_markup: menuKeyboard(locale),
      });
      return;
    }

    const confirmed = await fillIntentRepo.confirmLatest(user.id);
    await ctx.reply(
      t(locale, confirmed ? "alert.fillSaved" : "alert.fillMissing"),
      { reply_markup: menuKeyboard(locale) },
    );
  });
}

async function resumeMissingProfile(ctx: BotContext): Promise<boolean> {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) {
    return false;
  }
  const user = await userRepo.findByTelegramId(telegramId);
  if (!user?.country) {
    return false;
  }

  const draft: OnboardingDraft = {
    step: !user.vehicle
      ? "propulsion"
      : user.vehicle.litersPer100km == null
        ? "consumption"
        : "daily_km",
    locale: user.locale,
    country: user.country,
    city: user.city ?? undefined,
    propulsion: user.vehicle?.propulsion,
    fillGrade: user.vehicle?.fillGrade,
    litersPer100km:
      user.vehicle?.litersPer100km == null
        ? undefined
        : Number(user.vehicle.litersPer100km),
    dailyKm: user.dailyKm == null ? undefined : Number(user.dailyKm),
    watchFuels: user.watchFuels,
    resumeToSavings: true,
  };

  await promptOnboarding(ctx, draft);
  return true;
}
