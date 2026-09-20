import type { Bot } from "grammy";
import { ALL_FUELS, toggleFuel } from "../../config/constants";
import { onboardingService } from "../../services/onboarding";
import { subscriptionService } from "../../services/subscription";
import { adminNotify, formatUser } from "../../services/admin-notify";
import { userRepo } from "../../repositories/user.repo";
import type { FuelKind, OnboardingDraft } from "../../types";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { cityKeyboard, menuKeyboard, skipBackKeyboard, watchFuelsInline } from "../keyboards";
import {
  cityUnknownText,
  defaultWatchFuels,
  fillGradeForPropulsion,
  isBack,
  isSkip,
  matchCountry,
  matchFillGrade,
  matchLanguage,
  matchPropulsion,
  matchTrial,
  previousStep,
  promptOnboarding,
  resolveCity,
} from "../onboarding-flow";
import { showSavingsRating } from "./menu";
import { sendTodayPrices } from "../../services/today-prices";

function parseNumber(text: string | undefined) {
  if (!text) {
    return null;
  }
  const normalized = text.replace(",", ".").trim();
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function goBack(ctx: BotContext, draft: OnboardingDraft) {
  draft.step = previousStep(draft);
  await promptOnboarding(ctx, draft);
}

async function persistDraft(ctx: BotContext, draft: OnboardingDraft) {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) {
    return;
  }
  await onboardingService.persist(
    telegramId,
    { username: ctx.from?.username, firstName: ctx.from?.first_name },
    draft,
  );
}

export async function applyTrialChoice(ctx: BotContext, choice: "yes" | "no") {
  const locale = ctx.session.locale;
  const telegramId = ctx.from?.id.toString();

  if (choice === "no") {
    if (ctx.session.onboarding) {
      ctx.session.onboarding.step = "done";
    }
    await ctx.reply(t(locale, "onboarding.trialDeclined"), {
      reply_markup: menuKeyboard(locale),
    });
    await sendTodayPrices(ctx);
    return;
  }

  if (telegramId) {
    const user = await userRepo.findByTelegramId(telegramId);
    if (!user) {
      await ctx.reply(t(locale, "errors.generic"));
      return;
    }
    if (user.subscription) {
      await ctx.reply(
        subscriptionService.hasAccess(user.subscription)
          ? t(locale, "subscription.trial")
          : t(locale, "subscription.expired"),
        { reply_markup: menuKeyboard(locale) },
      );
      if (ctx.session.onboarding) {
        ctx.session.onboarding.step = "done";
      }
      await sendTodayPrices(ctx);
      return;
    }
    await subscriptionService.startTrial(user.id);
    await adminNotify.send(ctx.api, `Триал 3 дня\n${formatUser(user)}`);
  }

  if (ctx.session.onboarding) {
    ctx.session.onboarding.step = "done";
  }
  await ctx.reply(t(locale, "onboarding.done"), {
    reply_markup: menuKeyboard(locale),
  });
  await sendTodayPrices(ctx);
}

export function registerOnboarding(bot: Bot<BotContext>) {
  bot.on("message:text", async (ctx, next) => {
    const draft = ctx.session.onboarding;
    if (!draft || draft.step === "done") {
      await next();
      return;
    }
    if (ctx.message.text.startsWith("/")) {
      await next();
      return;
    }

    const text = ctx.message.text.trim();
    const locale = draft.locale ?? ctx.session.locale;

    if (isBack(text) && draft.step !== "language") {
      await goBack(ctx, draft);
      return;
    }

    if (draft.step === "language") {
      const picked = matchLanguage(text);
      if (!picked) {
        await promptOnboarding(ctx, draft);
        return;
      }
      draft.locale = picked;
      ctx.session.locale = picked;
      draft.step = "country";
      await promptOnboarding(ctx, draft);
      return;
    }

    if (draft.step === "country") {
      const country = matchCountry(text);
      if (!country) {
        await promptOnboarding(ctx, draft);
        return;
      }
      draft.country = country;
      draft.city = undefined;
      draft.step = "city";
      await promptOnboarding(ctx, draft);
      return;
    }

    if (draft.step === "city") {
      if (!draft.country) {
        draft.step = "country";
        await promptOnboarding(ctx, draft);
        return;
      }
      const resolved = resolveCity(text, draft.country, locale);
      if (!resolved.ok) {
        await ctx.reply(cityUnknownText(locale, draft.country), {
          reply_markup: cityKeyboard(locale, draft.country),
        });
        return;
      }
      draft.city = resolved.city.slug;
      draft.step = "propulsion";
      await promptOnboarding(ctx, draft);
      return;
    }

    if (draft.step === "car") {
      draft.step = "propulsion";
      await promptOnboarding(ctx, draft);
      return;
    }

    if (draft.step === "propulsion") {
      const propulsion = matchPropulsion(text);
      if (!propulsion) {
        await promptOnboarding(ctx, draft);
        return;
      }
      draft.propulsion = propulsion;
      const autoGrade = fillGradeForPropulsion(propulsion);
      if (autoGrade) {
        draft.fillGrade = autoGrade;
        draft.step = "consumption";
      } else {
        draft.fillGrade = undefined;
        draft.step = "fill_grade";
      }
      draft.watchFuels = defaultWatchFuels(autoGrade ?? undefined);
      await promptOnboarding(ctx, draft);
      return;
    }

    if (draft.step === "fill_grade") {
      const grade = matchFillGrade(text);
      if (!grade) {
        await promptOnboarding(ctx, draft);
        return;
      }
      draft.fillGrade = grade;
      draft.watchFuels = defaultWatchFuels(grade);
      draft.step = "consumption";
      await promptOnboarding(ctx, draft);
      return;
    }

    if (draft.step === "consumption") {
      if (isSkip(text)) {
        if (draft.resumeToSavings) {
          await promptOnboarding(ctx, draft);
          return;
        }
        draft.litersPer100km = undefined;
      } else {
        const value = parseNumber(text);
        if (!value) {
          await ctx.reply(t(locale, "errors.number"), {
            reply_markup: skipBackKeyboard(locale),
          });
          return;
        }
        draft.litersPer100km = value;
      }
      draft.step = "daily_km";
      await promptOnboarding(ctx, draft);
      return;
    }

    if (draft.step === "daily_km") {
      if (isSkip(text)) {
        if (draft.resumeToSavings) {
          await promptOnboarding(ctx, draft);
          return;
        }
        draft.dailyKm = undefined;
      } else {
        const value = parseNumber(text);
        if (!value) {
          await ctx.reply(t(locale, "errors.number"), {
            reply_markup: skipBackKeyboard(locale),
          });
          return;
        }
        draft.dailyKm = value;
      }
      if (!draft.watchFuels?.length) {
        draft.watchFuels = defaultWatchFuels(draft.fillGrade);
      }
      if (draft.resumeToSavings) {
        try {
          await persistDraft(ctx, draft);
        } catch {
          await ctx.reply(t(locale, "errors.generic"));
          return;
        }
        draft.step = "done";
        ctx.session.onboarding = draft;
        await showSavingsRating(ctx);
        return;
      }
      draft.step = "watch_fuels";
      await promptOnboarding(ctx, draft);
      return;
    }

    if (draft.step === "watch_fuels") {
      return;
    }

    if (draft.step === "trial_consent") {
      const choice = matchTrial(text);
      if (!choice) {
        await promptOnboarding(ctx, draft);
        return;
      }
      await applyTrialChoice(ctx, choice);
      return;
    }

    await next();
  });

  bot.callbackQuery(/^watch:(.+)$/, async (ctx) => {
    const draft = ctx.session.onboarding;
    if (!draft || draft.step !== "watch_fuels") {
      await ctx.answerCallbackQuery();
      return;
    }
    const locale = draft.locale ?? ctx.session.locale;
    const token = ctx.match[1];

    if (token === "back") {
      await ctx.answerCallbackQuery();
      await goBack(ctx, draft);
      return;
    }

    if (token === "done") {
      if (!draft.watchFuels?.length) {
        draft.watchFuels = defaultWatchFuels(draft.fillGrade);
      }
      try {
        await persistDraft(ctx, draft);
      } catch {
        await ctx.answerCallbackQuery();
        await ctx.reply(t(locale, "errors.generic"));
        return;
      }
      draft.step = "trial_consent";
      await ctx.answerCallbackQuery();
      await promptOnboarding(ctx, draft);
      return;
    }

    if (!ALL_FUELS.includes(token as FuelKind)) {
      await ctx.answerCallbackQuery();
      return;
    }
    draft.watchFuels = toggleFuel(draft.watchFuels ?? [], token as FuelKind);
    ctx.session.onboarding = draft;
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({
      reply_markup: watchFuelsInline(locale, draft.watchFuels),
    });
  });
}
