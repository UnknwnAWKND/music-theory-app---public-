-- Personal Music Theory Tutor — Supabase schema v1
-- Source-of-truth curriculum/theory rules live in versioned application code.
-- Supabase stores learner history, derived state caches, and scheduler state.

create extension if not exists pgcrypto;

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  completion_reason text,
  plan_snapshot jsonb,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index if not exists study_sessions_user_id_idx
  on public.study_sessions(user_id);

create table if not exists public.learning_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid,
  skill_id text not null,
  prompt_signature text not null,
  occurred_at timestamptz not null default now(),
  outcome text not null check (outcome in ('correct','incorrect','hinted','revealed')),
  independent boolean not null,
  direct_evidence boolean not null,
  evidence_context text not null check (evidence_context in ('acquisition','review','transfer','diagnostic')),
  cold_probe boolean not null default false,
  response_ms integer check (response_ms is null or response_ms >= 0),
  assessment_code text,
  metadata jsonb not null default '{}'::jsonb,
  evidence_source text not null default 'objective' check (evidence_source in ('objective','self-report')),
  created_at timestamptz not null default now(),
  foreign key (session_id, user_id) references public.study_sessions(id, user_id) on delete restrict
);

create index if not exists learning_attempts_user_skill_time_idx
  on public.learning_attempts(user_id, skill_id, occurred_at desc);
create index if not exists learning_attempts_user_session_idx
  on public.learning_attempts(user_id, session_id);
create index if not exists learning_attempts_session_user_idx
  on public.learning_attempts(session_id, user_id);

-- Cached/derived state for fast session planning. It can always be rebuilt from attempts.
create table if not exists public.skill_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null,
  learning_state text not null check (learning_state in ('new','acquiring','ready','consolidating','retained','fragile')),
  ready boolean not null default false,
  retained boolean not null default false,
  fragile boolean not null default false,
  acquisition_successes integer not null default 0 check (acquisition_successes >= 0),
  distinct_successful_prompts integer not null default 0 check (distinct_successful_prompts >= 0),
  successful_delayed_reviews integer not null default 0 check (successful_delayed_reviews >= 0),
  last_direct_outcome text check (last_direct_outcome is null or last_direct_outcome in ('correct','incorrect')),
  evidence_basis text not null default 'none' check (evidence_basis in ('none','objective','self-report','mixed')),
  last_attempt_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

-- Scheduler card is intentionally separate from pedagogical READY/RETAINED state.
create table if not exists public.scheduler_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null,
  due_at timestamptz not null,
  stability double precision not null default 0 check (stability >= 0),
  difficulty double precision not null default 0 check (difficulty >= 0),
  elapsed_days integer not null default 0 check (elapsed_days >= 0),
  scheduled_days integer not null default 0 check (scheduled_days >= 0),
  learning_steps integer not null default 0 check (learning_steps >= 0),
  reps integer not null default 0 check (reps >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  scheduler_state text not null check (scheduler_state in ('new','learning','review','relearning')),
  last_review_at timestamptz,
  scheduler_version text not null default 'fsrs-6',
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create index if not exists scheduler_cards_due_idx
  on public.scheduler_cards(user_id, due_at);

-- Append-only audit log for scheduler transitions. Useful for replay/rebuild/parameter fitting later.
create table if not exists public.scheduler_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null,
  reviewed_at timestamptz not null,
  event_kind text not null default 'review' check (event_kind in ('initial-seed','review')),
  rating text not null check (rating in ('again','good')),
  due_before timestamptz not null,
  due_after timestamptz not null,
  card_before jsonb not null,
  card_after jsonb not null,
  scheduler_version text not null default 'fsrs-6',
  created_at timestamptz not null default now()
);

create index if not exists scheduler_reviews_user_skill_time_idx
  on public.scheduler_reviews(user_id, skill_id, reviewed_at desc);

create table if not exists public.user_learning_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  desired_retention double precision not null default 0.90 check (desired_retention >= 0.70 and desired_retention <= 0.99),
  maximum_interval_days integer not null default 36500 check (maximum_interval_days >= 1),
  require_previous_lessons boolean not null default true,
  curriculum_version text not null default 'v0.7',
  scheduler_version text not null default 'fsrs-6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_learning_settings
  add column if not exists require_previous_lessons boolean not null default true;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Student' check (char_length(trim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.user_profiles (user_id, display_name, created_at, updated_at)
select
  u.id,
  coalesce(nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'Student'),
  u.created_at,
  now()
from auth.users u
on conflict (user_id) do nothing;

alter table public.study_sessions enable row level security;
alter table public.learning_attempts enable row level security;
alter table public.skill_state enable row level security;
alter table public.scheduler_cards enable row level security;
alter table public.scheduler_reviews enable row level security;
alter table public.user_learning_settings enable row level security;
alter table public.user_profiles enable row level security;

-- Least-privilege Data API grants. Signed-out visitors get no learner-data access.
revoke all on table public.study_sessions from anon, authenticated;
revoke all on table public.learning_attempts from anon, authenticated;
revoke all on table public.skill_state from anon, authenticated;
revoke all on table public.scheduler_cards from anon, authenticated;
revoke all on table public.scheduler_reviews from anon, authenticated;
revoke all on table public.user_learning_settings from anon, authenticated;
revoke all on table public.user_profiles from anon, authenticated;

grant select, insert, update on table public.study_sessions to authenticated;
grant select, insert on table public.learning_attempts to authenticated;
grant select, insert, update on table public.skill_state to authenticated;
grant select, insert, update on table public.scheduler_cards to authenticated;
grant select, insert on table public.scheduler_reviews to authenticated;
grant select, insert, update on table public.user_learning_settings to authenticated;
grant select, insert, update on table public.user_profiles to authenticated;

-- Recreate policies so the schema can be safely re-applied during personal-project setup.
drop policy if exists "study_sessions_select_own" on public.study_sessions;
drop policy if exists "study_sessions_insert_own" on public.study_sessions;
drop policy if exists "study_sessions_update_own" on public.study_sessions;
drop policy if exists "learning_attempts_select_own" on public.learning_attempts;
drop policy if exists "learning_attempts_insert_own" on public.learning_attempts;
drop policy if exists "skill_state_select_own" on public.skill_state;
drop policy if exists "skill_state_insert_own" on public.skill_state;
drop policy if exists "skill_state_update_own" on public.skill_state;
drop policy if exists "scheduler_cards_select_own" on public.scheduler_cards;
drop policy if exists "scheduler_cards_insert_own" on public.scheduler_cards;
drop policy if exists "scheduler_cards_update_own" on public.scheduler_cards;
drop policy if exists "scheduler_reviews_select_own" on public.scheduler_reviews;
drop policy if exists "scheduler_reviews_insert_own" on public.scheduler_reviews;
drop policy if exists "user_learning_settings_select_own" on public.user_learning_settings;
drop policy if exists "user_learning_settings_insert_own" on public.user_learning_settings;
drop policy if exists "user_learning_settings_update_own" on public.user_learning_settings;
drop policy if exists "user_profiles_select_own" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;

-- Read/write only the signed-in user's own mutable state.
create policy "study_sessions_select_own" on public.study_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "study_sessions_insert_own" on public.study_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "study_sessions_update_own" on public.study_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Attempts are append-only from the authenticated client: SELECT + INSERT, deliberately no UPDATE/DELETE grant or policy.
create policy "learning_attempts_select_own" on public.learning_attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy "learning_attempts_insert_own" on public.learning_attempts for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "skill_state_select_own" on public.skill_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "skill_state_insert_own" on public.skill_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "skill_state_update_own" on public.skill_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "scheduler_cards_select_own" on public.scheduler_cards for select to authenticated using ((select auth.uid()) = user_id);
create policy "scheduler_cards_insert_own" on public.scheduler_cards for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "scheduler_cards_update_own" on public.scheduler_cards for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Scheduler logs are append-only too.
create policy "scheduler_reviews_select_own" on public.scheduler_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy "scheduler_reviews_insert_own" on public.scheduler_reviews for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "user_learning_settings_select_own" on public.user_learning_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_learning_settings_insert_own" on public.user_learning_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_learning_settings_update_own" on public.user_learning_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);


create policy "user_profiles_select_own" on public.user_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_profiles_insert_own" on public.user_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_profiles_update_own" on public.user_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
