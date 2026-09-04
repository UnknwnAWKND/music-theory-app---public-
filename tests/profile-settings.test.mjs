import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { InMemoryTutorRepository, SupabaseRestTutorRepository } from "../dist/persistence/index.js";

const settings = (userId, requirePreviousLessons) => ({
  userId,
  desiredRetention: 0.9,
  maximumIntervalDays: 36500,
  requirePreviousLessons,
  curriculumVersion: "v0.7",
  schedulerVersion: "fsrs-6",
});

test("profiles, settings, sessions, and skill state remain separated per user", async () => {
  const repo = new InMemoryTutorRepository();
  await repo.upsertProfile("user-a", "A", "2026-09-01T00:00:00Z");
  await repo.upsertProfile("user-b", "B", "2026-09-02T00:00:00Z");
  await repo.upsertSettings(settings("user-a", true));
  await repo.upsertSettings(settings("user-b", false));
  await repo.createSession("user-a", "2026-09-03T10:00:00Z");
  await repo.createSession("user-b", "2026-09-03T11:00:00Z");
  const evidence = {
    state: "ready", ready: true, retained: false, fragile: false,
    acquisitionIndependentSuccesses: 3, acquisitionDistinctSuccessfulPrompts: 3,
    successfulDelayedReviewSessions: 0, recentColdReviewResults: [], lastDirectOutcome: "correct",
    evidenceBasis: "objective",
  };
  await repo.upsertSkillState("user-a", "interval.M3", evidence, "2026-09-03T10:10:00Z");

  assert.equal((await repo.getProfile("user-a"))?.displayName, "A");
  assert.equal((await repo.getProfile("user-b"))?.displayName, "B");
  assert.equal((await repo.getSettings("user-a"))?.requirePreviousLessons, true);
  assert.equal((await repo.getSettings("user-b"))?.requirePreviousLessons, false);
  assert.equal((await repo.recentSessions("user-a")).length, 1);
  assert.equal((await repo.recentSessions("user-b")).length, 1);
  assert.equal((await repo.allSkillStates("user-a")).length, 1);
  assert.equal((await repo.allSkillStates("user-b")).length, 0);
});

test("Supabase REST requests keep user filters and persist the per-user locking flag", async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("user_learning_settings") && (!init.method || init.method === "GET")) {
      return { ok: true, status: 200, text: async () => JSON.stringify([{ user_id: "user-a", desired_retention: .9, maximum_interval_days: 36500, require_previous_lessons: false, curriculum_version: "v0.7", scheduler_version: "fsrs-6" }]) };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };
  const repo = new SupabaseRestTutorRepository({ url: "https://project.supabase.co", publishableKey: "sb_publishable_test", accessToken: "jwt", fetchImpl });
  const loaded = await repo.getSettings("user-a");
  await repo.upsertSettings(settings("user-a", false));
  await repo.allSkillStates("user-a");
  await repo.recentSessions("user-a", 5);

  assert.equal(loaded?.requirePreviousLessons, false);
  assert.ok(calls.some((x) => x.url.includes("user_id=eq.user-a")));
  const write = calls.find((x) => x.url.includes("user_learning_settings") && x.init.method === "POST");
  assert.equal(JSON.parse(write.init.body).require_previous_lessons, false);
});

test("curriculum unlock setting changes access only, not learning-state predicates", () => {
  const source = fs.readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
  assert.match(source, /requirePreviousLessons/);
  assert.match(source, /function curriculumAccessAllowed/);
  assert.match(source, /userSettings\?\.requirePreviousLessons === false/);
  assert.match(source, /function evidenceReady/);
  assert.match(source, /if \(evidence\?\.retained/);
  assert.match(source, /if \(state\.itemIndex >= state\.queue\.length && state\.manualStudy\)/);
  assert.match(source, /This changes access only/);
});
