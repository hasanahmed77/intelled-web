alter table public.worksheets
  add column if not exists education_type text,
  add column if not exists subject text,
  add column if not exists source text not null default 'ai';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'worksheets_source_check'
  ) then
    alter table public.worksheets
      add constraint worksheets_source_check
      check (source in ('ai', 'static'));
  end if;
end $$;

update public.worksheets
set source = 'ai'
where source is null;

create table if not exists public.static_question_sets (
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

create index if not exists static_question_sets_lookup_idx
  on public.static_question_sets(education_type, subject, topic, difficulty, language, active, variant_index);

create table if not exists public.worksheet_answer_keys (
  worksheet_id uuid primary key references public.worksheets(id) on delete cascade,
  source_set_id uuid references public.static_question_sets(id) on delete set null,
  questions jsonb not null,
  created_at timestamptz not null default now()
);

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

alter table public.static_question_sets enable row level security;
alter table public.worksheet_answer_keys enable row level security;
alter table public.user_static_topic_progress enable row level security;

insert into public.static_question_sets (
  education_type,
  subject,
  topic,
  difficulty,
  language,
  variant_index,
  questions
)
values (
  'O Level',
  'Mathematics',
  'Number Skills',
  'medium',
  'english',
  1,
  '[
    {"prompt":"Evaluate \\(6 + 3 \\times (8 - 5)^2\\).","feedback":"","correctAnswer":"33"},
    {"prompt":"Find the Highest Common Factor (HCF) of 36 and 84.","feedback":"Prime factorisation or listing factors should be used. The HCF is the largest common factor shared by both numbers.","correctAnswer":"12"},
    {"prompt":"Simplify \\(2^3 \\times 2^5 \\div 2^4\\).","feedback":"Use index laws: when multiplying add powers, when dividing subtract powers.","correctAnswer":"\\(2^4\\) or \\(16\\)"},
    {"prompt":"Simplify \\(\\sqrt{50} + \\sqrt{8}\\).","feedback":"Simplify each surd first: \\(\\sqrt{50} = 5\\sqrt{2}\\) and \\(\\sqrt{8} = 2\\sqrt{2}\\), then combine like terms.","correctAnswer":"\\(7\\sqrt{2}\\)"},
    {"prompt":"Rationalise the denominator of \\(\\frac{5}{3 - \\sqrt{2}}\\).","feedback":"Multiply numerator and denominator by the conjugate \\((3 + \\sqrt{2})\\) to remove the surd from the denominator.","correctAnswer":"\\(\\frac{15 + 5\\sqrt{2}}{7}\\)"},
    {"prompt":"State whether \\(\\sqrt{18}\\) is rational or irrational.","feedback":"\\(\\sqrt{18}\\) cannot be written as a terminating or recurring decimal, so it is irrational.","correctAnswer":"Irrational"},
    {"prompt":"A car travels 150 km in 3 hours. Calculate its average speed in km/h.","feedback":"Average speed = distance ÷ time.","correctAnswer":"50 km/h"},
    {"prompt":"Write 0.375 as a fraction in its simplest form.","feedback":"Convert decimal to fraction then simplify by dividing numerator and denominator by their highest common factor.","correctAnswer":"3/8"},
    {"prompt":"Round 3.7865 to 3 significant figures.","feedback":"Keep the first 3 significant digits and check the next digit to round correctly.","correctAnswer":"3.79"},
    {"prompt":"Write 0.00052 in standard form.","feedback":"Standard form is written as \\(a \\times 10^n\\) where \\(1 \\le a < 10\\).","correctAnswer":"\\(5.2 \\times 10^{-4}\\)"}
  ]'::jsonb
)
on conflict (education_type, subject, topic, language, difficulty, variant_index) do update
set
  difficulty = excluded.difficulty,
  variant_index = excluded.variant_index,
  questions = excluded.questions,
  active = true;
