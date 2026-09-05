create table if not exists public.user_appearance_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  accent_color text not null default 'purple',
  updated_at timestamptz not null default now(),
  constraint user_appearance_settings_accent_color_check
    check (accent_color in ('red','green','purple','yellow','orange','blue','black','white'))
);

alter table public.user_appearance_settings enable row level security;

drop policy if exists "Users can read their appearance" on public.user_appearance_settings;
create policy "Users can read their appearance"
  on public.user_appearance_settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their appearance" on public.user_appearance_settings;
create policy "Users can insert their appearance"
  on public.user_appearance_settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their appearance" on public.user_appearance_settings;
create policy "Users can update their appearance"
  on public.user_appearance_settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
