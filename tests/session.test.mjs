import assert from "node:assert/strict";
import test from "node:test";
import { planSession } from "../dist/session/index.js";
import { SKILLS } from "../dist/curriculum/index.js";

const evidence = (state, ready = false, fragile = false) => ({
  state,
  ready,
  retained: state === "retained",
  fragile,
  retentionAtRisk: false,
  everRetained: state === "retained",
  readinessBasis: ready ? "legacy-v1" : "none",
  acquisitionIndependentSuccesses: ready ? 3 : 0,
  acquisitionDistinctSuccessfulPrompts: ready ? 3 : 0,
  successfulDelayedReviewSessions: state === "retained" ? 2 : 0,
  independentFirstAttemptSuccesses: 0,
  independentFirstAttemptFailures: 0,
  distinctSuccessfulExamples: 0,
  recognitionSuccesses: 0,
  constructedSuccesses: 0,
  discriminationSuccesses: 0,
  applicationSuccesses: 0,
  hintedOrGuidedSuccesses: 0,
  answerRevealEvents: 0,
  immediatePostInstructionResponses: 0,
  successfulColdRetrievals: state === "retained" ? 2 : 0,
  failedColdRetrievals: 0,
  successfulRelearningEvents: 0,
  recentColdReviewResults: [],
  evidenceBasis: "objective",
  confusions: {},
  evidenceVersion: "v2",
});

test("session planner prioritizes fragile repairs and blocks new material", () => {
  const map = new Map([["interval.generic-number", evidence("fragile", true, true)]]);
  const plan = planSession({ evidenceBySkill: map, dueReviews: [] });
  assert.deepEqual(plan.repairSkillIds, ["interval.generic-number"]);
  assert.equal(plan.newSkillId, undefined);
  assert.equal(plan.reasonNoNewSkill, "repair-prerequisite");
});

test("session planner caps normal review batch at six", () => {
  const due = SKILLS.slice(0, 8).map((skill, i) => ({ skillId: skill.id, dueAt: `2026-09-0${i+1}T00:00:00Z`, urgency: i }));
  const plan = planSession({ evidenceBySkill: new Map(), dueReviews: due });
  assert.equal(plan.reviewSkillIds.length, 6);
});

test("with no repair, backlog, or current acquisition, planner picks Phase 1 entry skill", () => {
  const plan = planSession({ evidenceBySkill: new Map(), dueReviews: [] });
  assert.equal(plan.newSkillId, "interval.generic-number");
});

test("retired skill IDs are ignored by the current session planner", () => {
  const plan = planSession({
    evidenceBySkill: new Map([["pitch.accidentals", evidence("fragile", true, true)]]),
    dueReviews: [{ skillId: "pitch.accidentals", dueAt: "2026-09-01T00:00:00Z", urgency: 10 }],
  });
  assert.deepEqual(plan.repairSkillIds, []);
  assert.deepEqual(plan.reviewSkillIds, []);
  assert.equal(plan.newSkillId, "interval.generic-number");
});

test("session planner does not auto-introduce optional enrichment skills", () => {
  const evidenceMap = new Map();
  for (const skill of SKILLS) if (!skill.optional) evidenceMap.set(skill.id, evidence("ready", true, false));
  const plan = planSession({ evidenceBySkill: evidenceMap, dueReviews: [] });
  assert.equal(plan.newSkillId, undefined);
  assert.equal(plan.reasonNoNewSkill, "nothing-unlocked");
});
