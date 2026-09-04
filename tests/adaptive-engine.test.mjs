import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  decideAdaptivePractice,
  deriveSkillEvidence,
  evidencePolicyForModes,
  evidenceQualityForAttempt,
  interleavingTargets,
  planSession,
  selectAdaptiveExercise,
  semanticExerciseSignature,
  SKILLS,
} from "../dist/index.js";

const t0 = Date.parse("2026-09-01T12:00:00Z");
const at = (minutes) => new Date(t0 + minutes * 60_000).toISOString();

function attempt(overrides = {}) {
  return {
    skillId: "interval.M3",
    sessionId: "s1",
    promptSignature: "p1",
    occurredAt: at(0),
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
    exampleSignature: "ex1",
    evidenceVersion: "v2",
    ...overrides,
  };
}

const variedPolicy = evidencePolicyForModes(["construct", "identify"]);

test("three easy correct answers do not create READY merely because the count is three", () => {
  const attempts = [
    attempt({ promptSignature: "p1", responseMode: "recognition", exampleSignature: "same" }),
    attempt({ promptSignature: "p2", occurredAt: at(1), responseMode: "recognition", exampleSignature: "same" }),
    attempt({ promptSignature: "p3", occurredAt: at(2), responseMode: "recognition", exampleSignature: "same" }),
  ];
  const evidence = deriveSkillEvidence(attempts, variedPolicy);
  assert.equal(evidence.ready, false);
  assert.equal(evidence.independentFirstAttemptSuccesses, 3);
});

test("varied independent generative evidence can finish acquisition without pointless extra questions", () => {
  const attempts = [
    attempt({ promptSignature: "p1", exampleSignature: "root:C|M3", responseMode: "constructed" }),
    attempt({ promptSignature: "p2", occurredAt: at(2), exampleSignature: "root:F#|M3", responseMode: "constructed" }),
  ];
  const evidence = deriveSkillEvidence(attempts, variedPolicy);
  assert.equal(evidence.ready, true);
  assert.equal(evidence.retained, false);
  assert.equal(decideAdaptivePractice(attempts, evidence).action, "complete");
});

test("a later unresolved independent miss removes current READY without erasing earlier successes", () => {
  const attempts = [
    attempt({ promptSignature: "p1", exampleSignature: "root:C|M3" }),
    attempt({ promptSignature: "p2", occurredAt: at(2), exampleSignature: "root:F#|M3" }),
    attempt({ promptSignature: "p3", occurredAt: at(3), outcome: "incorrect", exampleSignature: "root:Bb|M3" }),
  ];
  const evidence = deriveSkillEvidence(attempts, variedPolicy);
  assert.equal(evidence.ready, false);
  assert.equal(evidence.independentFirstAttemptSuccesses, 2);
  assert.equal(evidence.independentFirstAttemptFailures, 1);
});

test("hinted and revealed work is weaker than clean independent retrieval", () => {
  assert.equal(evidenceQualityForAttempt(attempt()), "strong");
  assert.equal(evidenceQualityForAttempt(attempt({ responseMode: "recognition" })), "moderate");
  assert.equal(evidenceQualityForAttempt(attempt({ independent: false, guidance: "hint" })), "weak");
  assert.equal(evidenceQualityForAttempt(attempt({ eventKind: "answer-reveal", outcome: "revealed", directEvidence: false, independent: false, solutionSeen: true })), "learning-event");
  assert.equal(evidenceQualityForAttempt(attempt({ context: "review", coldProbe: true, responseMode: "constructed" })), "very-strong");
});

test("inconsistent acquisition expands practice and repeated failures trigger reteaching rather than a fixed count", () => {
  const failures = [
    attempt({ outcome: "incorrect", promptSignature: "f1" }),
    attempt({ outcome: "incorrect", promptSignature: "f2", occurredAt: at(1), exampleSignature: "ex2" }),
  ];
  const evidence = deriveSkillEvidence(failures, variedPolicy);
  assert.equal(decideAdaptivePractice(failures, evidence).action, "reteach");
  const three = [...failures, attempt({ outcome: "incorrect", promptSignature: "f3", occurredAt: at(2), exampleSignature: "ex3" })];
  assert.equal(decideAdaptivePractice(three, deriveSkillEvidence(three, variedPolicy)).action, "stop-for-now");
});

test("adaptive selector avoids recent duplicate prompts and prefers unseen semantic examples", () => {
  const first = selectAdaptiveExercise("interval.M3", [], 0, 8);
  const history = [attempt({ skillId: "interval.M3", promptSignature: first.exercise.id, exampleSignature: first.semanticSignature })];
  const next = selectAdaptiveExercise("interval.M3", history, first.index, 8);
  assert.notEqual(next.exercise.id, first.exercise.id);
  assert.notEqual(semanticExerciseSignature(next.exercise), first.semanticSignature);
});

test("small exercise pools still return a usable question", () => {
  const selected = selectAdaptiveExercise("major.formula", [attempt({ skillId: "major.formula", promptSignature: "major.formula:0" })], 0, 1);
  assert.equal(selected.exercise.skillId, "major.formula");
});

test("confusion history triggers interleaving only after both related skills are established", () => {
  const ready = (confusions = {}) => ({
    ...deriveSkillEvidence([
      attempt({ promptSignature: "a", exampleSignature: "a" }),
      attempt({ promptSignature: "b", occurredAt: at(1), exampleSignature: "b" }),
    ], variedPolicy),
    confusions,
  });
  const map = new Map([
    ["interval.m3", ready({ "interval.M3": 2 })],
    ["interval.M3", ready()],
  ]);
  assert.deepEqual(interleavingTargets(map), ["interval.m3", "interval.M3"]);
  map.set("interval.M3", { ...ready(), ready: false, state: "acquiring" });
  assert.deepEqual(interleavingTargets(map), ["interval.m3"]);
  map.set("interval.m3", { ...ready({ "interval.M3": 2 }), state: "retained", retained: true });
  assert.deepEqual(interleavingTargets(map), []);
});

test("long-break recovery prioritizes overdue work before unnecessary new material", () => {
  const plan = planSession({
    evidenceBySkill: new Map(),
    dueReviews: [{ skillId: "interval.generic-number", dueAt: "2026-08-01T00:00:00Z", urgency: 10 }],
    nowIso: "2026-09-03T12:00:00Z",
  });
  assert.equal(plan.newSkillId, undefined);
  assert.equal(plan.reasonNoNewSkill, "long-break-recovery");
  assert.deepEqual(plan.reviewSkillIds, ["interval.generic-number"]);
});

test("session planner can be genuinely caught up without manufacturing busywork", () => {
  const allReady = new Map();
  for (const skill of SKILLS) {
    allReady.set(skill.id, { ready: true, retained: true, fragile: false, state: "retained", confusions: {} });
  }
  const plan = planSession({ evidenceBySkill: allReady, dueReviews: [], nowIso: "2026-09-03T12:00:00Z" });
  assert.equal(plan.newSkillId, undefined);
  assert.deepEqual(plan.reviewSkillIds, []);
  assert.deepEqual(plan.repairSkillIds, []);
  assert.deepEqual(plan.interleaveSkillIds, []);
  assert.equal(plan.reasonNoNewSkill, "nothing-unlocked");
});

test("browser Prompt 2 flow uses adaptive selection, hints, repair fading, and no checkpoint placement code", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  assert.match(app, /selectAdaptiveExercise/);
  assert.match(app, /decideAdaptivePractice/);
  assert.match(app, /Need a hint\?/);
  assert.match(app, /eventKind:\s*"hint"/);
  assert.match(app, /review-repair/);
  assert.match(app, /guidanceForNext = "none"/);
  assert.doesNotMatch(app, /phase checkpoint|skip-ahead placement|tested-out phase/i);
});
