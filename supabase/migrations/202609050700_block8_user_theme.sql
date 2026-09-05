alter table public.user_learning_settings
  add column if not exists theme text not null default 'dark';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_learning_settings_theme_check'
      and conrelid = 'public.user_learning_settings'::regclass
  ) then
    alter table public.user_learning_settings
      add constraint user_learning_settings_theme_check
      check (theme in ('light', 'dark'));
  end if;
end
$$;
