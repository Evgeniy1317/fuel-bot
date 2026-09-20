import "dotenv/config";
import { z } from "zod";
import { SITE_SOURCES, telegramUsernames } from "./news-sources";

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  TZ: z.string().default("Europe/Chisinau"),
  TRIAL_DAYS: z.coerce.number().int().positive().default(3),
  SUBSCRIPTION_STARS: z.coerce.number().int().positive(),
  SUBSCRIPTION_TITLE: z.string().default("Заправься умно"),
  SUBSCRIPTION_PAYLOAD: z.string().default("fuel_bot_month"),
  ADMIN_TELEGRAM_IDS: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  NEWS_CHANNEL_IDS: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  NEWS_SITE_URLS: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? SITE_SOURCES.map((item) => item.url).join(","))
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  TELEGRAM_PREVIEW_CHANNELS: z
    .string()
    .default(telegramUsernames().join(","))
    .transform((value) =>
      value
        .split(",")
        .map((name) => name.trim().replace(/^@/, ""))
        .filter(Boolean),
    ),
  LOG_CHAT_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
