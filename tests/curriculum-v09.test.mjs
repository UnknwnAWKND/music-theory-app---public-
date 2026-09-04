import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  SKILLS,
  SKILL_BY_ID,
  checkpointDefinition,
  exerciseForSkill,
  interleavingTargets,
  placementPrerequisitePhases,
  practiceRoundPlan,
} from "../dist/index.js";

const idIndex = (id) => SKILLS.findIndex((skill) => skill.id === id);

test("interval numbers are introduced in small cumulative subsets", () => {
  const sequence = [
    "interval.number-3-8",
    "interval.number-4-5",
    "interval.number-mix-3-4-5-8",
    "interval.number-2-7",
    "interval.number-mix-2-3-4-5-7-8",
    "interval.number-6",
    "interval.generic-number",
  ];
  for (let i = 1; i < sequence.length; i++) {
    assert.ok(idIndex(sequence[i - 1]) < idIndex(sequence[i]), `${sequence[i - 1]} should precede ${sequence[i]}`);
  }
  assert.deepEqual(SKILL_BY_ID.get("interval.number-4-5")?.prerequisites, ["interval.number-3-8"]);
  assert.ok(SKILL_BY_ID.get("interval.number-mix-3-4-5-8")?.prerequisites.includes("interval.number-4-5"));
  assert.ok(SKILL_BY_ID.get("interval.number-2-7")?.prerequisites.includes("interval.number-mix-3-4-5-8"));
});

test("interval-number exercise pools stay inside the intended subset and vary examples", () => {
  const allowed = new Set([3, 8]);
  const prompts = [];
  for (let i = 0; i < 40; i++) {
    const exercise = exerciseForSkill("interval.number-3-8", i);
    assert.ok(allowed.has(Number(exercise.payload.intervalNumber)), `unexpected interval ${exercise.payload.intervalNumber}`);
    prompts.push(exercise.prompt);
  }
  assert.ok(new Set(prompts).size >= 12, "interval practice should vary roots/examples instead of repeating one prompt");
  for (let i = 1; i < prompts.length; i++) assert.notEqual(prompts[i], prompts[i - 1], "avoid immediate exact duplicates");
});

test("later interval-quality work is spiraled instead of trapping all quality work in Phase 1", () => {
  for (const id of ["interval.M2", "interval.m2", "interval.M6", "interval.m6", "interval.M7", "interval.m7", "interval.mixed-core"]) {
    assert.equal(SKILL_BY_ID.get(id)?.phase, 3, `${id} should return in the scale phase`);
  }
  for (const id of ["interval.M3", "interval.m3", "interval.P4", "interval.P5", "interval.P8"]) {
    assert.equal(SKILL_BY_ID.get(id)?.phase, 1, `${id} is an early chord-building foundation`);
  }
});

test("foundational interval skills keep extra spiral priority after READY but before RETAINED", () => {
  const evidence = {
    state: "ready", ready: true, retained: false, fragile: false,
    successfulDelayedReviewSessions: 0, independentFirstAttemptSuccesses: 3, confusions: {},
  };
  const map = new Map([["interval.number-3-8", evidence]]);
  assert.ok(interleavingTargets(map).includes("interval.number-3-8"));

  const retained = new Map([["interval.number-3-8", { ...evidence, state: "retained", retained: true }]]);
  assert.equal(interleavingTargets(retained).includes("interval.number-3-8"), false, "RETAINED should remove extra spiral pressure; normal spaced reviews still remain");
});

test("curriculum importance is encoded independently of READY and RETAINED", () => {
  const interval = SKILL_BY_ID.get("interval.number-3-8");
  const advanced = SKILL_BY_ID.get("extension.11-13");
  assert.equal(interval?.priority, "foundation");
  assert.ok((interval?.recurrenceWeight ?? 0) > (advanced?.recurrenceWeight ?? 0));
});

test("practice rounds use honest learner-visible sizes with a 30-question minimum", () => {
  assert.equal(practiceRoundPlan("interval.number-3-8", "new").size, 30);
  assert.equal(practiceRoundPlan("interval.number-4-5", "new").size, 30);
  assert.equal(practiceRoundPlan("interval.number-3-8", "review").size, 30);
  assert.equal(practiceRoundPlan("interval.number-3-8", "repair").size, 30);
  assert.equal(practiceRoundPlan("interval.number-3-8", "interleave").size, 30);
  for (const kind of ["new", "acquisition", "review", "repair", "review-repair", "interleave"]) {
    const initial = practiceRoundPlan("interval.number-3-8", kind).size;
    const followUp = practiceRoundPlan("interval.number-3-8", kind, true).size;
    assert.ok(initial >= 30, `${kind} round must never be shorter than 30 questions`);
    assert.ok(followUp >= 30, `${kind} follow-up round must never be shorter than 30 questions`);
  }
});

test("question counter counts the current round, not the session skill queue", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  assert.match(app, /Question \$\{questionNumber\} of \$\{round\.size\}/);
  assert.doesNotMatch(app, /Question \$\{state\.itemIndex \+ 1\} of \$\{state\.queue\.length\}/);
  assert.match(app, /Round \$\{round\.number\}/);
  assert.match(app, /One more round/);
});

test("round completion is explicitly separated from mastery", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  assert.match(app, /Finishing the round did not create mastery by itself/);
  assert.match(app, /if \(evidence\?\.ready\) return renderRoundComplete\(item, false\)/);
  assert.match(app, /return renderRoundComplete\(item, true\)/);
});

test("checkpoint maps follow the redesigned interval spiral", () => {
  const phase1 = checkpointDefinition(1);
  const phase3 = checkpointDefinition(3);
  assert.ok(phase1?.competencies.some((c) => c.id === "interval-number-core"));
  assert.equal(phase1?.competencies.some((c) => c.skillIds.includes("interval.M7")), false);
  assert.ok(phase3?.competencies.some((c) => c.id === "interval-quality-expansion" && c.skillIds.includes("interval.M7")));
});

test("placement prerequisites are derived from the redesigned graph", () => {
  const phases = placementPrerequisitePhases(5);
  assert.ok(phases.includes(1));
  assert.ok(phases.includes(2));
  assert.ok(phases.includes(3));
  assert.ok(phases.includes(4));
});

test("Phase 0 stays removed", () => {
  assert.equal(SKILLS.some((skill) => skill.phase === 0), false);
  assert.equal(SKILLS.some((skill) => skill.id.startsWith("pitch.")), false);
});
