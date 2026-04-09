import Image from "next/image";
import { ViewportSection } from "@/components/viewport-section";
import { FormPendingBar, FormPendingBarButton } from "@/components/form-pending-bar";
import { submitManualPaymentRequestAction } from "@/app/actions/manual-billing";
import { requireUser } from "@/lib/auth";
import { listActivePlans } from "@/lib/billing/data";
import type { BillingPlanId } from "@/lib/billing/types";

const PLAN_IDS: Exclude<BillingPlanId, "free">[] = [
  "curated_essential",
  "curated_focus",
  "curated_scholar",
  "ai_spark",
  "ai_flow",
  "ai_master",
  "hybrid_plus",
  "hybrid_pro",
  "hybrid_elite"
];

type SearchParams = Promise<{
  planId?: string;
  status?: string;
  error?: string;
}>;

export default async function ManualBillingPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  await requireUser("/pricing");
  const params = await searchParams;
  const plans = await listActivePlans();
  const selectedPlanId = PLAN_IDS.includes(params.planId as Exclude<BillingPlanId, "free">)
    ? (params.planId as Exclude<BillingPlanId, "free">)
    : "hybrid_pro";
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  return (
    <ViewportSection center>
      <div className="w-full max-w-5xl space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-semibold">Pay with bKash</h1>
          <p className="mx-auto max-w-2xl text-muted">
            Make the payment manually, submit the transaction ID, and your plan will be activated
            after verification from the admin dashboard.
          </p>
        </div>

        {params.status === "submitted" ? (
          <div className="card border-accent/40 bg-accent/10 p-4 text-sm text-zinc-100">
            Payment request submitted. We will review it, activate your plan after verification,
            and email you the outcome.
          </div>
        ) : null}

        {params.error ? (
          <div className="card border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {params.error}
          </div>
        ) : null}

        <div className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form
            action={submitManualPaymentRequestAction}
            className="card relative flex h-full flex-col space-y-6 overflow-hidden p-6"
          >
              <FormPendingBar />
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.22em] text-accent">bKash checkout</p>
                <h2 className="text-2xl font-semibold">Submit your bKash payment</h2>
                <p className="text-sm text-muted">
                  Use your plan amount exactly. We verify against the transaction ID and the payer
                  number you submit here.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200" htmlFor="planId">
                  Plan
                </label>
                <select
                  id="planId"
                  name="planId"
                  defaultValue={selectedPlanId}
                  className="w-full rounded-2xl border border-ink-700 bg-ink-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-accent"
                >
                  {plans
                    .filter((plan) => plan.id !== "free")
                    .map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — ৳{plan.price_bdt}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200" htmlFor="payerNumber">
                  bKash number used for payment
                </label>
                <input
                  id="payerNumber"
                  name="payerNumber"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-2xl border border-ink-700 bg-ink-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200" htmlFor="transactionId">
                  Transaction ID
                </label>
                <input
                  id="transactionId"
                  name="transactionId"
                  type="text"
                  placeholder="e.g. 9A1BC2D3EF"
                  className="w-full rounded-2xl border border-ink-700 bg-ink-900/80 px-4 py-3 text-sm uppercase text-zinc-100 outline-none transition focus:border-accent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200" htmlFor="notes">
                  Notes for review (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Anything the reviewer should know."
                  className="w-full rounded-2xl border border-ink-700 bg-ink-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-accent"
                />
              </div>

              <FormPendingBarButton label="Submit payment request" scrollToTopOnClick />
            </form>

          <div className="flex h-full flex-col">
            <div className="card flex h-full flex-col space-y-4 p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-accent">Instructions</p>
                <h2 className="mt-2 text-2xl font-semibold">Pay the exact amount</h2>
              </div>
              <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/75">
                <div className="border-b border-ink-700 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Scan to pay with bKash
                  </p>
                </div>
                <div className="p-4">
                  <Image
                    src="/payments/bkash-qr-sent-money-smaller.jpeg"
                    alt="bKash send money QR code"
                    width={1200}
                    height={1200}
                    className="mx-auto h-auto w-full max-w-[300px] rounded-xl sm:max-w-[340px]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ViewportSection>
  );
}
