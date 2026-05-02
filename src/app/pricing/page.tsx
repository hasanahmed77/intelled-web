import Link from "next/link";
import { ViewportSection } from "@/components/viewport-section";
import { getUser } from "@/lib/auth";
import { isManualBillingEnabled } from "@/lib/billing/config";
import { getCurrentSubscription, listActivePlans } from "@/lib/billing/data";
import type { BillingPlanId } from "@/lib/billing/types";

type Tier = {
  id: Exclude<BillingPlanId, "free">;
  name: string;
  family: "Hybrid" | "Curated" | "AI";
  cadence: "/ month";
  primaryAllowance: string;
  secondaryAllowance: string;
  description: string;
  badge: string | null;
  highlighted: boolean;
  features: string[];
};

const tierGroups: {
  title: string;
  subtitle: string;
  tiers: Tier[];
}[] = [
  {
    title: "Curated Only",
    subtitle: "Built for O Level learners who want structured, syllabus-aligned practice for board exam preparation without paying for extra AI access.",
    tiers: [
      {
        id: "curated_essential",
        name: "Essential",
        family: "Curated",
        cadence: "/ month",
        primaryAllowance: "80 curated practice sets",
        secondaryAllowance: "AI-assisted evaluation included",
        description: "A focused monthly plan for consistent syllabus-based practice at the most accessible paid entry point.",
        badge: null,
        highlighted: false,
        features: [
          "Simple, lower-cost access for disciplined daily practice",
          "Good for students who mainly want guided sets",
          "A strong step up from the free experience"
        ]
      },
      {
        id: "curated_focus",
        name: "Focus",
        family: "Curated",
        cadence: "/ month",
        primaryAllowance: "200 curated practice sets",
        secondaryAllowance: "AI-assisted evaluation included",
        description: "A stronger curated plan for learners who want more volume, more revision, and noticeably better value than the entry tier.",
        badge: "Best For Revision",
        highlighted: false,
        features: [
          "More depth for topic-by-topic improvement",
          "Ideal during mocks, exam season, or catch-up phases",
          "Built for learners who want guided volume without AI generation"
        ]
      },
      {
        id: "curated_scholar",
        name: "Scholar",
        family: "Curated",
        cadence: "/ month",
        primaryAllowance: "360 curated practice sets",
        secondaryAllowance: "AI-assisted evaluation included",
        description: "Our highest curated tier for learners who want large-volume syllabus practice with no compromise on pace.",
        badge: null,
        highlighted: false,
        features: [
          "Large monthly runway for relentless practice",
          "Best for high-frequency learners and academic centers",
          "Premium curated access without paying for AI generation"
        ]
      }
    ]
  },
  {
    title: "AI Only",
    subtitle: "Designed for university students and independent learners who want on-demand practice across concepts, coursework, weak areas, and skill-building topics.",
    tiers: [
      {
        id: "ai_spark",
        name: "AI Spark",
        family: "AI",
        cadence: "/ month",
        primaryAllowance: "20 AI practice sets",
        secondaryAllowance: "Practice on almost any topic",
        description: "A lightweight monthly plan for exploring AI practice without committing to a larger bundle.",
        badge: null,
        highlighted: false,
        features: [
          "Ideal for trying custom practice in a controlled way",
          "Good for occasional targeted revision",
          "A clean entry into AI-powered learning"
        ]
      },
      {
        id: "ai_flow",
        name: "AI Flow",
        family: "AI",
        cadence: "/ month",
        primaryAllowance: "45 AI practice sets",
        secondaryAllowance: "Practice on almost any topic",
        description: "A flexible monthly plan for learners who want AI support as a regular study companion.",
        badge: "Best For Flexibility",
        highlighted: false,
        features: [
          "Strong value for students who learn across many topics",
          "Enough depth for weekly custom practice",
          "Built for learners who want variety, not just syllabus repetition"
        ]
      },
      {
        id: "ai_master",
        name: "AI Master",
        family: "AI",
        cadence: "/ month",
        primaryAllowance: "90 AI practice sets",
        secondaryAllowance: "Practice on almost any topic",
        description: "The highest AI-only tier for learners who want on-demand practice at scale without switching plans.",
        badge: null,
        highlighted: false,
        features: [
          "Best for advanced users and fast-moving learners",
          "High monthly capacity for targeted concept drilling",
          "Premium AI access without paying for curated bundles"
        ]
      }
    ]
  },
  {
    title: "Curated + AI",
    subtitle: "Ideal for learners who want strong board-exam preparation through curated practice, while also using AI to deepen concepts, revise beyond the syllabus, and explore topics independently.",
    tiers: [
      {
        id: "hybrid_plus",
        name: "Plus",
        family: "Hybrid",
        cadence: "/ month",
        primaryAllowance: "90 curated practice sets",
        secondaryAllowance: "15 AI practice sets",
        description: "A smart entry plan for learners who want guided practice first and AI support when it matters.",
        badge: null,
        highlighted: false,
        features: [
          "Balanced monthly access for steady weekly study",
          "Great for students who want structure first and flexibility second",
          "A clean upgrade from Free without overpaying"
        ]
      },
      {
        id: "hybrid_pro",
        name: "Pro",
        family: "Hybrid",
        cadence: "/ month",
        primaryAllowance: "220 curated practice sets",
        secondaryAllowance: "40 AI practice sets",
        description: "Built for serious learners who want strong volume across both curated and AI modes without paying for excess.",
        badge: "Most Popular",
        highlighted: true,
        features: [
          "Strong monthly depth for exam prep and revision",
          "Enough AI practice to sharpen weak areas fast",
          "Best all-round plan for committed learners"
        ]
      },
      {
        id: "hybrid_elite",
        name: "Elite",
        family: "Hybrid",
        cadence: "/ month",
        primaryAllowance: "420 curated practice sets",
        secondaryAllowance: "75 AI practice sets",
        description: "Designed for heavy users who want premium volume, faster iteration, and room to practice without hesitation.",
        badge: "Premium",
        highlighted: false,
        features: [
          "High-capacity access for intense study cycles",
          "Best for power users, top performers, and coaching-led routines",
          "Built for learners who do not want limits getting in the way"
        ]
      }
    ]
  }
];

const PLAN_DISPLAY_NAME: Partial<Record<BillingPlanId, string>> = {
  free: "FREE",
  curated_essential: "ESSENTIAL",
  curated_focus: "FOCUS",
  curated_scholar: "SCHOLAR",
  ai_spark: "AI SPARK",
  ai_flow: "AI FLOW",
  ai_master: "AI MASTER",
  hybrid_plus: "PLUS",
  hybrid_pro: "PRO",
  hybrid_elite: "ELITE"
};

function getPlanDisplayName(planId: BillingPlanId, fallbackName?: string | null) {
  return PLAN_DISPLAY_NAME[planId] ?? fallbackName?.toUpperCase() ?? "PLAN";
}

export default async function PricingPage() {
  const user = await getUser();
  const paymentsEnabled = isManualBillingEnabled();
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
  const curatedUsed = billing.usage?.period_static_problem_sets_used ?? 0;
  const aiUsed = billing.usage?.period_ai_problem_sets_used ?? 0;
  const curatedLimit =
    currentPlanId === "free" ? null : (currentPlan?.static_problem_sets_per_period ?? null);
  const aiLimit =
    currentPlanId === "free" ? null : (currentPlan?.ai_problem_sets_per_period ?? null);

  return (
    <ViewportSection center>
      <div className="w-full space-y-12">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-semibold">Choose the practice plan that fits how you learn.</h1>
          <p className="mx-auto max-w-3xl text-muted">
            Start free, then upgrade based on whether you want guided curated practice, flexible AI practice, or both together in one premium monthly plan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <p className="text-sm text-muted">Current plan</p>
            <p className="mt-3 text-2xl font-semibold uppercase">
              {getPlanDisplayName(currentPlanId, currentPlan?.name)}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted">Curated sets used</p>
            <p className="mt-3 text-2xl font-semibold">
              {currentPlanId === "free" ? freeStaticUsed : curatedUsed}
              {currentPlanId === "free"
                ? ` / ${freeStaticLimit}`
                : curatedLimit !== null
                  ? ` / ${curatedLimit}`
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

        {tierGroups.map((group) => (
          <section key={group.title} className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.22em] text-accent">{group.title}</p>
              <p className="max-w-3xl text-sm text-muted">{group.subtitle}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {group.tiers.map((tier) => {
                const plan = planById.get(tier.id);
                const isCurrent = currentPlanId === tier.id;

                return (
                  <div
                    key={tier.id}
                    className={`card relative flex flex-col gap-6 border-accent p-6 shadow-[0_0_40px_rgba(255,214,10,0.18)] ${
                      isCurrent ? "ring-1 ring-accent/70" : ""
                    }`}
                  >
                    {tier.badge ? (
                      <span
                        className="absolute -top-3 right-4 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-950"
                      >
                        {tier.badge}
                      </span>
                    ) : null}

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-accent/80">{tier.family}</p>
                      <h2 className="mt-2 text-2xl font-semibold uppercase">{tier.name}</h2>
                      <p className="mt-2 text-muted">{tier.description}</p>
                    </div>

                    <div>
                      <p className="text-3xl font-semibold">
                        ৳{plan?.price_bdt ?? 0}{" "}
                        <span className="text-base font-normal text-muted">{tier.cadence}</span>
                      </p>
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

                    {paymentsEnabled ? (
                    user ? (
                      isCurrent ? (
                        <button type="button" className="button mt-auto cursor-default opacity-80" disabled>
                          Current plan
                        </button>
                      ) : (
                        <div className="mt-auto space-y-3">
                          <Link
                            href={`/billing/manual?planId=${tier.id}`}
                            className="button button-primary w-full"
                          >
                            Pay with bKash
                          </Link>
                          <p className="text-center text-xs text-muted">
                            Access is activated after payment approval.
                          </p>
                        </div>
                      )
                    ) : (
                      <Link
                        href={`/auth/sign-in?redirect=${encodeURIComponent(`/billing/manual?planId=${tier.id}`)}`}
                        className="mt-auto inline-flex items-center justify-center rounded-full border border-transparent bg-accent px-5 py-2.5 text-sm font-medium text-ink-950"
                      >
                        Sign in to pay
                      </Link>
                    )) : (
                      <div className="mt-auto space-y-3">
                        <button
                          type="button"
                          className="button w-full cursor-not-allowed border-ink-700/60 bg-ink-900/80 text-zinc-400 opacity-80"
                          disabled
                        >
                          Payments temporarily unavailable
                        </button>
                        <p className="text-center text-xs text-muted">
                          Plan checkout is currently disabled.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </ViewportSection>
  );
}
