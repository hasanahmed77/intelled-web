alter table public.static_question_sets
drop constraint if exists static_question_sets_education_type_subject_topic_language_key;

alter table public.static_question_sets
drop constraint if exists static_question_sets_education_type_subject_topic_language_difficulty_key;

alter table public.static_question_sets
drop constraint if exists static_question_sets_variant_unique;

alter table public.static_question_sets
add column if not exists variant_index integer not null default 1
  check (variant_index >= 1);

alter table public.static_question_sets
add constraint static_question_sets_variant_unique
unique (education_type, subject, topic, language, difficulty, variant_index);

create index if not exists static_question_sets_lookup_idx
  on public.static_question_sets(education_type, subject, topic, difficulty, language, active, variant_index);

create table if not exists public.user_static_topic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  education_type text not null,
  subject text not null,
  topic text not null,
  language text not null check (language in ('english', 'bengali')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  next_variant_index integer not null default 1 check (next_variant_index >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, education_type, subject, topic, language, difficulty)
);

alter table public.user_static_topic_progress enable row level security;

drop policy if exists "Static topic progress is viewable by owners" on public.user_static_topic_progress;
create policy "Static topic progress is viewable by owners"
on public.user_static_topic_progress
for select
using (auth.uid() = user_id);

drop policy if exists "Static topic progress is insertable by owners" on public.user_static_topic_progress;
create policy "Static topic progress is insertable by owners"
on public.user_static_topic_progress
for insert
with check (auth.uid() = user_id);

drop policy if exists "Static topic progress is updatable by owners" on public.user_static_topic_progress;
create policy "Static topic progress is updatable by owners"
on public.user_static_topic_progress
for update
using (auth.uid() = user_id);
