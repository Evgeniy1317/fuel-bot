export const LINE = "────────────";

export function blocks(...parts: Array<string | undefined | null | false>) {
  return parts
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(`\n${LINE}\n`);
}
