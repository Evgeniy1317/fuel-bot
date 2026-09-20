import { BROWSER_UA, FETCH_LIMITS } from "../config/sources";

interface HostState {
  lastAt: number;
  backoffUntil: number;
  etag?: string;
  lastModified?: string;
  body?: string;
  queue: Promise<unknown>;
}

const hosts = new Map<string, HostState>();

function stateFor(url: string): HostState {
  const host = new URL(url).host;
  const existing = hosts.get(host);
  if (existing) {
    return existing;
  }
  const created: HostState = {
    lastAt: 0,
    backoffUntil: 0,
    queue: Promise.resolve(),
  };
  hosts.set(host, created);
  return created;
}

export type PoliteGetResult =
  | { ok: true; body: string; fromCache: boolean }
  | { ok: false; reason: "backoff" | "too_soon" | "blocked" | "http" | "network" };

/**
 * Один GET на хост за раз, с паузой, ETag и длинным backoff на 403/429.
 */
export async function politeGet(
  url: string,
  minIntervalMs: number,
  userAgent = BROWSER_UA,
  options?: { force?: boolean },
): Promise<PoliteGetResult> {
  const state = stateFor(url);
  const run = state.queue.then(() =>
    doGet(url, state, minIntervalMs, userAgent, options?.force === true),
  );
  state.queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function doGet(
  url: string,
  state: HostState,
  minIntervalMs: number,
  userAgent: string,
  force: boolean,
): Promise<PoliteGetResult> {
  const now = Date.now();
  if (now < state.backoffUntil) {
    return { ok: false, reason: "backoff" };
  }
  if (!force && now - state.lastAt < minIntervalMs) {
    if (state.body) {
      return { ok: true, body: state.body, fromCache: true };
    }
    return { ok: false, reason: "too_soon" };
  }

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru,ro,en;q=0.8",
  };
  if (state.etag) {
    headers["If-None-Match"] = state.etag;
  }
  if (state.lastModified) {
    headers["If-Modified-Since"] = state.lastModified;
  }

  try {
    const response = await fetch(url, {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    if (response.status === 304 && state.body) {
      state.lastAt = Date.now();
      return { ok: true, body: state.body, fromCache: true };
    }

    if (response.status === 403 || response.status === 429) {
      state.backoffUntil = Date.now() + FETCH_LIMITS.backoffOnBlockMs;
      console.warn(`[http] ${url} → ${response.status}, backoff 6h`);
      return { ok: false, reason: "blocked" };
    }

    if (!response.ok) {
      console.warn(`[http] ${url} → ${response.status}`);
      return { ok: false, reason: "http" };
    }

    const body = await response.text();
    state.lastAt = Date.now();
    state.body = body;
    state.etag = response.headers.get("etag") ?? state.etag;
    state.lastModified = response.headers.get("last-modified") ?? state.lastModified;
    return { ok: true, body, fromCache: false };
  } catch (error) {
    console.warn(`[http] ${url} network`, error);
    return { ok: false, reason: "network" };
  }
}
