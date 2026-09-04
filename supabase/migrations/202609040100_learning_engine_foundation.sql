-- Prompt 1 learning-engine foundation.
-- Add richer append-only learning evidence while preserving existing legitimate progress.
-- Retire the two former Phase 0 skills without renumbering Phase 1-12.

alter table public.learning_attempts
  drop constraint if exists learning_attempts_outcome_check;

alter table public.learning_attempts
  add constraint learning_attempts_outcome_check
  check (outcome in ('correct', 'incorrect', 'hinted', 'revealed', 'exposed'));

alter table public.learning_attempts add column if not exists event_kind text not null default 'response'
  check (event_kind in ('response', 'hint', 'explanation', 'answer-reveal'));
alter table public.learning_attempts add column if not exists submission_index integer
  check (submission_index is null or submission_index >= 1);
alter table public.learning_attempts add column if not exists first_submission boolean;
alter table public.learning_attempts add column if not exists attempt_stage text
  check (attempt_stage is null or attempt_stage in ('initial', 'retry', 'relearning'));
alter table public.learning_attempts add column if not exists response_mode text
  check (response_mode is null or response_mode in ('recognition', 'constructed', 'discrimination', 'application'));
alter table public.learning_attempts add column if not exists guidance text not null default 'none'
  check (guidance in ('none', 'hint', 'explanation', 'answer-reveal'));
alter table public.learning_attempts add column if not exists solution_seen boolean not null default false;
alter table public.learning_attempts add column if not exists example_signature text;
alter table public.learning_attempts add column if not exists example_attributes jsonb not null default '{}'::jsonb;
alter table public.learning_attempts add column if not exists confusion_with text;
alter table public.learning_attempts add column if not exists prior_relevant_exposure_at timestamptz;
alter table public.learning_attempts add column if not exists elapsed_since_relevant_exposure_ms bigint
  check (elapsed_since_relevant_exposure_ms is null or elapsed_since_relevant_exposure_ms >= 0);
alter table public.learning_attempts add column if not exists evidence_version text;

-- Rows that existed before this migration keep their old semantics. New rows default to v2.
update public.learning_attempts
set evidence_version = 'legacy-v1'
where evidence_version is null;
alter table public.learning_attempts alter column evidence_version set default 'v2';
alter table public.learning_attempts alter column evidence_version set not null;
alter table public.learning_attempts drop constraint if exists learning_attempts_evidence_version_check;
alter table public.learning_attempts add constraint learning_attempts_evidence_version_check
  check (evidence_version in ('legacy-v1', 'v2'));

-- Preserve the first submitted response explicitly for historical rows.
with ranked as (
  select id,
         row_number() over (
           partition by user_id, session_id, skill_id, prompt_signature
           order by occurred_at, id
         ) as submission_no
  from public.learning_attempts
  where event_kind = 'response'
)
update public.learning_attempts a
set submission_index = r.submission_no,
    first_submission = (r.submission_no = 1),
    attempt_stage = case when r.submission_no = 1 then 'initial' else 'retry' end
from ranked r
where a.id = r.id
  and a.submission_index is null;

update public.learning_attempts
set guidance = case when independent then 'none' else 'explanation' end,
    response_mode = case
      when metadata->>'exerciseType' = 'self-check-application' then 'application'
      when metadata->>'exerciseType' in ('concept-check', 'note-identify', 'interval-identify', 'triad-identify', 'scale-membership') then 'recognition'
      else 'constructed'
    end,
    example_signature = coalesce(example_signature, prompt_signature),
    example_attributes = case when example_attributes = '{}'::jsonb then metadata else example_attributes end
where evidence_version = 'legacy-v1';

alter table public.skill_state add column if not exists evidence_summary jsonb not null default '{}'::jsonb;
alter table public.skill_state add column if not exists evidence_version text;
update public.skill_state set evidence_version = 'legacy-v1' where evidence_version is null;
alter table public.skill_state alter column evidence_version set default 'v2';
alter table public.skill_state alter column evidence_version set not null;
alter table public.skill_state drop constraint if exists skill_state_evidence_version_check;
alter table public.skill_state add constraint skill_state_evidence_version_check
  check (evidence_version in ('legacy-v1', 'v2'));
alter table public.skill_state add column if not exists ready_established_at timestamptz;
alter table public.skill_state add column if not exists retained_established_at timestamptz;

create table if not exists public.retired_skill_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null,
  retired_reason text not null,
  retired_at timestamptz not null default now(),
  attempts jsonb not null default '[]'::jsonb,
  skill_state jsonb,
  scheduler_card jsonb,
  scheduler_reviews jsonb not null default '[]'::jsonb,
  unique (user_id, skill_id)
);

alter table public.retired_skill_history enable row level security;
revoke all on table public.retired_skill_history from anon;
revoke all on table public.retired_skill_history from authenticated;

-- Archive the former Phase 0 evidence before removing it from active learning tables.
with retired as (
  select distinct user_id, skill_id
  from (
    select user_id, skill_id from public.learning_attempts where skill_id in ('pitch.accidentals', 'pitch.half-whole')
    union all
    select user_id, skill_id from public.skill_state where skill_id in ('pitch.accidentals', 'pitch.half-whole')
    union all
    select user_id, skill_id from public.scheduler_cards where skill_id in ('pitch.accidentals', 'pitch.half-whole')
    union all
    select user_id, skill_id from public.scheduler_reviews where skill_id in ('pitch.accidentals', 'pitch.half-whole')
  ) x
)
insert into public.retired_skill_history (
  user_id, skill_id, retired_reason, attempts, skill_state, scheduler_card, scheduler_reviews
)
select r.user_id,
       r.skill_id,
       'phase-0-removed-v0.8',
       coalesce((select jsonb_agg(to_jsonb(a) order by a.occurred_at) from public.learning_attempts a where a.user_id = r.user_id and a.skill_id = r.skill_id), '[]'::jsonb),
       (select to_jsonb(s) from public.skill_state s where s.user_id = r.user_id and s.skill_id = r.skill_id),
       (select to_jsonb(c) from public.scheduler_cards c where c.user_id = r.user_id and c.skill_id = r.skill_id),
       coalesce((select jsonb_agg(to_jsonb(sr) order by sr.reviewed_at) from public.scheduler_reviews sr where sr.user_id = r.user_id and sr.skill_id = r.skill_id), '[]'::jsonb)
from retired r
on conflict (user_id, skill_id) do update
set retired_reason = excluded.retired_reason,
    retired_at = now(),
    attempts = excluded.attempts,
    skill_state = excluded.skill_state,
    scheduler_card = excluded.scheduler_card,
    scheduler_reviews = excluded.scheduler_reviews;

-- Historical session rows stay, but obsolete Phase 0 IDs are removed from their plan snapshots.
update public.study_sessions
set plan_snapshot =
  case when plan_snapshot is null then null else
    (
      case when plan_snapshot->>'newSkillId' in ('pitch.accidentals', 'pitch.half-whole') then plan_snapshot - 'newSkillId' else plan_snapshot end
    )
  end
where plan_snapshot is not null;

update public.study_sessions
set plan_snapshot =
  case when plan_snapshot->>'acquiringSkillId' in ('pitch.accidentals', 'pitch.half-whole') then plan_snapshot - 'acquiringSkillId' else plan_snapshot end
where plan_snapshot is not null;

update public.study_sessions
set plan_snapshot = jsonb_set(
  jsonb_set(
    plan_snapshot,
    '{repairSkillIds}',
    coalesce((select jsonb_agg(value) from jsonb_array_elements(coalesce(plan_snapshot->'repairSkillIds', '[]'::jsonb)) value where trim(both '"' from value::text) not in ('pitch.accidentals', 'pitch.half-whole')), '[]'::jsonb),
    true
  ),
  '{reviewSkillIds}',
  coalesce((select jsonb_agg(value) from jsonb_array_elements(coalesce(plan_snapshot->'reviewSkillIds', '[]'::jsonb)) value where trim(both '"' from value::text) not in ('pitch.accidentals', 'pitch.half-whole')), '[]'::jsonb),
  true
)
where plan_snapshot is not null;

delete from public.scheduler_reviews where skill_id in ('pitch.accidentals', 'pitch.half-whole');
delete from public.scheduler_cards where skill_id in ('pitch.accidentals', 'pitch.half-whole');
delete from public.skill_state where skill_id in ('pitch.accidentals', 'pitch.half-whole');
delete from public.learning_attempts where skill_id in ('pitch.accidentals', 'pitch.half-whole');

update public.user_learning_settings
set curriculum_version = 'v0.8', updated_at = now()
where curriculum_version <> 'v0.8';

alter table public.user_learning_settings alter column curriculum_version set default 'v0.8';
