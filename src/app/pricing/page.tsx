import Link from "next/link";
import { ViewportSection } from "@/components/viewport-section";
import { getUser } from "@/lib/auth";
import { getCurrentSubscription, listActivePlans } from "@/lib/billing/data";
import type { BillingPlanId } from "@/lib/billing/types";

type Tier = {
  id: Exclude<BillingPlanId, "free">;
  name: string;
  cadence: string;
  credits: string;
  description: string;
  badge: string | null;
  highlighted: boolean;
  features: string[];
  cta: string;
};

const tiers: Tier[] = [
  {
    id: "weekly",
    name: "Weekly",
    cadence: "/ week",
    credits: "12 problem sets",
    description: "Fast start for short prep sprints.",
    badge: null,
    highlighted: false,
    features: [
      "AI problem set generation + grading",
      "Progress tracking",
      "Basic support"
    ],
    cta: "Start weekly"
  },
  {
    id: "monthly",
    name: "Monthly",
    cadence: "/ month",
    credits: "50 problem sets",
    description: "Best balance for consistent students.",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Everything in Weekly",
      "Auto difficulty personalization",
      "Priority generation queue"
    ],
    cta: "Choose monthly"
  },
  {
    id: "yearly",
    name: "Yearly",
    cadence: "/ year",
    credits: "600 problem sets / year",
    description: "Lower yearly rate for long-term learners.",
    badge: "Save 12%",
    highlighted: false,
    features: [
      "Everything in Monthly",
      "Annual billing discount",
      "Extended history insights"
    ],
    cta: "Go yearly"
  }
];

export default async function PricingPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const billingStatus =
    typeof resolvedSearchParams.billing === "string" ? resolvedSearchParams.billing : null;
  const user = await getUser();
  const plans = await listActivePlans().catch(() => []);
  const billing = user
    ? await getCurrentSubscription(user.id).catch(() => ({ subscription: null, usage: null }))
    : { subscription: null, usage: null };

  const currentPlanId = billing.subscription?.plan_id ?? "free";
  const planPriceById = new Map(plans.map((plan) => [plan.id, plan.price_bdt]));
  const currentPlan =
    plans.find((plan) => plan.id === currentPlanId) ??
    plans.find((plan) => plan.id === "free") ??
    null;
  const currentLimit =
    currentPlanId === "free"
      ? (currentPlan?.lifetime_worksheet_limit ?? 2)
      : currentPlan?.worksheets_per_period ?? null;
  const currentUsed =
    currentPlanId === "free"
      ? (billing.usage?.free_worksheets_used_lifetime ?? 0)
      : (billing.usage?.period_worksheets_used ?? 0);

  return (
    <ViewportSection center>
      <div className="w-full space-y-12">
        {billingStatus ? (
          <div className="card p-4 text-sm text-zinc-200">
            Billing status: {billingStatus.replaceAll("_", " ")}
          </div>
        ) : null}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-semibold">Simple plans, clear value.</h1>
          <p className="mx-auto max-w-2xl text-muted">
            Every account starts on Free with 2 problem sets for life. Paid plans unlock
            recurring problem set quotas, AI grading, and adaptive performance tracking.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <p className="text-sm text-muted">Current plan</p>
            <p className="mt-3 text-3xl font-semibold uppercase">{currentPlanId}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted">
              {currentPlanId === "free" ? "Free problem sets used" : "Plan problem sets used"}
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {currentUsed}
              {currentLimit !== null ? ` / ${currentLimit}` : ""}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted">Recurring mode</p>
            <p className="mt-3 text-3xl font-semibold">
              {billing.subscription?.auto_renew ? "ON" : "OFF"}
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`card relative flex flex-col gap-6 p-6 ${
                currentPlanId === tier.id || tier.highlighted
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
                  ৳{planPriceById.get(tier.id) ?? 0}{" "}
                  <span className="text-base font-normal text-muted">{tier.cadence}</span>
                </p>
                <p className="mt-2 text-sm text-zinc-300">{tier.credits}</p>
              </div>
              <ul className="space-y-2 text-sm text-muted">
                {tier.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              {user ? (
                currentPlanId === tier.id ? (
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
                      className={`button w-full cursor-not-allowed opacity-60 ${tier.highlighted ? "button-primary" : "button-dark-accent"}`}
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
          ))}
        </div>
      </div>
    </ViewportSection>
  );
}
