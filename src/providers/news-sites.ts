import { FUEL_TOPIC_RE, SITE_SOURCES } from "../config/news-sources";
import { FETCH_LIMITS } from "../config/sources";
import { politeGet } from "../lib/http";
import type { CountryCode } from "../types";

export interface NewsSiteItem {
  sourceUrl: string;
  externalId: string;
  text: string;
  country: CountryCode;
  at?: Date;
}

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decode(match[1] ?? "") : "";
}

function parseDate(raw: string) {
  if (!raw) {
    return undefined;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function countryOf(url: string): CountryCode {
  const known = SITE_SOURCES.find((item) => url.startsWith(item.url) || item.url.startsWith(url));
  if (known) {
    return known.country;
  }
  return /pmr|tiraspol|novostipmr|sheriff|pridnestrov/i.test(url) ? "PMR" : "MD";
}

function isRss(url: string, body: string) {
  const known = SITE_SOURCES.find((item) => url.startsWith(item.url) || item.url.startsWith(url));
  if (known) {
    return known.kind === "rss";
  }
  return /<(rss|feed)[\s>]/i.test(body);
}

function fromRss(url: string, body: string, country: CountryCode): NewsSiteItem[] {
  const chunks = body.match(/<item[\s\S]*?<\/item>/gi) ?? body.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const items: NewsSiteItem[] = [];
  for (const chunk of chunks) {
    const title = tag(chunk, "title");
    const description = tag(chunk, "description") || tag(chunk, "summary") || tag(chunk, "content");
    const text = `${title}\n${description}`.trim();
    if (!FUEL_TOPIC_RE.test(text)) {
      continue;
    }
    const link = tag(chunk, "link") || chunk.match(/<link[^>]+href="([^"]+)"/i)?.[1] || "";
    const at = parseDate(tag(chunk, "pubDate") || tag(chunk, "updated") || tag(chunk, "published"));
    items.push({
      sourceUrl: url,
      externalId: `site:${link || title.slice(0, 80)}`,
      text,
      country,
      at,
    });
  }
  return items.slice(0, 10);
}

function fromHtml(url: string, body: string, country: CountryCode): NewsSiteItem[] {
  const titles = [...body.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((match) => decode(match[1] ?? ""))
    .filter((title) => title.length > 12 && FUEL_TOPIC_RE.test(title));
  return titles.slice(0, 8).map((title) => ({
    sourceUrl: url,
    externalId: `site:${url}:${title.slice(0, 80)}`,
    text: title,
    country,
  }));
}

export async function fetchNewsSite(url: string): Promise<NewsSiteItem[]> {
  const result = await politeGet(url, FETCH_LIMITS.newsSiteMs);
  if (!result.ok) {
    return [];
  }
  const country = countryOf(url);
  if (isRss(url, result.body)) {
    return fromRss(url, result.body, country);
  }
  return fromHtml(url, result.body, country);
}
