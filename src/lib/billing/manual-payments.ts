import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BillingPlan, BillingPlanId } from "@/lib/billing/types";
import { activateManualSubscription, listActivePlans } from "@/lib/billing/data";
import {
  notifyAdminOfManualPayment,
  notifyUserOfManualPaymentReview
} from "@/lib/notifications/manual-payments";

export type ManualPaymentStatus = "pending" | "approved" | "rejected";

export type ManualPaymentRequest = {
  id: string;
  user_id: string;
  plan_id: BillingPlanId;
  payment_method: string;
  amount_bdt: number;
  payer_number: string;
  transaction_id: string;
  notes: string | null;
  status: ManualPaymentStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type AdminManualPaymentRequest = ManualPaymentRequest & {
  user_email: string;
};

const MANUAL_PAYMENT_SELECT = [
  "id",
  "user_id",
  "plan_id",
  "payment_method",
  "amount_bdt",
  "payer_number",
  "transaction_id",
  "notes",
  "status",
  "admin_notes",
  "reviewed_by",
  "reviewed_at",
  "submitted_at",
  "created_at",
  "updated_at"
].join(", ");

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://intelled.org";
}

function normalizeTransactionId(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizePhone(input: string) {
  return input.trim().replace(/\s+/g, "");
}

async function getActivePlanById(planId: Exclude<BillingPlanId, "free">): Promise<BillingPlan> {
  const plans = await listActivePlans();
  const plan = plans.find((entry) => entry.id === planId);

  if (!plan || !plan.active) {
    throw new Error("Selected plan is not available.");
  }

  return plan;
}

async function getUserEmailById(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    throw new Error(error.message);
  }

  return data.user.email ?? "";
}

export async function submitManualPaymentRequest(input: {
  userId: string;
  userEmail: string;
  planId: Exclude<BillingPlanId, "free">;
  payerNumber: string;
  transactionId: string;
  notes?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const plan = await getActivePlanById(input.planId);
  const normalizedTransactionId = normalizeTransactionId(input.transactionId);
  const normalizedPayerNumber = normalizePhone(input.payerNumber);

  const { data: existingPending, error: existingPendingError } = await supabase
    .from("manual_payment_requests")
    .select("id")
    .eq("user_id", input.userId)
    .eq("plan_id", input.planId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPendingError) {
    throw new Error(existingPendingError.message);
  }

  if (existingPending) {
    throw new Error("You already have a pending payment request for this plan.");
  }

  const { data, error } = await supabase
    .from("manual_payment_requests")
    .insert({
      user_id: input.userId,
      plan_id: input.planId,
      payment_method: "bkash_manual",
      amount_bdt: plan.price_bdt,
      payer_number: normalizedPayerNumber,
      transaction_id: normalizedTransactionId,
      notes: input.notes?.trim() ? input.notes.trim() : null,
      status: "pending"
    })
    .select(MANUAL_PAYMENT_SELECT)
    .single();

  if (error) {
    const normalizedMessage = error.message.toLowerCase();
    if (
      normalizedMessage.includes("manual_payment_requests_transaction_id_key") ||
      normalizedMessage.includes("duplicate key")
    ) {
      throw new Error("This transaction ID has already been submitted.");
    }

    throw new Error(error.message);
  }

  await notifyAdminOfManualPayment({
    planName: plan.name,
    amountBdt: plan.price_bdt,
    transactionId: normalizedTransactionId,
    payerNumber: normalizedPayerNumber,
    submittedByEmail: input.userEmail,
    reviewUrl: `${getSiteUrl()}/admin/payments`
  });

  return data as unknown as ManualPaymentRequest;
}

export async function listManualPaymentRequestsForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("manual_payment_requests")
    .select(MANUAL_PAYMENT_SELECT)
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as ManualPaymentRequest[];
}

export async function listManualPaymentRequestsForAdmin(status?: ManualPaymentStatus) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("manual_payment_requests")
    .select(MANUAL_PAYMENT_SELECT)
    .order("submitted_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const requests = (data ?? []) as unknown as ManualPaymentRequest[];
  const userIds = [...new Set(requests.map((request) => request.user_id))];
  const emailByUserId = new Map<string, string>();

  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const email = await getUserEmailById(userId);
        emailByUserId.set(userId, email);
      } catch (error) {
        console.error(error);
      }
    })
  );

  return requests.map((request) => ({
    ...request,
    user_email: emailByUserId.get(request.user_id) ?? ""
  })) as AdminManualPaymentRequest[];
}

export async function approveManualPaymentRequest(input: {
  requestId: string;
  adminUserId: string;
  adminEmail: string;
  adminNotes?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: request, error } = await supabase
    .from("manual_payment_requests")
    .select(MANUAL_PAYMENT_SELECT)
    .eq("id", input.requestId)
    .single();

  if (error || !request) {
    throw new Error(error?.message ?? "Payment request not found.");
  }

  const typedRequest = request as unknown as ManualPaymentRequest;
  const planId = typedRequest.plan_id as Exclude<BillingPlanId, "free">;

  if (typedRequest.status !== "pending") {
    throw new Error("This payment request has already been reviewed.");
  }

  const result = await activateManualSubscription(
    typedRequest.user_id,
    planId,
    typedRequest.transaction_id,
    {
      approvedBy: input.adminEmail,
      requestId: typedRequest.id
    }
  );

  const adminNotes = input.adminNotes?.trim() ? input.adminNotes.trim() : null;
  const { error: updateError } = await supabase
    .from("manual_payment_requests")
    .update({
      status: "approved",
      admin_notes: adminNotes,
      reviewed_by: input.adminUserId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", input.requestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const userEmail = await getUserEmailById(typedRequest.user_id);
  await notifyUserOfManualPaymentReview({
    userEmail,
    planName: result.planName,
    amountBdt: typedRequest.amount_bdt,
    transactionId: typedRequest.transaction_id,
    status: "approved",
    notes: adminNotes
  });

  return result;
}

export async function rejectManualPaymentRequest(input: {
  requestId: string;
  adminUserId: string;
  adminEmail: string;
  adminNotes?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: request, error } = await supabase
    .from("manual_payment_requests")
    .select(MANUAL_PAYMENT_SELECT)
    .eq("id", input.requestId)
    .single();

  if (error || !request) {
    throw new Error(error?.message ?? "Payment request not found.");
  }

  const typedRequest = request as unknown as ManualPaymentRequest;
  const planId = typedRequest.plan_id as Exclude<BillingPlanId, "free">;

  if (typedRequest.status !== "pending") {
    throw new Error("This payment request has already been reviewed.");
  }

  const adminNotes = input.adminNotes?.trim() ? input.adminNotes.trim() : "Payment could not be verified.";

  const { error: updateError } = await supabase
    .from("manual_payment_requests")
    .update({
      status: "rejected",
      admin_notes: adminNotes,
      reviewed_by: input.adminUserId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", input.requestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const plan = await getActivePlanById(planId);
  const userEmail = await getUserEmailById(typedRequest.user_id);

  await notifyUserOfManualPaymentReview({
    userEmail,
    planName: plan.name,
    amountBdt: typedRequest.amount_bdt,
    transactionId: typedRequest.transaction_id,
    status: "rejected",
    notes: adminNotes
  });

  return {
    ok: true
  };
}
