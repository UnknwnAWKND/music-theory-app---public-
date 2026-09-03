import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const sql = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("Supabase schema enables RLS on all learner-owned tables", () => {
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

test("attempt and scheduler review histories are append-only under client RLS", () => {
  assert.doesNotMatch(sql, /create policy\s+"learning_attempts_[^"]*"[^;]*for\s+(update|delete)/i);
  assert.doesNotMatch(sql, /create policy\s+"scheduler_reviews_[^"]*"[^;]*for\s+(update|delete)/i);
  assert.match(sql, /learning_attempts_insert_own/i);
  assert.match(sql, /scheduler_reviews_insert_own/i);
});

test("scheduler state is persisted separately from pedagogical skill state", () => {
  assert.match(sql, /create table if not exists public\.skill_state/i);
  assert.match(sql, /create table if not exists public\.scheduler_cards/i);
  assert.match(sql, /scheduler_version text not null default 'fsrs-6'/i);
});

test("session plans and scheduler seed/review event kinds are persisted", () => {
  assert.match(sql, /plan_snapshot jsonb/i);
  assert.match(sql, /completion_reason text/i);
  assert.match(sql, /event_kind text not null default 'review'/i);
  assert.match(sql, /initial-seed/i);
  assert.match(sql, /curriculum_version text not null default 'v0\.7'/i);
});


test("Supabase schema uses least-privilege grants for authenticated users and none for anon", () => {
  assert.match(sql, /revoke all on table public\.learning_attempts from anon, authenticated/i);
  assert.match(sql, /grant select, insert on table public\.learning_attempts to authenticated/i);
  assert.match(sql, /grant select, insert on table public\.scheduler_reviews to authenticated/i);
  assert.doesNotMatch(sql, /grant[^;]+on table public\.(learning_attempts|scheduler_reviews)[^;]+\b(update|delete)\b[^;]+to authenticated/i);
  assert.match(sql, /for select to authenticated using \(\(select auth\.uid\(\)\) = user_id\)/i);
});
