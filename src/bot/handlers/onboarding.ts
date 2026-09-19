import type { Bot } from "grammy";
import { GASOLINE_GRADES } from "../../config/constants";
import { onboardingService } from "../../services/onboarding";
import { subscriptionService } from "../../services/subscription";
import { adminNotify, formatUser } from "../../services/admin-notify";
import { userRepo } from "../../repositories/user.repo";
import type { FuelKind, Locale, VehiclePropulsion } from "../../types";
import type { BotContext } from "../context";
import { t } from "../i18n";
import {
  countryKeyboard,
  fillGradeKeyboard,
  menuKeyboard,
  propulsionKeyboard,
  trialKeyboard,
  watchFuelsKeyboard,
} from "../keyboards";

function parseNumber(text: string | undefined) {
  if (!text) {
    return null;
  }
  const normalized = text.replace(",", ".").trim();
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function registerOnboarding(bot: Bot<BotContext>) {
  bot.callbackQuery(/^lang:(ru|ro)$/, async (ctx, next) => {
    if (ctx.session.onboarding?.step !== "language") {
      await next();
      return;
    }
    const locale = ctx.match[1] as Locale;
    ctx.session.locale = locale;
    ctx.session.onboarding = { step: "country", locale };
    await ctx.answerCallbackQuery();
    await ctx.reply(t(locale, "onboarding.country"), {
      reply_markup: countryKeyboard(locale),
    });
  });

  bot.callbackQuery(/^country:(PMR|MD)$/, async (ctx) => {
    const locale = ctx.session.locale;
    const draft = ctx.session.onboarding ?? { step: "country", locale };
    draft.country = ctx.match[1] as "PMR" | "MD";
    draft.step = "car";
    ctx.session.onboarding = draft;
    await ctx.answerCallbackQuery();
    await ctx.reply(t(locale, "onboarding.car"));
  });

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

    const locale = ctx.session.locale;

    if (draft.step === "car") {
      const parts = ctx.message.text.trim().split(/\s+/);
      draft.brand = parts[0] ?? "";
      draft.model = parts.slice(1).join(" ") || parts[0] || "";
      draft.step = "propulsion";
      ctx.session.onboarding = draft;
      await ctx.reply(t(locale, "onboarding.propulsion"), {
        reply_markup: propulsionKeyboard(locale),
      });
      return;
    }

    if (draft.step === "consumption") {
      const value = parseNumber(ctx.message.text);
      if (!value) {
        await ctx.reply(t(locale, "errors.number"));
        return;
      }
      draft.litersPer100km = value;
      draft.step = "daily_km";
      ctx.session.onboarding = draft;
      await ctx.reply(t(locale, "onboarding.dailyKm"));
      return;
    }

    if (draft.step === "daily_km") {
      const value = parseNumber(ctx.message.text);
      if (!value) {
        await ctx.reply(t(locale, "errors.number"));
        return;
      }
      draft.dailyKm = value;
      draft.watchFuels = draft.fillGrade ? [draft.fillGrade] : [];
      draft.step = "watch_fuels";
      ctx.session.onboarding = draft;
      await ctx.reply(
        `${t(locale, "onboarding.watchFuels")}\n${t(locale, "onboarding.skipLong")}`,
        { reply_markup: watchFuelsKeyboard(locale, draft.watchFuels) },
      );
      return;
    }

    await next();
  });

  bot.callbackQuery(/^prop:(GASOLINE|LPG)$/, async (ctx) => {
    const locale = ctx.session.locale;
    const draft = ctx.session.onboarding;
    if (!draft) {
      return;
    }

    const propulsion = ctx.match[1] as VehiclePropulsion;
    draft.propulsion = propulsion;
    await ctx.answerCallbackQuery();

    if (propulsion === "LPG") {
      draft.fillGrade = "LPG";
      draft.step = "consumption";
      ctx.session.onboarding = draft;
      await ctx.reply(t(locale, "onboarding.consumption"));
      return;
    }

    draft.step = "fill_grade";
    ctx.session.onboarding = draft;
    await ctx.reply(t(locale, "onboarding.fillGrade"), {
      reply_markup: fillGradeKeyboard(locale),
    });
  });

  bot.callbackQuery(/^grade:(AI92|AI95|AI98)$/, async (ctx) => {
    const locale = ctx.session.locale;
    const draft = ctx.session.onboarding;
    if (!draft) {
      return;
    }
    const grade = ctx.match[1] as FuelKind;
    if (!GASOLINE_GRADES.includes(grade)) {
      return;
    }
    draft.fillGrade = grade;
    draft.step = "consumption";
    ctx.session.onboarding = draft;
    await ctx.answerCallbackQuery();
    await ctx.reply(t(locale, "onboarding.consumption"));
  });

  bot.callbackQuery(/^watch:(.+)$/, async (ctx) => {
    const locale = ctx.session.locale;
    const draft = ctx.session.onboarding;
    if (!draft) {
      return;
    }

    const token = ctx.match[1];
    await ctx.answerCallbackQuery();

    if (token === "done") {
      if (!draft.watchFuels?.length && draft.fillGrade) {
        draft.watchFuels = [draft.fillGrade];
      }
      draft.step = "trial_consent";
      ctx.session.onboarding = draft;

      const telegramId = ctx.from?.id.toString();
      if (telegramId) {
        await onboardingService.persist(
          telegramId,
          { username: ctx.from?.username, firstName: ctx.from?.first_name },
          draft,
        );
      }

      await ctx.reply(t(locale, "onboarding.trialAsk"), {
        reply_markup: trialKeyboard(locale),
      });
      return;
    }

    const fuel = token as FuelKind;
    const selected = new Set(draft.watchFuels ?? []);
    if (selected.has(fuel)) {
      selected.delete(fuel);
    } else {
      selected.add(fuel);
    }
    draft.watchFuels = [...selected];
    ctx.session.onboarding = draft;
    await ctx.editMessageReplyMarkup({
      reply_markup: watchFuelsKeyboard(locale, draft.watchFuels),
    });
  });

  bot.callbackQuery(/^trial:(yes|no)$/, async (ctx) => {
    const locale = ctx.session.locale;
    const telegramId = ctx.from?.id.toString();
    await ctx.answerCallbackQuery();

    if (ctx.match[1] === "no") {
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
        return;
      }
      await subscriptionService.startTrial(user.id);
      await adminNotify.send(
        ctx.api,
        `Триал 3 дня\n${formatUser(user)}`,
      );
    }

    if (ctx.session.onboarding) {
      ctx.session.onboarding.step = "done";
    }
    await ctx.reply(t(locale, "onboarding.done"), {
      reply_markup: menuKeyboard(locale),
    });
  });
}
