-- Block 8 final QA: keep lesson_progress user-scoped while avoiding per-row auth.uid() re-evaluation.
-- This is a performance-only RLS rewrite. It does not broaden access or add DELETE rights.

drop policy if exists lesson_progress_select_own on public.lesson_progress;
drop policy if exists lesson_progress_insert_own on public.lesson_progress;
drop policy if exists lesson_progress_update_own on public.lesson_progress;

create policy lesson_progress_select_own
on public.lesson_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy lesson_progress_insert_own
on public.lesson_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy lesson_progress_update_own
on public.lesson_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
