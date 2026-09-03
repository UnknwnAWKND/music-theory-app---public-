import assert from "node:assert/strict";
import test from "node:test";
import { planSession } from "../dist/session/index.js";
import { SKILLS } from "../dist/curriculum/index.js";

const evidence = (state, ready = false, fragile = false) => ({
  state,
  ready,
  retained: state === "retained",
  fragile,
  acquisitionIndependentSuccesses: ready ? 3 : 0,
  acquisitionDistinctSuccessfulPrompts: ready ? 3 : 0,
  successfulDelayedReviewSessions: state === "retained" ? 3 : 0,
  recentColdReviewResults: [],
});

test("session planner prioritizes fragile repairs and blocks new material", () => {
  const map = new Map([
    ["pitch.accidentals", evidence("fragile", true, true)],
  ]);
  const plan = planSession({ evidenceBySkill: map, dueReviews: [] });
  assert.deepEqual(plan.repairSkillIds, ["pitch.accidentals"]);
  assert.equal(plan.newSkillId, undefined);
  assert.equal(plan.reasonNoNewSkill, "repair-prerequisite");
});

test("session planner caps normal review batch at six", () => {
  const due = SKILLS.slice(0, 8).map((skill, i) => ({ skillId: skill.id, dueAt: `2026-09-0${i+1}T00:00:00Z`, urgency: i }));
  const plan = planSession({ evidenceBySkill: new Map(), dueReviews: due });
  assert.equal(plan.reviewSkillIds.length, 6);
});

test("with no repair, backlog, or current acquisition, planner picks an unlocked new skill", () => {
  const plan = planSession({ evidenceBySkill: new Map(), dueReviews: [] });
  assert.equal(plan.newSkillId, "pitch.accidentals");
});

test("session planner does not auto-introduce optional enrichment skills", () => {
  const ready = (state = "ready") => ({
    state, ready: true, retained: false, fragile: false,
    acquisitionIndependentSuccesses: 3,
    acquisitionDistinctSuccessfulPrompts: 3,
    successfulDelayedReviewSessions: 0,
    recentColdReviewResults: [],
    lastDirectOutcome: "correct",
  });
  // Make all non-optional skills ready, leave optional skills new.
  const evidence = new Map();
  for (const skill of SKILLS) if (!skill.optional) evidence.set(skill.id, ready());
  const plan = planSession({ evidenceBySkill: evidence, dueReviews: [] });
  assert.equal(plan.newSkillId, undefined);
  assert.equal(plan.reasonNoNewSkill, "nothing-unlocked");
});
