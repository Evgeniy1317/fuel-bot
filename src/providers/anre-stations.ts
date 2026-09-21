import { API_UA, FETCH_LIMITS, SOURCES } from "../config/sources";
import { namesMatch } from "../config/cities";
import { politeGet } from "../lib/http";
import type { OfficialPrice } from "../types/price";
import type { FuelKind } from "../types";
import type { City } from "../config/cities";
import { DIESEL_GRADES } from "../config/constants";

interface AnreStation {
  x?: number;
  y?: number;
  station_status?: number;
  gasoline?: number | null;
  diesel?: number | null;
  gpl?: number | null;
  station_name?: string | null;
  company_name?: string | null;
  nomenclator?: string | null;
  fullstreet?: string | null;
  addrnum?: string | null;
  bua?: string | null;
  lev1?: string | null;
  lev2?: string | null;
  sector?: string | null;
}

export interface StationQuote {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  mapQuery?: string;
  prices: { fuel: FuelKind; amount: number }[];
  currencyCode: "MDL" | "PRB";
}

function median(values: number[]): number | null {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!clean.length) {
    return null;
  }
  clean.sort((a, b) => a - b);
  const mid = Math.floor(clean.length / 2);
  const raw =
    clean.length % 2 === 1 ? clean[mid]! : (clean[mid - 1]! + clean[mid]!) / 2;
  return Math.round(raw * 100) / 100;
}

function push(
  list: OfficialPrice[],
  fuel: FuelKind,
  amount: number | null,
) {
  if (amount === null) {
    return;
  }
  list.push({
    country: "MD",
    fuel,
    amount,
    currencyCode: "MDL",
    observedAt: new Date(),
    kind: "SPOT",
  });
}

/** Web Mercator (EPSG:3857) → WGS84 для Google Maps. */
export function mercatorToWgs(x: number, y: number) {
  const lon = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  return { lat, lng: lon };
}

function stationInCity(station: AnreStation, city: City) {
  const fields = [station.lev1, station.lev2, station.bua, station.sector].filter(
    (value): value is string => Boolean(value),
  );
  const needles = [city.slug, city.nameRu, city.nameRo, ...city.aliases];
  return fields.some((field) => needles.some((needle) => namesMatch(field, needle)));
}

function plausibleBand(fuel: "gasoline" | "diesel" | "gpl", amount: number) {
  if (fuel === "gpl") {
    return amount >= 8 && amount <= 28;
  }
  return amount >= 18 && amount <= 48;
}

function nearAnchor(amount: number, anchor: number | null, fuel: "gasoline" | "diesel" | "gpl") {
  if (!anchor) {
    return true;
  }
  const floor = fuel === "gpl" ? 0.82 : 0.92;
  const ceil = fuel === "gpl" ? 1.22 : 1.15;
  return amount >= anchor * floor && amount <= anchor * ceil;
}

function stationPrices(
  station: AnreStation,
  watch: FuelKind[],
  anchors: { gasoline: number | null; diesel: number | null; gpl: number | null },
) {
  const prices: { fuel: FuelKind; amount: number }[] = [];
  if (
    station.gasoline &&
    watch.includes("AI95") &&
    plausibleBand("gasoline", station.gasoline) &&
    nearAnchor(station.gasoline, anchors.gasoline, "gasoline")
  ) {
    prices.push({ fuel: "AI95", amount: station.gasoline });
  }
  if (
    station.diesel &&
    watch.some((fuel) => DIESEL_GRADES.includes(fuel)) &&
    plausibleBand("diesel", station.diesel) &&
    nearAnchor(station.diesel, anchors.diesel, "diesel")
  ) {
    prices.push({
      fuel: watch.includes("DIESEL_EURO") ? "DIESEL_EURO" : "DIESEL",
      amount: station.diesel,
    });
  }
  if (
    watch.includes("LPG") &&
    station.gpl &&
    plausibleBand("gpl", station.gpl) &&
    nearAnchor(station.gpl, anchors.gpl, "gpl")
  ) {
    prices.push({ fuel: "LPG", amount: station.gpl });
  }
  return prices;
}

async function loadStations(force: boolean) {
  const result = await politeGet(SOURCES.anreApi, FETCH_LIMITS.anreApiMs, API_UA, {
    force,
  });
  if (!result.ok) {
    return [];
  }
  try {
    return JSON.parse(result.body) as AnreStation[];
  } catch {
    console.warn("[anre] invalid JSON");
    return [];
  }
}

/** Официальный JSON ANRE e-Carburanți — без парсинга HTML. */
export async function fetchAnreStations(force = false): Promise<OfficialPrice[]> {
  const stations = await loadStations(force);
  const gasoline: number[] = [];
  const diesel: number[] = [];
  const gpl: number[] = [];

  for (const station of stations) {
    if (station.station_status !== 1) {
      continue;
    }
    if (station.gasoline && plausibleBand("gasoline", station.gasoline)) {
      gasoline.push(station.gasoline);
    }
    if (station.diesel && plausibleBand("diesel", station.diesel)) {
      diesel.push(station.diesel);
    }
    if (station.gpl && plausibleBand("gpl", station.gpl)) {
      gpl.push(station.gpl);
    }
  }

  const prices: OfficialPrice[] = [];
  push(prices, "AI95", median(gasoline));
  push(prices, "DIESEL_EURO", median(diesel));
  push(prices, "LPG", median(gpl));
  return prices;
}

function nationalAnchors(stations: AnreStation[]) {
  const gasoline: number[] = [];
  const diesel: number[] = [];
  const gpl: number[] = [];
  for (const station of stations) {
    if (station.station_status !== 1) {
      continue;
    }
    if (station.gasoline && plausibleBand("gasoline", station.gasoline)) {
      gasoline.push(station.gasoline);
    }
    if (station.diesel && plausibleBand("diesel", station.diesel)) {
      diesel.push(station.diesel);
    }
    if (station.gpl && plausibleBand("gpl", station.gpl)) {
      gpl.push(station.gpl);
    }
  }
  return {
    gasoline: median(gasoline),
    diesel: median(diesel),
    gpl: median(gpl),
  };
}

export async function fetchAnreCityStations(
  city: City,
  watch: FuelKind[],
  limit = 8,
): Promise<StationQuote[]> {
  const stations = await loadStations(true);
  const anchors = nationalAnchors(stations);
  const quotes: StationQuote[] = [];

  for (const station of stations) {
    if (station.station_status !== 1 || !stationInCity(station, city)) {
      continue;
    }
    const prices = stationPrices(station, watch, anchors);
    if (!prices.length) {
      continue;
    }
    const geo =
      station.x != null && station.y != null
        ? mercatorToWgs(station.x, station.y)
        : null;
    const name = [station.station_name, station.nomenclator]
      .filter((part) => part && part.trim())
      .join(" · ") || station.company_name || "PECO";
    const address = [station.fullstreet, station.addrnum]
      .filter((part) => part && String(part).trim())
      .join(", ");
    quotes.push({
      name,
      address: address || undefined,
      lat: geo?.lat,
      lng: geo?.lng,
      mapQuery: [name, address, city.nameRo || city.nameRu, "Moldova"].filter(Boolean).join(", "),
      prices,
      currencyCode: "MDL",
    });
  }

  const sortFuel = watch[0] ?? "AI95";
  quotes.sort((a, b) => {
    const pa = a.prices.find((item) => item.fuel === sortFuel)?.amount ?? 999;
    const pb = b.prices.find((item) => item.fuel === sortFuel)?.amount ?? 999;
    return pa - pb;
  });
  return quotes.slice(0, limit);
}

