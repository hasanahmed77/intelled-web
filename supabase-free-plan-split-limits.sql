begin;

alter table public.billing_plans
  add column if not exists free_static_problem_sets_lifetime_limit integer
    check (free_static_problem_sets_lifetime_limit is null or free_static_problem_sets_lifetime_limit >= 0),
  add column if not exists free_ai_problem_sets_lifetime_limit integer
    check (free_ai_problem_sets_lifetime_limit is null or free_ai_problem_sets_lifetime_limit >= 0);

alter table public.usage_counters
  add column if not exists free_static_problem_sets_used_lifetime integer not null default 0
    check (free_static_problem_sets_used_lifetime >= 0),
  add column if not exists free_ai_problem_sets_used_lifetime integer not null default 0
    check (free_ai_problem_sets_used_lifetime >= 0);

update public.billing_plans
set
  lifetime_worksheet_limit = 7,
  free_static_problem_sets_lifetime_limit = 5,
  free_ai_problem_sets_lifetime_limit = 2,
  updated_at = now()
where id = 'free';

update public.usage_counters
set
  free_static_problem_sets_used_lifetime = least(coalesce(free_worksheets_used_lifetime, 0), 5),
  free_ai_problem_sets_used_lifetime = 0,
  updated_at = now()
where true;

commit;
