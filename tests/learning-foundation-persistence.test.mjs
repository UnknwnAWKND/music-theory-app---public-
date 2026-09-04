import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { InMemoryTutorRepository, SupabaseRestTutorRepository } from "../dist/persistence/index.js";

const richAttempt = (userId, sessionId, overrides = {}) => ({
  userId,
  sessionId,
  skillId: "interval.M3",
  promptSignature: "interval.M3:0",
  occurredAt: "2026-09-03T12:01:00Z",
  outcome: "correct",
  independent: true,
  directEvidence: true,
  context: "acquisition",
  eventKind: "response",
  submissionIndex: 1,
  firstSubmission: true,
  stage: "initial",
  responseMode: "constructed",
  guidance: "none",
  solutionSeen: false,
  exampleSignature: "M3:C",
  exampleAttributes: { root: "C", interval: "M3" },
  confusionWith: undefined,
  priorRelevantExposureAt: "2026-09-03T11:55:00Z",
  elapsedSinceRelevantExposureMs: 360000,
  evidenceVersion: "v2",
  evidenceSource: "objective",
  ...overrides,
});

test("User A learning evidence never appears in User B evidence queries", async () => {
  const repo = new InMemoryTutorRepository();
  const a = await repo.createSession("user-a", "2026-09-03T12:00:00Z");
  const b = await repo.createSession("user-b", "2026-09-03T12:00:00Z");
  await repo.appendAttempt(richAttempt("user-a", a.id));
  await repo.appendAttempt(richAttempt("user-b", b.id, { promptSignature: "interval.M3:1", exampleSignature: "M3:F" }));

  const rowsA = await repo.attemptsForSkill("user-a", "interval.M3");
  const rowsB = await repo.attemptsForSkill("user-b", "interval.M3");
  assert.equal(rowsA.length, 1);
  assert.equal(rowsB.length, 1);
  assert.equal(rowsA[0].userId, "user-a");
  assert.equal(rowsB[0].userId, "user-b");
  assert.notEqual(rowsA[0].promptSignature, rowsB[0].promptSignature);
});

test("Supabase REST writes and reads the richer evidence fields without collapsing them into one correctness count", async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (init.method === "POST" && String(url).includes("learning_attempts")) {
      const body = JSON.parse(init.body);
      return { ok: true, status: 201, text: async () => JSON.stringify([{ id: "a1", ...body }]) };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };
  const repo = new SupabaseRestTutorRepository({
    url: "https://project.supabase.co",
    publishableKey: "sb_publishable_test",
    accessToken: "jwt",
    fetchImpl,
  });
  const row = await repo.appendAttempt(richAttempt("user-a", "session-a", { confusionWith: "m3" }));
  assert.equal(row.firstSubmission, true);
  assert.equal(row.responseMode, "constructed");
  assert.equal(row.exampleSignature, "M3:C");
  assert.equal(row.confusionWith, "m3");
  const write = calls.find((x) => x.init.method === "POST");
  const body = JSON.parse(write.init.body);
  assert.equal(body.first_submission, true);
  assert.equal(body.guidance, "none");
  assert.equal(body.example_attributes.root, "C");
  assert.equal(body.evidence_version, "v2");
});

test("browser source records explanations and answer reveals as learning events rather than successful retrieval", () => {
  const source = fs.readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
  assert.match(source, /eventKind:\s*"explanation"/);
  assert.match(source, /outcome:\s*"exposed"/);
  assert.match(source, /eventKind:\s*"answer-reveal"/);
  assert.match(source, /outcome:\s*"revealed"/);
  assert.match(source, /responseModeForEvidence/);
  assert.match(source, /exampleSignatureForExercise/);
});

test("old immediate three-correct fast path is disabled pending later diagnostic placement work", () => {
  const source = fs.readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /direct\.length\s*>?=\s*3/);
  assert.match(source, /async function maybeAppendFastPath\(\) \{ return false; \}/);
});

test("completed browser source has no genuine Phase 0 route or retired curriculum ids", () => {
  const source = fs.readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /Phase 0/);
  assert.doesNotMatch(source, /0:\s*"Foundations"/);
  assert.doesNotMatch(source, /pitch\.accidentals|pitch\.half-whole/);
  assert.match(source, /length:\s*12/);
});
