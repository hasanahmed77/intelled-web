import { ViewportSection } from "@/components/viewport-section";
import { FormPendingBar, FormPendingBarButton } from "@/components/form-pending-bar";
import { refreshBillingPlansAction, refreshPracticeCatalogAction } from "@/app/actions/catalog";
import {
  approveManualPaymentRequestAction,
  rejectManualPaymentRequestAction
} from "@/app/actions/manual-billing";
import { requireAdminUser } from "@/lib/auth";
import { listActivePlans } from "@/lib/billing/data";
import { listManualPaymentRequestsForAdmin } from "@/lib/billing/manual-payments";

type SearchParams = Promise<{
  status?: string;
  error?: string;
}>;

export default async function AdminPaymentsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  await requireAdminUser("/admin/payments");
  const params = await searchParams;
  const [plans, requests] = await Promise.all([
    listActivePlans(),
    listManualPaymentRequestsForAdmin()
  ]);

  const pendingRequests = requests.filter((request) => request.status === "pending");
  const reviewedRequests = requests.filter((request) => request.status !== "pending");
  const totalPendingAmount = pendingRequests.reduce((sum, request) => sum + request.amount_bdt, 0);

  return (
    <ViewportSection center>
      <div className="w-full max-w-6xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Admin</p>
          <h1 className="text-4xl font-semibold">bKash payment review</h1>
          <p className="max-w-3xl text-muted">
            Review bKash transactions, approve verified requests, and activate paid access without
            exposing subscription changes to regular users.
          </p>
        </div>

        {params.status ? (
          <div className="card border-accent/40 bg-accent/10 p-4 text-sm text-zinc-100">
            {params.status === "catalog_refreshed"
              ? "Practice catalog cache refreshed."
              : params.status === "billing_refreshed"
              ? "Billing plan cache refreshed."
              : `Payment request ${params.status}.`}
          </div>
        ) : null}

        {params.error ? (
          <div className="card border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {params.error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <p className="text-sm text-muted">Pending requests</p>
            <p className="mt-3 text-3xl font-semibold">{pendingRequests.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted">Pending amount</p>
            <p className="mt-3 text-3xl font-semibold">৳{totalPendingAmount}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-muted">Reviewed recently</p>
            <p className="mt-3 text-3xl font-semibold">{reviewedRequests.length}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Practice catalog cache</h2>
                <p className="text-sm text-muted">
                  Refresh this after adding or changing subjects, topics, or curated sets in the database.
                </p>
              </div>
              <form action={refreshPracticeCatalogAction} className="relative min-w-[16rem] overflow-hidden rounded-2xl">
                <FormPendingBar />
                <FormPendingBarButton label="Refresh catalog" className="button button-primary w-full" />
              </form>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Billing plan cache</h2>
                <p className="text-sm text-muted">
                  Refresh this after updating plan prices or allowances in Supabase so pricing pages stop showing stale values.
                </p>
              </div>
              <form action={refreshBillingPlansAction} className="relative min-w-[16rem] overflow-hidden rounded-2xl">
                <FormPendingBar />
                <FormPendingBarButton label="Refresh plans" className="button button-primary w-full" />
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Pending verification</h2>
            <p className="text-sm text-muted">Approve only after matching the transaction in bKash.</p>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="card p-8 text-center text-sm text-muted">
              No pending payment requests.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const plan = plans.find((entry) => entry.id === request.plan_id);

                return (
                  <div key={request.id} className="card space-y-5 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold">{plan?.name ?? request.plan_id}</h3>
                          <span className="rounded-full border border-ink-700 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                            pending
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-muted">
                          <p>User: {request.user_email || request.user_id}</p>
                          <p>Amount: ৳{request.amount_bdt}</p>
                          <p>Payer number: {request.payer_number}</p>
                          <p>Transaction ID: {request.transaction_id}</p>
                          <p>Submitted: {new Date(request.submitted_at).toLocaleString()}</p>
                          {request.notes ? <p>User note: {request.notes}</p> : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <form action={approveManualPaymentRequestAction} className="relative space-y-3 overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/65 p-4">
                        <FormPendingBar />
                        <input type="hidden" name="requestId" value={request.id} />
                        <div>
                          <label className="text-sm font-medium text-zinc-200" htmlFor={`approve-${request.id}`}>
                            Approval note (optional)
                          </label>
                          <input
                            id={`approve-${request.id}`}
                            name="adminNotes"
                            type="text"
                            placeholder="Internal note"
                            className="mt-2 w-full rounded-2xl border border-ink-700 bg-ink-950/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-accent"
                          />
                        </div>
                        <FormPendingBarButton label="Approve and activate" />
                      </form>

                      <form action={rejectManualPaymentRequestAction} className="relative space-y-3 overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                        <FormPendingBar />
                        <input type="hidden" name="requestId" value={request.id} />
                        <div>
                          <label className="text-sm font-medium text-zinc-200" htmlFor={`reject-${request.id}`}>
                            Rejection reason
                          </label>
                          <input
                            id={`reject-${request.id}`}
                            name="adminNotes"
                            type="text"
                            placeholder="Why this could not be verified"
                            className="mt-2 w-full rounded-2xl border border-ink-700 bg-ink-950/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-red-300"
                          />
                        </div>
                        <FormPendingBarButton
                          label="Reject request"
                          className="button w-full border-red-500/50 text-red-200 hover:border-red-400 hover:text-red-100"
                        />
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent reviews</h2>
          {reviewedRequests.length === 0 ? (
            <div className="card p-8 text-center text-sm text-muted">
              No reviewed requests yet.
            </div>
          ) : (
            <div className="space-y-4">
              {reviewedRequests.slice(0, 20).map((request) => {
                const plan = plans.find((entry) => entry.id === request.plan_id);

                return (
                  <div key={request.id} className="card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-zinc-100">{plan?.name ?? request.plan_id}</p>
                          <span className="rounded-full border border-ink-700 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                            {request.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted">
                          <p>User: {request.user_email || request.user_id}</p>
                          <p>Transaction ID: {request.transaction_id}</p>
                          <p>Submitted: {new Date(request.submitted_at).toLocaleString()}</p>
                          {request.reviewed_at ? (
                            <p>Reviewed: {new Date(request.reviewed_at).toLocaleString()}</p>
                          ) : null}
                          {request.admin_notes ? <p>Note: {request.admin_notes}</p> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ViewportSection>
  );
}
