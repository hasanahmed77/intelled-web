export type BillingPlanId = "free" | "weekly" | "monthly" | "yearly";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  interval: "free" | "weekly" | "monthly" | "yearly";
  price_bdt: number;
  duration_days: number;
  worksheets_per_period: number | null;
  lifetime_worksheet_limit: number | null;
  active: boolean;
};

export type UserSubscription = {
  user_id: string;
  plan_id: BillingPlanId;
  status: "active" | "past_due" | "canceled" | "expired";
  period_start: string | null;
  period_end: string | null;
  cancel_at_period_end: boolean;
  auto_renew: boolean;
  provider: string;
};

export type UsageCounter = {
  user_id: string;
  free_worksheets_used_lifetime: number;
  period_worksheets_used: number;
  period_anchor: string | null;
};
