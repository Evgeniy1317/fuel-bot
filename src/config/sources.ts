export const SOURCES = {
  anreApi: "https://api.ecarburanti.anre.md/public/",
  anreSite: "https://anre.md/",
  sheriffPrices: "https://sheriff.md/activities/nefteprodukty/ceny_po_regionam/",
} as const;

/** Минимальный интервал между запросами на хост — чтобы не словить бан по IP. */
export const FETCH_LIMITS = {
  anreApiMs: 15 * 60 * 1000,
  anreSiteMs: 30 * 60 * 1000,
  sheriffMs: 30 * 60 * 1000,
  telegramPreviewMs: 30 * 60 * 1000,
  backoffOnBlockMs: 6 * 60 * 60 * 1000,
} as const;

export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export const API_UA = "FuelBot/0.1 (Telegram savings assistant; polite polling)";
