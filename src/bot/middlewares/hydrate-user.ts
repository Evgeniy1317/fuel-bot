import type { NextFunction } from "grammy";
import { userRepo } from "../../repositories/user.repo";
import type { BotContext } from "../context";

/** Подтягивает locale из БД после онбординга. */
export async function hydrateUser(ctx: BotContext, next: NextFunction) {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) {
    await next();
    return;
  }

  // TODO: кэш на короткий TTL, чтобы не ходить в БД на каждый апдейт
  const user = await userRepo.findByTelegramId(telegramId);
  if (user) {
    ctx.session.locale = user.locale;
  }

  await next();
}
