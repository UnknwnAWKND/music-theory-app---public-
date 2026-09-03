import test from "node:test";
import assert from "node:assert/strict";
import { answerSpecForExercise, normalizeAccidentals, parseAnswerFromValues, parseChordSymbol, parseProgression, splitNoteSequence } from "../web/answer-utils.js";

test("browser answer parser normalizes common accidental typing", () => {
  assert.equal(normalizeAccidentals("F#"), "F♯");
  assert.deepEqual(splitNoteSequence("Bb, D F"), ["B♭", "D", "F"]);
});

test("progression parser handles basic major/minor/diminished/augmented symbols", () => {
  assert.deepEqual(parseChordSymbol("F#m"), { root: "F♯", quality: "minor" });
  assert.deepEqual(parseChordSymbol("Bdim"), { root: "B", quality: "diminished" });
  assert.deepEqual(parseProgression("C G Am F"), [
    {root:"C",quality:"major"},{root:"G",quality:"major"},{root:"A",quality:"minor"},{root:"F",quality:"major"}
  ]);
});

test("answer spec detects key signature, sequence, choices, and self-check", () => {
  assert.deepEqual(answerSpecForExercise({type:"key-signature",payload:{},assessmentMode:"objective"}).kind, "key-signature");
  assert.deepEqual(answerSpecForExercise({type:"major-scale-build",payload:{},assessmentMode:"objective"}).kind, "sequence");
  assert.deepEqual(answerSpecForExercise({type:"concept-check",payload:{choices:["a","b"]},assessmentMode:"objective"}).kind, "choice");
  assert.deepEqual(answerSpecForExercise({type:"self-check-application",payload:{},assessmentMode:"self-check"}).kind, "self-check");
});

test("two-sequence parser produces the grader shape", () => {
  assert.deepEqual(parseAnswerFromValues({kind:"two-sequences"},{ascending:"A B C",descending:"A G F"}), {ascending:["A","B","C"],descending:["A","G","F"]});
});
