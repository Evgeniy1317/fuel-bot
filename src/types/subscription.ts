export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "COMPLIMENTARY"
  | "EXPIRED"
  | "CANCELED";

export interface StarsInvoice {
  title: string;
  description: string;
  payload: string;
  currency: "XTR";
  stars: number;
}

export interface AccessSnapshot {
  hasAccess: boolean;
  status: SubscriptionStatus;
  trialEndsAt: Date;
  currentPeriodEndsAt: Date | null;
}
