import { Context, type SessionFlavor } from "grammy";
import type { OnboardingDraft } from "../types";

export interface SessionData {
  locale: "ru" | "ro";
  onboarding?: OnboardingDraft;
  awaitingProfile?: boolean;
}

export type BotContext = Context & SessionFlavor<SessionData>;
