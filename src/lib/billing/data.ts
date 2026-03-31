import "server-only";

import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BillingPlan, BillingPlanId, UsageCounter, UserSubscription } from "@/lib/billing/types";

const FALLBACK_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    interval: "free",
    price_bdt: 0,
    duration_days: 0,
    worksheets_per_period: null,
    lifetime_worksheet_limit: 2,
    active: true
  },
  {
    id: "weekly",
    name: "Weekly",
    interval: "weekly",
    price_bdt: 129,
    duration_days: 7,
    worksheets_per_period: 12,
    lifetime_worksheet_limit: null,
    active: true
  },
  {
    id: "monthly",
    name: "Monthly",
    interval: "monthly",
    price_bdt: 349,
    duration_days: 30,
    worksheets_per_period: 50,
    lifetime_worksheet_limit: null,
    active: true
  },
  {
    id: "yearly",
    name: "Yearly",
    interval: "yearly",
    price_bdt: 3699,
    duration_days: 365,
    worksheets_per_period: 600,
    lifetime_worksheet_limit: null,
    active: true
  }
];

const FALLBACK_SUBSCRIPTION: UserSubscription = {
  user_id: "",
  plan_id: "free",
  status: "active",
  period_start: null,
  period_end: null,
  cancel_at_period_end: false,
  auto_renew: false,
  provider: "internal"
};

const FALLBACK_USAGE: UsageCounter = {
  user_id: "",
  free_worksheets_used_lifetime: 0,
  period_worksheets_used: 0,
  period_anchor: null
};

function isBillingSchemaUnavailable(message: string | undefined) {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes("schema cache") ||
    normalized.includes("could not find the table") ||
    normalized.includes("could not find the function") ||
    normalized.includes("does not exist")
  );
}

function billingSetupError() {
  return new Error(
    "Billing schema is not ready in Supabase yet. Re-run supabase-billing.sql, confirm it completed successfully, then wait a few seconds and refresh."
  );
}

function buildOrderId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`;
}

async function ensureBillingRows(userId: string) {
  const supabase = createSupabaseAdminClient();

  const [
    { data: subscription, error: subscriptionReadError },
    { data: usage, error: usageReadError }
  ] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("usage_counters")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  if (subscriptionReadError) {
    if (isBillingSchemaUnavailable(subscriptionReadError.message)) {
      throw billingSetupError();
    }
    throw new Error(subscriptionReadError.message);
  }

  if (usageReadError) {
    if (isBillingSchemaUnavailable(usageReadError.message)) {
      throw billingSetupError();
    }
    throw new Error(usageReadError.message);
  }

  if (!subscription) {
    const { error } = await supabase.from("user_subscriptions").insert({
      user_id: userId,
      plan_id: "free",
      status: "active",
      cancel_at_period_end: false,
      auto_renew: false,
      provider: "internal"
    });

    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
  }

  if (!usage) {
    const { error } = await supabase.from("usage_counters").insert({
      user_id: userId,
      free_worksheets_used_lifetime: 0,
      period_worksheets_used: 0,
      period_anchor: null
    });

    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
  }
}

async function logSubscriptionEvent(userId: string, planId: BillingPlanId, eventType: string, metadata: Record<string, unknown> = {}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("subscription_events").insert({
    user_id: userId,
    plan_id: planId,
    event_type: eventType,
    metadata
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function refreshSubscriptionStateDirect(userId: string) {
  const supabase = createSupabaseAdminClient();
  await ensureBillingRows(userId);

  const [{ data: subscription, error: subscriptionError }, { data: usage, error: usageError }] =
    await Promise.all([
      supabase
        .from("user_subscriptions")
        .select(
          "user_id, plan_id, status, period_start, period_end, cancel_at_period_end, auto_renew, provider"
        )
        .eq("user_id", userId)
        .single(),
      supabase
        .from("usage_counters")
        .select("user_id, free_worksheets_used_lifetime, period_worksheets_used, period_anchor")
        .eq("user_id", userId)
        .single()
    ]);

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  if (usageError) {
    throw new Error(usageError.message);
  }

  const currentSubscription = subscription as UserSubscription;
  const currentUsage = usage as UsageCounter;

  if (
    currentSubscription.plan_id === "free" ||
    !currentSubscription.period_end ||
    new Date(currentSubscription.period_end).getTime() > Date.now()
  ) {
    return { subscription: currentSubscription, usage: currentUsage };
  }

  const { data: plan, error: planError } = await supabase
    .from("billing_plans")
    .select(
      "id, name, interval, price_bdt, duration_days, worksheets_per_period, lifetime_worksheet_limit, active"
    )
    .eq("id", currentSubscription.plan_id)
    .single();

  if (planError || !plan || !plan.active) {
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        plan_id: "free",
        status: "expired",
        period_start: null,
        period_end: null,
        cancel_at_period_end: false,
        auto_renew: false,
        provider: "internal"
      })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    await logSubscriptionEvent(userId, "free", "downgraded_invalid_plan");

    return {
      subscription: {
        ...currentSubscription,
        plan_id: "free",
        status: "expired",
        period_start: null,
        period_end: null,
        cancel_at_period_end: false,
        auto_renew: false,
        provider: "internal"
      },
      usage: currentUsage
    };
  }

  if (
    currentSubscription.auto_renew &&
    !currentSubscription.cancel_at_period_end &&
    currentSubscription.provider === "dummy"
  ) {
    const renewalStart = new Date(currentSubscription.period_end);
    const renewalEnd = new Date(renewalStart);
    renewalEnd.setUTCDate(renewalEnd.getUTCDate() + plan.duration_days);
    const renewalOrderId = buildOrderId("DUMMYRENEW");

    const paymentResult = await supabase.from("payment_transactions").insert({
      user_id: userId,
      plan_id: plan.id,
      order_id: renewalOrderId,
      provider: "dummy",
      provider_txn_id: renewalOrderId,
      amount_bdt: plan.price_bdt,
      currency: "BDT",
      status: "paid",
      paid_at: new Date().toISOString(),
      raw_payload: { kind: "dummy_renewal" }
    });

    if (paymentResult.error) {
      throw new Error(paymentResult.error.message);
    }

    const updateSubResult = await supabase
      .from("user_subscriptions")
      .update({
        status: "active",
        period_start: renewalStart.toISOString(),
        period_end: renewalEnd.toISOString()
      })
      .eq("user_id", userId);

    if (updateSubResult.error) {
      throw new Error(updateSubResult.error.message);
    }

    const updateUsageResult = await supabase
      .from("usage_counters")
      .update({
        period_anchor: renewalStart.toISOString(),
        period_worksheets_used: 0
      })
      .eq("user_id", userId);

    if (updateUsageResult.error) {
      throw new Error(updateUsageResult.error.message);
    }

    await logSubscriptionEvent(userId, plan.id as BillingPlanId, "renewed", {
      provider: "dummy",
      orderId: renewalOrderId
    });

    return {
      subscription: {
        ...currentSubscription,
        status: "active",
        period_start: renewalStart.toISOString(),
        period_end: renewalEnd.toISOString()
      },
      usage: {
        ...currentUsage,
        period_anchor: renewalStart.toISOString(),
        period_worksheets_used: 0
      }
    };
  }

  const downgradeResult = await supabase
    .from("user_subscriptions")
    .update({
      plan_id: "free",
      status: currentSubscription.cancel_at_period_end ? "canceled" : "expired",
      period_start: null,
      period_end: null,
      cancel_at_period_end: false,
      auto_renew: false,
      provider: "internal"
    })
    .eq("user_id", userId);

  if (downgradeResult.error) {
    throw new Error(downgradeResult.error.message);
  }

  await logSubscriptionEvent(
    userId,
    "free",
    currentSubscription.cancel_at_period_end
      ? "downgraded_after_cancel"
      : "downgraded_after_expiry"
  );

  return {
    subscription: {
      ...currentSubscription,
      plan_id: "free",
      status: currentSubscription.cancel_at_period_end ? "canceled" : "expired",
      period_start: null,
      period_end: null,
      cancel_at_period_end: false,
      auto_renew: false,
      provider: "internal"
    },
    usage: currentUsage
  };
}

export const listActivePlans = unstable_cache(
  async (): Promise<BillingPlan[]> => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("billing_plans")
      .select(
        "id, name, interval, price_bdt, duration_days, worksheets_per_period, lifetime_worksheet_limit, active"
      )
      .eq("active", true)
      .order("price_bdt", { ascending: true });

    if (error) {
      if (isBillingSchemaUnavailable(error.message)) {
        return FALLBACK_PLANS;
      }
      throw new Error(error.message);
    }

    return ((data ?? []) as BillingPlan[]).length > 0 ? ((data ?? []) as BillingPlan[]) : FALLBACK_PLANS;
  },
  ["billing-plans"],
  { revalidate: 3600, tags: ["billing-plans"] }
);

export async function getCurrentSubscription(userId: string) {
  try {
    return await refreshSubscriptionStateDirect(userId);
  } catch (error) {
    if (
      error instanceof Error &&
      isBillingSchemaUnavailable(error.message)
    ) {
      return {
        subscription: { ...FALLBACK_SUBSCRIPTION, user_id: userId },
        usage: { ...FALLBACK_USAGE, user_id: userId }
      };
    }

    throw error;
  }
}

export async function activateDummySubscription(
  userId: string,
  planId: Exclude<BillingPlanId, "free">
) {
  const supabase = createSupabaseAdminClient();

  await ensureBillingRows(userId);
  const current = await refreshSubscriptionStateDirect(userId);
  const { data: plan, error: planError } = await supabase
    .from("billing_plans")
    .select(
      "id, name, interval, price_bdt, duration_days, worksheets_per_period, lifetime_worksheet_limit, active"
    )
    .eq("id", planId)
    .eq("active", true)
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message ?? "Selected plan is not available.");
  }

  const now = new Date();
  const currentPeriodEnd = current.subscription.period_end
    ? new Date(current.subscription.period_end)
    : null;
  const shouldExtend =
    current.subscription.plan_id === planId &&
    currentPeriodEnd !== null &&
    currentPeriodEnd.getTime() > now.getTime() &&
    !current.subscription.cancel_at_period_end;

  const periodStart = shouldExtend
    ? current.subscription.period_start ?? now.toISOString()
    : now.toISOString();
  const periodEndDate = shouldExtend ? new Date(currentPeriodEnd as Date) : new Date(now);
  periodEndDate.setUTCDate(periodEndDate.getUTCDate() + plan.duration_days);

  const orderId = buildOrderId("DUMMY");
  const paymentResult = await supabase.from("payment_transactions").insert({
    user_id: userId,
    plan_id: plan.id,
    order_id: orderId,
    provider: "dummy",
    provider_txn_id: orderId,
    amount_bdt: plan.price_bdt,
    currency: "BDT",
    status: "paid",
    paid_at: now.toISOString(),
    raw_payload: { kind: "dummy_purchase" }
  });

  if (paymentResult.error) {
    throw new Error(paymentResult.error.message);
  }

  const updateSubscriptionResult = await supabase
    .from("user_subscriptions")
    .update({
      plan_id: plan.id,
      status: "active",
      period_start: periodStart,
      period_end: periodEndDate.toISOString(),
      cancel_at_period_end: false,
      auto_renew: true,
      provider: "dummy"
    })
    .eq("user_id", userId);

  if (updateSubscriptionResult.error) {
    throw new Error(updateSubscriptionResult.error.message);
  }

  const updateUsageResult = await supabase
    .from("usage_counters")
    .update({
      period_anchor: periodStart,
      period_worksheets_used: 0
    })
    .eq("user_id", userId);

  if (updateUsageResult.error) {
    throw new Error(updateUsageResult.error.message);
  }

  await logSubscriptionEvent(userId, plan.id as BillingPlanId, "activated", {
    provider: "dummy",
    orderId
  });

  return {
    ok: true,
    plan: plan.id,
    period_start: periodStart,
    period_end: periodEndDate.toISOString()
  };
}

export async function cancelCurrentSubscription(userId: string) {
  const supabase = createSupabaseAdminClient();

  await ensureBillingRows(userId);
  const current = await refreshSubscriptionStateDirect(userId);

  if (current.subscription.plan_id === "free") {
    throw new Error("No paid subscription to cancel.");
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      cancel_at_period_end: true,
      auto_renew: false
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await logSubscriptionEvent(
    userId,
    current.subscription.plan_id as BillingPlanId,
    "cancel_scheduled"
  );

  return {
    ok: true,
    period_end: current.subscription.period_end
  };
}

export async function consumeWorksheetCredit(userId: string) {
  const supabase = createSupabaseAdminClient();
  const current = await refreshSubscriptionStateDirect(userId);
  const { data: plan, error: planError } = await supabase
    .from("billing_plans")
    .select(
      "id, name, interval, price_bdt, duration_days, worksheets_per_period, lifetime_worksheet_limit, active"
    )
    .eq("id", current.subscription.plan_id)
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message ?? billingSetupError().message);
  }

  if (current.subscription.plan_id === "free") {
    if (current.usage.free_worksheets_used_lifetime >= (plan.lifetime_worksheet_limit ?? 0)) {
      return {
        ok: false,
        code: "FREE_LIMIT_REACHED",
        message: "Free plan lifetime limit reached. Upgrade to continue."
      };
    }

    const { error } = await supabase
      .from("usage_counters")
      .update({
        free_worksheets_used_lifetime: current.usage.free_worksheets_used_lifetime + 1
      })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return {
      ok: true,
      plan: "free",
      remaining: Math.max(
        (plan.lifetime_worksheet_limit ?? 0) -
          (current.usage.free_worksheets_used_lifetime + 1),
        0
      )
    };
  }

  const shouldResetUsage =
    current.usage.period_anchor !== current.subscription.period_start;

  let periodUsed = current.usage.period_worksheets_used;
  if (shouldResetUsage) {
    const resetResult = await supabase
      .from("usage_counters")
      .update({
        period_anchor: current.subscription.period_start,
        period_worksheets_used: 0
      })
      .eq("user_id", userId);

    if (resetResult.error) {
      throw new Error(resetResult.error.message);
    }

    periodUsed = 0;
  }

  if (
    plan.worksheets_per_period !== null &&
    periodUsed >= plan.worksheets_per_period
  ) {
    return {
      ok: false,
      code: "PLAN_LIMIT_REACHED",
      message: "Your worksheet limit is reached for the current billing period."
    };
  }

  const updateResult = await supabase
    .from("usage_counters")
    .update({
      period_anchor: current.subscription.period_start,
      period_worksheets_used: periodUsed + 1
    })
    .eq("user_id", userId);

  if (updateResult.error) {
    throw new Error(updateResult.error.message);
  }

  return {
    ok: true,
    plan: current.subscription.plan_id,
    remaining:
      plan.worksheets_per_period === null
        ? null
        : Math.max(plan.worksheets_per_period - (periodUsed + 1), 0)
  };
}

export async function refundWorksheetCredit(userId: string) {
  const supabase = createSupabaseAdminClient();
  const current = await getCurrentSubscription(userId);

  if (current.subscription.plan_id === "free") {
    const { error } = await supabase
      .from("usage_counters")
      .update({
        free_worksheets_used_lifetime: Math.max(
          current.usage.free_worksheets_used_lifetime - 1,
          0
        )
      })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase
    .from("usage_counters")
    .update({
      period_worksheets_used: Math.max(current.usage.period_worksheets_used - 1, 0)
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
