import { requireUser } from "@/lib/auth";
import { getCurrentSubscription, listActivePlans } from "@/lib/billing/data";
import { listStaticQuestionBankOptions } from "@/lib/worksheet/data";
import { fetchProfile } from "@/lib/profile/data";
import { AnimatedName } from "@/components/animated-name";
import { StaticPracticeForm } from "@/components/static-practice-form";
import { ViewportSection } from "@/components/viewport-section";

export default async function PracticePage() {
  const user = await requireUser("/practice");
  const fallbackName = (user.email ?? "user").split("@")[0];
  const [profile, billing, plans, catalog] = await Promise.all([
    fetchProfile(user.id),
    getCurrentSubscription(user.id),
    listActivePlans(),
    listStaticQuestionBankOptions()
  ]);
  const displayName = profile?.full_name?.trim() || fallbackName;

  const currentPlan =
    plans.find((plan) => plan.id === billing.subscription.plan_id) ??
    plans.find((plan) => plan.id === "free") ??
    null;

  let generationDisabled = false;
  let generationDisabledMessage: string | null = null;

  if (
    billing.subscription.plan_id === "free" &&
    currentPlan?.lifetime_worksheet_limit !== null &&
    currentPlan?.lifetime_worksheet_limit !== undefined &&
    billing.usage.free_worksheets_used_lifetime >= currentPlan.lifetime_worksheet_limit
  ) {
    generationDisabled = true;
    generationDisabledMessage = "Free plan lifetime limit reached. Upgrade to become a legend.";
  } else if (
    billing.subscription.plan_id !== "free" &&
    currentPlan?.static_problem_sets_per_period !== null &&
    currentPlan?.static_problem_sets_per_period !== undefined &&
    billing.usage.period_static_problem_sets_used >= currentPlan.static_problem_sets_per_period
  ) {
    generationDisabled = true;
    generationDisabledMessage = "Your curated problem set limit is reached for the current billing period.";
  }

  return (
    <ViewportSection center>
      <div className="w-full space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">
            What would you like to learn today, <AnimatedName name={displayName} />?
          </h1>
          <p className="text-muted">
            Choose an education type, subject, topic, and difficulty. Access curated problem
            sets with precise evaluation and targeted feedback.
          </p>
        </div>

        <StaticPracticeForm
          options={catalog.options}
          subjectCatalog={catalog.subjectCatalog}
          topicCatalog={catalog.topicCatalog}
          generationDisabled={generationDisabled}
          generationDisabledMessage={generationDisabledMessage}
        />
      </div>
    </ViewportSection>
  );
}
