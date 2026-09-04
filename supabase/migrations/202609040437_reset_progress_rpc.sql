-- Secure testing reset: preserve normal append-only table permissions while allowing
-- an authenticated learner to clear only their own progress through one RPC.

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
