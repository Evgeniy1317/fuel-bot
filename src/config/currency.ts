import type { Locale } from "../types";

/** ПМР — рубли, Молдова — леи. Коды PRB/MDL пользователю не показываем. */
export function currencyWord(code: string, locale: Locale): string {
  if (code === "PRB") {
    return locale === "ro" ? "rub." : "руб.";
  }
  if (code === "MDL") {
    return locale === "ro" ? "lei" : "лей";
  }
  return code;
}

export function money(amount: number, code: string, locale: Locale): string {
  const rounded = Math.round(amount * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${text} ${currencyWord(code, locale)}`;
}
