import type { Locale } from "../types";
import { ro } from "./locales/ro";
import { ru, type Messages } from "./locales/ru";

const dict: Record<Locale, Messages> = { ru, ro };

export function t(
  locale: Locale,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict[locale]);

  if (typeof value !== "string") {
    return path;
  }

  if (!vars) {
    return value;
  }

  return Object.entries(vars).reduce(
    (text, [key, replacement]) =>
      text.replaceAll(`{${key}}`, String(replacement)),
    value,
  );
}

export function localeOf(code: string | undefined): Locale {
  return code === "ro" ? "ro" : "ru";
}
