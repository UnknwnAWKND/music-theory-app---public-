import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const sql = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/202609040100_learning_engine_foundation.sql", import.meta.url), "utf8");

test("Supabase schema enables RLS on all learner-owned active tables", () => {
  for (const table of [
    "study_sessions",
    "learning_attempts",
    "skill_state",
    "scheduler_cards",
    "scheduler_reviews",
    "user_learning_settings",
  ]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"), table);
  }
});

test("attempt and scheduler review histories remain append-only under client RLS", () => {
  assert.doesNotMatch(sql, /create policy\s+"learning_attempts_[^"]*"[^;]*for\s+(update|delete)/i);
  assert.doesNotMatch(sql, /create policy\s+"scheduler_reviews_[^"]*"[^;]*for\s+(update|delete)/i);
  assert.match(sql, /learning_attempts_insert_own/i);
  assert.match(sql, /scheduler_reviews_insert_own/i);
});

test("learning attempts store first-submission, guidance, response mode, example variety, confusion, and exposure timing", () => {
  for (const field of [
    "event_kind", "submission_index", "first_submission", "attempt_stage", "response_mode", "guidance",
    "solution_seen", "example_signature", "example_attributes", "confusion_with",
    "prior_relevant_exposure_at", "elapsed_since_relevant_exposure_ms", "evidence_version",
  ]) assert.match(sql, new RegExp(`\\b${field}\\b`, "i"), field);
});

test("derived skill state stores a versioned rich evidence summary while scheduler remains separate", () => {
  assert.match(sql, /create table if not exists public\.skill_state/i);
  assert.match(sql, /evidence_summary jsonb/i);
  assert.match(sql, /ready_established_at timestamptz/i);
  assert.match(sql, /retained_established_at timestamptz/i);
  assert.match(sql, /create table if not exists public\.scheduler_cards/i);
  assert.match(sql, /scheduler_version text not null default 'fsrs-6'/i);
});

test("session plans and scheduler seed/review event kinds are persisted", () => {
  assert.match(sql, /plan_snapshot jsonb/i);
  assert.match(sql, /completion_reason text/i);
  assert.match(sql, /event_kind text not null default 'review'/i);
  assert.match(sql, /initial-seed/i);
  assert.match(sql, /curriculum_version text not null default 'v0\.8'/i);
});

test("retired Phase 0 evidence is archived outside active client-accessible learning tables", () => {
  assert.match(sql, /create table if not exists public\.retired_skill_history/i);
  assert.match(sql, /revoke all on table public\.retired_skill_history from authenticated/i);
  assert.match(migration, /pitch\.accidentals/);
  assert.match(migration, /pitch\.half-whole/);
  assert.match(migration, /delete from public\.learning_attempts where skill_id in \('pitch\.accidentals', 'pitch\.half-whole'\)/i);
});

test("Supabase schema uses least-privilege grants for authenticated users and none for anon", () => {
  assert.match(sql, /revoke all on table public\.learning_attempts from anon, authenticated/i);
  assert.match(sql, /grant select, insert on table public\.learning_attempts to authenticated/i);
  assert.match(sql, /grant select, insert on table public\.scheduler_reviews to authenticated/i);
  assert.doesNotMatch(sql, /grant[^;]+on table public\.(learning_attempts|scheduler_reviews)[^;]+\b(update|delete)\b[^;]+to authenticated/i);
  assert.match(sql, /for select to authenticated using \(\(select auth\.uid\(\)\) = user_id\)/i);
});
