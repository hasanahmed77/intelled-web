-- Enable UUIDs
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Worksheets
create table if not exists worksheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  topic text not null,
  education_type text,
  subject text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  language text not null default 'english' check (language in ('english', 'bengali')),
  source text not null default 'ai' check (source in ('ai', 'static')),
  questions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists static_question_sets (
  id uuid primary key default gen_random_uuid(),
  education_type text not null,
  subject text not null,
  topic text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  language text not null default 'english' check (language in ('english', 'bengali')),
  variant_index integer not null default 1 check (variant_index >= 1),
  questions jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (education_type, subject, topic, language, difficulty, variant_index)
);

create table if not exists worksheet_answer_keys (
  worksheet_id uuid primary key references worksheets(id) on delete cascade,
  source_set_id uuid references static_question_sets(id) on delete set null,
  questions jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists user_static_topic_progress (
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

-- Attempts
create table if not exists worksheet_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  worksheet_id uuid not null references worksheets(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  difficulty_used text not null check (difficulty_used in ('easy', 'medium', 'hard')),
  answers jsonb not null,
  created_at timestamptz not null default now()
);
create unique index if not exists worksheet_attempts_worksheet_id_unique_idx
  on worksheet_attempts(worksheet_id);

-- Basic indexes
create index if not exists worksheets_user_id_idx on worksheets(user_id);
create index if not exists worksheet_attempts_user_id_idx on worksheet_attempts(user_id);
create index if not exists static_question_sets_lookup_idx
  on static_question_sets(education_type, subject, topic, difficulty, language, active, variant_index);

-- Row Level Security
alter table profiles enable row level security;
alter table worksheets enable row level security;
alter table worksheet_attempts enable row level security;
alter table static_question_sets enable row level security;
alter table worksheet_answer_keys enable row level security;
alter table user_static_topic_progress enable row level security;

-- Profiles policies
create policy "Profiles are viewable by owners" on profiles
  for select using (auth.uid() = id);

create policy "Profiles can be inserted by owners" on profiles
  for insert with check (auth.uid() = id);

create policy "Profiles can be updated by owners" on profiles
  for update using (auth.uid() = id);

-- Worksheets policies
create policy "Worksheets are viewable by owners" on worksheets
  for select using (auth.uid() = user_id);

create policy "Worksheets are insertable by owners" on worksheets
  for insert with check (auth.uid() = user_id);

create policy "Worksheets are deletable by owners" on worksheets
  for delete using (auth.uid() = user_id);

-- Attempts policies
create policy "Attempts are viewable by owners" on worksheet_attempts
  for select using (auth.uid() = user_id);

create policy "Attempts are insertable by owners" on worksheet_attempts
  for insert with check (auth.uid() = user_id);

create policy "Static topic progress is viewable by owners" on user_static_topic_progress
  for select using (auth.uid() = user_id);

create policy "Static topic progress is insertable by owners" on user_static_topic_progress
  for insert with check (auth.uid() = user_id);

create policy "Static topic progress is updatable by owners" on user_static_topic_progress
  for update using (auth.uid() = user_id);

-- Keep only the latest 10 worksheets per user
create or replace function public.keep_only_last_10_worksheets()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.worksheets
  where id in (
    select id
    from public.worksheets
    where user_id = new.user_id
    order by created_at desc, id desc
    offset 10
  );

  return new;
end;
$$;

drop trigger if exists trg_keep_last_10_worksheets on public.worksheets;
create trigger trg_keep_last_10_worksheets
after insert on public.worksheets
for each row execute function public.keep_only_last_10_worksheets();

-- Optional: keep profiles in sync
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
