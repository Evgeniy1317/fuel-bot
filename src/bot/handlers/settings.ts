import type { Bot } from "grammy";
import { ALL_FUELS, FUEL_LABELS, toggleFuel } from "../../config/constants";
import { cityExamples, cityLabel } from "../../config/cities";
import { userRepo } from "../../repositories/user.repo";
import { vehicleRepo } from "../../repositories/vehicle.repo";
import type { FuelKind, Locale } from "../../types";
import type { BotContext, SettingsEditField } from "../context";
import { t } from "../i18n";
import {
  backKeyboard,
  countryKeyboard,
  fillGradeKeyboard,
  languageKeyboard,
  menuKeyboard,
  propulsionKeyboard,
  settingsEditKeyboard,
  skipBackKeyboard,
  watchFuelsInline,
} from "../keyboards";
import {
  fillGradeForPropulsion,
  isBack,
  isSkip,
  matchCountry,
  matchFillGrade,
  matchLanguage,
  matchPropulsion,
  resolveCity,
} from "../onboarding-flow";

function wizardOpen(ctx: BotContext) {
  return Boolean(ctx.session.onboarding && ctx.session.onboarding.step !== "done");
}

function parseNumber(text: string | undefined) {
  if (!text) {
    return null;
  }
  const normalized = text.replace(",", ".").trim();
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function dash(locale: Locale, value?: string | null) {
  return value && value.trim() ? value : t(locale, "settings.dash");
}

export async function showSettings(ctx: BotContext) {
  const locale = ctx.session.locale;
  const user = await userRepo.findByTelegramId(String(ctx.from?.id));
  const country = user?.country;
  const fuel = user?.vehicle?.fillGrade
    ? FUEL_LABELS[user.vehicle.fillGrade][locale]
    : null;
  const consumption =
    user?.vehicle?.litersPer100km == null
      ? null
      : t(locale, "settings.consumptionValue", {
          n: Number(user.vehicle.litersPer100km),
        });
  const dailyKm =
    user?.dailyKm == null
      ? null
      : t(locale, "settings.dailyKmValue", { n: Number(user.dailyKm) });
  const alerts = user?.watchFuels?.length
    ? user.watchFuels.map((item) => FUEL_LABELS[item][locale]).join(", ")
    : null;

  const card = [
    t(locale, "settings.title"),
    "",
    t(locale, "settings.lineLang", {
      value: locale === "ro" ? "Română" : "Русский",
    }),
    t(locale, "settings.lineCountry", {
      value: dash(
        locale,
        country ? t(locale, country === "PMR" ? "onboarding.countryPmr" : "onboarding.countryMd") : null,
      ),
    }),
    t(locale, "settings.lineCity", {
      value: dash(locale, user?.city ? cityLabel(user.city, locale) : null),
    }),
    t(locale, "settings.lineFuel", { value: dash(locale, fuel) }),
    t(locale, "settings.lineConsumption", { value: dash(locale, consumption) }),
    t(locale, "settings.lineDailyKm", { value: dash(locale, dailyKm) }),
    t(locale, "settings.lineAlerts", { value: dash(locale, alerts) }),
    "",
    t(locale, "settings.hint"),
  ].join("\n");

  ctx.session.editing = undefined;
  await ctx.reply(card, {
    reply_markup: settingsEditKeyboard(locale),
  });
}

async function startEdit(ctx: BotContext, field: SettingsEditField) {
  const locale = ctx.session.locale;
  ctx.session.editing = field;
  if (field === "language") {
    await ctx.reply(t(locale, "start.language"), { reply_markup: languageKeyboard() });
    return;
  }
  if (field === "country") {
    await ctx.reply(t(locale, "onboarding.country"), {
      reply_markup: countryKeyboard(locale),
    });
    return;
  }
  if (field === "city") {
    const user = await userRepo.findByTelegramId(String(ctx.from?.id));
    const examples = user?.country ? cityExamples(user.country, locale) : "";
    await ctx.reply(t(locale, "onboarding.city", { examples }), {
      reply_markup: backKeyboard(locale),
    });
    return;
  }
  if (field === "propulsion") {
    await ctx.reply(t(locale, "onboarding.propulsion"), {
      reply_markup: propulsionKeyboard(locale),
    });
    return;
  }
  if (field === "fill_grade") {
    await ctx.reply(t(locale, "onboarding.fillGrade"), {
      reply_markup: fillGradeKeyboard(locale),
    });
    return;
  }
  if (field === "consumption") {
    await ctx.reply(t(locale, "onboarding.consumption"), {
      reply_markup: skipBackKeyboard(locale),
    });
    return;
  }
  if (field === "daily_km") {
    await ctx.reply(t(locale, "onboarding.dailyKm"), {
      reply_markup: skipBackKeyboard(locale),
    });
    return;
  }
  if (field === "watch_fuels") {
    const user = await userRepo.findByTelegramId(String(ctx.from?.id));
    await ctx.reply(t(locale, "onboarding.watchFuels"), {
      reply_markup: watchFuelsInline(locale, user?.watchFuels ?? [], "setwatch"),
    });
  }
}

export function registerSettings(bot: Bot<BotContext>) {
  bot.command("language", async (ctx) => {
    if (wizardOpen(ctx)) {
      return;
    }
    ctx.session.editing = "language";
    await ctx.reply(t(ctx.session.locale, "start.language"), {
      reply_markup: languageKeyboard(),
    });
  });

  bot.hears(/Настройки|Setări/, async (ctx) => {
    if (wizardOpen(ctx)) {
      return;
    }
    await showSettings(ctx);
  });

  bot.callbackQuery(/^set:(.+)$/, async (ctx) => {
    if (wizardOpen(ctx)) {
      await ctx.answerCallbackQuery();
      return;
    }
    await ctx.answerCallbackQuery();
    const action = ctx.match[1];
    if (action === "close") {
      ctx.session.editing = undefined;
      await ctx.reply(t(ctx.session.locale, "menu.title"), {
        reply_markup: menuKeyboard(ctx.session.locale),
      });
      return;
    }
    if (action === "fuel") {
      await startEdit(ctx, "propulsion");
      return;
    }
    if (action === "alerts") {
      await startEdit(ctx, "watch_fuels");
      return;
    }
    if (
      action === "language" ||
      action === "country" ||
      action === "city" ||
      action === "consumption" ||
      action === "daily_km"
    ) {
      await startEdit(ctx, action);
    }
  });

  bot.callbackQuery(/^setwatch:(.+)$/, async (ctx) => {
    if (wizardOpen(ctx) || ctx.session.editing !== "watch_fuels") {
      await ctx.answerCallbackQuery();
      return;
    }
    const locale = ctx.session.locale;
    const telegramId = ctx.from?.id.toString();
    const token = ctx.match[1];
    if (!telegramId) {
      await ctx.answerCallbackQuery();
      return;
    }
    const user = await userRepo.findByTelegramId(telegramId);
    if (!user) {
      await ctx.answerCallbackQuery();
      return;
    }

    if (token === "back") {
      await ctx.answerCallbackQuery();
      await showSettings(ctx);
      return;
    }
    if (token === "done") {
      await ctx.answerCallbackQuery();
      await ctx.reply(t(locale, "settings.saved"), {
        reply_markup: menuKeyboard(locale),
      });
      await showSettings(ctx);
      return;
    }
    if (!ALL_FUELS.includes(token as FuelKind)) {
      await ctx.answerCallbackQuery();
      return;
    }
    const next = toggleFuel(user.watchFuels, token as FuelKind);
    if (!next.length) {
      await ctx.answerCallbackQuery();
      return;
    }
    await userRepo.patch(telegramId, { watchFuels: next });
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({
      reply_markup: watchFuelsInline(locale, next, "setwatch"),
    });
  });

  bot.on("message:text", async (ctx, next) => {
    if (wizardOpen(ctx) || !ctx.session.editing) {
      await next();
      return;
    }
    const text = ctx.message.text.trim();
    const locale = ctx.session.locale;
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      return;
    }

    if (isBack(text)) {
      await showSettings(ctx);
      return;
    }

    if (ctx.session.editing === "language") {
      const picked = matchLanguage(text);
      if (!picked) {
        await startEdit(ctx, "language");
        return;
      }
      ctx.session.locale = picked;
      await userRepo.patch(telegramId, { locale: picked });
      await ctx.reply(t(picked, "settings.saved"), {
        reply_markup: menuKeyboard(picked),
      });
      await showSettings(ctx);
      return;
    }

    if (ctx.session.editing === "country") {
      const country = matchCountry(text);
      if (!country) {
        await startEdit(ctx, "country");
        return;
      }
      await userRepo.patch(telegramId, { country, city: null });
      ctx.session.editing = "city";
      await ctx.reply(t(locale, "onboarding.city", { examples: cityExamples(country, locale) }), {
        reply_markup: backKeyboard(locale),
      });
      return;
    }

    if (ctx.session.editing === "city") {
      const user = await userRepo.findByTelegramId(telegramId);
      if (!user?.country) {
        await startEdit(ctx, "country");
        return;
      }
      const resolved = resolveCity(text, user.country, locale);
      if (!resolved.ok) {
        await ctx.reply(t(locale, "onboarding.cityUnknown", { examples: resolved.examples }), {
          reply_markup: backKeyboard(locale),
        });
        return;
      }
      await userRepo.patch(telegramId, { city: resolved.city.slug });
      await ctx.reply(t(locale, "settings.saved"), {
        reply_markup: menuKeyboard(locale),
      });
      await showSettings(ctx);
      return;
    }

    if (ctx.session.editing === "propulsion") {
      const propulsion = matchPropulsion(text);
      if (!propulsion) {
        await startEdit(ctx, "propulsion");
        return;
      }
      const user = await userRepo.findByTelegramId(telegramId);
      if (!user) {
        await showSettings(ctx);
        return;
      }
      const autoGrade = fillGradeForPropulsion(propulsion);
      if (autoGrade) {
        await vehicleRepo.upsertForUser(user.id, {
          brand: user?.vehicle?.brand ?? null,
          model: user?.vehicle?.model ?? null,
          litersPer100km:
            user?.vehicle?.litersPer100km == null
              ? null
              : Number(user.vehicle.litersPer100km),
          propulsion,
          fillGrade: autoGrade,
        });
        await ctx.reply(t(locale, "settings.saved"), {
          reply_markup: menuKeyboard(locale),
        });
        await showSettings(ctx);
        return;
      }
      ctx.session.editing = "fill_grade";
      await vehicleRepo.upsertForUser(user.id, {
        brand: user?.vehicle?.brand ?? null,
        model: user?.vehicle?.model ?? null,
        litersPer100km:
          user?.vehicle?.litersPer100km == null
            ? null
            : Number(user.vehicle.litersPer100km),
        propulsion,
        fillGrade: user?.vehicle?.fillGrade ?? "AI95",
      });
      await ctx.reply(t(locale, "onboarding.fillGrade"), {
        reply_markup: fillGradeKeyboard(locale),
      });
      return;
    }

    if (ctx.session.editing === "fill_grade") {
      const grade = matchFillGrade(text);
      if (!grade) {
        await startEdit(ctx, "fill_grade");
        return;
      }
      const user = await userRepo.findByTelegramId(telegramId);
      if (!user?.vehicle) {
        await showSettings(ctx);
        return;
      }
      await vehicleRepo.upsertForUser(user.id, {
        brand: user.vehicle.brand,
        model: user.vehicle.model,
        litersPer100km:
          user.vehicle.litersPer100km == null
            ? null
            : Number(user.vehicle.litersPer100km),
        propulsion: user.vehicle.propulsion,
        fillGrade: grade,
      });
      await ctx.reply(t(locale, "settings.saved"), {
        reply_markup: menuKeyboard(locale),
      });
      await showSettings(ctx);
      return;
    }

    if (ctx.session.editing === "consumption") {
      const user = await userRepo.findByTelegramId(telegramId);
      if (!user?.vehicle) {
        await showSettings(ctx);
        return;
      }
      let liters: number | null = user.vehicle.litersPer100km == null
        ? null
        : Number(user.vehicle.litersPer100km);
      if (isSkip(text)) {
        liters = null;
      } else {
        const value = parseNumber(text);
        if (!value) {
          await ctx.reply(t(locale, "errors.number"), {
            reply_markup: skipBackKeyboard(locale),
          });
          return;
        }
        liters = value;
      }
      await vehicleRepo.upsertForUser(user.id, {
        brand: user.vehicle.brand,
        model: user.vehicle.model,
        litersPer100km: liters,
        propulsion: user.vehicle.propulsion,
        fillGrade: user.vehicle.fillGrade,
      });
      await ctx.reply(t(locale, "settings.saved"), {
        reply_markup: menuKeyboard(locale),
      });
      await showSettings(ctx);
      return;
    }

    if (ctx.session.editing === "daily_km") {
      let dailyKm: number | null = null;
      if (!isSkip(text)) {
        const value = parseNumber(text);
        if (!value) {
          await ctx.reply(t(locale, "errors.number"), {
            reply_markup: skipBackKeyboard(locale),
          });
          return;
        }
        dailyKm = value;
      }
      await userRepo.patch(telegramId, { dailyKm });
      await ctx.reply(t(locale, "settings.saved"), {
        reply_markup: menuKeyboard(locale),
      });
      await showSettings(ctx);
      return;
    }

    await next();
  });
}
