import Link from "next/link";
import { ViewportSection } from "@/components/viewport-section";
import { getUser } from "@/lib/auth";
import { getCurrentSubscription, listActivePlans } from "@/lib/billing/data";
import type { BillingPlanId } from "@/lib/billing/types";

type Tier = {
  id: Exclude<BillingPlanId, "free">;
  name: string;
  cadence: string;
  originalPriceBdt: number;
  primaryAllowance: string;
  secondaryAllowance: string;
  description: string;
  badge: string | null;
  highlighted: boolean;
  features: string[];
};

const tiers: Tier[] = [
  {
    id: "static_monthly",
    name: "Essential",
    cadence: "/ month",
    originalPriceBdt: 199,
    primaryAllowance: "120 curated practice sets",
    secondaryAllowance: "AI-assisted evaluation included",
    description: "For lower-cost practice with curated problem sets and AI evaluation.",
    badge: null,
    highlighted: false,
    features: [
      "Curated problem sets across multiple difficulty levels",
      "AI-assisted evaluation on every submission",
      "Ideal if you want strong daily practice without on-demand generation"
    ]
  },
  {
    id: "hybrid_monthly",
    name: "Plus",
    cadence: "/ month",
    originalPriceBdt: 349,
    primaryAllowance: "120 curated practice sets",
    secondaryAllowance: "30 AI-generated practice sets",
    description: "For learners who want the full mix of curated practice and premium AI-generated sets.",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Everything in Essential",
      "AI-generated practice sets on demand",
      "Best balance of value, flexibility, and depth"
    ]
  },
  {
    id: "hybrid_yearly",
    name: "Pro",
    cadence: "/ year",
    originalPriceBdt: 4499,
    primaryAllowance: "1,800 curated practice sets",
    secondaryAllowance: "480 AI-generated practice sets",
    description: "For serious learners who want premium long-term access at the strongest yearly value.",
    badge: "Best Value",
    highlighted: false,
    features: [
      "Everything in Plus",
      "Lower effective yearly pricing",
      "Built for sustained preparation over the full year"
    ]
  }
];

const PLAN_DISPLAY_NAME: Record<BillingPlanId, string> = {
  free: "FREE",
  static_monthly: "ESSENTIAL",
  hybrid_monthly: "PLUS",
  hybrid_yearly: "PRO"
};

export default async function PricingPage() {
  const user = await getUser();
  const plans = await listActivePlans().catch(() => []);
  const billing = user
    ? await getCurrentSubscription(user.id).catch(() => ({ subscription: null, usage: null }))
    : { subscription: null, usage: null };

  const currentPlanId = (billing.subscription?.plan_id ?? "free") as BillingPlanId;
  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const currentPlan = planById.get(currentPlanId) ?? planById.get("free") ?? null;

  const freeStaticUsed = billing.usage?.free_static_problem_sets_used_lifetime ?? 0;
  const freeAiUsed = billing.usage?.free_ai_problem_sets_used_lifetime ?? 0;
  const freeStaticLimit = currentPlan?.free_static_problem_sets_lifetime_limit ?? 5;
  const freeAiLimit = currentPlan?.free_ai_problem_sets_lifetime_limit ?? 2;
  const staticUsed = billing.usage?.period_static_problem_sets_used ?? 0;
  const aiUsed = billing.usage?.period_ai_problem_sets_used ?? 0;
  const staticLimit =
    currentPlanId === "free" ? null : (currentPlan?.static_problem_sets_per_period ?? null);
  const aiLimit =
    currentPlanId === "free" ? null : (currentPlan?.ai_problem_sets_per_period ?? null);

  return (
    <ViewportSection center>
      <div className="w-full space-y-12">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-semibold">Premium plans for curated and AI practice.</h1>
          <p className="mx-auto max-w-2xl text-muted">
            Every account starts on Free with 5 curated sets and 2 AI sets for life. Choose a plan
            based on how much guided practice and AI-powered support you want each month.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <p className="text-sm text-muted">Current plan</p>
            <p className="mt-3 text-2xl font-semibold uppercase">
              {PLAN_DISPLAY_NAME[currentPlanId]}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted">
              {currentPlanId === "free" ? "Curated sets used" : "Static sets used"}
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {currentPlanId === "free" ? freeStaticUsed : staticUsed}
              {currentPlanId === "free"
                ? ` / ${freeStaticLimit}`
                : staticLimit !== null
                ? ` / ${staticLimit}`
                : ""}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted">AI sets used</p>
            <p className="mt-3 text-2xl font-semibold">
              {currentPlanId === "free" ? freeAiUsed : aiUsed}
              {currentPlanId === "free"
                ? ` / ${freeAiLimit}`
                : aiLimit !== null
                ? ` / ${aiLimit}`
                : ""}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const plan = planById.get(tier.id);
            const isCurrent = currentPlanId === tier.id;

            return (
              <div
                key={tier.id}
                className={`card relative flex flex-col gap-6 p-6 ${
                  isCurrent || tier.highlighted
                    ? "border-accent shadow-[0_0_40px_rgba(255,214,10,0.18)]"
                    : ""
                }`}
              >
                {tier.badge ? (
                  <span
                    className={`absolute -top-3 right-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      tier.highlighted
                        ? "bg-accent text-ink-950"
                        : "border border-ink-700 bg-ink-950 text-zinc-300"
                    }`}
                  >
                    {tier.badge}
                  </span>
                ) : null}

                <div>
                  <h2 className="text-2xl font-semibold uppercase">{tier.name}</h2>
                  <p className="mt-2 text-muted">{tier.description}</p>
                </div>

                <div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted line-through">
                      ৳{tier.originalPriceBdt}
                      <span className="ml-1">{tier.cadence}</span>
                    </p>
                    <p className="text-3xl font-semibold">
                      ৳{plan?.price_bdt ?? 0}{" "}
                      <span className="text-base font-normal text-muted">{tier.cadence}</span>
                    </p>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-zinc-300">
                    <p>{tier.primaryAllowance}</p>
                    <p>{tier.secondaryAllowance}</p>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-muted">
                  {tier.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>

                {user ? (
                  isCurrent ? (
                    <button
                      type="button"
                      className="button mt-auto cursor-default opacity-80"
                      disabled
                    >
                      Current plan
                    </button>
                  ) : (
                    <div className="mt-auto space-y-3">
                      <Link
                        href={`/billing/manual?planId=${tier.id}`}
                        className={`button w-full ${
                          tier.highlighted ? "button-primary" : "button-dark-accent"
                        }`}
                      >
                        Pay with bKash
                      </Link>
                      <p className="text-center text-xs text-muted">
                        Manual verification. Access is activated after payment approval.
                      </p>
                    </div>
                  )
                ) : (
                  <Link
                    href={`/auth/sign-in?redirect=${encodeURIComponent(`/billing/manual?planId=${tier.id}`)}`}
                    className={`mt-auto inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium ${
                      tier.highlighted
                        ? "border-transparent bg-accent text-ink-950"
                        : "border-ink-700/60 bg-ink-900/80 text-accent"
                    }`}
                  >
                    Sign in to pay
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ViewportSection>
  );
}
