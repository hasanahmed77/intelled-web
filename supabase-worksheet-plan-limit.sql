-- ============================================================
-- Worksheet Cleanup — Plan-Aware
-- Replaces the hardcoded keep-last-10 trigger with one that
-- reads the user's active subscription plan and keeps exactly
-- that many worksheets (lifetime limit for free, period limit
-- for paid plans).
--
-- Run AFTER supabase-billing.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.keep_worksheets_within_plan_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id        TEXT;
  v_keep_limit     INT;
  v_lifetime_limit INT;
  v_period_limit   INT;
BEGIN
  -- Look up the user's current plan
  SELECT plan_id
    INTO v_plan_id
    FROM user_subscriptions
   WHERE user_id = NEW.user_id;

  v_plan_id := COALESCE(v_plan_id, 'free');

  -- Look up the plan's limits
  SELECT lifetime_worksheet_limit, worksheets_per_period
    INTO v_lifetime_limit, v_period_limit
    FROM billing_plans
   WHERE id = v_plan_id;

  -- Free plan uses the lifetime cap; paid plans use the period cap
  IF v_plan_id = 'free' THEN
    v_keep_limit := COALESCE(v_lifetime_limit, 2);
  ELSE
    v_keep_limit := COALESCE(v_period_limit, 10);
  END IF;

  -- Delete anything beyond the limit, oldest first
  DELETE FROM public.worksheets
   WHERE id IN (
     SELECT id
       FROM public.worksheets
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC, id DESC
      OFFSET v_keep_limit
   );

  RETURN NEW;

EXCEPTION WHEN others THEN
  -- Billing tables not yet set up — fall back to keeping last 10
  DELETE FROM public.worksheets
   WHERE id IN (
     SELECT id
       FROM public.worksheets
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC, id DESC
      OFFSET 10
   );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the old hardcoded trigger and replace it
DROP TRIGGER IF EXISTS trg_keep_last_10_worksheets ON public.worksheets;
DROP TRIGGER IF EXISTS trg_keep_worksheets_within_plan_limit ON public.worksheets;

CREATE TRIGGER trg_keep_worksheets_within_plan_limit
  AFTER INSERT ON public.worksheets
  FOR EACH ROW
  EXECUTE FUNCTION public.keep_worksheets_within_plan_limit();
