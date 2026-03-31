import Link from "next/link";
import { cancelSubscriptionAction } from "@/app/actions/billing";
import { requireUser } from "@/lib/auth";
import { AnimatedName } from "@/components/animated-name";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { getCurrentSubscription, listActivePlans } from "@/lib/billing/data";
import { fetchProfile } from "@/lib/profile/data";
import { fetchAttempts, fetchWorksheets } from "@/lib/worksheet/data";
import { ViewportSection } from "@/components/viewport-section";

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  const user = await requireUser("/profile");
  const fallbackName = (user.email ?? "user").split("@")[0];
  const [attempts, worksheets, billing, plans, profile] = await Promise.all([
    fetchAttempts(user.id),
    fetchWorksheets(user.id),
    getCurrentSubscription(user.id),
    listActivePlans(),
    fetchProfile(user.id)
  ]);
  const displayName = profile?.full_name?.trim() || fallbackName;
  const completedWorksheetIds = new Set(
    attempts
      .map((attempt) => attempt.worksheet_id)
      .filter((id): id is string => Boolean(id))
  );

  const average =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / attempts.length)
      : 0;
  const currentPlanId = billing.subscription?.plan_id ?? "free";
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
    <ViewportSection innerClassName="space-y-10 pt-6 pb-20">
      <div className="space-y-2">
        <span className="tag">Profile</span>
        <h1 className="text-3xl font-semibold">
          <AnimatedName name={displayName} />
        </h1>
        <p className="text-muted">
          {profile?.primary_learning_goal?.trim()
            ? `Focused on ${profile.primary_learning_goal}.`
            : "Track how your problem sets are improving over time."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm text-muted">Average score</p>
          <p className="mt-3 text-3xl font-semibold">{average}%</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted">Problem sets generated</p>
          <p className="mt-3 text-3xl font-semibold">{worksheets.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted">Attempts submitted</p>
          <p className="mt-3 text-3xl font-semibold">{attempts.length}</p>
        </div>
      </div>

      <section className="card space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Subscription</p>
            <h2 className="mt-2 text-2xl font-semibold uppercase">
              {billing.subscription?.plan_id ?? "free"}
            </h2>
          </div>
          <span className="rounded-full border border-ink-700 px-3 py-1 text-xs uppercase tracking-[0.16em] text-zinc-300">
            {(billing.subscription?.status ?? "active").toUpperCase()}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted">Period ends</p>
            <p className="mt-2 text-lg font-medium">
              {billing.subscription?.period_end
                ? new Date(billing.subscription.period_end).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Auto renew</p>
            <p className="mt-2 text-lg font-medium">
              {billing.subscription?.auto_renew ? "ENABLED" : "DISABLED"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">
              {currentPlanId === "free" ? "Free lifetime used" : "Plan problem sets used"}
            </p>
            <p className="mt-2 text-lg font-medium">
              {currentUsed}
              {currentLimit !== null ? ` / ${currentLimit}` : ""}
            </p>
          </div>
        </div>
        {billing.subscription?.plan_id !== "free" ? (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-800 pt-5">
            <p className="text-sm text-muted">
              Cancellation is scheduled for the end of the current billing period.
            </p>
            {billing.subscription?.cancel_at_period_end ? (
              <span className="rounded-full border border-amber-500/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-amber-300">
                Cancel Scheduled
              </span>
            ) : (
              <ConfirmActionForm
                action={cancelSubscriptionAction}
                title="Cancel subscription?"
                message="Your subscription will stay active until the current billing period ends, and auto-renew will be turned off."
                buttonLabel="Cancel subscription"
                className="button border-red-500/50 text-red-300 hover:border-red-400 hover:text-red-200"
              />
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent problem sets</h2>
          <span className="text-sm text-muted">{worksheets.length} total</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {worksheets.map((worksheet) => (
            <Link
              key={worksheet.id}
              className="card p-5 transition hover:border-accent"
              href={`/practice/${worksheet.id}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{toTitleCase(worksheet.title)}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      completedWorksheetIds.has(worksheet.id)
                        ? "border-green-500/40 text-green-400"
                        : "border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {completedWorksheetIds.has(worksheet.id) ? "Complete" : "Incomplete"}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">
                    {worksheet.difficulty}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted">
                Created {new Date(worksheet.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
          {worksheets.length === 0 ? (
            <div className="card p-6 text-sm text-muted">
              No problem sets yet. Generate your first problem set from Practice.
            </div>
          ) : null}
        </div>
      </section>
    </ViewportSection>
  );
}
