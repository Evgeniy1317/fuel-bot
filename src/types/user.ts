import type {
  CountryCode,
  FuelKind,
  Locale,
  VehiclePropulsion,
} from "./fuel";

export type OnboardingStep =
  | "language"
  | "country"
  | "city"
  | "car"
  | "propulsion"
  | "fill_grade"
  | "consumption"
  | "daily_km"
  | "watch_fuels"
  | "trial_consent"
  | "done";

export interface OnboardingDraft {
  step: OnboardingStep;
  locale?: Locale;
  country?: CountryCode;
  city?: string;
  brand?: string;
  model?: string;
  propulsion?: VehiclePropulsion;
  fillGrade?: FuelKind;
  litersPer100km?: number;
  dailyKm?: number;
  watchFuels?: FuelKind[];
  resumeToSavings?: boolean;
}

export interface UserProfile {
  telegramId: string;
  locale: Locale;
  country: CountryCode | null;
  dailyKm: number | null;
  watchFuels: FuelKind[];
  onboarded: boolean;
}

export interface VehicleInput {
  brand: string | null;
  model: string | null;
  litersPer100km: number | null;
  propulsion: VehiclePropulsion;
  fillGrade: FuelKind;
}
