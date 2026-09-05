import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  CURRICULUM_PHASES,
  INTERVALS,
  PHASE1_INTERVAL_NAMES,
  SKILLS,
  activeExerciseSkillIds,
  activeLessonSkillIds,
  checkpointDefinition,
  deriveSkillEvidence,
  exerciseForSkill,
  formatNote,
  gradeExercise,
  intervalAbove,
  invertPhase1Interval,
  invertSimpleIntervalNumber,
  inversionQuality,
  interleavingTargets,
  lessonForSkill,
  longTermPracticeWeight,
  parseNote,
  phase1Lessons,
  phase1RootNames,
  practiceRoundPlan,
  simpleToCompoundIntervalNumber,
} from "../dist/index.js";
import { renderPracticeRoundCounter, renderTeachingLesson } from "../web/lesson-ui.js";

const EXPECTED_TITLES = [
  "Perfect Unison & Perfect Octave",
  "Perfect 5th",
  "Perfect 4th",
  "Major 3rd & Minor 3rd",
  "Major 6th & Minor 6th",
  "Major 2nd & Minor 2nd",
  "Major 7th & Minor 7th",
  "Tritone: Augmented 4th / Diminished 5th",
  "Inversion Rule Capstone",
  "Cumulative Drilling",
];
const EXPECTED_IDS = [
  "intervals.lesson-1-unison-octave",
  "intervals.lesson-2-perfect-fifth",
  "intervals.lesson-3-perfect-fourth",
  "intervals.lesson-4-thirds",
  "intervals.lesson-5-sixths",
  "intervals.lesson-6-seconds",
  "intervals.lesson-7-sevenths",
  "intervals.lesson-8-tritone",
  "intervals.lesson-9-inversion-capstone",
  "intervals.lesson-10-cumulative",
];

function generated(skillId, count = 120) {
  return Array.from({ length: count }, (_, index) => exerciseForSkill(skillId, index)).filter(Boolean);
}

function cleanEvidence(overrides = {}) {
  return { ...deriveSkillEvidence([]), ...overrides };
}

test("Phase 1 contains exactly the requested ten lessons in exact order", () => {
  assert.deepEqual(SKILLS.map((skill) => skill.title), EXPECTED_TITLES);
  assert.deepEqual(SKILLS.map((skill) => skill.id), EXPECTED_IDS);
  assert.deepEqual(activeLessonSkillIds(), EXPECTED_IDS);
  assert.deepEqual(phase1Lessons().map((lesson) => lesson.title), EXPECTED_TITLES);
  assert.equal(SKILLS.every((skill) => skill.phase === 1), true);
  assert.equal(SKILLS.some((skill) => skill.phase === 2), false);
});

test("Phase 2 and later phase descriptors remain shells only", () => {
  assert.deepEqual(CURRICULUM_PHASES.map((phase) => phase.phase), [1, 2, 3, 4, 5, 6]);
  assert.equal(SKILLS.filter((skill) => skill.phase > 1).length, 0);
});

test("every Phase 1 lesson has a registered question generator and teaching content", () => {
  assert.deepEqual(activeExerciseSkillIds(), EXPECTED_IDS);
  for (const id of EXPECTED_IDS) {
    assert.ok(lessonForSkill(id)?.teachingSteps.length >= 4, id);
    assert.ok(exerciseForSkill(id, 0), id);
  }
});

test("Phase 1 intentionally teaches 14 distinct simple interval spellings", () => {
  assert.deepEqual(PHASE1_INTERVAL_NAMES, ["P1", "P8", "P5", "P4", "M3", "m3", "M6", "m6", "M2", "m2", "M7", "m7", "A4", "d5"]);
  assert.equal(new Set(PHASE1_INTERVAL_NAMES).size, 14);
});

test("simple and compound interval terminology is encoded correctly", () => {
  assert.equal(simpleToCompoundIntervalNumber(1), 8);
  assert.equal(simpleToCompoundIntervalNumber(3), 10);
  assert.equal(simpleToCompoundIntervalNumber(8), 15);
  assert.throws(() => simpleToCompoundIntervalNumber(9));
});

test("interval construction is theoretically spelled above natural sharp and flat roots", () => {
  const cases = [
    ["C", "P5", "G"],
    ["B", "P5", "F♯"],
    ["F", "M3", "A"],
    ["F", "m3", "A♭"],
    ["C", "A4", "F♯"],
    ["C", "d5", "G♭"],
    ["G#", "A4", "C♯♯"],
    ["Db", "M3", "F"],
    ["Gb", "m3", "B♭♭"],
    ["Cb", "M7", "B♭"],
  ];
  for (const [root, interval, expected] of cases) {
    assert.equal(formatNote(intervalAbove(parseNote(root), INTERVALS[interval])), expected, `${interval} above ${root}`);
  }
});

test("A4 and d5 share piano distance but require different written answers", () => {
  const a4 = formatNote(intervalAbove(parseNote("C"), INTERVALS.A4));
  const d5 = formatNote(intervalAbove(parseNote("C"), INTERVALS.d5));
  assert.equal(a4, "F♯");
  assert.equal(d5, "G♭");
  const constructD5 = generated("intervals.lesson-8-tritone", 200).find((exercise) => exercise.metadata?.interval === "d5" && exercise.metadata?.root === "C" && exercise.metadata?.direction === "construct");
  if (constructD5) {
    assert.equal(gradeExercise(constructD5, "Gb").correct, true);
    const wrongSpelling = gradeExercise(constructD5, "F#");
    assert.equal(wrongSpelling.correct, false);
    assert.equal(wrongSpelling.code, "enharmonic-spelling-error");
  }
});

test("inversion numbers and quality rules are exact", () => {
  assert.deepEqual([1,2,3,4,5,6,7,8].map((n) => invertSimpleIntervalNumber(n)), [8,7,6,5,4,3,2,1]);
  assert.equal(inversionQuality("perfect"), "perfect");
  assert.equal(inversionQuality("major"), "minor");
  assert.equal(inversionQuality("minor"), "major");
  assert.equal(inversionQuality("augmented"), "diminished");
  assert.equal(inversionQuality("diminished"), "augmented");
});

test("requested inversion partner relationships are exact", () => {
  const pairs = { P5:"P4", P4:"P5", M3:"m6", m6:"M3", m3:"M6", M6:"m3", M2:"m7", m7:"M2", m2:"M7", M7:"m2", A4:"d5", d5:"A4", P1:"P8", P8:"P1" };
  for (const [left, right] of Object.entries(pairs)) assert.equal(invertPhase1Interval(left), right, left);
});

test("progressive generators keep earlier intervals alive after later lessons", () => {
  const checks = [
    ["intervals.lesson-2-perfect-fifth", ["P1","P8","P5"]],
    ["intervals.lesson-3-perfect-fourth", ["P1","P8","P5","P4"]],
    ["intervals.lesson-5-sixths", ["M3","m3","M6","m6","P5"]],
    ["intervals.lesson-7-sevenths", ["M2","m2","M7","m7","M3","P5"]],
    ["intervals.lesson-8-tritone", ["A4","d5","M7","m7","M2","m2","M3","m3","P5","P4"]],
  ];
  for (const [skillId, expected] of checks) {
    const seen = new Set(generated(skillId, 180).map((exercise) => exercise.metadata?.interval).filter(Boolean));
    for (const interval of expected) assert.ok(seen.has(interval), `${skillId} should recur ${interval}`);
  }
});

test("cumulative lesson mixes complete Phase 1 interval coverage", () => {
  const exercises = generated("intervals.lesson-10-cumulative", 260);
  const seen = new Set(exercises.map((exercise) => exercise.metadata?.interval).filter(Boolean));
  for (const interval of PHASE1_INTERVAL_NAMES) assert.ok(seen.has(interval), interval);
  assert.ok(exercises.some((exercise) => exercise.metadata?.direction === "construct"));
  assert.ok(exercises.some((exercise) => exercise.metadata?.direction === "identify"));
  assert.ok(exercises.some((exercise) => exercise.metadata?.family === "interval-inversion"));
  assert.ok(exercises.some((exercise) => exercise.metadata?.family === "tritone-spelling"));
});

test("question roots include natural sharp and flat spellings", () => {
  assert.ok(phase1RootNames().some((root) => !/[#b]/.test(root)));
  assert.ok(phase1RootNames().some((root) => root.includes("#")));
  assert.ok(phase1RootNames().some((root) => root.includes("b")));
  const roots = new Set(generated("intervals.lesson-10-cumulative", 240).map((exercise) => String(exercise.metadata?.root ?? "")));
  assert.ok([...roots].some((root) => /♯/.test(root)), "generated sharp root");
  assert.ok([...roots].some((root) => /♭/.test(root)), "generated flat root");
  assert.ok([...roots].some((root) => root && !/[♯♭]/.test(root)), "generated natural root");
});

test("independent construct questions do not pre-highlight the target note", () => {
  const exercise = generated("intervals.lesson-10-cumulative", 100).find((item) => item.metadata?.direction === "construct");
  assert.ok(exercise);
  assert.equal(exercise.metadata.pianoHighlighted.length, 1);
  assert.ok(exercise.metadata.revealPianoTarget);
});

test("recently generated examples have meaningful variety rather than one repeated prompt", () => {
  for (const id of EXPECTED_IDS) {
    const recent = generated(id, 30);
    const signatures = new Set(recent.map((exercise) => exercise.exampleSignature));
    assert.ok(signatures.size >= Math.min(12, recent.length), `${id} only produced ${signatures.size} unique examples`);
  }
});

test("all lessons explicitly communicate automatic recall vs conceptual understanding", () => {
  for (const lesson of phase1Lessons()) {
    const expectations = new Set(lesson.teachingSteps.map((step) => step.expectation));
    assert.ok(expectations.has("know-instantly"), `${lesson.title} missing automatic-recall target`);
    assert.ok(expectations.has("understand"), `${lesson.title} missing conceptual target`);
    assert.ok(lesson.teachingSteps.every((step) => step.workedExample), `${lesson.title} rule without worked example`);
  }
  const ui = fs.readFileSync("web/lesson-ui.js", "utf8");
  assert.match(ui, /KNOW THIS INSTANTLY/);
  assert.match(ui, /UNDERSTAND THIS/);
});

test("READY interval evidence stays eligible for cumulative interleaving", () => {
  const ready = cleanEvidence({ state:"ready", ready:true, retained:false, fragile:false });
  const retained = cleanEvidence({ state:"retained", ready:true, retained:true, fragile:false, everRetained:true });
  const id = EXPECTED_IDS[0];
  assert.ok(longTermPracticeWeight(id, ready) > 0);
  assert.ok(longTermPracticeWeight(id, retained) > 0);
  assert.ok(longTermPracticeWeight(id, ready) > longTermPracticeWeight(id, retained));
  assert.ok(interleavingTargets(new Map([[id, ready]])).includes(id));
  assert.ok(interleavingTargets(new Map([[id, retained]])).includes(id));
});

test("Phase 1 has highest recurrence metadata and rounds remain at least 30 questions", () => {
  assert.ok(SKILLS.every((skill) => skill.foundationality === 5 && skill.reviewPriority === 5 && skill.longTermRecurrence === 5));
  for (const skill of SKILLS) {
    assert.ok(practiceRoundPlan(skill.id, "new").size >= 30);
    assert.ok(practiceRoundPlan(skill.id, "review").size >= 30);
  }
  assert.match(renderPracticeRoundCounter(2, 30, 1), /Question 3 of 30/);
});

test("Phase 1 checkpoint samples representative competencies and is not recognition-only by design", () => {
  const checkpoint = checkpointDefinition(1);
  assert.ok(checkpoint);
  assert.ok(checkpoint.minItems >= 14);
  const ids = new Set(checkpoint.competencies.map((competency) => competency.id));
  for (const id of ["perfect-construction","major-minor-construction","interval-identification","interval-inversion","quality-discrimination","tritone-spelling","varied-root-spelling"]) assert.ok(ids.has(id), id);
  assert.ok(checkpoint.competencies.every((competency) => competency.critical));
  assert.equal(checkpointDefinition(2), undefined);
});

test("lesson replay still starts at teaching and only completed lessons can skip at the bottom", async () => {
  const lesson = lessonForSkill(EXPECTED_IDS[0]);
  const fresh = { stage:"teaching", teachingStepIndex:0, canSkipToReview:false, skipPlacement:null };
  const replay = { stage:"teaching", teachingStepIndex:0, canSkipToReview:true, skipPlacement:"teaching-bottom" };
  assert.doesNotMatch(renderTeachingLesson({ lesson, openingState:fresh }), /Skip to Review/);
  const html = renderTeachingLesson({ lesson, openingState:replay });
  assert.ok(html.indexOf("Skip to Review") > html.indexOf(lesson.teachingSteps.at(-1).body));
});

test("Phase 1 active files do not contain user-facing hint controls", () => {
  for (const path of ["web/app.js", "web/lesson-ui.js", "src/practice/lessons.ts", "src/exercises/phase1-intervals.ts"]) {
    assert.doesNotMatch(fs.readFileSync(path, "utf8"), /show\s+hint|need\s+a\s+hint|hintbutton|hintbtn/i, path);
  }
});
