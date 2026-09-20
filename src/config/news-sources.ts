import type { CountryCode } from "../types";

export type SourceTrust = "official" | "specialist" | "news";

export interface TelegramSource {
  username: string;
  country: CountryCode;
  trust: SourceTrust;
}

export interface SiteSource {
  url: string;
  country: CountryCode;
  kind: "rss" | "html";
}

/** Публичные каналы с ценами и новостями по топливу. Смотрим t.me/s/… без Bot API. */
export const TELEGRAM_SOURCES: TelegramSource[] = [
  { username: "anre_md", country: "MD", trust: "official" },
  { username: "benzin_md", country: "MD", trust: "specialist" },
  { username: "petrolmd", country: "MD", trust: "specialist" },
  { username: "newsmakerlive", country: "MD", trust: "news" },
  { username: "ro_newsmakerlive", country: "MD", trust: "news" },
  { username: "pointnews", country: "MD", trust: "news" },
  { username: "PointNewsRo", country: "MD", trust: "news" },
  { username: "pridnestrovec", country: "PMR", trust: "specialist" },
  { username: "most_dnestr", country: "PMR", trust: "specialist" },
  { username: "novostipmrcom", country: "PMR", trust: "news" },
];

export const SITE_SOURCES: SiteSource[] = [
  { url: "https://newsmaker.md/ru/feed/", country: "MD", kind: "rss" },
  { url: "https://newsmaker.md/ro/feed/", country: "MD", kind: "rss" },
  { url: "https://point.md/ru/rss/all", country: "MD", kind: "rss" },
  { url: "https://agora.md/rss", country: "MD", kind: "rss" },
  { url: "https://novostipmr.com/ru/rss.xml", country: "PMR", kind: "rss" },
  { url: "https://pmr-news.ru/", country: "PMR", kind: "html" },
  { url: "https://tiraspol-news.ru/", country: "PMR", kind: "html" },
];

export const FUEL_TOPIC_RE =
  /бензин|дизел|дизель|моторін|motorin|carburant|топлив|гсм|аи[-\s]?9|азс|заправ|gpl|sheriff|шериф|\banre\b|нарэ|95\s*premium|евро\s*d|д\/?т/i;

export function telegramUsernames() {
  return TELEGRAM_SOURCES.map((item) => item.username);
}

export function telegramMeta(username: string) {
  const key = username.replace(/^@/, "").trim().toLowerCase();
  return TELEGRAM_SOURCES.find((item) => item.username.toLowerCase() === key);
}
