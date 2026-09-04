from pathlib import Path


# Extend the Supabase REST adapter without replacing the existing repository boundary.
path = Path("src/persistence/supabase-rest.ts")
s = path.read_text()

old = '''        evidence_source: input.evidenceSource ?? "objective",
      }),'''
new = '''        evidence_source: input.evidenceSource ?? "objective",
        event_kind: input.eventKind ?? "response",
        submission_index: input.submissionIndex ?? null,
        first_submission: input.firstSubmission ?? null,
        attempt_stage: input.stage ?? "initial",
        response_mode: input.responseMode ?? null,
        guidance: input.guidance ?? "none",
        solution_seen: input.solutionSeen ?? false,
        example_signature: input.exampleSignature ?? null,
        example_attributes: input.exampleAttributes ?? {},
        confusion_with: input.confusionWith ?? null,
        prior_relevant_exposure_at: input.priorRelevantExposureAt ?? null,
        elapsed_since_relevant_exposure_ms: input.elapsedSinceRelevantExposureMs ?? null,
        evidence_version: input.evidenceVersion ?? "v2",
      }),'''
if old in s:
    s = s.replace(old, new, 1)

return_anchor = '''      evidenceSource: r.evidence_source ?? "objective",
    };'''
return_new = '''      evidenceSource: r.evidence_source ?? "objective",
      eventKind: r.event_kind ?? "response",
      submissionIndex: r.submission_index ?? undefined,
      firstSubmission: r.first_submission ?? undefined,
      stage: r.attempt_stage ?? undefined,
      responseMode: r.response_mode ?? undefined,
      guidance: r.guidance ?? undefined,
      solutionSeen: r.solution_seen ?? false,
      exampleSignature: r.example_signature ?? undefined,
      exampleAttributes: r.example_attributes ?? undefined,
      confusionWith: r.confusion_with ?? undefined,
      priorRelevantExposureAt: r.prior_relevant_exposure_at ?? undefined,
      elapsedSinceRelevantExposureMs: r.elapsed_since_relevant_exposure_ms ?? undefined,
      evidenceVersion: r.evidence_version ?? "legacy-v1",
    };'''
if return_anchor in s:
    s = s.replace(return_anchor, return_new, 1)

map_anchor = '''      evidenceSource: r.evidence_source ?? "objective",
    }));'''
map_new = '''      evidenceSource: r.evidence_source ?? "objective",
      eventKind: r.event_kind ?? "response",
      submissionIndex: r.submission_index ?? undefined,
      firstSubmission: r.first_submission ?? undefined,
      stage: r.attempt_stage ?? undefined,
      responseMode: r.response_mode ?? undefined,
      guidance: r.guidance ?? undefined,
      solutionSeen: r.solution_seen ?? false,
      exampleSignature: r.example_signature ?? undefined,
      exampleAttributes: r.example_attributes ?? undefined,
      confusionWith: r.confusion_with ?? undefined,
      priorRelevantExposureAt: r.prior_relevant_exposure_at ?? undefined,
      elapsedSinceRelevantExposureMs: r.elapsed_since_relevant_exposure_ms ?? undefined,
      evidenceVersion: r.evidence_version ?? "legacy-v1",
    }));'''
if map_anchor in s:
    s = s.replace(map_anchor, map_new, 1)

old_state = '''      const evidence: DerivedSkillEvidence = {
        state: r.learning_state,
        ready: r.ready,
        retained: r.retained,
        fragile: r.fragile,
        acquisitionIndependentSuccesses: r.acquisition_successes,
        acquisitionDistinctSuccessfulPrompts: r.distinct_successful_prompts,
        successfulDelayedReviewSessions: r.successful_delayed_reviews,
        recentColdReviewResults: [],
        lastDirectOutcome: r.last_direct_outcome ?? undefined,
        evidenceBasis: r.evidence_basis ?? "none",
      };'''
new_state = '''      const evidence: DerivedSkillEvidence = r.evidence_summary && Object.keys(r.evidence_summary).length
        ? r.evidence_summary
        : {
          state: r.learning_state,
          ready: r.ready,
          retained: r.retained,
          fragile: r.fragile,
          retentionAtRisk: false,
          everRetained: r.retained,
          readinessBasis: r.ready ? "legacy-v1" : "none",
          readyEstablishedAt: r.ready_established_at ?? undefined,
          retainedEstablishedAt: r.retained_established_at ?? undefined,
          acquisitionIndependentSuccesses: r.acquisition_successes,
          acquisitionDistinctSuccessfulPrompts: r.distinct_successful_prompts,
          successfulDelayedReviewSessions: r.successful_delayed_reviews,
          independentFirstAttemptSuccesses: 0,
          independentFirstAttemptFailures: 0,
          distinctSuccessfulExamples: 0,
          recognitionSuccesses: 0,
          constructedSuccesses: 0,
          discriminationSuccesses: 0,
          applicationSuccesses: 0,
          hintedOrGuidedSuccesses: 0,
          answerRevealEvents: 0,
          immediatePostInstructionResponses: 0,
          successfulColdRetrievals: r.successful_delayed_reviews,
          failedColdRetrievals: 0,
          successfulRelearningEvents: 0,
          recentColdReviewResults: [],
          lastDirectOutcome: r.last_direct_outcome ?? undefined,
          evidenceBasis: r.evidence_basis ?? "none",
          confusions: {},
          evidenceVersion: "v2",
        };'''
if old_state in s:
    s = s.replace(old_state, new_state, 1)

upsert_anchor = '''        evidence_basis: evidence.evidenceBasis,
        last_attempt_at: lastAttemptAt ?? null,'''
upsert_new = '''        evidence_basis: evidence.evidenceBasis,
        evidence_summary: evidence,
        evidence_version: evidence.evidenceVersion,
        ready_established_at: evidence.readyEstablishedAt ?? null,
        retained_established_at: evidence.retainedEstablishedAt ?? null,
        last_attempt_at: lastAttemptAt ?? null,'''
if upsert_anchor in s:
    s = s.replace(upsert_anchor, upsert_new, 1)

for required in ("event_kind", "first_submission", "evidence_summary", "ready_established_at"):
    if required not in s:
        raise RuntimeError(f"Supabase REST evidence persistence missing {required}")
path.write_text(s)

# Keep the checked-in fresh-install schema aligned with the production migration.
schema_path = Path("supabase/schema.sql")
schema = schema_path.read_text()
schema = schema.replace(
    "check (outcome in ('correct', 'incorrect', 'hinted', 'revealed'))",
    "check (outcome in ('correct', 'incorrect', 'hinted', 'revealed', 'exposed'))",
)
old = '''  evidence_source text not null default 'objective' check (evidence_source in ('objective', 'self-report')),
  created_at timestamptz not null default now()'''
new = '''  evidence_source text not null default 'objective' check (evidence_source in ('objective', 'self-report')),
  event_kind text not null default 'response' check (event_kind in ('response', 'hint', 'explanation', 'answer-reveal')),
  submission_index integer check (submission_index is null or submission_index >= 1),
  first_submission boolean,
  attempt_stage text check (attempt_stage is null or attempt_stage in ('initial', 'retry', 'relearning')),
  response_mode text check (response_mode is null or response_mode in ('recognition', 'constructed', 'discrimination', 'application')),
  guidance text not null default 'none' check (guidance in ('none', 'hint', 'explanation', 'answer-reveal')),
  solution_seen boolean not null default false,
  example_signature text,
  example_attributes jsonb not null default '{}'::jsonb,
  confusion_with text,
  prior_relevant_exposure_at timestamptz,
  elapsed_since_relevant_exposure_ms bigint check (elapsed_since_relevant_exposure_ms is null or elapsed_since_relevant_exposure_ms >= 0),
  evidence_version text not null default 'v2' check (evidence_version in ('legacy-v1', 'v2')),
  created_at timestamptz not null default now()'''
if old in schema:
    schema = schema.replace(old, new, 1)

old = '''  evidence_basis text not null default 'none' check (evidence_basis in ('none', 'objective', 'self-report', 'mixed')),
  last_attempt_at timestamptz,'''
new = '''  evidence_basis text not null default 'none' check (evidence_basis in ('none', 'objective', 'self-report', 'mixed')),
  evidence_summary jsonb not null default '{}'::jsonb,
  evidence_version text not null default 'v2' check (evidence_version in ('legacy-v1', 'v2')),
  ready_established_at timestamptz,
  retained_established_at timestamptz,
  last_attempt_at timestamptz,'''
if old in schema:
    schema = schema.replace(old, new, 1)

schema = schema.replace("curriculum_version text not null default 'v0.7'", "curriculum_version text not null default 'v0.8'")

if "create table if not exists public.retired_skill_history" not in schema:
    insert_at = schema.index("create index if not exists learning_attempts_user_skill_time_idx")
    archive = '''create table if not exists public.retired_skill_history (
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

'''
    schema = schema[:insert_at] + archive + schema[insert_at:]
    schema = schema.replace(
        "alter table public.user_learning_settings enable row level security;",
        "alter table public.user_learning_settings enable row level security;\nalter table public.retired_skill_history enable row level security;",
    )
    schema = schema.replace(
        "revoke all on table public.user_learning_settings from anon;",
        "revoke all on table public.user_learning_settings from anon;\nrevoke all on table public.retired_skill_history from anon;\nrevoke all on table public.retired_skill_history from authenticated;",
    )

for required in ("event_kind", "evidence_summary", "retired_skill_history", "v0.8"):
    if required not in schema:
        raise RuntimeError(f"Schema foundation missing {required}")
schema_path.write_text(schema)

print("Learning evidence persistence transform applied")
