-- Block 1 destructive curriculum rebuild.
-- Preserve auth.users identities, but intentionally clear every application-level user row.

alter table public.phase_progress
  drop constraint if exists phase_progress_phase_number_check;
alter table public.phase_progress
  add constraint phase_progress_phase_number_check check (phase_number between 1 and 6);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  completion_count integer not null default 0 check (completion_count >= 0),
  first_completed_at timestamptz,
  last_completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;
revoke all on table public.lesson_progress from anon, authenticated;
grant select, insert, update on table public.lesson_progress to authenticated;

drop policy if exists "lesson_progress_select_own" on public.lesson_progress;
drop policy if exists "lesson_progress_insert_own" on public.lesson_progress;
drop policy if exists "lesson_progress_update_own" on public.lesson_progress;
create policy "lesson_progress_select_own" on public.lesson_progress for select to authenticated using (auth.uid() = user_id);
create policy "lesson_progress_insert_own" on public.lesson_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "lesson_progress_update_own" on public.lesson_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One-time global application-data reset for this rebuild. Auth identities are deliberately untouched.
delete from public.lesson_progress;
delete from public.scheduler_reviews;
delete from public.scheduler_cards;
delete from public.skill_state;
delete from public.phase_progress;
delete from public.retired_skill_history;
delete from public.learning_attempts;
delete from public.study_sessions;
delete from public.user_learning_settings;
delete from public.user_profiles;

create or replace function public.reset_my_learning_progress()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.lesson_progress where user_id = current_user_id;
  delete from public.scheduler_reviews where user_id = current_user_id;
  delete from public.scheduler_cards where user_id = current_user_id;
  delete from public.skill_state where user_id = current_user_id;
  delete from public.phase_progress where user_id = current_user_id;
  delete from public.retired_skill_history where user_id = current_user_id;
  delete from public.learning_attempts where user_id = current_user_id;
  delete from public.study_sessions where user_id = current_user_id;
end;
$$;

revoke all on function public.reset_my_learning_progress() from public;
revoke all on function public.reset_my_learning_progress() from anon;
grant execute on function public.reset_my_learning_progress() to authenticated;
