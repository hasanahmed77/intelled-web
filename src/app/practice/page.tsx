import { requireUser } from "@/lib/auth";
import { getCurrentSubscription, listActivePlans } from "@/lib/billing/data";
import { AnimatedName } from "@/components/animated-name";
import { PracticeForm } from "@/components/practice-form";
import { fetchProfile } from "@/lib/profile/data";
import { ViewportSection } from "@/components/viewport-section";

export default async function PracticePage() {
  const user = await requireUser("/practice");
  const fallbackName = (user.email ?? "user").split("@")[0];
  const [profile, billing, plans] = await Promise.all([
    fetchProfile(user.id),
    getCurrentSubscription(user.id),
    listActivePlans()
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
    currentPlan?.worksheets_per_period !== null &&
    currentPlan?.worksheets_per_period !== undefined &&
    billing.usage.period_worksheets_used >= currentPlan.worksheets_per_period
  ) {
    generationDisabled = true;
    generationDisabledMessage = "Your problem set limit is reached for the current billing period.";
  }

  return (
    <ViewportSection center>
      <div className="w-full space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">
            What would you like to learn today,{" "}
            <AnimatedName name={displayName} />?
          </h1>
          <p className="text-muted">
            Enter a topic and choose a difficulty. Auto uses your performance history to
            tune the problem set level.
          </p>
        </div>

        <PracticeForm
          username={displayName}
          generationDisabled={generationDisabled}
          generationDisabledMessage={generationDisabledMessage}
        />
      </div>
    </ViewportSection>
  );
}
