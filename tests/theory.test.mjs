import assert from "node:assert/strict";
import test from "node:test";
import {
  INTERVALS,
  buildSeventh,
  buildTriad,
  formatNote,
  intervalAbove,
  majorDiatonicSevenths,
  majorDiatonicTriads,
  majorScale,
  parseNote,
  pitchClass,
} from "../dist/theory/index.js";

const names = (notes) => notes.map(formatNote);

test("major thirds use correct letter spelling", () => {
  assert.equal(formatNote(intervalAbove(parseNote("F#"), INTERVALS.M3)), "A♯");
  assert.equal(formatNote(intervalAbove(parseNote("Bb"), INTERVALS.M3)), "D");
});

test("tritone spelling distinguishes A4 and d5", () => {
  assert.equal(formatNote(intervalAbove(parseNote("C"), INTERVALS.A4)), "F♯");
  assert.equal(formatNote(intervalAbove(parseNote("C"), INTERVALS.d5)), "G♭");
});

test("major scales are spelled correctly", () => {
  assert.deepEqual(names(majorScale(parseNote("D"))), ["D", "E", "F♯", "G", "A", "B", "C♯"]);
  assert.deepEqual(names(majorScale(parseNote("F#"))), ["F♯", "G♯", "A♯", "B", "C♯", "D♯", "E♯"]);
  assert.deepEqual(names(majorScale(parseNote("Gb"))), ["G♭", "A♭", "B♭", "C♭", "D♭", "E♭", "F"]);
  assert.deepEqual(names(majorScale(parseNote("C#"))), ["C♯", "D♯", "E♯", "F♯", "G♯", "A♯", "B♯"]);
  assert.deepEqual(names(majorScale(parseNote("Db"))), ["D♭", "E♭", "F", "G♭", "A♭", "B♭", "C"]);
});

test("enharmonic major scales preserve spelling but share sounding pitch classes", () => {
  const fs = majorScale(parseNote("F#"));
  const gb = majorScale(parseNote("Gb"));
  assert.deepEqual(fs.map(pitchClass), gb.map(pitchClass));
  assert.notDeepEqual(fs.map(formatNote), gb.map(formatNote));
});

test("basic triads are generated correctly", () => {
  assert.deepEqual(buildTriad(parseNote("F#"), "major").map(formatNote), ["F♯", "A♯", "C♯"]);
  assert.deepEqual(buildTriad(parseNote("Ab"), "minor").map(formatNote), ["A♭", "C♭", "E♭"]);
  assert.deepEqual(buildTriad(parseNote("C"), "diminished").map(formatNote), ["C", "E♭", "G♭"]);
  assert.deepEqual(buildTriad(parseNote("Bb"), "augmented").map(formatNote), ["B♭", "D", "F♯"]);
});

test("fully diminished seventh preserves diminished-seventh spelling", () => {
  assert.deepEqual(buildSeventh(parseNote("C"), "diminished7").map(formatNote), ["C", "E♭", "G♭", "B♭♭"]);
});

const conventionalMajorTonics = [
  "C", "G", "D", "A", "E", "B", "F#", "C#",
  "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb",
];

test("all conventional major keys derive the invariant triad-quality pattern", () => {
  const expected = ["major", "minor", "minor", "major", "major", "minor", "diminished"];
  for (const tonic of conventionalMajorTonics) {
    assert.deepEqual(majorDiatonicTriads(parseNote(tonic)).map((x) => x.quality), expected, tonic);
  }
});

test("all conventional major keys derive the invariant seventh-quality pattern", () => {
  const expected = ["major7", "minor7", "minor7", "major7", "dominant7", "minor7", "halfDiminished7"];
  for (const tonic of conventionalMajorTonics) {
    assert.deepEqual(majorDiatonicSevenths(parseNote(tonic)).map((x) => x.quality), expected, tonic);
  }
});

test("perfect unison preserves spelling", () => {
  assert.equal(formatNote(intervalAbove(parseNote("F#"), INTERVALS.P1)), "F♯");
  assert.equal(formatNote(intervalAbove(parseNote("Cb"), INTERVALS.P1)), "C♭");
});

test("minor scale forms are correctly spelled and distinguish variable 6 and 7", async () => {
  const {
    naturalMinorScale,
    harmonicMinorScale,
    classicalMelodicMinor,
    jazzMelodicMinorScale,
  } = await import("../dist/theory/index.js");
  assert.deepEqual(names(naturalMinorScale(parseNote("A"))), ["A", "B", "C", "D", "E", "F", "G"]);
  assert.deepEqual(names(harmonicMinorScale(parseNote("A"))), ["A", "B", "C", "D", "E", "F", "G♯"]);
  const classical = classicalMelodicMinor(parseNote("A"));
  assert.deepEqual(names(classical.ascending), ["A", "B", "C", "D", "E", "F♯", "G♯"]);
  assert.deepEqual(names(classical.descending), ["A", "G", "F", "E", "D", "C", "B"]);
  assert.deepEqual(names(jazzMelodicMinorScale(parseNote("A"))), ["A", "B", "C", "D", "E", "F♯", "G♯"]);
});

test("relative major/minor tonic functions preserve correct spelling", async () => {
  const { relativeMinorTonic, relativeMajorTonic } = await import("../dist/theory/index.js");
  assert.equal(formatNote(relativeMinorTonic(parseNote("Eb"))), "C");
  assert.equal(formatNote(relativeMinorTonic(parseNote("F#"))), "D♯");
  assert.equal(formatNote(relativeMajorTonic(parseNote("C#"))), "E");
  assert.equal(formatNote(relativeMajorTonic(parseNote("Bb"))), "D♭");
});

test("minor scale forms derive the expected triad quality patterns", async () => {
  const {
    naturalMinorDiatonicTriads,
    harmonicMinorDiatonicTriads,
    melodicMinorAscendingDiatonicTriads,
  } = await import("../dist/theory/index.js");
  assert.deepEqual(naturalMinorDiatonicTriads(parseNote("A")).map((x) => x.quality),
    ["minor", "diminished", "major", "minor", "minor", "major", "major"]);
  assert.deepEqual(harmonicMinorDiatonicTriads(parseNote("A")).map((x) => x.quality),
    ["minor", "diminished", "augmented", "minor", "major", "major", "diminished"]);
  assert.deepEqual(melodicMinorAscendingDiatonicTriads(parseNote("A")).map((x) => x.quality),
    ["minor", "minor", "augmented", "major", "major", "diminished", "diminished"]);
});

import {
  buildColorChord,
  buildDominantExtension,
  buildNinth,
  canonicalGuitarNoteName,
  majorKeySignature,
  majorProgression,
  modeScale,
} from "../dist/theory/index.js";

test("modal scales are generated by tonic-relative interval formulas", () => {
  assert.deepEqual(modeScale(parseNote("C"), "lydian").map(formatNote), ["C","D","E","F♯","G","A","B"]);
  assert.deepEqual(modeScale(parseNote("C"), "mixolydian").map(formatNote), ["C","D","E","F","G","A","B♭"]);
  assert.deepEqual(modeScale(parseNote("D"), "dorian").map(formatNote), ["D","E","F","G","A","B","C"]);
});

test("suspended, added-note, sixth, and ninth chords preserve their distinct structures", () => {
  assert.deepEqual(buildColorChord(parseNote("C"), "sus2").map(formatNote), ["C","D","G"]);
  assert.deepEqual(buildColorChord(parseNote("C"), "majorAdd9").map(formatNote), ["C","E","G","D"]);
  assert.deepEqual(buildColorChord(parseNote("C"), "major6").map(formatNote), ["C","E","G","A"]);
  assert.deepEqual(buildNinth(parseNote("C"), "dominant9").map(formatNote), ["C","E","G","B♭","D"]);
});

test("full dominant extensions are theoretical stacks and retain chord-member spellings", () => {
  assert.deepEqual(buildDominantExtension(parseNote("C"), 13).map(formatNote), ["C","E","G","B♭","D","F","A"]);
});

test("major key signature derivation is correct at sharp and flat extremes", () => {
  assert.deepEqual(majorKeySignature(parseNote("C")), { tonic: "C", accidentalType: "none", count: 0, alteredNotes: [] });
  assert.equal(majorKeySignature(parseNote("C#")).count, 7);
  assert.equal(majorKeySignature(parseNote("C#")).accidentalType, "sharp");
  assert.equal(majorKeySignature(parseNote("Cb")).count, 7);
  assert.equal(majorKeySignature(parseNote("Cb")).accidentalType, "flat");
});

test("major progression generation preserves Roman-numeral relationships across keys", () => {
  assert.deepEqual(majorProgression(parseNote("D"), ["I","V","vi","IV"]).map((x) => [formatNote(x.root), x.quality]), [
    ["D","major"],["A","major"],["B","minor"],["G","major"],
  ]);
});

test("standard-tuning guitar note mapping is correct", () => {
  assert.equal(canonicalGuitarNoteName(6, 0), "E");
  assert.equal(canonicalGuitarNoteName(6, 1), "F");
  assert.equal(canonicalGuitarNoteName(2, 1), "C");
  assert.equal(canonicalGuitarNoteName(1, 12), "E");
});
