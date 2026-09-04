import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveSkillEvidence,
  evidencePolicyForModes,
  nextAcquisitionAction,
  normalizeLearningAttempt,
  stateSatisfiesPrerequisite,
} from "../dist/learning/index.js";

const variedPolicy = evidencePolicyForModes(["construct", "identify"]);
const atomicPolicy = evidencePolicyForModes(["identify"]);

const a = (overrides = {}) => ({
  skillId: "interval.M3",
  sessionId: "s1",
  promptSignature: "interval.M3:0",
  occurredAt: "2026-09-01T10:00:00Z",
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
  evidenceVersion: "v2",
  evidenceSource: "objective",
  ...overrides,
});

function readyAttempts() {
  return [
    a({ promptSignature: "interval.M3:0", exampleSignature: "M3:C", exampleAttributes: { root: "C", interval: "M3" } }),
    a({ promptSignature: "interval.M3:1", exampleSignature: "M3:F#", exampleAttributes: { root: "F#", interval: "M3" }, occurredAt: "2026-09-01T10:03:00Z" }),
  ];
}

test("varied independent first-submission evidence can establish READY without implying RETAINED", () => {
  const evidence = deriveSkillEvidence(readyAttempts(), variedPolicy);
  assert.equal(evidence.ready, true);
  assert.equal(evidence.retained, false);
  assert.equal(evidence.readinessBasis, "varied-independent");
  assert.equal(evidence.distinctSuccessfulExamples, 2);
  assert.equal(stateSatisfiesPrerequisite(evidence), true);
});

test("one semantic example repeated under different prompt ids is not varied evidence", () => {
  const evidence = deriveSkillEvidence([
    a({ promptSignature: "interval.M3:0", exampleSignature: "M3:C" }),
    a({ promptSignature: "interval.M3:1", exampleSignature: "M3:C", occurredAt: "2026-09-01T10:03:00Z" }),
  ], variedPolicy);
  assert.equal(evidence.ready, false);
  assert.equal(evidence.distinctSuccessfulExamples, 1);
});

test("legacy READY progress is preserved but labeled as legacy evidence", () => {
  const legacy = [0, 1, 2].map((i) => ({
    skillId: "interval.generic-number",
    sessionId: "old-session",
    promptSignature: `legacy:${i}`,
    occurredAt: `2026-08-31T10:0${i}:00Z`,
    outcome: "correct",
    independent: true,
    directEvidence: true,
    context: "acquisition",
    evidenceVersion: "legacy-v1",
  }));
  const evidence = deriveSkillEvidence(legacy, atomicPolicy);
  assert.equal(evidence.ready, true);
  assert.equal(evidence.retained, false);
  assert.equal(evidence.readinessBasis, "legacy-v1");
});

test("normalization preserves the first submitted response and marks a later response as retry", () => {
  const first = normalizeLearningAttempt(a({ outcome: "incorrect" }), []);
  const second = normalizeLearningAttempt(a({ outcome: "correct", occurredAt: "2026-09-01T10:01:00Z", firstSubmission: undefined, submissionIndex: undefined, stage: undefined }), [first]);
  assert.equal(first.firstSubmission, true);
  assert.equal(first.submissionIndex, 1);
  assert.equal(first.outcome, "incorrect");
  assert.equal(second.firstSubmission, false);
  assert.equal(second.submissionIndex, 2);
  assert.equal(second.stage, "retry");
  assert.equal(first.outcome, "incorrect", "retry must not rewrite first response history");
});

test("correct after hint is distinguishable from independent correct", () => {
  const evidence = deriveSkillEvidence([
    a({ independent: false, guidance: "hint", outcome: "correct", firstSubmission: true }),
  ], variedPolicy);
  assert.equal(evidence.independentFirstAttemptSuccesses, 0);
  assert.equal(evidence.hintedOrGuidedSuccesses, 1);
  assert.equal(evidence.ready, false);
});

test("answer reveal is a learning event, not successful retrieval evidence", () => {
  const evidence = deriveSkillEvidence([
    a({ eventKind: "answer-reveal", outcome: "revealed", independent: false, directEvidence: false, guidance: "answer-reveal", solutionSeen: true, responseMode: undefined }),
  ], variedPolicy);
  assert.equal(evidence.answerRevealEvents, 1);
  assert.equal(evidence.independentFirstAttemptSuccesses, 0);
  assert.equal(evidence.ready, false);
});

test("cold retrieval is distinguishable from immediate post-instruction response", () => {
  const attempts = [
    ...readyAttempts(),
    a({ eventKind: "explanation", outcome: "exposed", independent: false, directEvidence: false, guidance: "explanation", responseMode: undefined, promptSignature: "lesson:M3", occurredAt: "2026-09-01T10:05:00Z" }),
    a({ promptSignature: "M3:guided", exampleSignature: "M3:A", guidance: "explanation", independent: false, occurredAt: "2026-09-01T10:06:00Z" }),
    a({ sessionId: "r1", context: "review", coldProbe: true, promptSignature: "M3:review", exampleSignature: "M3:D", occurredAt: "2026-09-05T10:00:00Z" }),
  ];
  const evidence = deriveSkillEvidence(attempts, variedPolicy);
  assert.equal(evidence.immediatePostInstructionResponses, 1);
  assert.equal(evidence.successfulColdRetrievals, 1);
  assert.equal(evidence.retained, false);
});

test("failed cold retrieval remains failed after successful relearning", () => {
  const attempts = [
    ...readyAttempts(),
    a({ sessionId: "r1", context: "review", coldProbe: true, outcome: "incorrect", promptSignature: "cold-1", exampleSignature: "M3:D", occurredAt: "2026-09-05T10:00:00Z" }),
    a({ sessionId: "r1", context: "review", coldProbe: false, outcome: "correct", independent: false, guidance: "explanation", stage: "relearning", promptSignature: "repair-1", exampleSignature: "M3:E", occurredAt: "2026-09-05T10:05:00Z" }),
  ];
  const evidence = deriveSkillEvidence(attempts, variedPolicy);
  assert.equal(evidence.failedColdRetrievals, 1);
  assert.equal(evidence.successfulColdRetrievals, 0);
  assert.equal(evidence.successfulRelearningEvents, 1);
  assert.equal(evidence.lastColdOutcome, "failure");
  assert.equal(evidence.ready, true, "forgetting later must not erase established readiness");
  assert.equal(evidence.retentionAtRisk, true);
});

test("RETAINED requires repeated successful cold retrieval across separate sessions", () => {
  const attempts = [
    ...readyAttempts(),
    a({ sessionId: "r1", context: "review", coldProbe: true, promptSignature: "cold-1", exampleSignature: "M3:D", occurredAt: "2026-09-05T10:00:00Z" }),
    a({ sessionId: "r2", context: "review", coldProbe: true, promptSignature: "cold-2", exampleSignature: "M3:A", occurredAt: "2026-09-14T10:00:00Z" }),
  ];
  const evidence = deriveSkillEvidence(attempts, variedPolicy);
  assert.equal(evidence.ready, true);
  assert.equal(evidence.retained, true);
  assert.equal(evidence.successfulColdRetrievals, 2);
});

test("later retention failure weakens current retention without erasing historical learning", () => {
  const attempts = [
    ...readyAttempts(),
    a({ sessionId: "r1", context: "review", coldProbe: true, promptSignature: "cold-1", exampleSignature: "M3:D", occurredAt: "2026-09-05T10:00:00Z" }),
    a({ sessionId: "r2", context: "review", coldProbe: true, promptSignature: "cold-2", exampleSignature: "M3:A", occurredAt: "2026-09-14T10:00:00Z" }),
    a({ sessionId: "r3", context: "review", coldProbe: true, outcome: "incorrect", promptSignature: "cold-3", exampleSignature: "M3:B", occurredAt: "2026-09-28T10:00:00Z" }),
  ];
  const evidence = deriveSkillEvidence(attempts, variedPolicy);
  assert.equal(evidence.ready, true);
  assert.equal(evidence.everRetained, true);
  assert.equal(evidence.retained, false);
  assert.equal(evidence.retentionAtRisk, true);
});

test("recognition, constructed, discrimination, and application responses remain separate evidence", () => {
  const attempts = [
    a({ responseMode: "recognition", promptSignature: "r", exampleSignature: "r" }),
    a({ responseMode: "constructed", promptSignature: "c", exampleSignature: "c", occurredAt: "2026-09-01T10:01:00Z" }),
    a({ responseMode: "discrimination", promptSignature: "d", exampleSignature: "d", occurredAt: "2026-09-01T10:02:00Z" }),
    a({ responseMode: "application", context: "transfer", promptSignature: "a", exampleSignature: "a", occurredAt: "2026-09-01T10:03:00Z" }),
  ];
  const evidence = deriveSkillEvidence(attempts, variedPolicy);
  assert.equal(evidence.recognitionSuccesses, 1);
  assert.equal(evidence.constructedSuccesses, 1);
  assert.equal(evidence.discriminationSuccesses, 1);
  assert.equal(evidence.applicationSuccesses, 1);
});

test("structured example variety and recurring confusions can be represented", () => {
  const evidence = deriveSkillEvidence([
    a({ confusionWith: "m3" }),
    a({ promptSignature: "M3:F", exampleSignature: "M3:F", exampleAttributes: { root: "F", interval: "M3" }, confusionWith: "m3", occurredAt: "2026-09-01T10:03:00Z" }),
  ], variedPolicy);
  assert.equal(evidence.distinctSuccessfulExamples, 2);
  assert.equal(evidence.confusions.m3, 2);
});

test("normalization can infer relearning after a failed cold probe without rewriting the cold failure", () => {
  const coldFailure = normalizeLearningAttempt(a({ sessionId: "r1", context: "review", coldProbe: true, outcome: "incorrect", promptSignature: "cold", occurredAt: "2026-09-05T10:00:00Z" }), []);
  const repair = normalizeLearningAttempt(a({ sessionId: "r1", context: "review", coldProbe: false, independent: false, guidance: "explanation", promptSignature: "repair", occurredAt: "2026-09-05T10:05:00Z", stage: undefined }), [coldFailure]);
  assert.equal(coldFailure.outcome, "incorrect");
  assert.equal(coldFailure.coldProbe, true);
  assert.equal(repair.stage, "relearning");
});

test("repeated acquisition failures still escalate to scaffold and then stop rather than endless identical drilling", () => {
  const first = [a({ outcome: "incorrect" })];
  assert.equal(nextAcquisitionAction(first, variedPolicy), "give-corrective-feedback");
  const second = [...first, a({ outcome: "incorrect", promptSignature: "D:M3", exampleSignature: "M3:D", occurredAt: "2026-09-01T10:03:00Z" })];
  assert.equal(nextAcquisitionAction(second, variedPolicy), "scaffold-and-retry");
  const third = [...second, a({ outcome: "incorrect", promptSignature: "E:M3", exampleSignature: "M3:E", occurredAt: "2026-09-01T10:06:00Z" })];
  assert.equal(nextAcquisitionAction(third, variedPolicy), "stop-unit-for-now");
});
