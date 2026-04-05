create table if not exists public.leaderboard_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  attempt_count integer not null default 0,
  avg_score numeric(5,1) not null default 0,
  current_streak integer not null default 0,
  level integer not null default 1,
  last_attempt_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_stats_rank_idx
  on public.leaderboard_stats (attempt_count desc, avg_score desc, last_attempt_at asc);

alter table public.leaderboard_stats enable row level security;

drop policy if exists "Leaderboard stats are publicly viewable" on public.leaderboard_stats;
create policy "Leaderboard stats are publicly viewable" on public.leaderboard_stats
  for select using (true);

create or replace function public.refresh_leaderboard_stats_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_display_name text;
  v_attempt_count integer;
  v_avg_score numeric(5,1);
  v_current_streak integer;
  v_level integer;
  v_last_attempt_at timestamptz;
begin
  select
    coalesce(nullif(trim(p.full_name), ''), split_part(u.email, '@', 1)),
    p.current_streak,
    p.level
  into
    v_display_name,
    v_current_streak,
    v_level
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = target_user_id;

  if v_display_name is null then
    delete from public.leaderboard_stats where user_id = target_user_id;
    return;
  end if;

  select
    count(*)::integer,
    coalesce(round(avg(score)::numeric, 1), 0),
    max(created_at)
  into
    v_attempt_count,
    v_avg_score,
    v_last_attempt_at
  from public.worksheet_attempts
  where user_id = target_user_id;

  if coalesce(v_attempt_count, 0) <= 0 then
    delete from public.leaderboard_stats where user_id = target_user_id;
    return;
  end if;

  insert into public.leaderboard_stats (
    user_id,
    display_name,
    attempt_count,
    avg_score,
    current_streak,
    level,
    last_attempt_at,
    updated_at
  )
  values (
    target_user_id,
    v_display_name,
    v_attempt_count,
    v_avg_score,
    coalesce(v_current_streak, 0),
    coalesce(v_level, 1),
    v_last_attempt_at,
    now()
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        attempt_count = excluded.attempt_count,
        avg_score = excluded.avg_score,
        current_streak = excluded.current_streak,
        level = excluded.level,
        last_attempt_at = excluded.last_attempt_at,
        updated_at = now();
end;
$$;

create or replace function public.sync_leaderboard_stats_from_attempt()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.refresh_leaderboard_stats_for_user(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.sync_leaderboard_stats_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.refresh_leaderboard_stats_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists on_attempt_refresh_leaderboard_stats on public.worksheet_attempts;
create trigger on_attempt_refresh_leaderboard_stats
after insert or delete on public.worksheet_attempts
for each row execute function public.sync_leaderboard_stats_from_attempt();

drop trigger if exists on_profile_refresh_leaderboard_stats on public.profiles;
create trigger on_profile_refresh_leaderboard_stats
after update of full_name, current_streak, level on public.profiles
for each row execute function public.sync_leaderboard_stats_from_profile();

do $$
declare
  user_record record;
begin
  for user_record in
    select distinct user_id
    from public.worksheet_attempts
  loop
    perform public.refresh_leaderboard_stats_for_user(user_record.user_id);
  end loop;
end $$;
