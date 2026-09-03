import assert from "node:assert/strict";
import test from "node:test";
import {
  intervalBuildExercise,
  majorDegreeExercise,
  majorScaleExercise,
  triadBuildExercise,
} from "../dist/exercises/index.js";

test("exercise generators are deterministic", () => {
  assert.deepEqual(intervalBuildExercise("M3", 4), intervalBuildExercise("M3", 4));
  assert.deepEqual(triadBuildExercise("minor", 8), triadBuildExercise("minor", 8));
  assert.deepEqual(majorScaleExercise(2), majorScaleExercise(2));
  assert.deepEqual(majorDegreeExercise(5), majorDegreeExercise(5));
});

test("generated interval exercises carry a theory-derived expected spelling", () => {
  const exercise = intervalBuildExercise("M3", 5);
  assert.equal(typeof exercise.payload.expected, "string");
  assert.ok(exercise.payload.expected.length >= 1);
});

import { exerciseForSkill, gradeExercise } from "../dist/exercises/index.js";
import { SKILLS } from "../dist/curriculum/index.js";
import { buildTriad, formatNote, majorScale, parseNote } from "../dist/theory/index.js";

function correctAnswerFor(exercise) {
  const p = exercise.payload;
  switch (exercise.type) {
    case "interval-build-note": return p.expected;
    case "triad-build-notes": return buildTriad(parseNote(p.root), p.quality).map(formatNote);
    case "major-scale-build": return majorScale(parseNote(p.tonic)).map(formatNote);
    case "major-degree-note": return p.expected ?? formatNote(majorScale(parseNote(p.tonic))[p.degree - 1]);
    case "major-note-degree": return p.expected;
    case "guitar-fret-note": return p.canonical;
    case "minor-scale-build": return p.expected ?? { ascending: p.expectedAscending, descending: p.expectedDescending };
    case "seventh-build-notes":
    case "chord-color-build":
    case "mode-scale-build":
    case "inversion-build": return p.expected;
    case "diatonic-chord-build": return p.expectedNotes ?? p.expected;
    case "progression-build": return p.expected;
    case "key-signature": return { count: p.expectedCount, type: p.expectedType };
    default: return p.expected;
  }
}

test("every curriculum node has a deterministic exercise plan", () => {
  for (const skill of SKILLS) {
    const a = exerciseForSkill(skill.id, 3);
    const b = exerciseForSkill(skill.id, 3);
    assert.deepEqual(a, b, skill.id);
    assert.equal(a.skillId, skill.id);
    assert.ok(a.prompt.length > 0);
  }
});

test("all objectively gradable curriculum exercises accept their generated correct answer", () => {
  for (const skill of SKILLS) {
    for (let index = 0; index < 3; index++) {
      const exercise = exerciseForSkill(skill.id, index);
      if (exercise.assessmentMode === "self-check") continue;
      const result = gradeExercise(exercise, correctAnswerFor(exercise));
      assert.equal(result.correct, true, `${skill.id} / ${exercise.type}`);
    }
  }
});

test("generated curriculum prompts contain no ear-training or audio-recognition tasks", () => {
  const prohibited = /\b(ear|hear|hearing|aural|audio|listen|listening)\b/i;
  for (const skill of SKILLS) {
    for (let index = 0; index < 6; index++) {
      const exercise = exerciseForSkill(skill.id, index);
      assert.equal(prohibited.test(exercise.prompt), false, `${skill.id}: ${exercise.prompt}`);
    }
  }
});

test("physical or creative transfer nodes use self-check rather than fake objective grading", () => {
  for (const id of [
    "major.piano-application",
    "diatonic.piano-application",
    "voice.economical",
    "guitar.triads",
    "guitar.voice-leading",
    "guitar.idea-to-neck",
  ]) {
    assert.equal(exerciseForSkill(id, 0).assessmentMode, "self-check", id);
  }
});

test("Roman-numeral chord quality remains case-sensitive", () => {
  const romanExercise = exerciseForSkill("diatonic.chord-to-degree", 0);
  const correct = romanExercise.payload.expected;
  assert.equal(gradeExercise(romanExercise, correct).correct, true);
  const flipped = String(correct).split("").map((c) => /[iv]/i.test(c) ? (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()) : c).join("");
  assert.equal(gradeExercise(romanExercise, flipped).correct, false);

  const integrated = exerciseForSkill("analysis.integrated", 0);
  assert.equal(gradeExercise(integrated, "V7/ii").correct, true);
  assert.equal(gradeExercise(integrated, "v7/ii").correct, false);
});

test("Roman numerals embedded in text answers keep case-sensitive chord quality", () => {
  const predominant = exerciseForSkill("function.predominant", 0);
  assert.equal(gradeExercise(predominant, "ii and IV").correct, true);
  assert.equal(gradeExercise(predominant, "II and iv").correct, false);
});
