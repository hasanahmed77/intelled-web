"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminUser, requireUser } from "@/lib/auth";
import {
  approveManualPaymentRequest,
  rejectManualPaymentRequest,
  submitManualPaymentRequest
} from "@/lib/billing/manual-payments";

const createManualPaymentSchema = z.object({
  planId: z.enum(["static_monthly", "hybrid_monthly", "hybrid_yearly"]),
  payerNumber: z
    .string()
    .trim()
    .min(11, "Enter the bKash number you paid from.")
    .max(20, "Use a valid bKash number."),
  transactionId: z
    .string()
    .trim()
    .min(6, "Enter the transaction ID.")
    .max(64, "Transaction ID is too long."),
  notes: z.string().trim().max(400, "Notes must be 400 characters or fewer.").optional()
});

const reviewManualPaymentSchema = z.object({
  requestId: z.string().uuid("Invalid payment request."),
  adminNotes: z.string().trim().max(400, "Notes must be 400 characters or fewer.").optional()
});

export async function submitManualPaymentRequestAction(formData: FormData) {
  const user = await requireUser("/pricing");

  const parsed = createManualPaymentSchema.safeParse({
    planId: formData.get("planId"),
    payerNumber: formData.get("payerNumber"),
    transactionId: formData.get("transactionId"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    const planId = String(formData.get("planId") ?? "");
    const message = encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid payment request.");
    redirect(`/billing/manual?planId=${planId}&error=${message}`);
  }

  try {
    await submitManualPaymentRequest({
      userId: user.id,
      userEmail: user.email ?? "",
      planId: parsed.data.planId,
      payerNumber: parsed.data.payerNumber,
      transactionId: parsed.data.transactionId,
      notes: parsed.data.notes
    });
  } catch (error) {
    const message = encodeURIComponent(
      error instanceof Error ? error.message : "Could not submit payment request."
    );
    redirect(`/billing/manual?planId=${parsed.data.planId}&error=${message}`);
  }

  revalidatePath("/billing/manual");
  revalidatePath("/pricing");
  revalidatePath("/profile");
  redirect(`/billing/manual?planId=${parsed.data.planId}&status=submitted`);
}

export async function approveManualPaymentRequestAction(formData: FormData) {
  const admin = await requireAdminUser("/admin/payments");
  const parsed = reviewManualPaymentSchema.safeParse({
    requestId: formData.get("requestId"),
    adminNotes: formData.get("adminNotes")
  });

  if (!parsed.success) {
    redirect("/admin/payments?error=invalid_request");
  }

  try {
    await approveManualPaymentRequest({
      requestId: parsed.data.requestId,
      adminUserId: admin.id,
      adminEmail: admin.email ?? "",
      adminNotes: parsed.data.adminNotes
    });
  } catch (error) {
    const message = encodeURIComponent(
      error instanceof Error ? error.message : "Could not approve payment request."
    );
    redirect(`/admin/payments?error=${message}`);
  }

  revalidatePath("/admin/payments");
  revalidatePath("/pricing");
  revalidatePath("/profile");
  redirect("/admin/payments?status=approved");
}

export async function rejectManualPaymentRequestAction(formData: FormData) {
  const admin = await requireAdminUser("/admin/payments");
  const parsed = reviewManualPaymentSchema.safeParse({
    requestId: formData.get("requestId"),
    adminNotes: formData.get("adminNotes")
  });

  if (!parsed.success) {
    redirect("/admin/payments?error=invalid_request");
  }

  try {
    await rejectManualPaymentRequest({
      requestId: parsed.data.requestId,
      adminUserId: admin.id,
      adminEmail: admin.email ?? "",
      adminNotes: parsed.data.adminNotes
    });
  } catch (error) {
    const message = encodeURIComponent(
      error instanceof Error ? error.message : "Could not reject payment request."
    );
    redirect(`/admin/payments?error=${message}`);
  }

  revalidatePath("/admin/payments");
  revalidatePath("/pricing");
  revalidatePath("/profile");
  redirect("/admin/payments?status=rejected");
}
