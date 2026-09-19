import { BROWSER_UA, FETCH_LIMITS, SOURCES } from "../config/sources";
import { politeGet } from "../lib/http";
import type { OfficialPrice } from "../types/price";

function parseLei(raw: string): number | null {
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && value > 5 && value < 80 ? value : null;
}

function parseMdDate(raw: string): Date | undefined {
  const match = raw.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) {
    return undefined;
  }
  const [, day, month, year] = match;
  return new Date(`${year}-${month}-${day}T00:00:00+03:00`);
}

function firstStrong(html: string, label: RegExp): number | null {
  const match = html.match(
    new RegExp(`${label.source}[\\s\\S]{0,500}?<strong>(\\d+[.,]\\d{2})</strong>`, "i"),
  );
  return match ? parseLei(match[1]!) : null;
}

export async function fetchAnreCeiling(): Promise<OfficialPrice[]> {
  const result = await politeGet(SOURCES.anreSite, FETCH_LIMITS.anreSiteMs, BROWSER_UA);
  if (!result.ok) {
    return [];
  }

  const html = result.body;
  const section =
    html.match(/Prețul maxim de referință[\s\S]{0,8000}/i)?.[0] ?? html;
  const applicable = section.match(
    /aplicabil pentru[^\d]{0,40}(\d{2}\.\d{2}\.\d{4})/i,
  );
  const effectiveFrom = applicable ? parseMdDate(applicable[1]!) : undefined;
  const observedAt = new Date();

  const gasAmount = firstStrong(section, /Benzin[ăa]\s*95/);
  const dieselAmount = firstStrong(section, /Motorin[ăa]/);
  const prices: OfficialPrice[] = [];

  if (gasAmount !== null) {
    prices.push({
      country: "MD",
      fuel: "AI95",
      amount: gasAmount,
      currencyCode: "MDL",
      observedAt,
      kind: "CEILING",
      effectiveFrom,
    });
  }
  if (dieselAmount !== null) {
    prices.push({
      country: "MD",
      fuel: "DIESEL",
      amount: dieselAmount,
      currencyCode: "MDL",
      observedAt,
      kind: "CEILING",
      effectiveFrom,
    });
  }

  return prices;
}
