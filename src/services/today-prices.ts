import { InlineKeyboard } from "grammy";
import { FUEL_LABELS } from "../config/constants";
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

function formatSpot(prices: OfficialPrice[], watch: FuelKind[], locale: Locale) {
  const lines: string[] = [];
  for (const fuel of watch) {
    const hit = pickAmount(prices, fuel);
    if (!hit) {
      continue;
    }
    lines.push(`${esc(FUEL_LABELS[fuel][locale])}\n<b>${esc(money(hit.amount, hit.currencyCode, locale))}</b>`);
  }
  return lines;
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

function formatStations(quotes: StationQuote[], locale: Locale) {
  return quotes.map((quote, index) => {
    const fuels = quote.prices
      .map(
        (item) =>
          `${esc(FUEL_LABELS[item.fuel][locale])}  —  <b>${esc(money(item.amount, quote.currencyCode, locale))}</b>`,
      )
      .join("\n");
    const address = quote.address ? `\n${esc(quote.address)}` : "";
    return `<b>${index + 1}. ${esc(quote.name)}</b>${address}\n${fuels}`;
  });
}

function mapsKeyboard(quotes: StationQuote[], country: CountryCode, locale: Locale) {
  const kb = new InlineKeyboard();
  quotes.forEach((quote, index) => {
    kb.url(`${t(locale, "prices.map")} ${index + 1}`, quoteMapUrl(quote, country));
    if (index % 2 === 1) {
      kb.row();
    }
  });
  return kb;
}

function pushChunks(target: string[], header: string, parts: string[]) {
  let current = header;
  for (const part of parts) {
    const next = current ? `${current}\n\n${part}` : part;
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

export async function sendTodayPrices(ctx: BotContext) {
  try {
    const locale = ctx.session.locale;
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      return;
    }
    const user = await userRepo.findByTelegramId(telegramId);
    if (!user?.country || !user.watchFuels.length) {
      return;
    }

    const city = user.city ? cityFromSlug(user.city, user.country) : null;
    const watch = user.watchFuels;
    let spot: OfficialPrice[] = [];
    let quotes: StationQuote[] = [];

    try {
      if (user.country === "MD") {
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

    if (!spot.length && user.country) {
      const fallback: OfficialPrice[] = [];
      for (const fuel of watch) {
        const latest = await priceRepo.latest(user.country, fuel);
        if (latest && isToday(latest.observedAt)) {
          fallback.push({
            country: user.country,
            fuel,
            amount: Number(latest.amount),
            currencyCode: latest.currencyCode as "MDL" | "PRB",
            observedAt: latest.observedAt,
            kind: "SPOT",
          });
        }
      }
      spot = fallback;
      if (user.country === "PMR" && city && !quotes.length && fallback.length) {
        quotes = pmrStationsIn(city.slug).map((station) => ({
          name: locale === "ro" ? station.nameRo : station.nameRu,
          address: locale === "ro" ? station.addressRo : station.addressRu,
          mapQuery: station.mapQuery,
          prices: watchPrices(fallback, watch),
          currencyCode: "PRB" as const,
        }));
      }
    }

    quotes = quotes.filter((quote) => quote.prices.length);

    const cityName = city ? (locale === "ro" ? city.nameRo : city.nameRu) || cityLabel(city.slug, locale) : "";
    const header = `<b>${esc(t(locale, "prices.today", { city: cityName || "—" }))}</b>`;
    const spotLines = formatSpot(spot, watch, locale);
    const priceText = spotLines.length ? `${header}\n\n${spotLines.join("\n\n")}` : esc(t(locale, "prices.empty"));
    const markup = menuKeyboard(locale);

    await ctx.reply(priceText, {
      parse_mode: "HTML",
      reply_markup: markup,
      link_preview_options: { is_disabled: true },
    });

    if (quotes.length) {
      const stationParts = formatStations(quotes, locale);
      const chunks: string[] = [];
      pushChunks(chunks, `<b>${esc(t(locale, "prices.stations"))}</b>`, stationParts);
      if (user.country === "MD" && quotes.length >= 10) {
        chunks.push(esc(t(locale, "prices.stationsCap")));
      }
      for (const [index, chunk] of chunks.entries()) {
        await ctx.reply(chunk, {
          parse_mode: "HTML",
          reply_markup: index === chunks.length - 1 ? mapsKeyboard(quotes, user.country, locale) : undefined,
          link_preview_options: { is_disabled: true },
        });
      }
    } else if (city) {
      await ctx.reply(t(locale, "prices.noStations"), { reply_markup: markup });
    }
  } catch (error) {
    console.error("[today-prices]", error);
  }
}
