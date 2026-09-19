import type { Bot } from "grammy";
import { subscriptionService } from "../../services/subscription";
import { userRepo } from "../../repositories/user.repo";
import type { BotContext } from "../context";
import { t } from "../i18n";
import { adminNotify, formatUser } from "../../services/admin-notify";
import { trialKeyboard } from "../keyboards";

export function registerSubscription(bot: Bot<BotContext>) {
  bot.command("subscribe", sendSubscribe);
  bot.hears(/Подписка|Abonament/, sendSubscribe);

  bot.on("pre_checkout_query", async (ctx) => {
    await ctx.answerPreCheckoutQuery(true);
  });

  bot.on("message:successful_payment", async (ctx) => {
    const payment = ctx.message.successful_payment;
    const user = await userRepo.findByTelegramId(String(ctx.from?.id));
    if (!user || payment.currency !== "XTR") {
      return;
    }
    await subscriptionService.activateFromStars(
      user.id,
      payment.telegram_payment_charge_id,
    );
    await ctx.reply(t(ctx.session.locale, "subscription.active", { date: "—" }));
    await adminNotify.send(
      ctx.api,
      `Оплата Stars: ${payment.total_amount} XTR\n${formatUser(user)}`,
    );
  });
}

async function sendSubscribe(ctx: BotContext) {
  const locale = ctx.session.locale;
  const user = await userRepo.findByTelegramId(String(ctx.from?.id));
  const sub = user?.subscription;

  if (!sub) {
    await ctx.reply(t(locale, "onboarding.trialAsk"), {
      reply_markup: trialKeyboard(locale),
    });
    return;
  }

  if (sub.status === "COMPLIMENTARY" && subscriptionService.hasAccess(sub)) {
    await ctx.reply(t(locale, "subscription.complimentary"));
    return;
  }

  if (sub.status === "TRIAL" && subscriptionService.hasAccess(sub)) {
    await ctx.reply(t(locale, "subscription.trial"));
    return;
  }

  const invoice = subscriptionService.invoice();
  await ctx.replyWithInvoice(
    invoice.title,
    t(locale, "subscription.invoiceDescription"),
    invoice.payload,
    invoice.currency,
    [{ label: invoice.title, amount: invoice.stars }],
  );
}
