create or replace function public.slugify_topic_label(input text)
returns text
language sql
immutable
as $$
  select trim(both '_' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '_', 'g'));
$$;

alter table public.curriculum_topics
  add column if not exists topic_key text;

update public.curriculum_topics
set topic_key = public.slugify_topic_label(display_label)
where topic_key is null or topic_key = '';

alter table public.curriculum_topics
  alter column topic_key set not null;

create index if not exists curriculum_topics_topic_key_idx
  on public.curriculum_topics (education_type, subject, topic_key, sort_order);

alter table public.static_question_sets
  add column if not exists topic_key text;

update public.static_question_sets s
set topic_key = coalesce(
  (
    select ct.topic_key
    from public.curriculum_topics ct
    where ct.education_type = s.education_type
      and ct.subject = s.subject
      and public.slugify_topic_label(ct.display_label) = public.slugify_topic_label(s.topic)
    order by ct.sort_order asc
    limit 1
  ),
  public.slugify_topic_label(s.topic)
)
where s.topic_key is null or s.topic_key = '';

alter table public.static_question_sets
  alter column topic_key set not null;

create index if not exists static_question_sets_topic_key_lookup_idx
  on public.static_question_sets (education_type, subject, topic_key, difficulty, language, active, variant_index);

alter table public.worksheets
  add column if not exists topic_key text;

update public.worksheets w
set topic_key = coalesce(
  (
    select s.topic_key
    from public.static_question_sets s
    where s.education_type = w.education_type
      and s.subject = w.subject
      and s.topic = w.topic
    order by s.variant_index asc
    limit 1
  ),
  case when w.topic is not null then public.slugify_topic_label(w.topic) else null end
)
where w.source = 'static'
  and (w.topic_key is null or w.topic_key = '');

alter table public.user_static_topic_progress
  add column if not exists topic_key text;

update public.user_static_topic_progress p
set topic_key = coalesce(
  (
    select ct.topic_key
    from public.curriculum_topics ct
    where ct.education_type = p.education_type
      and ct.subject = p.subject
      and public.slugify_topic_label(ct.display_label) = public.slugify_topic_label(p.topic)
    order by ct.sort_order asc
    limit 1
  ),
  public.slugify_topic_label(p.topic)
)
where p.topic_key is null or p.topic_key = '';

create unique index if not exists user_static_topic_progress_topic_key_idx
  on public.user_static_topic_progress (user_id, education_type, subject, topic_key, language, difficulty);
