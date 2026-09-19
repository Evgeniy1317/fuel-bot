import type { Bot } from "grammy";
import { subscriptionService } from "../../services/subscription";
import { userRepo } from "../../repositories/user.repo";
import type { BotContext } from "../context";
import { t } from "../i18n";

export function registerSubscription(bot: Bot<BotContext>) {
  bot.command("subscribe", sendInvoice);
  bot.hears(/Подписка|Abonament/, sendInvoice);

  bot.on("pre_checkout_query", async (ctx) => {
    // TODO: проверить payload и что пользователь уже прошёл онбординг
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
  });
}

async function sendInvoice(ctx: BotContext) {
  const locale = ctx.session.locale;
  const user = await userRepo.findByTelegramId(String(ctx.from?.id));
  const sub = user?.subscription;

  if (sub && subscriptionService.hasAccess(sub) && sub.status === "TRIAL") {
    await ctx.reply(t(locale, "subscription.trial"));
  }

  if (sub?.status === "COMPLIMENTARY") {
    await ctx.reply(t(locale, "subscription.complimentary"));
    return;
  }

  const invoice = subscriptionService.invoice();
  // Telegram Stars: currency XTR, provider_token не нужен.
  await ctx.replyWithInvoice(
    invoice.title,
    t(locale, "subscription.invoiceDescription"),
    invoice.payload,
    invoice.currency,
    [{ label: invoice.title, amount: invoice.stars }],
  );
}
