import { BROWSER_UA, FETCH_LIMITS } from "../config/sources";
import { politeGet } from "../lib/http";

export interface TelegramPreviewPost {
  channel: string;
  messageId: string;
  text: string;
  at?: Date;
}

function decodeEntities(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Публичная страница t.me/s/channel — не Bot API.
 * Редко, по одному каналу, чтобы не стучать в Telegram с одного IP.
 */
export async function fetchTelegramPreview(
  channel: string,
): Promise<TelegramPreviewPost[]> {
  const username = channel.replace(/^@/, "").trim();
  if (!username) {
    return [];
  }

  const result = await politeGet(
    `https://t.me/s/${username}`,
    FETCH_LIMITS.telegramPreviewMs,
    BROWSER_UA,
  );
  if (!result.ok) {
    return [];
  }

  const posts: TelegramPreviewPost[] = [];
  const chunks = result.body.split("tgme_widget_message_wrap");
  for (const chunk of chunks) {
    const post = chunk.match(/data-post="([^"]+)"/);
    const text = chunk.match(
      /tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/i,
    );
    const time = chunk.match(/datetime="([^"]+)"/);
    if (!post || !text) {
      continue;
    }
    const [, ref] = post[1]!.split("/");
    const body = decodeEntities(text[1] ?? "");
    if (!ref || !body) {
      continue;
    }
    const at = time ? new Date(time[1]!) : undefined;
    posts.push({
      channel: username,
      messageId: ref,
      text: body,
      at: at && !Number.isNaN(at.getTime()) ? at : undefined,
    });
  }

  return posts.slice(-12);
}
