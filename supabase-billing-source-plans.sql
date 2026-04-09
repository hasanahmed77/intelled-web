begin;

alter table public.billing_plans
  add column if not exists free_static_problem_sets_lifetime_limit integer
    check (free_static_problem_sets_lifetime_limit is null or free_static_problem_sets_lifetime_limit >= 0),
  add column if not exists free_ai_problem_sets_lifetime_limit integer
    check (free_ai_problem_sets_lifetime_limit is null or free_ai_problem_sets_lifetime_limit >= 0),
  add column if not exists static_problem_sets_per_period integer
    check (static_problem_sets_per_period is null or static_problem_sets_per_period >= 0),
  add column if not exists ai_problem_sets_per_period integer
    check (ai_problem_sets_per_period is null or ai_problem_sets_per_period >= 0);

alter table public.usage_counters
  add column if not exists free_static_problem_sets_used_lifetime integer not null default 0
    check (free_static_problem_sets_used_lifetime >= 0),
  add column if not exists free_ai_problem_sets_used_lifetime integer not null default 0
    check (free_ai_problem_sets_used_lifetime >= 0),
  add column if not exists period_static_problem_sets_used integer not null default 0
    check (period_static_problem_sets_used >= 0),
  add column if not exists period_ai_problem_sets_used integer not null default 0
    check (period_ai_problem_sets_used >= 0);

update public.billing_plans
set
  lifetime_worksheet_limit = 7,
  free_static_problem_sets_lifetime_limit = 5,
  free_ai_problem_sets_lifetime_limit = 2
where id = 'free';

insert into public.billing_plans (
  id,
  name,
  interval,
  price_bdt,
  duration_days,
  worksheets_per_period,
  free_static_problem_sets_lifetime_limit,
  free_ai_problem_sets_lifetime_limit,
  static_problem_sets_per_period,
  ai_problem_sets_per_period,
  lifetime_worksheet_limit,
  active
)
values
  ('curated_essential', 'Essential', 'monthly', 149, 30, null, null, null, 80, 0, null, true),
  ('curated_focus', 'Focus', 'monthly', 249, 30, null, null, null, 200, 0, null, true),
  ('curated_scholar', 'Scholar', 'monthly', 449, 30, null, null, null, 360, 0, null, true),
  ('ai_spark', 'AI Spark', 'monthly', 149, 30, null, null, null, 0, 20, null, true),
  ('ai_flow', 'AI Flow', 'monthly', 299, 30, null, null, null, 0, 45, null, true),
  ('ai_master', 'AI Master', 'monthly', 499, 30, null, null, null, 0, 90, null, true),
  ('hybrid_plus', 'Plus', 'monthly', 249, 30, null, null, null, 90, 15, null, true),
  ('hybrid_pro', 'Pro', 'monthly', 399, 30, null, null, null, 220, 40, null, true),
  ('hybrid_elite', 'Elite', 'monthly', 699, 30, null, null, null, 420, 75, null, true)
on conflict (id) do update
set
  name = excluded.name,
  interval = excluded.interval,
  price_bdt = excluded.price_bdt,
  duration_days = excluded.duration_days,
  worksheets_per_period = excluded.worksheets_per_period,
  free_static_problem_sets_lifetime_limit = excluded.free_static_problem_sets_lifetime_limit,
  free_ai_problem_sets_lifetime_limit = excluded.free_ai_problem_sets_lifetime_limit,
  static_problem_sets_per_period = excluded.static_problem_sets_per_period,
  ai_problem_sets_per_period = excluded.ai_problem_sets_per_period,
  lifetime_worksheet_limit = excluded.lifetime_worksheet_limit,
  active = excluded.active,
  updated_at = now();

update public.billing_plans
set active = false
where id in ('weekly', 'monthly', 'yearly', 'static_monthly', 'hybrid_monthly', 'hybrid_yearly');

update public.user_subscriptions
set
  plan_id = case
    when plan_id = 'static_monthly' then 'curated_essential'
    when plan_id in ('weekly', 'monthly', 'hybrid_monthly') then 'hybrid_pro'
    when plan_id in ('yearly', 'hybrid_yearly') then 'hybrid_elite'
    else plan_id
  end,
  updated_at = now()
where plan_id in ('weekly', 'monthly', 'yearly', 'static_monthly', 'hybrid_monthly', 'hybrid_yearly');

update public.payment_transactions
set plan_id = case
  when plan_id = 'static_monthly' then 'curated_essential'
  when plan_id in ('weekly', 'monthly', 'hybrid_monthly') then 'hybrid_pro'
  when plan_id in ('yearly', 'hybrid_yearly') then 'hybrid_elite'
  else plan_id
end
where plan_id in ('weekly', 'monthly', 'yearly', 'static_monthly', 'hybrid_monthly', 'hybrid_yearly');

update public.subscription_events
set plan_id = case
  when plan_id = 'static_monthly' then 'curated_essential'
  when plan_id in ('weekly', 'monthly', 'hybrid_monthly') then 'hybrid_pro'
  when plan_id in ('yearly', 'hybrid_yearly') then 'hybrid_elite'
  else plan_id
end
where plan_id in ('weekly', 'monthly', 'yearly', 'static_monthly', 'hybrid_monthly', 'hybrid_yearly');

commit;
