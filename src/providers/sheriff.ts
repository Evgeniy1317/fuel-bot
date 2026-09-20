import { BROWSER_UA, FETCH_LIMITS, SOURCES } from "../config/sources";
import { politeGet } from "../lib/http";
import type { OfficialPrice } from "../types/price";
import type { FuelKind } from "../types";

/** Классы с https://sheriff.md/activities/nefteprodukty/ceny_po_regionam */
const SHERIFF_CLASS: Record<string, FuelKind> = {
  "f-98": "AI98",
  "f-95p": "AI95_PREMIUM",
  "f-95": "AI95",
  "f-dte": "DIESEL_EURO",
  "f-dt": "DIESEL",
};

export async function fetchSheriffPrices(force = false): Promise<OfficialPrice[]> {
  const result = await politeGet(
    SOURCES.sheriffPrices,
    FETCH_LIMITS.sheriffMs,
    BROWSER_UA,
    { force },
  );
  if (!result.ok) {
    return [];
  }

  const re =
    /class="item ([^"]+)"[\s\S]{0,400}?class="first">(\d+)<[\s\S]{0,250}?class="last">(\d+)/g;
  const byFuel = new Map<FuelKind, number>();

  for (const match of result.body.matchAll(re)) {
    const cls = match[1];
    const fuel = cls ? SHERIFF_CLASS[cls] : undefined;
    if (!fuel || byFuel.has(fuel)) {
      continue;
    }
    const amount = Number(`${match[2]}.${match[3]}`);
    if (!Number.isFinite(amount) || amount < 10 || amount > 80) {
      continue;
    }
    byFuel.set(fuel, amount);
  }

  if (byFuel.size < 4) {
    console.warn("[sheriff] parsed", [...byFuel.entries()]);
    return [];
  }

  const observedAt = new Date();
  return [...byFuel.entries()].map(([fuel, amount]) => ({
    country: "PMR" as const,
    fuel,
    amount,
    currencyCode: "PRB" as const,
    observedAt,
    kind: "SPOT" as const,
  }));
}
