import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveSkillEvidence,
  nextAcquisitionAction,
  stateSatisfiesPrerequisite,
} from "../dist/learning/index.js";

const a = (overrides = {}) => ({
  skillId: "interval.M3",
  sessionId: "s1",
  promptSignature: "C:M3",
  occurredAt: "2026-09-01T10:00:00Z",
  outcome: "correct",
  independent: true,
  directEvidence: true,
  context: "acquisition",
  ...overrides,
});

test("three varied independent direct successes make an atomic skill READY", () => {
  const evidence = deriveSkillEvidence([
    a({ promptSignature: "C:M3", occurredAt: "2026-09-01T10:00:00Z" }),
    a({ promptSignature: "F#:M3", occurredAt: "2026-09-01T10:03:00Z" }),
    a({ promptSignature: "Bb:M3", occurredAt: "2026-09-01T10:06:00Z" }),
  ]);
  assert.equal(evidence.state, "ready");
  assert.equal(evidence.ready, true);
  assert.equal(stateSatisfiesPrerequisite(evidence), true);
});

test("repeating the same prompt does not establish READY", () => {
  const evidence = deriveSkillEvidence([
    a({ occurredAt: "2026-09-01T10:00:00Z" }),
    a({ occurredAt: "2026-09-01T10:03:00Z" }),
    a({ occurredAt: "2026-09-01T10:06:00Z" }),
  ]);
  assert.equal(evidence.state, "acquiring");
  assert.equal(evidence.acquisitionDistinctSuccessfulPrompts, 1);
});

test("hinted or revealed answers do not count as positive READY evidence", () => {
  const evidence = deriveSkillEvidence([
    a({ promptSignature: "C:M3" }),
    a({ promptSignature: "F#:M3", outcome: "hinted", independent: false, occurredAt: "2026-09-01T10:03:00Z" }),
    a({ promptSignature: "Bb:M3", outcome: "revealed", independent: false, occurredAt: "2026-09-01T10:06:00Z" }),
  ]);
  assert.equal(evidence.acquisitionIndependentSuccesses, 1);
  assert.equal(evidence.ready, false);
});

test("a final unrepaired direct failure prevents READY", () => {
  const evidence = deriveSkillEvidence([
    a({ promptSignature: "C:M3", occurredAt: "2026-09-01T10:00:00Z" }),
    a({ promptSignature: "F#:M3", occurredAt: "2026-09-01T10:03:00Z" }),
    a({ promptSignature: "Bb:M3", occurredAt: "2026-09-01T10:06:00Z" }),
    a({ promptSignature: "Db:M3", outcome: "incorrect", occurredAt: "2026-09-01T10:09:00Z" }),
  ]);
  assert.equal(evidence.ready, false);
});

test("three successful delayed cold review sessions establish RETAINED", () => {
  const attempts = [
    a({ promptSignature: "C:M3", occurredAt: "2026-09-01T10:00:00Z" }),
    a({ promptSignature: "F#:M3", occurredAt: "2026-09-01T10:03:00Z" }),
    a({ promptSignature: "Bb:M3", occurredAt: "2026-09-01T10:06:00Z" }),
    a({ sessionId: "r1", context: "review", coldProbe: true, promptSignature: "D:M3", occurredAt: "2026-09-03T10:00:00Z" }),
    a({ sessionId: "r2", context: "review", coldProbe: true, promptSignature: "Ab:M3", occurredAt: "2026-09-10T10:00:00Z" }),
    a({ sessionId: "r3", context: "review", coldProbe: true, promptSignature: "B:M3", occurredAt: "2026-09-24T10:00:00Z" }),
  ];
  const evidence = deriveSkillEvidence(attempts);
  assert.equal(evidence.state, "retained");
  assert.equal(evidence.successfulDelayedReviewSessions, 3);
});

test("two cold-review failures in the latest three review sessions mark a READY skill FRAGILE", () => {
  const attempts = [
    a({ promptSignature: "C:M3" }),
    a({ promptSignature: "F#:M3", occurredAt: "2026-09-01T10:03:00Z" }),
    a({ promptSignature: "Bb:M3", occurredAt: "2026-09-01T10:06:00Z" }),
    a({ sessionId: "r1", context: "review", coldProbe: true, occurredAt: "2026-09-03T10:00:00Z", outcome: "incorrect" }),
    a({ sessionId: "r2", context: "review", coldProbe: true, occurredAt: "2026-09-10T10:00:00Z", outcome: "correct" }),
    a({ sessionId: "r3", context: "review", coldProbe: true, occurredAt: "2026-09-24T10:00:00Z", outcome: "incorrect" }),
  ];
  const evidence = deriveSkillEvidence(attempts);
  assert.equal(evidence.state, "fragile");
  assert.equal(stateSatisfiesPrerequisite(evidence), false);
});

test("repeated acquisition failures escalate feedback to scaffolding and then stop", () => {
  const first = [a({ outcome: "incorrect" })];
  assert.equal(nextAcquisitionAction(first), "give-corrective-feedback");
  const second = [...first, a({ outcome: "incorrect", promptSignature: "D:M3", occurredAt: "2026-09-01T10:03:00Z" })];
  assert.equal(nextAcquisitionAction(second), "scaffold-and-retry");
  const third = [...second, a({ outcome: "incorrect", promptSignature: "E:M3", occurredAt: "2026-09-01T10:06:00Z" })];
  assert.equal(nextAcquisitionAction(third), "stop-unit-for-now");
});

test('self-reported physical application can establish operational READY while remaining labeled self-report', () => {
  const attempts = [0,1,2].map((i) => ({
    skillId:'guitar.intervals', sessionId:'s1', promptSignature:`guitar.intervals:${i}`,
    occurredAt:`2026-09-03T12:0${i}:00Z`, outcome:'correct', independent:true,
    directEvidence:true, context:'acquisition', coldProbe:false, evidenceSource:'self-report'
  }));
  const evidence = deriveSkillEvidence(attempts);
  assert.equal(evidence.ready, true);
  assert.equal(evidence.evidenceBasis, 'self-report');
});
