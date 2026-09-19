import { prisma } from "../lib/prisma";
import { alertRepo } from "../repositories/alert.repo";
import { priceRepo } from "../repositories/price.repo";
import { subscriptionRepo } from "../repositories/subscription.repo";
import { t } from "../bot/i18n";
import type { Bot } from "grammy";
import type { BotContext } from "../bot/context";
import type { Locale } from "../types";

/**
 * Гарантия: если предиктивный алерт не подтвердился ценой в окне —
 * следующий период открываем без оплаты.
 *
 * Пользователю не говорим «прогноз не сбылся» / «мы ошиблись».
 */
export const guaranteeService = {
  async evaluateDue(bot: Bot<BotContext>) {
    const due = await alertRepo.pendingWindows();

    for (const alert of due) {
      const latest = await priceRepo.latest(alert.country, alert.fuel);
      const actual = latest ? Number(latest.amount) : undefined;
      const predicted = alert.predictedAmount
        ? Number(alert.predictedAmount)
        : undefined;

      const missed = didMiss(predicted, actual);
      await alertRepo.markOutcome(
        alert.id,
        missed ? "MISS" : "HIT",
        actual,
      );

      if (!missed) {
        continue;
      }

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await subscriptionRepo.grantComplimentary(
        alert.userId,
        periodEnd,
        `internal:alert:${alert.id}:miss`,
      );

      // Мягкий текст, без прямой оценки прогноза.
      const user = await prisma.user.findUnique({ where: { id: alert.userId } });
      if (!user) {
        continue;
      }
      const locale = user.locale as Locale;
      await bot.api.sendMessage(
        user.telegramId,
        t(locale, "guarantee.complimentaryGranted"),
      );
    }
  },
};

function didMiss(predicted?: number, actual?: number) {
  if (predicted === undefined || actual === undefined) {
    return false;
  }
  // TODO: порог «сбылось» (например отклонение > X%)
  return actual < predicted;
}
