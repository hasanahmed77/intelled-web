create table if not exists public.user_learning_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attempt_count integer not null default 0,
  avg_score numeric(5,1) not null default 0,
  best_score integer not null default 0,
  last_attempt_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists user_learning_stats_last_attempt_idx
  on public.user_learning_stats (last_attempt_at desc);

alter table public.user_learning_stats enable row level security;

drop policy if exists "User learning stats are viewable by owners" on public.user_learning_stats;
create policy "User learning stats are viewable by owners" on public.user_learning_stats
  for select using (auth.uid() = user_id);

create or replace function public.refresh_user_learning_stats(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_count integer;
  v_avg_score numeric(5,1);
  v_best_score integer;
  v_last_attempt_at timestamptz;
begin
  select
    count(*)::integer,
    coalesce(round(avg(score)::numeric, 1), 0),
    coalesce(max(score), 0),
    max(created_at)
  into
    v_attempt_count,
    v_avg_score,
    v_best_score,
    v_last_attempt_at
  from public.worksheet_attempts
  where user_id = target_user_id;

  insert into public.user_learning_stats (
    user_id,
    attempt_count,
    avg_score,
    best_score,
    last_attempt_at,
    updated_at
  )
  values (
    target_user_id,
    coalesce(v_attempt_count, 0),
    coalesce(v_avg_score, 0),
    coalesce(v_best_score, 0),
    v_last_attempt_at,
    now()
  )
  on conflict (user_id) do update
    set attempt_count = excluded.attempt_count,
        avg_score = excluded.avg_score,
        best_score = excluded.best_score,
        last_attempt_at = excluded.last_attempt_at,
        updated_at = now();
end;
$$;

create or replace function public.sync_user_learning_stats_from_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_user_learning_stats(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_attempt_refresh_user_learning_stats on public.worksheet_attempts;
create trigger on_attempt_refresh_user_learning_stats
after insert or delete on public.worksheet_attempts
for each row execute function public.sync_user_learning_stats_from_attempt();

insert into public.user_learning_stats (
  user_id,
  attempt_count,
  avg_score,
  best_score,
  last_attempt_at,
  updated_at
)
select
  a.user_id,
  count(*)::integer as attempt_count,
  coalesce(round(avg(a.score)::numeric, 1), 0) as avg_score,
  coalesce(max(a.score), 0) as best_score,
  max(a.created_at) as last_attempt_at,
  now() as updated_at
from public.worksheet_attempts a
group by a.user_id
on conflict (user_id) do update
  set attempt_count = excluded.attempt_count,
      avg_score = excluded.avg_score,
      best_score = excluded.best_score,
      last_attempt_at = excluded.last_attempt_at,
      updated_at = now();
