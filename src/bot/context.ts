import { Context, type SessionFlavor } from "grammy";
import type { OnboardingDraft, OnboardingStep } from "../types";

export type SettingsEditField = Extract<
  OnboardingStep,
  "language" | "country" | "city" | "propulsion" | "fill_grade" | "consumption" | "daily_km" | "watch_fuels"
>;

export interface SessionData {
  locale: "ru" | "ro";
  onboarding?: OnboardingDraft;
  awaitingProfile?: boolean;
  editing?: SettingsEditField;
}

export type BotContext = Context & SessionFlavor<SessionData>;
