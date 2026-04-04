begin;

create table if not exists public.manual_payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.billing_plans(id),
  payment_method text not null default 'bkash_manual',
  amount_bdt integer not null check (amount_bdt >= 0),
  payer_number text not null,
  transaction_id text not null unique,
  notes text,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  admin_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manual_payment_requests_user_id_idx
  on public.manual_payment_requests(user_id);

create index if not exists manual_payment_requests_status_idx
  on public.manual_payment_requests(status);

create index if not exists manual_payment_requests_plan_id_idx
  on public.manual_payment_requests(plan_id);

alter table public.manual_payment_requests enable row level security;

drop policy if exists "Users can view own manual payment requests" on public.manual_payment_requests;
create policy "Users can view own manual payment requests"
on public.manual_payment_requests
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own manual payment requests" on public.manual_payment_requests;
create policy "Users can insert own manual payment requests"
on public.manual_payment_requests
for insert
with check (
  auth.uid() = user_id
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

commit;
