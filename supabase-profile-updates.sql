begin;

alter table public.profiles
add column if not exists primary_learning_goal text;

update public.profiles
set full_name = coalesce(nullif(full_name, ''), split_part((select email from auth.users where auth.users.id = profiles.id), '@', 1))
where full_name is null or btrim(full_name) = '';

create or replace function public.handle_new_user()
returns trigger
as $$
begin
  insert into public.profiles (id, full_name, primary_learning_goal)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'primary_learning_goal', '')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    primary_learning_goal = coalesce(excluded.primary_learning_goal, public.profiles.primary_learning_goal);

  perform public.ensure_billing_defaults(new.id);
  return new;
end;
$$ language plpgsql security definer;

commit;
