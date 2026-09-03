import assert from "node:assert/strict";
import test from "node:test";
import {
  assessMajorRomanForChord,
  assessMajorScale,
  assessMajorScaleDegree,
  assessNote,
  assessTriad,
  majorRomanForDegree,
} from "../dist/assessment/index.js";
import { intervalAbove, INTERVALS, parseNote } from "../dist/theory/index.js";

test("note assessment distinguishes an enharmonic spelling error from a wrong note selection", () => {
  const expected = intervalAbove(parseNote("F#"), INTERVALS.M3);
  assert.equal(assessNote(expected, "A#").code, "correct");
  assert.equal(assessNote(expected, "Bb").code, "enharmonic-spelling-error");
  assert.equal(assessNote(expected, "B").code, "wrong-note-selection");
});

test("major-scale assessment diagnoses enharmonic spelling mistakes", () => {
  const right = ["F#", "G#", "A#", "B", "C#", "D#", "E#"];
  assert.equal(assessMajorScale("F#", right).correct, true);
  const wrongSpelling = ["F#", "G#", "Bb", "B", "C#", "D#", "F"];
  assert.equal(assessMajorScale("F#", wrongSpelling).code, "enharmonic-spelling-error");
});

test("triad assessment accepts note order but requires theoretical spelling", () => {
  assert.equal(assessTriad("F#", "major", ["C#", "F#", "A#"]).correct, true);
  assert.equal(assessTriad("F#", "major", ["F#", "Bb", "C#"]).code, "enharmonic-spelling-error");
});

test("major scale degree uses correct spelling", () => {
  assert.equal(assessMajorScaleDegree("F#", 7, "E#").correct, true);
  assert.equal(assessMajorScaleDegree("F#", 7, "F").code, "enharmonic-spelling-error");
});

test("major Roman numerals encode quality", () => {
  assert.deepEqual([1,2,3,4,5,6,7].map(majorRomanForDegree), ["I","ii","iii","IV","V","vi","vii°"]);
  assert.equal(assessMajorRomanForChord("D", "B", "minor", "vi").correct, true);
  assert.equal(assessMajorRomanForChord("D", "B", "major", "VI").code, "wrong-quality");
});
