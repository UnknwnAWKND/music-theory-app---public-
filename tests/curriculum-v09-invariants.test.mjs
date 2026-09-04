import assert from "node:assert/strict";
import test from "node:test";
import { SKILLS, SKILL_BY_ID, practiceRoundPlan } from "../dist/index.js";

const ROUND_KINDS = ["new", "acquisition", "review", "repair", "review-repair", "interleave"];

test("every learner-visible practice round is at least 30 questions", () => {
  for (const skill of SKILLS) {
    for (const kind of ROUND_KINDS) {
      assert.ok(practiceRoundPlan(skill.id, kind).size >= 30, `${skill.id} ${kind} round is below 30`);
      assert.ok(practiceRoundPlan(skill.id, kind, true).size >= 30, `${skill.id} ${kind} follow-up round is below 30`);
    }
  }
});

test("required curriculum skills never depend on material from a later phase", () => {
  for (const skill of SKILLS.filter((candidate) => !candidate.optional)) {
    for (const prerequisiteId of skill.prerequisites) {
      const prerequisite = SKILL_BY_ID.get(prerequisiteId);
      assert.ok(prerequisite, `${skill.id} references missing prerequisite ${prerequisiteId}`);
      assert.ok(
        prerequisite.phase <= skill.phase,
        `${skill.id} is Phase ${skill.phase} but depends on future Phase ${prerequisite.phase} skill ${prerequisiteId}`,
      );
    }
  }
});

test("Phase 1 octave work depends on early perfect-interval work, not Phase 3 interval expansion", () => {
  const octave = SKILL_BY_ID.get("interval.P8");
  assert.ok(octave);
  assert.deepEqual(octave.prerequisites, ["interval.P5"]);
});
