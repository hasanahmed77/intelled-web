"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { activateDummySubscription, cancelCurrentSubscription } from "@/lib/billing/data";
import { requireUser } from "@/lib/auth";

const planSchema = z.object({
  planId: z.enum(["weekly", "monthly", "yearly"])
});

export async function subscribeToPlanAction(formData: FormData) {
  const user = await requireUser("/pricing");

  const parsed = planSchema.safeParse({
    planId: formData.get("planId")
  });

  if (!parsed.success) {
    redirect("/pricing?billing=invalid_plan");
  }

  await activateDummySubscription(user.id, parsed.data.planId);
  redirect("/profile?billing=activated");
}

export async function cancelSubscriptionAction() {
  const user = await requireUser("/profile");
  await cancelCurrentSubscription(user.id);
  redirect("/profile?billing=cancel_scheduled");
}
