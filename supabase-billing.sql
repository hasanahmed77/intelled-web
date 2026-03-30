begin;

create extension if not exists "pgcrypto";

create table if not exists public.billing_plans (
  id text primary key,
  name text not null,
  interval text not null check (interval in ('free', 'weekly', 'monthly', 'yearly')),
  price_bdt integer not null check (price_bdt >= 0),
  duration_days integer not null check (duration_days >= 0),
  worksheets_per_period integer check (worksheets_per_period is null or worksheets_per_period >= 0),
  lifetime_worksheet_limit integer check (lifetime_worksheet_limit is null or lifetime_worksheet_limit >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null references public.billing_plans(id),
  status text not null check (status in ('active', 'past_due', 'canceled', 'expired')) default 'active',
  period_start timestamptz,
  period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  auto_renew boolean not null default false,
  provider text not null default 'internal',
  provider_customer_ref text,
  provider_subscription_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_subscriptions_plan_id_idx on public.user_subscriptions(plan_id);
create index if not exists user_subscriptions_period_end_idx on public.user_subscriptions(period_end);

create table if not exists public.usage_counters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_worksheets_used_lifetime integer not null default 0 check (free_worksheets_used_lifetime >= 0),
  period_worksheets_used integer not null default 0 check (period_worksheets_used >= 0),
  period_anchor timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.billing_plans(id),
  order_id text not null unique,
  provider text not null,
  provider_txn_id text,
  amount_bdt integer not null check (amount_bdt >= 0),
  currency text not null default 'BDT',
  status text not null check (status in ('pending', 'paid', 'failed', 'canceled', 'refunded')) default 'pending',
  paid_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_transactions_user_id_idx on public.payment_transactions(user_id);
create index if not exists payment_transactions_status_idx on public.payment_transactions(status);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.billing_plans(id),
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists subscription_events_user_id_idx on public.subscription_events(user_id);

insert into public.billing_plans (
  id,
  name,
  interval,
  price_bdt,
  duration_days,
  worksheets_per_period,
  lifetime_worksheet_limit,
  active
)
values
  ('free', 'Free', 'free', 0, 0, null, 3, true),
  ('weekly', 'Weekly', 'weekly', 129, 7, 12, null, true),
  ('monthly', 'Monthly', 'monthly', 349, 30, 50, null, true),
  ('yearly', 'Yearly', 'yearly', 3699, 365, 600, null, true)
on conflict (id) do update
set
  name = excluded.name,
  interval = excluded.interval,
  price_bdt = excluded.price_bdt,
  duration_days = excluded.duration_days,
  worksheets_per_period = excluded.worksheets_per_period,
  lifetime_worksheet_limit = excluded.lifetime_worksheet_limit,
  active = excluded.active,
  updated_at = now();

alter table public.billing_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.usage_counters enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.subscription_events enable row level security;

drop policy if exists "Authenticated users can view billing plans" on public.billing_plans;
create policy "Authenticated users can view billing plans"
on public.billing_plans
for select
using (auth.uid() is not null);

drop policy if exists "Users can view own subscriptions" on public.user_subscriptions;
create policy "Users can view own subscriptions"
on public.user_subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own subscriptions" on public.user_subscriptions;
create policy "Users can insert own subscriptions"
on public.user_subscriptions
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own subscriptions" on public.user_subscriptions;
create policy "Users can update own subscriptions"
on public.user_subscriptions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own usage counters" on public.usage_counters;
create policy "Users can view own usage counters"
on public.usage_counters
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own usage counters" on public.usage_counters;
create policy "Users can insert own usage counters"
on public.usage_counters
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own usage counters" on public.usage_counters;
create policy "Users can update own usage counters"
on public.usage_counters
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own transactions" on public.payment_transactions;
create policy "Users can view own transactions"
on public.payment_transactions
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own transactions" on public.payment_transactions;
create policy "Users can insert own transactions"
on public.payment_transactions
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can view own subscription events" on public.subscription_events;
create policy "Users can view own subscription events"
on public.subscription_events
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own subscription events" on public.subscription_events;
create policy "Users can insert own subscription events"
on public.subscription_events
for insert
with check (auth.uid() = user_id);

create or replace function public.ensure_billing_defaults(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_subscriptions (
    user_id,
    plan_id,
    status,
    auto_renew,
    cancel_at_period_end,
    provider
  )
  values (p_user_id, 'free', 'active', false, false, 'internal')
  on conflict (user_id) do nothing;

  insert into public.usage_counters (
    user_id,
    free_worksheets_used_lifetime,
    period_worksheets_used,
    period_anchor
  )
  values (p_user_id, 0, 0, null)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.log_subscription_event(
  p_user_id uuid,
  p_plan_id text,
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscription_events (user_id, plan_id, event_type, metadata)
  values (p_user_id, p_plan_id, p_event_type, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

create or replace function public.refresh_subscription_state(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sub_row public.user_subscriptions%rowtype;
  plan_row public.billing_plans%rowtype;
  renewal_order_id text;
  renewal_start timestamptz;
  renewal_end timestamptz;
begin
  perform public.ensure_billing_defaults(p_user_id);

  select *
  into sub_row
  from public.user_subscriptions
  where user_id = p_user_id
  for update;

  if sub_row.plan_id = 'free' or sub_row.period_end is null or sub_row.period_end > now() then
    return;
  end if;

  select *
  into plan_row
  from public.billing_plans
  where id = sub_row.plan_id
    and active = true;

  if not found then
    update public.user_subscriptions
    set
      plan_id = 'free',
      status = 'expired',
      period_start = null,
      period_end = null,
      cancel_at_period_end = false,
      auto_renew = false,
      updated_at = now()
    where user_id = p_user_id;

    perform public.log_subscription_event(p_user_id, 'free', 'downgraded_invalid_plan');
    return;
  end if;

  if sub_row.auto_renew = true
     and sub_row.cancel_at_period_end = false
     and sub_row.provider = 'dummy'
  then
    renewal_start := sub_row.period_end;
    renewal_end := renewal_start + make_interval(days => plan_row.duration_days);
    renewal_order_id := 'DUMMY-RENEW-' || replace(gen_random_uuid()::text, '-', '');

    insert into public.payment_transactions (
      user_id,
      plan_id,
      order_id,
      provider,
      provider_txn_id,
      amount_bdt,
      currency,
      status,
      paid_at,
      raw_payload
    )
    values (
      p_user_id,
      plan_row.id,
      renewal_order_id,
      'dummy',
      renewal_order_id,
      plan_row.price_bdt,
      'BDT',
      'paid',
      now(),
      jsonb_build_object('kind', 'dummy_renewal')
    );

    update public.user_subscriptions
    set
      status = 'active',
      period_start = renewal_start,
      period_end = renewal_end,
      updated_at = now()
    where user_id = p_user_id;

    update public.usage_counters
    set
      period_anchor = renewal_start,
      period_worksheets_used = 0,
      updated_at = now()
    where user_id = p_user_id;

    perform public.log_subscription_event(
      p_user_id,
      plan_row.id,
      'renewed',
      jsonb_build_object('provider', 'dummy', 'order_id', renewal_order_id)
    );

    return;
  end if;

  update public.user_subscriptions
  set
    plan_id = 'free',
    status = case when sub_row.cancel_at_period_end then 'canceled' else 'expired' end,
    period_start = null,
    period_end = null,
    cancel_at_period_end = false,
    auto_renew = false,
    provider = 'internal',
    updated_at = now()
  where user_id = p_user_id;

  perform public.log_subscription_event(
    p_user_id,
    'free',
    case when sub_row.cancel_at_period_end then 'downgraded_after_cancel' else 'downgraded_after_expiry' end
  );
end;
$$;

create or replace function public.activate_dummy_subscription(p_plan_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  plan_row public.billing_plans%rowtype;
  sub_row public.user_subscriptions%rowtype;
  period_start_value timestamptz;
  period_end_value timestamptz;
  order_id_value text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_plan_id = 'free' then
    raise exception 'Use the default free plan instead of activating it';
  end if;

  perform public.ensure_billing_defaults(v_user_id);
  perform public.refresh_subscription_state(v_user_id);

  select *
  into plan_row
  from public.billing_plans
  where id = p_plan_id
    and active = true
    and id <> 'free';

  if not found then
    raise exception 'Selected billing plan is not available';
  end if;

  select *
  into sub_row
  from public.user_subscriptions
  where user_id = v_user_id
  for update;

  if sub_row.plan_id = plan_row.id
     and sub_row.period_end is not null
     and sub_row.period_end > now()
     and sub_row.cancel_at_period_end = false
  then
    period_start_value := sub_row.period_start;
    period_end_value := sub_row.period_end + make_interval(days => plan_row.duration_days);
  else
    period_start_value := now();
    period_end_value := now() + make_interval(days => plan_row.duration_days);
  end if;

  order_id_value := 'DUMMY-' || replace(gen_random_uuid()::text, '-', '');

  insert into public.payment_transactions (
    user_id,
    plan_id,
    order_id,
    provider,
    provider_txn_id,
    amount_bdt,
    currency,
    status,
    paid_at,
    raw_payload
  )
  values (
    v_user_id,
    plan_row.id,
    order_id_value,
    'dummy',
    order_id_value,
    plan_row.price_bdt,
    'BDT',
    'paid',
    now(),
    jsonb_build_object('kind', 'dummy_purchase')
  );

  update public.user_subscriptions
  set
    plan_id = plan_row.id,
    status = 'active',
    period_start = period_start_value,
    period_end = period_end_value,
    cancel_at_period_end = false,
    auto_renew = true,
    provider = 'dummy',
    updated_at = now()
  where user_id = v_user_id;

  update public.usage_counters
  set
    period_anchor = period_start_value,
    period_worksheets_used = 0,
    updated_at = now()
  where user_id = v_user_id;

  perform public.log_subscription_event(
    v_user_id,
    plan_row.id,
    'activated',
    jsonb_build_object('provider', 'dummy', 'order_id', order_id_value)
  );

  return jsonb_build_object(
    'ok', true,
    'plan', plan_row.id,
    'period_start', period_start_value,
    'period_end', period_end_value
  );
end;
$$;

create or replace function public.cancel_my_subscription()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  sub_row public.user_subscriptions%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  perform public.ensure_billing_defaults(v_user_id);
  perform public.refresh_subscription_state(v_user_id);

  select *
  into sub_row
  from public.user_subscriptions
  where user_id = v_user_id
  for update;

  if sub_row.plan_id = 'free' then
    return jsonb_build_object('ok', false, 'message', 'No paid subscription to cancel');
  end if;

  update public.user_subscriptions
  set
    cancel_at_period_end = true,
    auto_renew = false,
    updated_at = now()
  where user_id = v_user_id;

  perform public.log_subscription_event(v_user_id, sub_row.plan_id, 'cancel_scheduled');

  return jsonb_build_object('ok', true, 'period_end', sub_row.period_end);
end;
$$;

create or replace function public.consume_worksheet_credit(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sub_row public.user_subscriptions%rowtype;
  plan_row public.billing_plans%rowtype;
  usage_row public.usage_counters%rowtype;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized credit request';
  end if;

  perform public.ensure_billing_defaults(p_user_id);
  perform public.refresh_subscription_state(p_user_id);

  select *
  into sub_row
  from public.user_subscriptions
  where user_id = p_user_id
  for update;

  select *
  into usage_row
  from public.usage_counters
  where user_id = p_user_id
  for update;

  select *
  into plan_row
  from public.billing_plans
  where id = sub_row.plan_id;

  if sub_row.plan_id = 'free' then
    if usage_row.free_worksheets_used_lifetime >= coalesce(plan_row.lifetime_worksheet_limit, 0) then
      return jsonb_build_object(
        'ok', false,
        'code', 'FREE_LIMIT_REACHED',
        'message', 'Free plan lifetime limit reached. Upgrade to continue.'
      );
    end if;

    update public.usage_counters
    set
      free_worksheets_used_lifetime = free_worksheets_used_lifetime + 1,
      updated_at = now()
    where user_id = p_user_id;

    return jsonb_build_object(
      'ok', true,
      'plan', 'free',
      'remaining', greatest(coalesce(plan_row.lifetime_worksheet_limit, 0) - (usage_row.free_worksheets_used_lifetime + 1), 0)
    );
  end if;

  if usage_row.period_anchor is distinct from sub_row.period_start then
    update public.usage_counters
    set
      period_anchor = sub_row.period_start,
      period_worksheets_used = 0,
      updated_at = now()
    where user_id = p_user_id;

    select *
    into usage_row
    from public.usage_counters
    where user_id = p_user_id
    for update;
  end if;

  if plan_row.worksheets_per_period is not null
     and usage_row.period_worksheets_used >= plan_row.worksheets_per_period
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLAN_LIMIT_REACHED',
      'message', 'Your worksheet limit is reached for the current billing period.'
    );
  end if;

  update public.usage_counters
  set
    period_worksheets_used = period_worksheets_used + 1,
    updated_at = now()
  where user_id = p_user_id;

  return jsonb_build_object(
    'ok', true,
    'plan', sub_row.plan_id,
    'remaining',
    case
      when plan_row.worksheets_per_period is null then null
      else greatest(plan_row.worksheets_per_period - (usage_row.period_worksheets_used + 1), 0)
    end
  );
end;
$$;

create or replace function public.refund_worksheet_credit(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sub_row public.user_subscriptions%rowtype;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized credit refund';
  end if;

  perform public.ensure_billing_defaults(p_user_id);
  perform public.refresh_subscription_state(p_user_id);

  select *
  into sub_row
  from public.user_subscriptions
  where user_id = p_user_id
  for update;

  if sub_row.plan_id = 'free' then
    update public.usage_counters
    set
      free_worksheets_used_lifetime = greatest(free_worksheets_used_lifetime - 1, 0),
      updated_at = now()
    where user_id = p_user_id;
  else
    update public.usage_counters
    set
      period_worksheets_used = greatest(period_worksheets_used - 1, 0),
      updated_at = now()
    where user_id = p_user_id;
  end if;
end;
$$;

insert into public.user_subscriptions (
  user_id,
  plan_id,
  status,
  auto_renew,
  cancel_at_period_end,
  provider
)
select u.id, 'free', 'active', false, false, 'internal'
from auth.users u
where not exists (
  select 1
  from public.user_subscriptions s
  where s.user_id = u.id
);

insert into public.usage_counters (
  user_id,
  free_worksheets_used_lifetime,
  period_worksheets_used,
  period_anchor
)
select u.id, 0, 0, null
from auth.users u
where not exists (
  select 1
  from public.usage_counters c
  where c.user_id = u.id
);

create or replace function public.handle_new_user()
returns trigger
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  perform public.ensure_billing_defaults(new.id);
  return new;
end;
$$ language plpgsql security definer;

commit;
