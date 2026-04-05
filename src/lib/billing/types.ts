export type BillingPlanId =
  | "free"
  | "static_monthly"
  | "hybrid_monthly"
  | "hybrid_yearly";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  interval: "free" | "monthly" | "yearly";
  price_bdt: number;
  duration_days: number;
  free_static_problem_sets_lifetime_limit: number | null;
  free_ai_problem_sets_lifetime_limit: number | null;
  static_problem_sets_per_period: number | null;
  ai_problem_sets_per_period: number | null;
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
  free_static_problem_sets_used_lifetime: number;
  free_ai_problem_sets_used_lifetime: number;
  period_static_problem_sets_used: number;
  period_ai_problem_sets_used: number;
  period_anchor: string | null;
};
