import type { NextFunction } from "grammy";
import { env } from "../../config/env";
import type { BotContext } from "../context";

export async function adminOnly(ctx: BotContext, next: NextFunction) {
  const id = ctx.from?.id?.toString();
  if (!id || !env.ADMIN_TELEGRAM_IDS.includes(id)) {
    return;
  }
  await next();
}
