import type { Api } from "grammy";
import { env } from "../config/env";

function targets() {
  const ids = [...env.ADMIN_TELEGRAM_IDS];
  if (env.LOG_CHAT_ID) {
    ids.push(env.LOG_CHAT_ID);
  }
  return [...new Set(ids)];
}

export function formatUser(user: {
  firstName?: string | null;
  username?: string | null;
  telegramId: string;
  country?: string | null;
}) {
  const name = user.firstName?.trim() || "без имени";
  const nick = user.username ? `@${user.username}` : "без username";
  const region =
    user.country === "PMR"
      ? "ПМР"
      : user.country === "MD"
        ? "Молдова"
        : "регион не указан";
  return `${name} (${nick}, id ${user.telegramId}, ${region})`;
}

export const adminNotify = {
  async send(api: Api, text: string) {
    const chats = targets();
    if (!chats.length) {
      console.warn("[admin] no ADMIN_TELEGRAM_IDS, skip notify");
      return;
    }

    await Promise.all(
      chats.map(async (chatId) => {
        try {
          await api.sendMessage(chatId, text);
        } catch (error) {
          console.warn("[admin] notify failed", chatId, error);
        }
      }),
    );
  },
};
