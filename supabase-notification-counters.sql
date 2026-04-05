create table if not exists public.user_notification_counters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unread_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_notification_counters enable row level security;

drop policy if exists "Users can view own notification counters" on public.user_notification_counters;
create policy "Users can view own notification counters"
on public.user_notification_counters
for select
using (auth.uid() = user_id);

create or replace function public.refresh_user_notification_counter(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unread_count integer;
begin
  select count(*)::integer
    into v_unread_count
    from public.user_notifications
   where user_id = target_user_id
     and read_at is null;

  insert into public.user_notification_counters (user_id, unread_count, updated_at)
  values (target_user_id, coalesce(v_unread_count, 0), now())
  on conflict (user_id) do update
    set unread_count = excluded.unread_count,
        updated_at = now();
end;
$$;

create or replace function public.sync_user_notification_counter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_user_notification_counter(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_user_notifications_refresh_counter on public.user_notifications;
create trigger on_user_notifications_refresh_counter
after insert or update or delete on public.user_notifications
for each row execute function public.sync_user_notification_counter();

insert into public.user_notification_counters (user_id, unread_count, updated_at)
select
  user_id,
  count(*) filter (where read_at is null)::integer as unread_count,
  now() as updated_at
from public.user_notifications
group by user_id
on conflict (user_id) do update
  set unread_count = excluded.unread_count,
      updated_at = now();
