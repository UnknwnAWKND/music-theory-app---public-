import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryTutorRepository, SupabaseRestTutorRepository } from "../dist/persistence/index.js";

const baseEvidence = {
  state: "ready",
  ready: true,
  retained: false,
  fragile: false,
  acquisitionIndependentSuccesses: 3,
  acquisitionDistinctSuccessfulPrompts: 3,
  successfulDelayedReviewSessions: 0,
  recentColdReviewResults: [],
  lastDirectOutcome: "correct",
};

test("in-memory repository preserves append-only attempts and derived skill snapshots separately", async () => {
  const repo = new InMemoryTutorRepository();
  const session = await repo.createSession("u1", "2026-09-03T12:00:00Z");
  await repo.appendAttempt({
    userId: "u1", sessionId: session.id, skillId: "interval.M3", promptSignature: "M3:C",
    occurredAt: "2026-09-03T12:01:00Z", outcome: "correct", independent: true,
    directEvidence: true, context: "acquisition",
  });
  await repo.upsertSkillState("u1", "interval.M3", baseEvidence, "2026-09-03T12:01:00Z");
  assert.equal((await repo.attemptsForSkill("u1", "interval.M3")).length, 1);
  assert.equal((await repo.allSkillStates("u1"))[0].evidence.state, "ready");
});

test("due-review query only returns cards whose due time has arrived", async () => {
  const repo = new InMemoryTutorRepository();
  const card = (skillId, dueAt) => ({
    skillId, dueAt, stability: 1, difficulty: 5, elapsedDays: 0, scheduledDays: 1,
    learningSteps: 0, reps: 1, lapses: 0, state: "review", schedulerVersion: "fsrs-6",
  });
  await repo.upsertSchedulerCard("u1", card("a", "2026-09-02T12:00:00Z"));
  await repo.upsertSchedulerCard("u1", card("b", "2026-09-04T12:00:00Z"));
  const due = await repo.dueReviews("u1", "2026-09-03T12:00:00Z");
  assert.deepEqual(due.map((x) => x.skillId), ["a"]);
});


test("Supabase REST repository requests a fresh access token for each Data API call", async () => {
  const authHeaders = [];
  let tokenNo = 0;
  const fetchImpl = async (_url, init) => {
    authHeaders.push(init.headers.Authorization);
    return { ok: true, status: 200, text: async () => "[]" };
  };
  const repo = new SupabaseRestTutorRepository({
    url: "https://project.supabase.co",
    publishableKey: "sb_publishable_test",
    getAccessToken: () => `jwt-${++tokenNo}`,
    fetchImpl,
  });
  await repo.allSkillStates("u1");
  await repo.dueReviews("u1", "2026-09-03T12:00:00Z");
  assert.deepEqual(authHeaders, ["Bearer jwt-1", "Bearer jwt-2"]);
});
