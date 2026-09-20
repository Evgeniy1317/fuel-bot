import { InlineKeyboard } from "grammy";
import { FUEL_LABELS, fuelsForCountry } from "../config/constants";
import { CITIES, cityLabel, type City } from "../config/cities";
import { mdMapsUrl, pmrMapsUrl, pmrStationsIn } from "../config/pmr-stations";
import { money } from "../config/currency";
import { fetchAnreCityStations, fetchAnreStations } from "../providers/anre-stations";
import type { StationQuote } from "../providers/anre-stations";
import { fetchSheriffPrices } from "../providers/sheriff";
import { priceRepo } from "../repositories/price.repo";
import { userRepo } from "../repositories/user.repo";
import type { CountryCode, FuelKind, Locale } from "../types";
import type { OfficialPrice } from "../types/price";
import { t } from "../bot/i18n";
import { blocks, LINE } from "../bot/format";
import type { BotContext } from "../bot/context";
import { menuKeyboard } from "../bot/keyboards";

const TELEGRAM_SAFE = 3500;

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cityFromSlug(slug: string, country: CountryCode): City {
  const known = CITIES.find((entry) => entry.slug === slug);
  if (known) {
    return known;
  }
  const name = slug.replace(/-/g, " ");
  return { slug, country, nameRu: name, nameRo: name, aliases: [name] };
}

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

function trendMark(current: number, previous?: number) {
  if (previous == null) {
    return "";
  }
  if (current > previous + 0.004) {
    return "🔺 ";
  }
  if (current < previous - 0.004) {
    return "🟢 ";
  }
  return "";
}

async function previousMap(country: CountryCode, prices: OfficialPrice[]) {
  const map = new Map<FuelKind, number>();
  await Promise.all(
    prices.map(async (price) => {
      const previous = await priceRepo.previousAmount(country, price.fuel, price.amount);
      if (previous != null) {
        map.set(price.fuel, previous);
      }
    }),
  );
  return map;
}

function formatSpot(
  prices: OfficialPrice[],
  fuels: FuelKind[],
  locale: Locale,
  previous: Map<FuelKind, number>,
) {
  const lines: string[] = [];
  for (const fuel of fuels) {
    const hit = pickAmount(prices, fuel);
    if (!hit) {
      continue;
    }
    const mark = trendMark(hit.amount, previous.get(hit.fuel) ?? previous.get(fuel));
    lines.push(
      `${mark}<b>${esc(FUEL_LABELS[fuel][locale])}</b>\n<code>${esc(money(hit.amount, hit.currencyCode, locale))}</code>`,
    );
  }
  return lines.join(`\n${LINE}\n`);
}

function watchPrices(spot: OfficialPrice[], watch: FuelKind[]) {
  const items: { fuel: FuelKind; amount: number }[] = [];
  for (const fuel of watch) {
    const hit = pickAmount(spot, fuel);
    if (hit) {
      items.push({ fuel, amount: hit.amount });
    }
  }
  return items;
}

function quoteMapUrl(quote: StationQuote, country: CountryCode) {
  const query =
    quote.mapQuery ||
    [quote.name, quote.address].filter(Boolean).join(", ");
  return country === "PMR" ? pmrMapsUrl(query) : mdMapsUrl(query);
}

function isToday(date: Date) {
  const zone = "Europe/Chisinau";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: zone });
  return date.toLocaleDateString("en-CA", { timeZone: zone }) === today;
}

function formatStations(
  quotes: StationQuote[],
  locale: Locale,
  previous: Map<FuelKind, number>,
) {
  return quotes.map((quote, index) => {
    const fuels = quote.prices
      .map((item) => {
        const mark = trendMark(item.amount, previous.get(item.fuel));
        return `${mark}${esc(FUEL_LABELS[item.fuel][locale])}\n<code>${esc(money(item.amount, quote.currencyCode, locale))}</code>`;
      })
      .join(`\n${LINE}\n`);
    const address = quote.address ? `<i>${esc(quote.address)}</i>` : "";
    return blocks(`<b>${index + 1}. ${esc(quote.name)}</b>`, address, fuels);
  });
}

function mapsKeyboard(quotes: StationQuote[], country: CountryCode, locale: Locale) {
  const kb = new InlineKeyboard();
  quotes.forEach((quote, index) => {
    kb.url(t(locale, "prices.map", { n: index + 1 }), quoteMapUrl(quote, country));
    if (index % 2 === 1) {
      kb.row();
    }
  });
  return kb;
}

function pushChunks(target: string[], header: string, parts: string[]) {
  let current = header;
  for (const part of parts) {
    const next = current ? `${current}\n\n${LINE}\n\n${part}` : part;
    if (next.length > TELEGRAM_SAFE && current) {
      target.push(current);
      current = part;
    } else {
      current = next;
    }
  }
  if (current) {
    target.push(current);
  }
}

async function loadLivePrices(
  country: CountryCode,
  city: City | null,
  watch: FuelKind[],
  locale: Locale,
) {
  let spot: OfficialPrice[] = [];
  let quotes: StationQuote[] = [];

  try {
    if (country === "MD") {
      spot = await fetchAnreStations(true);
      if (city) {
        quotes = await fetchAnreCityStations(city, watch, 10);
      }
    } else {
      spot = await fetchSheriffPrices(true);
      const network = watchPrices(spot, watch);
      if (city && network.length) {
        quotes = pmrStationsIn(city.slug).map((station) => ({
          name: locale === "ro" ? station.nameRo : station.nameRu,
          address: locale === "ro" ? station.addressRo : station.addressRu,
          mapQuery: station.mapQuery,
          prices: network,
          currencyCode: "PRB" as const,
        }));
      }
    }
  } catch (error) {
    console.error("[today-prices]", error);
  }

  if (!spot.length) {
    const fallback: OfficialPrice[] = [];
    for (const fuel of watch) {
      const latest = await priceRepo.latest(country, fuel);
      if (latest && isToday(latest.observedAt)) {
        fallback.push({
          country,
          fuel,
          amount: Number(latest.amount),
          currencyCode: latest.currencyCode as "MDL" | "PRB",
          observedAt: latest.observedAt,
          kind: "SPOT",
        });
      }
    }
    spot = fallback;
    if (country === "PMR" && city && !quotes.length && fallback.length) {
      quotes = pmrStationsIn(city.slug).map((station) => ({
        name: locale === "ro" ? station.nameRo : station.nameRu,
        address: locale === "ro" ? station.addressRo : station.addressRu,
        mapQuery: station.mapQuery,
        prices: watchPrices(fallback, watch),
        currencyCode: "PRB" as const,
      }));
    }
  }

  return { spot, quotes: quotes.filter((quote) => quote.prices.length) };
}

const replyOpts = {
  parse_mode: "HTML" as const,
  link_preview_options: { is_disabled: true },
};

export async function sendTodayPrices(ctx: BotContext) {
  await sendPriceBundle(ctx, "watch");
}

export async function sendAllPrices(ctx: BotContext) {
  await sendPriceBundle(ctx, "all");
}

async function sendPriceBundle(ctx: BotContext, mode: "watch" | "all") {
  try {
    const locale = ctx.session.locale;
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      return;
    }
    const user = await userRepo.findByTelegramId(telegramId);
    if (!user?.country) {
      await ctx.reply(t(locale, "prices.needCity"), {
        reply_markup: menuKeyboard(locale),
      });
      return;
    }

    const city = user.city ? cityFromSlug(user.city, user.country) : null;
    if (mode === "watch" && !city) {
      await ctx.reply(t(locale, "prices.needCity"), {
        reply_markup: menuKeyboard(locale),
      });
      return;
    }

    const fuels =
      mode === "all"
        ? fuelsForCountry(user.country)
        : user.watchFuels.length
          ? user.watchFuels
          : fuelsForCountry(user.country);

    const { spot, quotes } = await loadLivePrices(
      user.country,
      mode === "watch" ? city : null,
      fuels,
      locale,
    );
    const previous = await previousMap(user.country, spot);
    const cityName = city
      ? (locale === "ro" ? city.nameRo : city.nameRu) || cityLabel(city.slug, locale)
      : "";
    const headerText =
      mode === "all"
        ? t(locale, "prices.all")
        : t(locale, "prices.today", { city: cityName });
    const spotBlock = formatSpot(spot, fuels, locale, previous);
    const priceText = spotBlock
      ? blocks(`<b>${esc(headerText)}</b>`, spotBlock)
      : esc(t(locale, "prices.empty"));
    const markup = menuKeyboard(locale);

    await ctx.reply(priceText, {
      ...replyOpts,
      reply_markup: markup,
    });

    if (mode !== "watch") {
      return;
    }

    if (quotes.length) {
      const stationParts = formatStations(quotes, locale, previous);
      const chunks: string[] = [];
      pushChunks(chunks, `<b>${esc(t(locale, "prices.stations"))}</b>`, stationParts);
      if (user.country === "MD" && quotes.length >= 10) {
        chunks.push(esc(t(locale, "prices.stationsCap")));
      }
      for (const [index, chunk] of chunks.entries()) {
        await ctx.reply(chunk, {
          ...replyOpts,
          reply_markup: index === chunks.length - 1 ? mapsKeyboard(quotes, user.country, locale) : undefined,
        });
      }
    } else if (city) {
      await ctx.reply(t(locale, "prices.noStations"), { reply_markup: markup });
    }
  } catch (error) {
    console.error("[today-prices]", error);
  }
}

export async function liveFuelKinds(country: CountryCode) {
  const allowed = fuelsForCountry(country);
  let spot: OfficialPrice[] = [];
  try {
    spot = country === "MD" ? await fetchAnreStations(true) : await fetchSheriffPrices(true);
  } catch (error) {
    console.error("[today-prices] fuels", error);
  }
  if (!spot.length) {
    for (const fuel of allowed) {
      const latest = await priceRepo.latest(country, fuel);
      if (latest && isToday(latest.observedAt)) {
        spot.push({
          country,
          fuel,
          amount: Number(latest.amount),
          currencyCode: latest.currencyCode as "MDL" | "PRB",
          observedAt: latest.observedAt,
          kind: "SPOT",
        });
      }
    }
  }
  return allowed.filter((fuel) => Boolean(pickAmount(spot, fuel)));
}

export async function currentFuelPrice(country: CountryCode, fuel: FuelKind) {
  let spot: OfficialPrice[] = [];
  try {
    spot = country === "MD" ? await fetchAnreStations(true) : await fetchSheriffPrices(true);
  } catch (error) {
    console.error("[today-prices] calc", error);
  }
  const live = pickAmount(spot, fuel);
  if (live) {
    return live;
  }
  const latest = await priceRepo.latest(country, fuel);
  if (latest && isToday(latest.observedAt)) {
    return {
      country,
      fuel,
      amount: Number(latest.amount),
      currencyCode: latest.currencyCode as "MDL" | "PRB",
      observedAt: latest.observedAt,
      kind: "SPOT" as const,
    };
  }
  return undefined;
}
