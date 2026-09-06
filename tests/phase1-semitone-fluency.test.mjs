import assert from "node:assert/strict";
import test from "node:test";

import {
  INTERVALS,
  PHASE1_INTERVAL_NAMES,
  exerciseForSkill,
  gradeExercise,
  phase1SemitoneIntervalsForSkill,
} from "../dist/index.js";

const LESSONS = [
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

const INTRODUCED = [
  ["P1", "P8"],
  ["P5"],
  ["P4"],
  ["M3", "m3"],
  ["M6", "m6"],
  ["M2", "m2"],
  ["M7", "m7"],
  ["A4", "d5"],
  [],
  [],
];

const REQUIRED_SEMITONES = {
  m2: 1,
  M2: 2,
  m3: 3,
  M3: 4,
  P4: 5,
  A4: 6,
  d5: 6,
  P5: 7,
  m6: 8,
  M6: 9,
  m7: 10,
  M7: 11,
  P8: 12,
};

const generated = (skillId, count = 500) => Array.from({ length: count }, (_, index) => exerciseForSkill(skillId, index)).filter(Boolean);

function findDirection(skillId, interval, direction) {
  return generated(skillId).find((item) => item.metadata?.interval === interval && item.metadata?.direction === direction);
}

test("Phase 1 semitone pools disclose only qualities taught by that lesson", () => {
  const cumulative = [];
  LESSONS.forEach((skillId, index) => {
    cumulative.push(...INTRODUCED[index]);
    const pool = phase1SemitoneIntervalsForSkill(skillId);
    assert.ok(pool.length > 0, skillId);
    for (const interval of pool) {
      assert.ok(cumulative.includes(interval), `${skillId} exposes untaught ${interval}`);
    }
    for (const interval of cumulative) {
      assert.ok(pool.includes(interval), `${skillId} should retain taught ${interval}`);
    }
  });
});

test("required common interval quality to semitone mappings are exact", () => {
  for (const [interval, semitones] of Object.entries(REQUIRED_SEMITONES)) {
    assert.equal(INTERVALS[interval].semitones, semitones, interval);
  }
  assert.equal(INTERVALS.P1.semitones, 0);
});

test("each newly taught interval can be tested in both semitone directions and graded correctly", () => {
  LESSONS.forEach((skillId, lessonIndex) => {
    for (const interval of INTRODUCED[lessonIndex]) {
      const spec = INTERVALS[interval];
      const forward = findDirection(skillId, interval, "interval-to-semitones");
      const reverse = findDirection(skillId, interval, "semitones-to-interval");
      assert.ok(forward, `${skillId} missing ${interval} -> semitones`);
      assert.ok(reverse, `${skillId} missing semitones + family -> ${interval}`);

      assert.equal(forward.answerSpec.kind, "number");
      assert.equal(forward.answerSpec.expected, spec.semitones);
      assert.equal(gradeExercise(forward, spec.semitones).correct, true);
      assert.equal(gradeExercise(forward, spec.semitones + 1).correct, false);

      assert.equal(reverse.answerSpec.kind, "text");
      assert.equal(gradeExercise(reverse, interval).correct, true, `${interval} abbreviation should grade`);
      assert.equal(gradeExercise(reverse, "definitely-wrong").correct, false);
      assert.match(reverse.prompt, new RegExp(`A \\d+(?:st|nd|rd|th) spans ${spec.semitones} semitone`), `${interval} reverse prompt needs family context`);
    }
  });
});

test("the short Lesson 1 acquisition includes both P1 and P8 in both semitone directions", () => {
  const firstTen = generated(LESSONS[0], 10);
  const signatures = new Set(firstTen.map((item) => `${item.metadata?.interval}:${item.metadata?.direction}`));
  for (const key of [
    "P1:interval-to-semitones",
    "P1:semitones-to-interval",
    "P8:interval-to-semitones",
    "P8:semitones-to-interval",
  ]) assert.ok(signatures.has(key), key);
});

test("reverse semitone questions are never ambiguous semitone-only interval questions", () => {
  for (const skillId of LESSONS) {
    for (const item of generated(skillId, 240)) {
      if (item.metadata?.direction !== "semitones-to-interval") continue;
      assert.match(item.prompt, /^A (?:1st|2nd|3rd|4th|5th|6th|7th|8th) spans \d+ semitones?\./);
      assert.doesNotMatch(item.prompt, /^What interval is \d+ semitones?$/i);
      assert.ok(Number.isInteger(item.metadata?.intervalNumber));
    }
  }
});

test("A4 and d5 both map to six semitones while interval family preserves the correct name", () => {
  const a4Forward = findDirection(LESSONS[7], "A4", "interval-to-semitones");
  const d5Forward = findDirection(LESSONS[7], "d5", "interval-to-semitones");
  const a4Reverse = findDirection(LESSONS[7], "A4", "semitones-to-interval");
  const d5Reverse = findDirection(LESSONS[7], "d5", "semitones-to-interval");

  assert.equal(a4Forward.answerSpec.expected, 6);
  assert.equal(d5Forward.answerSpec.expected, 6);
  assert.match(a4Reverse.prompt, /A 4th spans 6 semitones/i);
  assert.match(d5Reverse.prompt, /A 5th spans 6 semitones/i);
  assert.equal(gradeExercise(a4Reverse, "A4").correct, true);
  assert.equal(gradeExercise(a4Reverse, "d5").correct, false);
  assert.equal(gradeExercise(d5Reverse, "d5").correct, true);
  assert.equal(gradeExercise(d5Reverse, "A4").correct, false);
  assert.match(`${a4Forward.explanation} ${d5Forward.explanation}`, /written interval number still decides/i);
});

test("semitone fluency never weakens exact tritone target-note spelling", () => {
  const items = generated(LESSONS[7], 1600);
  const a4 = items.find((item) => item.metadata?.direction === "construct" && item.metadata?.interval === "A4");
  const d5 = items.find((item) => item.metadata?.direction === "construct" && item.metadata?.interval === "d5");
  assert.ok(a4, "missing A4 construction");
  assert.ok(d5, "missing d5 construction");
  assert.equal(gradeExercise(a4, a4.answerSpec.expected).correct, true);
  assert.equal(gradeExercise(d5, d5.answerSpec.expected).correct, true);
  assert.equal(a4.answerSpec.kind, "note");
  assert.equal(d5.answerSpec.kind, "note");
});

test("Major/minor quality discrimination begins only after Major and minor qualities are taught", () => {
  for (const skillId of LESSONS.slice(0, 3)) {
    assert.equal(generated(skillId, 120).some((item) => item.metadata?.direction === "quality-discrimination"), false, skillId);
  }
  for (const skillId of LESSONS.slice(3)) {
    const item = generated(skillId, 160).find((exercise) => exercise.metadata?.direction === "quality-discrimination");
    assert.ok(item, `${skillId} should include quality discrimination`);
    assert.match(item.prompt, /Which is (?:larger|smaller):/);
    assert.match(item.explanation, /one semitone larger than the minor form/i);
  }
});

test("semitone questions stay mixed with construction, identification, spelling, and inversion representations", () => {
  const cumulative = generated(LESSONS[9], 420);
  const directions = new Set(cumulative.map((item) => item.metadata?.direction));
  for (const direction of [
    "interval-to-semitones",
    "semitones-to-interval",
    "quality-discrimination",
    "construct",
    "identify",
    "transform",
    "diagnose",
  ]) assert.ok(directions.has(direction), direction);

  const semitoneRepresentations = cumulative.filter((item) => [
    "interval-to-semitones",
    "semitones-to-interval",
    "quality-discrimination",
  ].includes(item.metadata?.direction)).length;
  assert.ok(semitoneRepresentations > 0);
  assert.ok(semitoneRepresentations < cumulative.length / 2, "semitone representation must not dominate cumulative interval practice");
});

test("all 14 Phase 1 written interval spellings remain represented after semitone mixing", () => {
  const seen = new Set(generated(LESSONS[9], 700).map((item) => item.metadata?.interval).filter(Boolean));
  for (const interval of PHASE1_INTERVAL_NAMES) assert.ok(seen.has(interval), interval);
});
