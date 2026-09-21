import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { FUEL_LABELS, fuelsForCountry } from "../config/constants";
import { cityLabel } from "../config/cities";
import { money } from "../config/currency";
import { chisinauDay, isFutureChisinauDay } from "../lib/time";
import { fetchAnreCeiling } from "../providers/anre-ceiling";
import { fetchAnreStations } from "../providers/anre-stations";
import { fetchSheriffPrices } from "../providers/sheriff";
import { fillIntentRepo } from "../repositories/fill-intent.repo";
import { newsEventRepo } from "../repositories/news-event.repo";
import { priceRepo } from "../repositories/price.repo";
import { userRepo } from "../repositories/user.repo";
import type { CountryCode, FuelKind, Locale } from "../types";
import type { OfficialPrice } from "../types/price";
import { t } from "../bot/i18n";
import { blocks, LINE } from "../bot/format";
import { fillTodayKeyboard, menuKeyboard } from "../bot/keyboards";
import { subscriptionService } from "./subscription";

type Advice = "fill" | "wait" | "hold";
type DigestUser = Awaited<ReturnType<typeof userRepo.findOnboardedByCountry>>[number];

function pickAmount(prices: OfficialPrice[], fuel: FuelKind) {
  const exact = prices.find((price) => price.fuel === fuel);
  if (exact) {
    return exact;
  }
  if (fuel === "DIESEL_EURO") {
    return prices.find((price) => price.fuel === "DIESEL");
  }
  if (fuel === "DIESEL") {
    return prices.find((price) => price.fuel === "DIESEL_EURO");
  }
  return undefined;
}

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tomorrowCeiling(ceilings: OfficialPrice[], fuel: FuelKind) {
  const hit = pickAmount(ceilings, fuel);
  if (!hit || !isFutureChisinauDay(hit.effectiveFrom)) {
    return undefined;
  }
  return hit;
}

function adviceFor(today: number, tomorrow?: number): Advice {
  if (tomorrow != null && tomorrow > today + 0.009) {
    return "fill";
  }
  if (tomorrow != null && tomorrow < today - 0.009) {
    return "wait";
  }
  return "hold";
}

function mdHikeSoon(ceilings: OfficialPrice[], spots: OfficialPrice[]) {
  for (const ceil of ceilings) {
    const spot = pickAmount(spots, ceil.fuel);
    const today = spot?.amount;
    if (today == null) {
      continue;
    }
    if (isFutureChisinauDay(ceil.effectiveFrom) && ceil.amount > today + 0.009) {
      return true;
    }
  }
  return false;
}

async function loadBundle() {
  const [mdSpot, mdCeil, pmrSpot] = await Promise.all([
    fetchAnreStations(true),
    fetchAnreCeiling(true),
    fetchSheriffPrices(true),
  ]);
  return { mdSpot, mdCeil, pmrSpot };
}

async function sendToUser(
  bot: Bot<BotContext>,
  user: DigestUser,
  country: CountryCode,
  slot: "morning" | "evening",
  bundle: Awaited<ReturnType<typeof loadBundle>>,
) {
  const locale = user.locale as Locale;
  const fuels = user.watchFuels.length ? user.watchFuels : fuelsForCountry(country);
  const spot = country === "MD" ? bundle.mdSpot : bundle.pmrSpot;
  const pmrHeads = country === "PMR" && mdHikeSoon(bundle.mdCeil, bundle.mdSpot);
  const parts: string[] = [];
  let fill: { fuel: FuelKind; amount: number; currencyCode: string } | undefined;

  for (const fuel of fuels) {
    const todayHit = pickAmount(spot, fuel);
    if (!todayHit) {
      continue;
    }
    const prev = await priceRepo.previousAmount(country, fuel, todayHit.amount);
    const tomorrow = country === "MD" ? tomorrowCeiling(bundle.mdCeil, fuel) : undefined;
    const tomorrowAmt = tomorrow?.amount;
    const advice: Advice = country === "MD"
      ? adviceFor(todayHit.amount, tomorrowAmt)
      : pmrHeads
        ? "fill"
        : "hold";

    if (advice === "fill" && !fill) {
      fill = {
        fuel,
        amount: todayHit.amount,
        currencyCode: todayHit.currencyCode,
      };
    }

    const lines = [
      `<b>${esc(FUEL_LABELS[fuel][locale])}</b>`,
      t(locale, "digest.now", {
        amount: esc(money(todayHit.amount, todayHit.currencyCode, locale)),
      }),
    ];
    if (tomorrowAmt != null) {
      lines.push(
        t(locale, "digest.tomorrow", {
          amount: esc(money(tomorrowAmt, todayHit.currencyCode, locale)),
        }),
      );
    } else if (prev != null && Math.abs(prev - todayHit.amount) > 0.004) {
      lines.push(
        t(locale, "digest.yesterday", {
          amount: esc(money(prev, todayHit.currencyCode, locale)),
        }),
      );
    }
    lines.push(t(locale, `digest.${advice}`));
    parts.push(lines.join("\n"));
  }

  if (!parts.length) {
    return;
  }

  const city = user.city ? cityLabel(user.city, locale) : "";
  const title = t(locale, slot === "morning" ? "digest.morning" : "digest.evening");
  const extra = pmrHeads ? t(locale, "digest.mdHeadsUp") : "";
  const askFill = slot === "evening" && Boolean(fill);
  const text = blocks(
    `<b>${esc(title)}</b>`,
    city ? esc(city) : "",
    extra ? esc(extra) : "",
    parts.join(`\n${LINE}\n`),
    askFill ? esc(t(locale, "alert.fillAsk")) : "",
  );

  await bot.api.sendMessage(user.telegramId, text, {
    parse_mode: "HTML",
    reply_markup: askFill ? fillTodayKeyboard(locale) : menuKeyboard(locale),
  });

  if (askFill && fill) {
    await fillIntentRepo.replaceOffer({
      userId: user.id,
      fuel: fill.fuel,
      country,
      priceAtFill: fill.amount,
      currencyCode: fill.currencyCode,
    });
  }
}

async function sendDigest(bot: Bot<BotContext>, slot: "morning" | "evening") {
  const key = `digest:${slot}:${chisinauDay()}`;
  if (await newsEventRepo.alreadyProcessed("API", key)) {
    return;
  }
  await newsEventRepo.save({
    source: "API",
    externalId: key,
    rawText: slot,
  });

  const bundle = await loadBundle();
  for (const country of ["MD", "PMR"] as const) {
    const users = await userRepo.findOnboardedByCountry(country);
    for (const user of users) {
      if (!subscriptionService.hasAccess(user.subscription)) {
        continue;
      }
      try {
        await sendToUser(bot, user, country, slot, bundle);
      } catch (error) {
        console.warn("[digest] send", user.telegramId, error);
      }
    }
  }
}

export const digestService = {
  sendMorning(bot: Bot<BotContext>) {
    return sendDigest(bot, "morning");
  },
  sendEvening(bot: Bot<BotContext>) {
    return sendDigest(bot, "evening");
  },
};
