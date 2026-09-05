import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  BrowserStorageTutorRepository,
  SKILLS,
  freshLessonProgress,
  lessonCompletionEligibleAfterRound,
  markLessonCompleted,
} from "../dist/index.js";
import {
  guidedLessonUnlocked,
  learningSummary,
  lessonCompleted,
  lessonDisplayState,
  lessonProgressMap,
  phaseAssessedLessonsComplete,
  phaseEntryAllowedForGuidedFlow,
} from "../web/final-ui.js";

const app = fs.readFileSync("web/app-block8.js", "utf8");
const phase1 = SKILLS.filter((skill) => skill.phase === 1);
const first = phase1[0];
const second = phase1[1];

function nextLessonUnlocked({ requirePreviousLessons = true, lessonRows = [], progressRows = [] } = {}) {
  const byLesson = lessonProgressMap(lessonRows);
  return guidedLessonUnlocked({
    skill: second,
    indexInPhase: 1,
    siblings: phase1,
    lessonProgressById: byLesson,
    phaseEntryAllowed: phaseEntryAllowedForGuidedFlow(1, progressRows, requirePreviousLessons),
    requirePreviousLessons,
  });
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
}

function partialAttempt(userId, skillId, index = 1, outcome = "correct") {
  return {
    userId,
    sessionId: `partial-${index}`,
    skillId,
    promptSignature: `partial-prompt-${index}`,
    exampleSignature: `partial-example-${index}`,
    occurredAt: new Date(1_800_000_000_000 + index * 1000).toISOString(),
    outcome,
    independent: true,
    directEvidence: true,
    context: "acquisition",
    eventKind: "response",
    submissionIndex: 1,
    firstSubmission: true,
    responseMode: "constructed",
    guidance: "none",
    solutionSeen: false,
    coldProbe: false,
  };
}

test("opening a lesson does not unlock its successor", () => {
  assert.equal(nextLessonUnlocked(), false);
  assert.equal(lessonCompleted(undefined), false);
});

test("one answered question cannot unlock the next lesson without lesson completion", () => {
  const readyButIncomplete = [{ skillId: first.id, evidence: { state: "ready", ready: true, fragile: false } }];
  const summary = learningSummary(SKILLS, readyButIncomplete, [], []);
  assert.equal(summary.completed, 0);
  assert.equal(summary.learning, 1);
  assert.equal(nextLessonUnlocked(), false);
});

test("several or half-round answers still cannot unlock while lesson completion is absent", () => {
  for (const answered of [2, 7, 15, 29]) {
    const fakeEvidence = { state: answered > 1 ? "ready" : "acquiring", ready: answered > 1, fragile: false };
    assert.equal(lessonDisplayState(fakeEvidence, undefined), "in-progress");
    assert.equal(nextLessonUnlocked(), false, `${answered} partial answers`);
  }
});

test("a finished round that has not satisfied adaptive READY cannot complete or unlock the lesson", () => {
  const progress = freshLessonProgress(first.id);
  assert.equal(lessonCompletionEligibleAfterRound(progress, { ready: false, fragile: false }), false);
  assert.equal(lessonCompletionEligibleAfterRound(progress, { ready: true, fragile: true }), false);
  assert.equal(nextLessonUnlocked({ lessonRows: [progress] }), false);
});

test("failed partial work remains in progress and does not unlock", () => {
  assert.equal(lessonDisplayState({ state: "acquiring", ready: false, fragile: false }, undefined), "in-progress");
  assert.equal(nextLessonUnlocked(), false);
});

test("Back only stops the session and navigates; it never marks lesson completion", () => {
  const handler = app.match(/document\.querySelector\("#exitPractice"\)\.onclick = async \(\) => \{[\s\S]*?\n  \};/i)?.[0] ?? "";
  assert.match(handler, /completeSession\([^\n]+"learner-stopped"\)/);
  assert.match(handler, /navigate\("learn"\)/);
  assert.doesNotMatch(handler, /markLessonCompleted|upsertLessonProgress|completionCount/);
});

test("refresh/reopen preserves partial evidence but no lesson completion or successor unlock", async () => {
  const storage = memoryStorage();
  const userId = "refresh-user";
  const repo1 = new BrowserStorageTutorRepository(storage, "regression");
  await repo1.appendAttempt(partialAttempt(userId, first.id));
  await repo1.upsertSkillState(userId, first.id, { state: "ready", ready: true, retained: false, fragile: false });

  const repo2 = new BrowserStorageTutorRepository(storage, "regression");
  assert.equal((await repo2.attemptsForSkill(userId, first.id)).length, 1);
  assert.equal((await repo2.allSkillStates(userId))[0].evidence.ready, true);
  const lessonRows = await repo2.allLessonProgress(userId);
  assert.deepEqual(lessonRows, []);
  assert.equal(nextLessonUnlocked({ lessonRows }), false);
});

test("logout/login semantics keep the same user's partial work isolated and incomplete", async () => {
  const storage = memoryStorage();
  const repo = new BrowserStorageTutorRepository(storage, "login-regression");
  await repo.appendAttempt(partialAttempt("user-a", first.id));
  await repo.upsertSkillState("user-a", first.id, { state: "acquiring", ready: false, retained: false, fragile: false });

  const signedBackIn = new BrowserStorageTutorRepository(storage, "login-regression");
  assert.equal((await signedBackIn.attemptsForSkill("user-a", first.id)).length, 1);
  assert.deepEqual(await signedBackIn.allLessonProgress("user-a"), []);
  assert.equal((await signedBackIn.attemptsForSkill("user-b", first.id)).length, 0);
  assert.deepEqual(await signedBackIn.allLessonProgress("user-b"), []);
  assert.equal(nextLessonUnlocked(), false);
});

test("partial learning evidence is represented as IN PROGRESS, not complete", () => {
  assert.equal(lessonDisplayState({ state: "acquiring", ready: false }, undefined), "in-progress");
  assert.equal(lessonDisplayState({ state: "ready", ready: true, fragile: false }, undefined), "in-progress");
  assert.equal(lessonDisplayState(undefined, undefined), "not-started");
});

test("legitimate round completion plus adaptive READY records completion and unlocks the successor", async () => {
  const storage = memoryStorage();
  const repo = new BrowserStorageTutorRepository(storage, "completion-regression");
  let progress = freshLessonProgress(first.id);
  assert.equal(lessonCompletionEligibleAfterRound(progress, { ready: true, fragile: false }), true);
  progress = markLessonCompleted(progress, "2026-09-05T06:00:00.000Z");
  await repo.upsertLessonProgress("complete-user", progress);

  const persisted = await repo.allLessonProgress("complete-user");
  assert.equal(lessonCompleted(persisted[0]), true);
  assert.equal(nextLessonUnlocked({ lessonRows: persisted }), true);
});

test("Require Previous Lessons OFF allows access without fabricating completion, and ON restores the lock", () => {
  const lessonRows = [];
  assert.equal(nextLessonUnlocked({ requirePreviousLessons: true, lessonRows }), false);
  assert.equal(nextLessonUnlocked({ requirePreviousLessons: false, lessonRows }), true);
  assert.equal(lessonRows.length, 0);
  assert.equal(nextLessonUnlocked({ requirePreviousLessons: true, lessonRows }), false);
});

test("checkpoint availability requires both adaptive readiness and persisted assessed-lesson completion", () => {
  const phase1Assessed = phase1.filter((skill) => skill.assessed !== false && skill.blocksPhaseCompletion !== false && skill.contentKind !== "reference");
  const allCompleted = phase1Assessed.map((skill) => ({ lessonId: skill.id, completionCount: 1 }));
  assert.equal(phaseAssessedLessonsComplete(SKILLS, 1, []), false);
  assert.equal(phaseAssessedLessonsComplete(SKILLS, 1, allCompleted.slice(0, -1)), false);
  assert.equal(phaseAssessedLessonsComplete(SKILLS, 1, allCompleted), true);
  assert.match(app, /phaseCoreReady\(phase, readyIds\)\s*&&\s*phaseAssessedLessonsComplete/);
});

test("starting or partially answering a checkpoint cannot unlock the next phase", () => {
  assert.equal(phaseEntryAllowedForGuidedFlow(2, [], true), false);
  assert.equal(phaseEntryAllowedForGuidedFlow(2, [{ phase: 1, updatedAt: "2026-09-05T06:00:00Z" }], true), false);
  assert.match(app, /if \(evaluation\.passed\) \{[\s\S]*checkpointPassedAt:/);
  const exitHandler = app.match(/document\.querySelector\("#exitCheckpoint"\)\.onclick = \(\) =>[^;]+;/)?.[0] ?? "";
  assert.match(exitHandler, /navigate\(/);
  assert.doesNotMatch(exitHandler, /upsertPhaseProgress|checkpointPassedAt|validatedEntryAt/);
});

test("passing the checkpoint unlocks exactly the next guided phase", () => {
  const passed = [{ phase: 1, checkpointPassedAt: "2026-09-05T06:05:00Z" }];
  assert.equal(phaseEntryAllowedForGuidedFlow(2, passed, true), true);
  assert.equal(phaseEntryAllowedForGuidedFlow(3, passed, true), false);
});
