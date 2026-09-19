import { API_UA, FETCH_LIMITS, SOURCES } from "../config/sources";
import { politeGet } from "../lib/http";
import type { OfficialPrice } from "../types/price";
import type { FuelKind } from "../types";

interface AnreStation {
  station_status?: number;
  gasoline?: number | null;
  diesel?: number | null;
  gpl?: number | null;
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

/** Официальный JSON ANRE e-Carburanți — без парсинга HTML. */
export async function fetchAnreStations(): Promise<OfficialPrice[]> {
  const result = await politeGet(SOURCES.anreApi, FETCH_LIMITS.anreApiMs, API_UA);
  if (!result.ok) {
    return [];
  }

  let stations: AnreStation[];
  try {
    stations = JSON.parse(result.body) as AnreStation[];
  } catch {
    console.warn("[anre] invalid JSON");
    return [];
  }

  const gasoline: number[] = [];
  const diesel: number[] = [];
  const gpl: number[] = [];

  for (const station of stations) {
    if (station.station_status !== 1) {
      continue;
    }
    if (station.gasoline) {
      gasoline.push(station.gasoline);
    }
    if (station.diesel) {
      diesel.push(station.diesel);
    }
    if (station.gpl) {
      gpl.push(station.gpl);
    }
  }

  const prices: OfficialPrice[] = [];
  push(prices, "AI95", median(gasoline));
  push(prices, "DIESEL", median(diesel));
  push(prices, "LPG", median(gpl));
  return prices;
}
