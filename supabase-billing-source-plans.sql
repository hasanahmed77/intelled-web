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
  ('static_monthly', 'Essential', 'monthly', 149, 30, null, null, null, 120, 0, null, true),
  ('hybrid_monthly', 'Plus', 'monthly', 299, 30, null, null, null, 120, 30, null, true),
  ('hybrid_yearly', 'Pro', 'yearly', 3999, 365, null, null, null, 1800, 480, null, true)
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
where id in ('weekly', 'monthly', 'yearly');

update public.user_subscriptions
set
  plan_id = case
    when plan_id in ('weekly', 'monthly') then 'hybrid_monthly'
    when plan_id = 'yearly' then 'hybrid_yearly'
    else plan_id
  end,
  updated_at = now()
where plan_id in ('weekly', 'monthly', 'yearly');

update public.payment_transactions
set plan_id = case
  when plan_id in ('weekly', 'monthly') then 'hybrid_monthly'
  when plan_id = 'yearly' then 'hybrid_yearly'
  else plan_id
end
where plan_id in ('weekly', 'monthly', 'yearly');

update public.subscription_events
set plan_id = case
  when plan_id in ('weekly', 'monthly') then 'hybrid_monthly'
  when plan_id = 'yearly' then 'hybrid_yearly'
  else plan_id
end
where plan_id in ('weekly', 'monthly', 'yearly');

commit;
