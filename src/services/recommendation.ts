import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import { telegramMeta, type SourceTrust } from "../config/news-sources";
import { priceRepo } from "../repositories/price.repo";
import type { AlertKind, CountryCode, FuelKind } from "../types";
import { alertService } from "./alerts";

interface Vote {
  at: number;
  source: string;
  trust: SourceTrust;
  kind: AlertKind;
  country: CountryCode;
  fuel: FuelKind;
  amount: number;
  currencyCode: string;
  previousAmount?: number;
}

const votes = new Map<string, Vote[]>();
const VOTE_MS = 3 * 60 * 60 * 1000;

function voteKey(country: CountryCode, fuel: FuelKind, kind: AlertKind) {
  return `${country}:${fuel}:${kind}`;
}

function prune(list: Vote[]) {
  const since = Date.now() - VOTE_MS;
  return list.filter((item) => item.at >= since);
}

function trustOf(source: string): SourceTrust {
  if (source === "API" || source === "sheriff" || source === "ceiling") {
    return "official";
  }
  return telegramMeta(source)?.trust ?? "news";
}

function shouldFire(list: Vote[], incoming: Vote) {
  if (incoming.trust === "official") {
    return true;
  }
  if (incoming.trust === "specialist") {
    return true;
  }
  const unique = new Set(list.map((item) => item.source));
  unique.add(incoming.source);
  return unique.size >= 2;
}

export const recommendationService = {
  async consider(
    bot: Bot<BotContext>,
    input: {
      source: string;
      kind: AlertKind;
      country: CountryCode;
      fuel: FuelKind;
      amount: number;
      currencyCode: string;
      previousAmount?: number;
      windowHours?: number;
      advisory?: boolean;
    },
  ) {
    const key = voteKey(input.country, input.fuel, input.kind);
    const incoming: Vote = {
      at: Date.now(),
      source: input.source,
      trust: trustOf(input.source),
      kind: input.kind,
      country: input.country,
      fuel: input.fuel,
      amount: input.amount,
      currencyCode: input.currencyCode,
      previousAmount: input.previousAmount,
    };

    if (
      input.kind !== "PREDICTED_HIKE" &&
      (input.previousAmount === undefined || Math.abs(input.amount - input.previousAmount) < 0.009)
    ) {
      return { sent: false as const };
    }

    const list = prune(votes.get(key) ?? []);
    if (!shouldFire(list, incoming)) {
      list.push(incoming);
      votes.set(key, list);
      return { sent: false as const };
    }
    list.push(incoming);
    votes.set(key, list);

    await alertService.dispatch({
      bot,
      kind: input.kind,
      country: input.country,
      fuel: input.fuel,
      amount: input.amount,
      currencyCode: input.currencyCode,
      previousAmount: input.previousAmount,
      windowHours: input.windowHours,
      advisory: input.advisory,
      confirmed: list.length >= 2 || incoming.trust !== "news",
    });
    return { sent: true as const };
  },

  async hikeWithoutPrice(
    bot: Bot<BotContext>,
    input: { source: string; country: CountryCode; fuel?: FuelKind; advisory?: boolean },
  ) {
    const fuel = input.fuel ?? (input.country === "MD" ? "AI95" : "AI95");
    const latest = await priceRepo.latestSpot(input.country, fuel);
    await this.consider(bot, {
      source: input.source,
      kind: "PREDICTED_HIKE",
      country: input.country,
      fuel,
      amount: latest ? Number(latest.amount) : 0,
      currencyCode: input.country === "MD" ? "MDL" : "PRB",
      windowHours: 24,
      advisory: input.advisory ?? true,
    });
  },
};
