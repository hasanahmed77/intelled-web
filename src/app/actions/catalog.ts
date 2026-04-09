"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth";

export async function refreshPracticeCatalogAction() {
  await requireAdminUser("/admin/payments");

  revalidateTag("static-question-bank-options", "max");
  revalidatePath("/practice");

  redirect("/admin/payments?status=catalog_refreshed");
}

export async function refreshBillingPlansAction() {
  await requireAdminUser("/admin/payments");

  revalidateTag("billing-plans", "max");
  revalidatePath("/pricing");
  revalidatePath("/billing/manual");
  revalidatePath("/profile");

  redirect("/admin/payments?status=billing_refreshed");
}
