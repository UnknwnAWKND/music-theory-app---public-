from pathlib import Path

path = Path("supabase/schema.sql")
schema = path.read_text()

schema = schema.replace(
    "outcome text not null check (outcome in ('correct','incorrect','hinted','revealed')),",
    "outcome text not null check (outcome in ('correct','incorrect','hinted','revealed','exposed')),")

attempt_anchor = "  evidence_source text not null default 'objective' check (evidence_source in ('objective','self-report')),\n"
if "  submission_index integer" not in schema:
    if attempt_anchor not in schema:
        raise RuntimeError("Could not locate learning_attempts evidence_source anchor")
    schema = schema.replace(attempt_anchor, attempt_anchor + """  event_kind text not null default 'response' check (event_kind in ('response','hint','explanation','answer-reveal')),
  submission_index integer check (submission_index is null or submission_index >= 1),
  first_submission boolean,
  attempt_stage text check (attempt_stage is null or attempt_stage in ('initial','retry','relearning')),
  response_mode text check (response_mode is null or response_mode in ('recognition','constructed','discrimination','application')),
  guidance text not null default 'none' check (guidance in ('none','hint','explanation','answer-reveal')),
  solution_seen boolean not null default false,
  example_signature text,
  example_attributes jsonb not null default '{}'::jsonb,
  confusion_with text,
  prior_relevant_exposure_at timestamptz,
  elapsed_since_relevant_exposure_ms bigint check (elapsed_since_relevant_exposure_ms is null or elapsed_since_relevant_exposure_ms >= 0),
  evidence_version text not null default 'v2' check (evidence_version in ('legacy-v1','v2')),
""", 1)

state_anchor = "  evidence_basis text not null default 'none' check (evidence_basis in ('none','objective','self-report','mixed')),\n"
if "  evidence_summary jsonb" not in schema:
    if state_anchor not in schema:
        raise RuntimeError("Could not locate skill_state evidence_basis anchor")
    schema = schema.replace(state_anchor, state_anchor + """  evidence_summary jsonb not null default '{}'::jsonb,
  evidence_version text not null default 'v2' check (evidence_version in ('legacy-v1','v2')),
  ready_established_at timestamptz,
  retained_established_at timestamptz,
""", 1)

schema = schema.replace("curriculum_version text not null default 'v0.7'", "curriculum_version text not null default 'v0.8'")

for field in (
    "submission_index integer",
    "first_submission boolean",
    "response_mode text",
    "example_attributes jsonb",
    "evidence_summary jsonb",
    "ready_established_at timestamptz",
    "retained_established_at timestamptz",
):
    if field not in schema:
        raise RuntimeError(f"Schema preparation failed to add {field}")

path.write_text(schema)
print("Learning evidence schema prepared")
