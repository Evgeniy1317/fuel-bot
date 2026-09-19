import type { Bot } from "grammy";
import { adminOnly } from "../middlewares/admin";
import { statsRepo } from "../../repositories/stats.repo";
import type { BotContext } from "../context";

function formatStats(s: Awaited<ReturnType<typeof statsRepo.snapshot>>) {
  return [
    "Статистика бота",
    "",
    `Всего пользователей: ${s.total}`,
    `Прошли онбординг: ${s.onboarded}`,
    `ПМР: ${s.pmr} · Молдова: ${s.md}`,
    "",
    `Триал сейчас: ${s.trial}`,
    `Оплатили (активные): ${s.paid}`,
    `Комплиментарный месяц: ${s.complimentary}`,
    `Истекли / отмена: ${s.expired}`,
  ].join("\n");
}

export function registerAdmin(bot: Bot<BotContext>) {
  bot.command("stats", adminOnly, async (ctx) => {
    const snapshot = await statsRepo.snapshot();
    await ctx.reply(formatStats(snapshot));
  });

  bot.command("admin", adminOnly, async (ctx) => {
    const snapshot = await statsRepo.snapshot();
    await ctx.reply(
      `${formatStats(snapshot)}\n\nКоманды: /stats — эти цифры. Уведомления о триале и оплате приходят сюда сами.`,
    );
  });
}
