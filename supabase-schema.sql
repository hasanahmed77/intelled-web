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
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

-- Questions
create table if not exists worksheet_questions (
  id uuid primary key default gen_random_uuid(),
  worksheet_id uuid not null references worksheets(id) on delete cascade,
  prompt text not null,
  answer text not null,
  feedback text not null,
  order_index integer not null,
  created_at timestamptz not null default now()
);

-- Attempts
create table if not exists worksheet_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  worksheet_id uuid not null references worksheets(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  difficulty_used text not null check (difficulty_used in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

-- Answers
create table if not exists attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references worksheet_attempts(id) on delete cascade,
  question_id uuid not null references worksheet_questions(id) on delete cascade,
  user_answer text not null,
  is_correct boolean not null,
  feedback text not null,
  created_at timestamptz not null default now()
);

-- Basic indexes
create index if not exists worksheets_user_id_idx on worksheets(user_id);
create index if not exists worksheet_questions_worksheet_id_idx on worksheet_questions(worksheet_id);
create index if not exists worksheet_attempts_user_id_idx on worksheet_attempts(user_id);
create index if not exists attempt_answers_attempt_id_idx on attempt_answers(attempt_id);

-- Row Level Security
alter table profiles enable row level security;
alter table worksheets enable row level security;
alter table worksheet_questions enable row level security;
alter table worksheet_attempts enable row level security;
alter table attempt_answers enable row level security;

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

-- Questions policies
create policy "Worksheet questions are viewable by worksheet owners" on worksheet_questions
  for select using (
    exists (
      select 1 from worksheets
      where worksheets.id = worksheet_questions.worksheet_id
      and worksheets.user_id = auth.uid()
    )
  );

create policy "Worksheet questions are insertable by worksheet owners" on worksheet_questions
  for insert with check (
    exists (
      select 1 from worksheets
      where worksheets.id = worksheet_questions.worksheet_id
      and worksheets.user_id = auth.uid()
    )
  );

-- Attempts policies
create policy "Attempts are viewable by owners" on worksheet_attempts
  for select using (auth.uid() = user_id);

create policy "Attempts are insertable by owners" on worksheet_attempts
  for insert with check (auth.uid() = user_id);

-- Answers policies
create policy "Attempt answers are viewable by owners" on attempt_answers
  for select using (
    exists (
      select 1 from worksheet_attempts
      where worksheet_attempts.id = attempt_answers.attempt_id
      and worksheet_attempts.user_id = auth.uid()
    )
  );

create policy "Attempt answers are insertable by owners" on attempt_answers
  for insert with check (
    exists (
      select 1 from worksheet_attempts
      where worksheet_attempts.id = attempt_answers.attempt_id
      and worksheet_attempts.user_id = auth.uid()
    )
  );

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
