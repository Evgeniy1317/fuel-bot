import type { Bot } from "grammy";
import { WATCH_GROUPS } from "../../config/constants";
import { onboardingService } from "../../services/onboarding";
import { subscriptionService } from "../../services/subscription";
import { adminNotify, formatUser } from "../../services/admin-notify";
import { userRepo } from "../../repositories/user.repo";
import type { FuelWatchGroup, OnboardingDraft } from "../../types";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { backKeyboard, menuKeyboard, skipBackKeyboard, watchGroupsKeyboard } from "../keyboards";
import {
  defaultWatchGroups,
  fillGradeForPropulsion,
  isBack,
  isSkip,
  matchCountry,
  matchFillGrade,
  matchLanguage,
  matchPropulsion,
  matchTrial,
  matchWatchAction,
  previousStep,
  promptOnboarding,
  resolveCity,
  watchListText,
} from "../onboarding-flow";
import { showSavingsRating } from "./menu";

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

function orderedWatchGroups(selected: Set<FuelWatchGroup>): FuelWatchGroup[] {
  return WATCH_GROUPS.filter((group) => selected.has(group));
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
        await ctx.reply(t(locale, "onboarding.cityUnknown", { examples: resolved.examples }), {
          reply_markup: backKeyboard(locale),
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
      draft.watchGroups = defaultWatchGroups(propulsion);
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
      if (!draft.watchGroups?.length) {
        draft.watchGroups = defaultWatchGroups(draft.propulsion);
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
      const action = matchWatchAction(text);
      if (!action) {
        await promptOnboarding(ctx, draft);
        return;
      }
      if (action === "done") {
        if (!draft.watchGroups?.length) {
          draft.watchGroups = defaultWatchGroups(draft.propulsion);
        }
        try {
          await persistDraft(ctx, draft);
        } catch {
          await ctx.reply(t(locale, "errors.generic"));
          return;
        }
        draft.step = "trial_consent";
        await promptOnboarding(ctx, draft);
        return;
      }
      const selected = new Set(draft.watchGroups ?? []);
      if (selected.has(action)) {
        selected.delete(action);
      } else {
        selected.add(action);
      }
      draft.watchGroups = orderedWatchGroups(selected);
      ctx.session.onboarding = draft;
      await ctx.reply(watchListText(locale, draft.watchGroups), {
        reply_markup: watchGroupsKeyboard(locale, draft.watchGroups),
      });
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
}
