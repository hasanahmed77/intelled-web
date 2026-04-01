import { ViewportSection } from "@/components/viewport-section";
import { getUser } from "@/lib/auth";
import { getCurrentSubscription, listActivePlans } from "@/lib/billing/data";
import type { BillingPlanId } from "@/lib/billing/types";

type Tier = {
  id: Exclude<BillingPlanId, "free">;
  name: string;
  cadence: string;
  staticCredits: string;
  aiCredits: string;
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
    staticCredits: "120 static problem sets",
    aiCredits: "0 AI problem sets",
    description: "Best if you want lower-cost practice with static curated sets and AI evaluation.",
    badge: null,
    highlighted: false,
    features: [
      "Static database-backed problem sets",
      "AI evaluation on every submission",
      "More generous monthly volume"
    ]
  },
  {
    id: "hybrid_monthly",
    name: "Plus",
    cadence: "/ month",
    staticCredits: "120 static problem sets",
    aiCredits: "40 AI problem sets",
    description: "Balanced monthly access across static practice and AI-generated sets.",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Everything in Static Monthly",
      "AI-generated problem sets",
      "Adaptive AI practice on demand"
    ]
  },
  {
    id: "hybrid_yearly",
    name: "Pro",
    cadence: "/ year",
    staticCredits: "1,800 static problem sets",
    aiCredits: "600 AI problem sets",
    description: "Lower effective yearly rate for serious long-term learners.",
    badge: "Best Value",
    highlighted: false,
    features: [
      "Everything in Hybrid Monthly",
      "Annual billing discount",
      "Large yearly quota for sustained study"
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

  const freeUsed = billing.usage?.free_worksheets_used_lifetime ?? 0;
  const freeLimit = currentPlan?.lifetime_worksheet_limit ?? 2;
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
          <h1 className="text-4xl font-semibold">Clear plans for static and AI practice.</h1>
          <p className="mx-auto max-w-2xl text-muted">
            Every account starts on Free with 2 problem sets for life. Static plans include
            more volume because they are cheaper to serve. Hybrid plans add AI-generated
            practice on top.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="card p-6">
            <p className="text-sm text-muted">Current plan</p>
            <p className="mt-3 text-2xl font-semibold uppercase">
              {PLAN_DISPLAY_NAME[currentPlanId]}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted">
              {currentPlanId === "free" ? "Free lifetime used" : "Static sets used"}
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {currentPlanId === "free" ? freeUsed : staticUsed}
              {currentPlanId === "free"
                ? ` / ${freeLimit}`
                : staticLimit !== null
                ? ` / ${staticLimit}`
                : ""}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted">AI sets used</p>
            <p className="mt-3 text-2xl font-semibold">
              {currentPlanId === "free" ? "N/A" : aiUsed}
              {currentPlanId !== "free" && aiLimit !== null ? ` / ${aiLimit}` : ""}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted">Recurring mode</p>
            <p className="mt-3 text-2xl font-semibold">
              {billing.subscription?.auto_renew ? "ON" : "OFF"}
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
                  <p className="text-3xl font-semibold">
                    ৳{plan?.price_bdt ?? 0}{" "}
                    <span className="text-base font-normal text-muted">{tier.cadence}</span>
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-zinc-300">
                    <p>{tier.staticCredits}</p>
                    <p>{tier.aiCredits}</p>
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
                      <button
                        type="button"
                        disabled
                        className={`button w-full cursor-not-allowed opacity-60 ${
                          tier.highlighted ? "button-primary" : "button-dark-accent"
                        }`}
                      >
                        Coming soon
                      </button>
                      <p className="text-center text-xs text-muted">
                        Payments are not live yet. All users are currently on Free.
                      </p>
                    </div>
                  )
                ) : (
                  <span
                    className={`mt-auto inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium cursor-not-allowed opacity-60 ${
                      tier.highlighted
                        ? "border-transparent bg-accent text-ink-950"
                        : "border-ink-700/60 bg-ink-900/80 text-accent"
                    }`}
                    aria-disabled="true"
                  >
                    Coming soon
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ViewportSection>
  );
}
