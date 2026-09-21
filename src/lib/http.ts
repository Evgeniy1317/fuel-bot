import { BROWSER_UA, FETCH_LIMITS } from "../config/sources";

interface UrlCache {
  lastAt: number;
  etag?: string;
  lastModified?: string;
  body?: string;
}

interface HostState {
  backoffUntil: number;
  lastHostAt: number;
  queue: Promise<unknown>;
}

const hosts = new Map<string, HostState>();
const urls = new Map<string, UrlCache>();

function hostState(url: string): HostState {
  const host = new URL(url).host;
  const existing = hosts.get(host);
  if (existing) {
    return existing;
  }
  const created: HostState = {
    backoffUntil: 0,
    lastHostAt: 0,
    queue: Promise.resolve(),
  };
  hosts.set(host, created);
  return created;
}

function urlCache(url: string): UrlCache {
  const existing = urls.get(url);
  if (existing) {
    return existing;
  }
  const created: UrlCache = { lastAt: 0 };
  urls.set(url, created);
  return created;
}

export type PoliteGetResult =
  | { ok: true; body: string; fromCache: boolean }
  | { ok: false; reason: "backoff" | "too_soon" | "blocked" | "http" | "network" };

/**
 * Один GET на хост за раз. Кэш и пауза считаются по полному URL,
 * чтобы t.me/s/канал1 и t.me/s/канал2 не затирали друг друга.
 */
export async function politeGet(
  url: string,
  minIntervalMs: number,
  userAgent = BROWSER_UA,
  options?: { force?: boolean },
): Promise<PoliteGetResult> {
  const host = hostState(url);
  const run = host.queue.then(() =>
    doGet(url, host, urlCache(url), minIntervalMs, userAgent, options?.force === true),
  );
  host.queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function doGet(
  url: string,
  host: HostState,
  cache: UrlCache,
  minIntervalMs: number,
  userAgent: string,
  force: boolean,
): Promise<PoliteGetResult> {
  const now = Date.now();
  if (now < host.backoffUntil) {
    return { ok: false, reason: "backoff" };
  }
  if (!force && now - cache.lastAt < minIntervalMs) {
    if (cache.body) {
      return { ok: true, body: cache.body, fromCache: true };
    }
    return { ok: false, reason: "too_soon" };
  }

  const gap = FETCH_LIMITS.hostGapMs;
  const wait = host.lastHostAt + gap - now;
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: "text/html,application/rss+xml,application/xml,application/json;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru,ro,en;q=0.8",
  };
  if (!force && cache.etag) {
    headers["If-None-Match"] = cache.etag;
  }
  if (!force && cache.lastModified) {
    headers["If-Modified-Since"] = cache.lastModified;
  }

  try {
    const response = await fetch(url, {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    if (response.status === 304 && cache.body) {
      cache.lastAt = Date.now();
      host.lastHostAt = cache.lastAt;
      return { ok: true, body: cache.body, fromCache: true };
    }

    if (response.status === 403 || response.status === 429) {
      host.backoffUntil = Date.now() + FETCH_LIMITS.backoffOnBlockMs;
      console.warn(`[http] ${url} → ${response.status}, backoff 6h`);
      return { ok: false, reason: "blocked" };
    }

    if (!response.ok) {
      console.warn(`[http] ${url} → ${response.status}`);
      return { ok: false, reason: "http" };
    }

    const body = await response.text();
    cache.lastAt = Date.now();
    host.lastHostAt = cache.lastAt;
    cache.body = body;
    cache.etag = response.headers.get("etag") ?? cache.etag;
    cache.lastModified = response.headers.get("last-modified") ?? cache.lastModified;
    return { ok: true, body, fromCache: false };
  } catch (error) {
    console.warn(`[http] ${url} network`, error);
    return { ok: false, reason: "network" };
  }
}
