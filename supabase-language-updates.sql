alter table public.worksheets
add column if not exists language text;

update public.worksheets
set language = 'english'
where language is null;

alter table public.worksheets
alter column language set default 'english';

alter table public.worksheets
alter column language set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'worksheets_language_check'
  ) then
    alter table public.worksheets
    add constraint worksheets_language_check
    check (language in ('english', 'bengali'));
  end if;
end $$;
