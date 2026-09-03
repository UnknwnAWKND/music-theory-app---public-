import test from "node:test";
import assert from "node:assert/strict";
import { assessNote, parseNote, formatNote } from "../dist/index.js";
import { normalizeAccidentals, splitNoteSequence, parseChordSymbol } from "../web/answer-utils.js";

test("note parser accepts normal keyboard spellings", () => {
  for (const answer of ["Db", "D♭", "D flat", "D-flat", "d flat", "d-flat"])
    assert.equal(formatNote(parseNote(answer)), "D♭");
  for (const answer of ["C#", "C♯", "C sharp", "C-sharp", "c sharp", "c-sharp"])
    assert.equal(formatNote(parseNote(answer)), "C♯");
});

test("note grading ignores input formatting but preserves theory spelling", () => {
  const expected = parseNote("Db");
  for (const answer of ["Db", "D♭", "D flat", "D-flat", "d flat", "d-flat"])
    assert.equal(assessNote(expected, answer).correct, true, answer);
  assert.equal(assessNote(expected, "C#").code, "enharmonic-spelling-error");
});

test("browser normalization supports words, symbols, case and hyphens", () => {
  assert.equal(normalizeAccidentals(" d-flat "), "D♭");
  assert.equal(normalizeAccidentals("f-sharp"), "F♯");
  assert.deepEqual(splitNoteSequence("C sharp, E, G flat"), ["C♯", "E", "G♭"]);
});

test("common chord quality text is keyboard friendly", () => {
  assert.deepEqual(parseChordSymbol("c diminished"), { root: "C", quality: "diminished" });
  assert.deepEqual(parseChordSymbol("F-augmented"), { root: "F", quality: "augmented" });
});
