import type { ExtractedPrice } from "../types";

/**
 * Достаёт цены из текста новости/поста.
 * Важно: наружу уходит только структура (топливо + число), не копипаст поста.
 */
export const priceExtractor = {
  extract(_rawText: string): ExtractedPrice[] {
    // TODO: эвристики/regex под типичные формулировки:
    // «АИ-95 — 21.30 лей», «бензин 95 подорожает до …»
    // TODO: отдельно словари для ru/ro и валют MDL / PRB
    return [];
  },
};
