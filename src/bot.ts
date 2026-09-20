import { Bot } from "grammy";
import { env } from "./config/env";
import type { BotContext } from "./bot/context";
import { sessionMiddleware } from "./bot/middlewares/session";
import { hydrateUser } from "./bot/middlewares/hydrate-user";
import { registerStart } from "./bot/handlers/start";
import { registerOnboarding } from "./bot/handlers/onboarding";
import { registerFillIntent } from "./bot/handlers/fill-intent";
import { registerCalculator } from "./bot/handlers/calculator";
import { registerMenu } from "./bot/handlers/menu";
import { registerSubscription } from "./bot/handlers/subscription";
import { registerLeaderboard } from "./bot/handlers/leaderboard";
import { registerSettings } from "./bot/handlers/settings";
import { registerChannelIngest } from "./bot/handlers/channel-ingest";
import { registerAdmin } from "./bot/handlers/admin";

export function createBot() {
  const bot = new Bot<BotContext>(env.BOT_TOKEN);

  bot.use(sessionMiddleware());
  bot.use(hydrateUser);

  registerChannelIngest(bot);
  registerStart(bot);
  registerOnboarding(bot);
  registerFillIntent(bot);
  registerSettings(bot);
  registerMenu(bot);
  registerCalculator(bot);
  registerSubscription(bot);
  registerLeaderboard(bot);
  registerAdmin(bot);

  bot.catch((error) => {
    console.error("bot error", error);
  });

  return bot;
}
