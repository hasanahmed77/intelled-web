import Link from "next/link";
import { cancelSubscriptionAction } from "@/app/actions/billing";
import { requireUser } from "@/lib/auth";
import { getCurrentSubscription, listActivePlans } from "@/lib/billing/data";
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
  const resolvedSearchParams = await searchParams;
  const billingStatus =
    typeof resolvedSearchParams.billing === "string" ? resolvedSearchParams.billing : null;
  const user = await requireUser("/profile");
  const username = (user.email ?? "user").split("@")[0];
  const [attempts, worksheets, billing, plans] = await Promise.all([
    fetchAttempts(user.id),
    fetchWorksheets(user.id),
    getCurrentSubscription(user.id),
    listActivePlans()
  ]);
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
      ? (currentPlan?.lifetime_worksheet_limit ?? 3)
      : currentPlan?.worksheets_per_period ?? null;
  const currentUsed =
    currentPlanId === "free"
      ? (billing.usage?.free_worksheets_used_lifetime ?? 0)
      : (billing.usage?.period_worksheets_used ?? 0);

  return (
    <ViewportSection innerClassName="space-y-10 pt-6 pb-20">
      {billingStatus ? (
        <div className="card p-4 text-sm text-zinc-200">
          Billing status: {billingStatus.replaceAll("_", " ")}
        </div>
      ) : null}
      <div className="space-y-2">
        <span className="tag">Profile</span>
        <h1 className="text-3xl font-semibold">{toTitleCase(username)}</h1>
        <p className="text-muted">Track how your worksheets are improving over time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm text-muted">Average score</p>
          <p className="mt-3 text-3xl font-semibold">{average}%</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted">Worksheets generated</p>
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
            <h2 className="mt-2 text-2xl font-semibold capitalize">
              {billing.subscription?.plan_id ?? "free"}
            </h2>
          </div>
          <span className="rounded-full border border-ink-700 px-3 py-1 text-xs uppercase tracking-[0.16em] text-zinc-300">
            {billing.subscription?.status ?? "active"}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted">Provider</p>
            <p className="mt-2 text-lg font-medium uppercase">
              {billing.subscription?.provider ?? "internal"}
            </p>
          </div>
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
              {billing.subscription?.auto_renew ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">
              {currentPlanId === "free" ? "Free lifetime used" : "Plan worksheets used"}
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
              <form action={cancelSubscriptionAction}>
                <button
                  type="submit"
                  className="button border-red-500/50 text-red-300 hover:border-red-400 hover:text-red-200"
                >
                  Cancel subscription
                </button>
              </form>
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent worksheets</h2>
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
              <p className="mt-2 text-sm text-muted">{worksheet.topic}</p>
              <p className="mt-4 text-xs text-muted">
                Created {new Date(worksheet.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
          {worksheets.length === 0 ? (
            <div className="card p-6 text-sm text-muted">
              No worksheets yet. Generate your first worksheet from Practice.
            </div>
          ) : null}
        </div>
      </section>
    </ViewportSection>
  );
}
