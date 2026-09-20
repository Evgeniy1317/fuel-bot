import { Context, type SessionFlavor } from "grammy";
import type { CountryCode, FuelKind, OnboardingDraft, OnboardingStep } from "../types";

export type SettingsEditField = Extract<
  OnboardingStep,
  "language" | "country" | "city" | "propulsion" | "fill_grade" | "consumption" | "daily_km" | "watch_fuels"
>;

export interface CalcSession {
  step: "fuel" | "amount";
  fuel?: FuelKind;
  country?: CountryCode;
  price?: number;
  currencyCode?: string;
}

export interface SessionData {
  locale: "ru" | "ro";
  onboarding?: OnboardingDraft;
  awaitingProfile?: boolean;
  editing?: SettingsEditField;
  calc?: CalcSession;
}

export type BotContext = Context & SessionFlavor<SessionData>;
