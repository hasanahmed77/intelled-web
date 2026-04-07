create table if not exists public.user_topic_mastery (
  user_id uuid not null references auth.users(id) on delete cascade,
  education_type text not null,
  subject text not null,
  topic_key text not null,
  topic_label text not null,
  total_attempts integer not null default 0,
  easy_attempts integer not null default 0,
  medium_attempts integer not null default 0,
  hard_attempts integer not null default 0,
  easy_90_plus_count integer not null default 0,
  medium_90_plus_count integer not null default 0,
  hard_90_plus_count integer not null default 0,
  hard_100_count integer not null default 0,
  recommended_difficulty text not null default 'easy' check (recommended_difficulty in ('easy', 'medium', 'hard')),
  mastery_level text not null default 'beginner' check (mastery_level in ('beginner', 'avg', 'great', 'master')),
  mastery_rank integer not null default 1 check (mastery_rank between 1 and 4),
  updated_at timestamptz not null default now(),
  primary key (user_id, education_type, subject, topic_key)
);

alter table public.user_topic_mastery
  add column if not exists topic text,
  add column if not exists topic_key text,
  add column if not exists topic_label text,
  add column if not exists total_attempts integer not null default 0,
  add column if not exists easy_attempts integer not null default 0,
  add column if not exists medium_attempts integer not null default 0,
  add column if not exists hard_attempts integer not null default 0,
  add column if not exists easy_90_plus_count integer not null default 0,
  add column if not exists medium_90_plus_count integer not null default 0,
  add column if not exists hard_90_plus_count integer not null default 0,
  add column if not exists hard_100_count integer not null default 0,
  add column if not exists recommended_difficulty text not null default 'easy',
  add column if not exists mastery_level text not null default 'beginner',
  add column if not exists mastery_rank integer not null default 1,
  add column if not exists updated_at timestamptz not null default now();

update public.user_topic_mastery
set
  topic_label = coalesce(topic_label, topic, replace(initcap(replace(topic_key, '_', ' ')), ' And ', ' and ')),
  topic_key = coalesce(topic_key, public.slugify_topic_label(coalesce(topic_label, topic, 'topic'))),
  topic = coalesce(topic, topic_label, replace(initcap(replace(topic_key, '_', ' ')), ' And ', ' and '))
where topic_key is null or topic_label is null or topic_label = '' or topic is null or topic = '';

update public.user_topic_mastery utm
set
  topic_key = coalesce(
    (
      select w.topic_key
      from public.worksheets w
      where w.user_id = utm.user_id
        and w.education_type = utm.education_type
        and w.subject = utm.subject
        and w.source = 'static'
      order by w.created_at desc
      limit 1
    ),
    public.slugify_topic_label(coalesce(utm.topic_label, 'topic'))
  )
where utm.topic_key is null or utm.topic_key = '';

alter table public.user_topic_mastery
  alter column topic set not null,
  alter column topic_key set not null,
  alter column topic_label set not null;

create unique index if not exists user_topic_mastery_topic_key_idx
  on public.user_topic_mastery (user_id, education_type, subject, topic_key);

create index if not exists user_topic_mastery_user_subject_idx
  on public.user_topic_mastery (user_id, education_type, subject, mastery_rank desc, topic_label);

alter table public.user_topic_mastery enable row level security;

drop policy if exists "User topic mastery is viewable by owners" on public.user_topic_mastery;
create policy "User topic mastery is viewable by owners"
on public.user_topic_mastery
for select
using (auth.uid() = user_id);

create or replace function public.refresh_user_topic_mastery(
  target_user_id uuid,
  target_education_type text,
  target_subject text,
  target_topic_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_topic_label text;
  v_total_attempts integer;
  v_easy_attempts integer;
  v_medium_attempts integer;
  v_hard_attempts integer;
  v_easy_90_plus_count integer;
  v_medium_90_plus_count integer;
  v_hard_90_plus_count integer;
  v_hard_100_count integer;
  v_recent_easy_min integer;
  v_recent_medium_min integer;
  v_recent_hard_avg numeric;
  v_recent_medium_avg numeric;
  v_recommended_difficulty text;
  v_mastery_level text;
  v_mastery_rank integer;
begin
  select ct.display_label
    into v_topic_label
  from public.curriculum_topics ct
  where ct.education_type = target_education_type
    and ct.subject = target_subject
    and ct.topic_key = target_topic_key
  order by ct.sort_order asc, ct.display_label asc
  limit 1;

  if v_topic_label is null then
    v_topic_label := replace(initcap(replace(target_topic_key, '_', ' ')), ' And ', ' and ');
  end if;

  select
    count(*)::integer,
    count(*) filter (where difficulty_used = 'easy')::integer,
    count(*) filter (where difficulty_used = 'medium')::integer,
    count(*) filter (where difficulty_used = 'hard')::integer,
    count(*) filter (where difficulty_used = 'easy' and score >= 90)::integer,
    count(*) filter (where difficulty_used = 'medium' and score >= 90)::integer,
    count(*) filter (where difficulty_used = 'hard' and score >= 90)::integer,
    count(*) filter (where difficulty_used = 'hard' and score = 100)::integer
  into
    v_total_attempts,
    v_easy_attempts,
    v_medium_attempts,
    v_hard_attempts,
    v_easy_90_plus_count,
    v_medium_90_plus_count,
    v_hard_90_plus_count,
    v_hard_100_count
  from public.worksheet_attempts a
  join public.worksheets w on w.id = a.worksheet_id
  where a.user_id = target_user_id
    and w.source = 'static'
    and w.education_type = target_education_type
    and w.subject = target_subject
    and w.topic_key = target_topic_key;

  if coalesce(v_total_attempts, 0) = 0 then
    delete from public.user_topic_mastery
    where user_id = target_user_id
      and education_type = target_education_type
      and subject = target_subject
      and topic_key = target_topic_key;
    return;
  end if;

  with ranked_easy as (
    select a.score, row_number() over (order by a.created_at desc, a.id desc) as rn
    from public.worksheet_attempts a
    join public.worksheets w on w.id = a.worksheet_id
    where a.user_id = target_user_id
      and w.source = 'static'
      and w.education_type = target_education_type
      and w.subject = target_subject
      and w.topic_key = target_topic_key
      and a.difficulty_used = 'easy'
  )
  select min(score) into v_recent_easy_min
  from ranked_easy
  where rn <= 3;

  with ranked_medium as (
    select a.score, row_number() over (order by a.created_at desc, a.id desc) as rn
    from public.worksheet_attempts a
    join public.worksheets w on w.id = a.worksheet_id
    where a.user_id = target_user_id
      and w.source = 'static'
      and w.education_type = target_education_type
      and w.subject = target_subject
      and w.topic_key = target_topic_key
      and a.difficulty_used = 'medium'
  )
  select min(score), avg(score)::numeric into v_recent_medium_min, v_recent_medium_avg
  from ranked_medium
  where rn <= 3;

  with ranked_hard as (
    select a.score, row_number() over (order by a.created_at desc, a.id desc) as rn
    from public.worksheet_attempts a
    join public.worksheets w on w.id = a.worksheet_id
    where a.user_id = target_user_id
      and w.source = 'static'
      and w.education_type = target_education_type
      and w.subject = target_subject
      and w.topic_key = target_topic_key
      and a.difficulty_used = 'hard'
  )
  select avg(score)::numeric into v_recent_hard_avg
  from ranked_hard
  where rn <= 3;

  v_recommended_difficulty := 'easy';
  if coalesce(v_easy_attempts, 0) >= 3 and coalesce(v_recent_easy_min, 0) >= 70 then
    v_recommended_difficulty := 'medium';
  end if;
  if coalesce(v_medium_attempts, 0) >= 3 and coalesce(v_recent_medium_min, 0) >= 80 then
    v_recommended_difficulty := 'hard';
  end if;

  if coalesce(v_hard_attempts, 0) >= 3 and coalesce(v_recent_hard_avg, 0) < 70 then
    v_recommended_difficulty := 'medium';
  elsif coalesce(v_medium_attempts, 0) >= 3 and coalesce(v_recent_medium_avg, 0) < 65 then
    v_recommended_difficulty := 'easy';
  end if;

  v_mastery_level := 'beginner';
  v_mastery_rank := 1;

  if coalesce(v_hard_100_count, 0) >= 5 then
    v_mastery_level := 'master';
    v_mastery_rank := 4;
  elsif coalesce(v_hard_90_plus_count, 0) >= 3 then
    v_mastery_level := 'great';
    v_mastery_rank := 3;
  elsif coalesce(v_medium_90_plus_count, 0) >= 3 then
    v_mastery_level := 'avg';
    v_mastery_rank := 2;
  end if;

  insert into public.user_topic_mastery (
    user_id,
    education_type,
    subject,
    topic,
    topic_key,
    topic_label,
    total_attempts,
    easy_attempts,
    medium_attempts,
    hard_attempts,
    easy_90_plus_count,
    medium_90_plus_count,
    hard_90_plus_count,
    hard_100_count,
    recommended_difficulty,
    mastery_level,
    mastery_rank,
    updated_at
  )
  values (
    target_user_id,
    target_education_type,
    target_subject,
    v_topic_label,
    target_topic_key,
    v_topic_label,
    v_total_attempts,
    v_easy_attempts,
    v_medium_attempts,
    v_hard_attempts,
    v_easy_90_plus_count,
    v_medium_90_plus_count,
    v_hard_90_plus_count,
    v_hard_100_count,
    v_recommended_difficulty,
    v_mastery_level,
    v_mastery_rank,
    now()
  )
  on conflict (user_id, education_type, subject, topic_key) do update
  set
    topic = excluded.topic,
    topic_label = excluded.topic_label,
    total_attempts = excluded.total_attempts,
    easy_attempts = excluded.easy_attempts,
    medium_attempts = excluded.medium_attempts,
    hard_attempts = excluded.hard_attempts,
    easy_90_plus_count = excluded.easy_90_plus_count,
    medium_90_plus_count = excluded.medium_90_plus_count,
    hard_90_plus_count = excluded.hard_90_plus_count,
    hard_100_count = excluded.hard_100_count,
    recommended_difficulty = excluded.recommended_difficulty,
    mastery_level = excluded.mastery_level,
    mastery_rank = excluded.mastery_rank,
    updated_at = now();
end;
$$;

create or replace function public.sync_user_topic_mastery_from_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_education_type text;
  v_subject text;
  v_topic_key text;
begin
  select education_type, subject, topic_key
    into v_education_type, v_subject, v_topic_key
  from public.worksheets
  where id = new.worksheet_id
    and source = 'static';

  if v_education_type is null or v_subject is null or v_topic_key is null then
    return new;
  end if;

  perform public.refresh_user_topic_mastery(new.user_id, v_education_type, v_subject, v_topic_key);
  return new;
end;
$$;

create or replace function public.sync_user_topic_mastery_from_worksheet_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.source = 'static' and old.education_type is not null and old.subject is not null and old.topic_key is not null then
    perform public.refresh_user_topic_mastery(old.user_id, old.education_type, old.subject, old.topic_key);
  end if;
  return old;
end;
$$;

drop trigger if exists on_attempt_refresh_user_topic_mastery on public.worksheet_attempts;
create trigger on_attempt_refresh_user_topic_mastery
after insert on public.worksheet_attempts
for each row execute function public.sync_user_topic_mastery_from_attempt();

drop trigger if exists on_static_worksheet_delete_refresh_user_topic_mastery on public.worksheets;
create trigger on_static_worksheet_delete_refresh_user_topic_mastery
after delete on public.worksheets
for each row execute function public.sync_user_topic_mastery_from_worksheet_delete();

insert into public.user_topic_mastery (
  user_id,
  education_type,
  subject,
  topic,
  topic_key,
  topic_label,
  total_attempts,
  easy_attempts,
  medium_attempts,
  hard_attempts,
  easy_90_plus_count,
  medium_90_plus_count,
  hard_90_plus_count,
  hard_100_count,
  recommended_difficulty,
  mastery_level,
  mastery_rank,
  updated_at
)
select
  base.user_id,
  base.education_type,
  base.subject,
  base.topic_label,
  base.topic_key,
  base.topic_label,
  base.total_attempts,
  base.easy_attempts,
  base.medium_attempts,
  base.hard_attempts,
  base.easy_90_plus_count,
  base.medium_90_plus_count,
  base.hard_90_plus_count,
  base.hard_100_count,
  case
    when base.hard_attempts >= 3 and coalesce(recent.recent_hard_avg, 0) < 70 then 'medium'
    when base.medium_attempts >= 3 and coalesce(recent.recent_medium_avg, 0) < 65 then 'easy'
    when base.medium_attempts >= 3 and coalesce(recent.recent_medium_min, 0) >= 80 then 'hard'
    when base.easy_attempts >= 3 and coalesce(recent.recent_easy_min, 0) >= 70 then 'medium'
    else 'easy'
  end as recommended_difficulty,
  case
    when base.hard_100_count >= 5 then 'master'
    when base.hard_90_plus_count >= 3 then 'great'
    when base.medium_90_plus_count >= 3 then 'avg'
    else 'beginner'
  end as mastery_level,
  case
    when base.hard_100_count >= 5 then 4
    when base.hard_90_plus_count >= 3 then 3
    when base.medium_90_plus_count >= 3 then 2
    else 1
  end as mastery_rank,
  now()
from (
  select
    a.user_id,
    w.education_type,
    w.subject,
    w.topic_key,
    max(coalesce(ct.display_label, w.topic)) as topic_label,
    count(*)::integer as total_attempts,
    count(*) filter (where a.difficulty_used = 'easy')::integer as easy_attempts,
    count(*) filter (where a.difficulty_used = 'medium')::integer as medium_attempts,
    count(*) filter (where a.difficulty_used = 'hard')::integer as hard_attempts,
    count(*) filter (where a.difficulty_used = 'easy' and a.score >= 90)::integer as easy_90_plus_count,
    count(*) filter (where a.difficulty_used = 'medium' and a.score >= 90)::integer as medium_90_plus_count,
    count(*) filter (where a.difficulty_used = 'hard' and a.score >= 90)::integer as hard_90_plus_count,
    count(*) filter (where a.difficulty_used = 'hard' and a.score = 100)::integer as hard_100_count
  from public.worksheet_attempts a
  join public.worksheets w on w.id = a.worksheet_id
  left join public.curriculum_topics ct
    on ct.education_type = w.education_type
   and ct.subject = w.subject
   and ct.topic_key = w.topic_key
  where w.source = 'static'
    and w.education_type is not null
    and w.subject is not null
    and w.topic_key is not null
  group by a.user_id, w.education_type, w.subject, w.topic_key
) base
left join (
  select
    t.user_id,
    t.education_type,
    t.subject,
    t.topic_key,
    min(case when t.difficulty_used = 'easy' and t.rn <= 3 then t.score end) as recent_easy_min,
    min(case when t.difficulty_used = 'medium' and t.rn <= 3 then t.score end) as recent_medium_min,
    avg(case when t.difficulty_used = 'medium' and t.rn <= 3 then t.score end)::numeric as recent_medium_avg,
    avg(case when t.difficulty_used = 'hard' and t.rn <= 3 then t.score end)::numeric as recent_hard_avg
  from (
    select
      a.user_id,
      w.education_type,
      w.subject,
      w.topic_key,
      a.difficulty_used,
      a.score,
      row_number() over (
        partition by a.user_id, w.education_type, w.subject, w.topic_key, a.difficulty_used
        order by a.created_at desc, a.id desc
      ) as rn
    from public.worksheet_attempts a
    join public.worksheets w on w.id = a.worksheet_id
    where w.source = 'static'
      and w.education_type is not null
      and w.subject is not null
      and w.topic_key is not null
  ) t
  group by t.user_id, t.education_type, t.subject, t.topic_key
) recent
  on recent.user_id = base.user_id
 and recent.education_type = base.education_type
 and recent.subject = base.subject
 and recent.topic_key = base.topic_key
on conflict (user_id, education_type, subject, topic_key) do update
set
  topic = excluded.topic,
  topic_label = excluded.topic_label,
  total_attempts = excluded.total_attempts,
  easy_attempts = excluded.easy_attempts,
  medium_attempts = excluded.medium_attempts,
  hard_attempts = excluded.hard_attempts,
  easy_90_plus_count = excluded.easy_90_plus_count,
  medium_90_plus_count = excluded.medium_90_plus_count,
  hard_90_plus_count = excluded.hard_90_plus_count,
  hard_100_count = excluded.hard_100_count,
  recommended_difficulty = excluded.recommended_difficulty,
  mastery_level = excluded.mastery_level,
  mastery_rank = excluded.mastery_rank,
  updated_at = now();
