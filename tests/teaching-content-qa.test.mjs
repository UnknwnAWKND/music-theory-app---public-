import assert from "node:assert/strict";
import test from "node:test";

import {
  INTERVALS,
  PHASE1_INTERVAL_NAMES,
  formatNote,
  intervalAbove,
  letterIndex,
  mod,
  parseNote,
  phase1Lessons,
  phase2Lessons,
  phase3Lessons,
  phase4Lessons,
  phase5Lessons,
  phase6Lessons,
  pitchClass,
} from "../dist/index.js";

const phases = [phase1Lessons(), phase2Lessons(), phase3Lessons(), phase4Lessons(), phase5Lessons(), phase6Lessons()];
const allLessons = phases.flat();
const allSteps = allLessons.flatMap((lesson) => lesson.teachingSteps.map((step) => ({ lesson, step })));
const lesson = (skillId) => allLessons.find((item) => item.skillId === skillId);
const step = (skillId, stepId) => lesson(skillId)?.teachingSteps.find((item) => item.id === stepId);
const teachingText = () => allSteps.map(({ step: item }) => [item.title, item.body, item.workedExample, item.payoff].filter(Boolean).join(" ")).join("\n");

test("all 37 rebuilt lessons and all 176 teaching pages receive the active QA catalog", () => {
  assert.equal(allLessons.length, 37);
  assert.equal(allSteps.length, 176);
  assert.deepEqual(phases.map((items) => items.length), [10, 4, 5, 10, 4, 4]);
});

test("Phase 1 Lesson 1 defines number, quality, half step, and the exact C-to-G P5 without vague wording", () => {
  const intro = step("intervals.lesson-1-unison-octave", "interval-means-distance");
  assert.ok(intro);
  assert.match(intro.body, /number tells you how many letter names/i);
  assert.match(intro.body, /Quality is the word that tells you the exact version/i);
  assert.match(intro.body, /half steps.*semitones/i);
  assert.match(intro.workedExample, /C→G.*Perfect 5th.*P5/i);
  assert.doesNotMatch(intro.workedExample, /some kind of/i);
});

test("vague 'some kind of' interval wording is absent from every active teaching page", () => {
  assert.doesNotMatch(teachingText(), /some kind of/i);
});

test("Augmented and Diminished first appear in the tritone lesson with plain definitions", () => {
  const phase1 = phase1Lessons();
  const beforeTritone = phase1.slice(0, 7).flatMap((item) => item.teachingSteps).map((item) => `${item.body} ${item.workedExample ?? ""}`).join("\n");
  assert.doesNotMatch(beforeTritone, /\bAugmented\b|\bDiminished\b/i);
  const tritone = step("intervals.lesson-8-tritone", "tritone");
  assert.match(tritone.body, /Augmented means one half step larger/i);
  assert.match(tritone.body, /Diminished means one half step smaller/i);
});

test("first-use terminology fixes define pitch class, chord quality, Roman numerals, and key signature at the point of need", () => {
  assert.match(step("major-scales.lesson-3-build-all-roots", "twelve-pitch-classes").body, /pitch class treats pitches an octave apart/i);
  assert.match(step("diatonic-chords.lesson-1-stacking-thirds", "phase1").body, /Chord quality means the chord's type/i);
  assert.match(step("diatonic-chords.lesson-2-major-triads", "derive").body, /Roman numerals label the scale degree of the chord root/i);
  assert.match(step("relatives.lesson-1-relative-major-minor", "relative-definition").body, /A key signature is the set of sharps or flats/i);
});

test("scale tonic and chord root terminology no longer collapse into one definition", () => {
  const scaleTonic = step("major-scales.lesson-1-formula", "scale-tonic-definition");
  assert.match(scaleTonic.body, /tonic is the word for the home note of a scale or key/i);
  assert.match(scaleTonic.body, /root is used mainly for the note a chord is built from/i);
  assert.equal(scaleTonic.workedExample, "In D major, D is the tonic and scale degree 1.");
});

test("piano teaching visuals use physical key IDs plus context-correct written labels", () => {
  const minor3 = step("intervals.lesson-4-thirds", "minor3").visual.data;
  assert.deepEqual(minor3.highlighted, ["F", "G#"]);
  assert.equal(minor3.displayLabels["G#"], "A♭");

  const naturalMinor = step("minor-scales.lesson-1-natural-formula", "natural-minor-formula").visual.data;
  assert.deepEqual(naturalMinor.highlighted, ["C", "D", "D#", "F", "G", "G#", "A#"]);
  assert.deepEqual(naturalMinor.displayLabels, { "D#": "E♭", "G#": "A♭", "A#": "B♭" });

  const a4 = step("intervals.lesson-8-tritone", "a4").visual.data;
  const d5 = step("intervals.lesson-8-tritone", "d5").visual.data;
  assert.deepEqual(a4.highlighted, ["C", "F#"]);
  assert.deepEqual(d5.highlighted, ["C", "F#"]);
  assert.equal(a4.displayLabels["F#"], "F♯");
  assert.equal(d5.displayLabels["F#"], "G♭");
});

test("interval spelling examples are exact for the requested canonical cases", () => {
  const cases = [
    ["C", "P5", "G"],
    ["F", "P5", "C"],
    ["C", "P4", "F"],
    ["C", "M3", "E"],
    ["C", "m3", "E♭"],
    ["C", "A4", "F♯"],
    ["C", "d5", "G♭"],
  ];
  for (const [root, intervalName, expected] of cases) {
    assert.equal(formatNote(intervalAbove(parseNote(root), INTERVALS[intervalName])), expected, `${root} ${intervalName}`);
  }
});

test("Phase 1 interval construction stays exact across varied natural, sharp, and flat roots", () => {
  const roots = ["C", "F", "B", "G#", "Db", "Eb"];
  for (const rootText of roots) {
    const root = parseNote(rootText);
    for (const intervalName of PHASE1_INTERVAL_NAMES) {
      const spec = INTERVALS[intervalName];
      const target = intervalAbove(root, spec);
      assert.equal(mod(letterIndex(target.letter) - letterIndex(root.letter), 7), mod(spec.number - 1, 7), `${rootText} ${intervalName} letter`);
      assert.equal(mod(pitchClass(target) - pitchClass(root), 12), mod(spec.semitones, 12), `${rootText} ${intervalName} pitch`);
    }
  }
});

test("tritone teaching preserves written A4 versus d5 identity rather than semitone-only naming", () => {
  const tritone = step("intervals.lesson-8-tritone", "tritone");
  assert.match(tritone.workedExample, /C→F♯ is A4/);
  assert.match(tritone.workedExample, /C→G♭ is d5/);
  assert.match(tritone.body, /spelling decides which written interval/i);
});

test("seventh-chord teaching defines chord types before using the pattern symbols", () => {
  const method = step("diatonic-chords.lesson-6-seventh-chords", "method");
  assert.match(method.body, /Major 7 = major triad \+ M7/i);
  assert.match(method.body, /dominant 7 = major triad \+ m7/i);
  assert.match(method.body, /half-diminished 7 = diminished triad \+ m7/i);
  const harmonic = step("diatonic-chords.lesson-6-seventh-chords", "harmonic");
  assert.match(harmonic.body, /d7 means a diminished 7th, one half step smaller than m7/i);
});

test("minor-scale teaching qualifies the classical descending melodic-minor convention instead of overstating it", () => {
  const descending = step("minor-scales.lesson-4-melodic-minor", "melodic-descending-why");
  assert.match(descending.body, /classical form taught here/i);
  assert.match(descending.body, /not a rule that every melody in minor must always follow/i);
  assert.equal(descending.workedExample, "C melodic minor descending uses C B♭ A♭ G F E♭ D C, the same pitches as C natural minor in descending order.");
});

test("conceptual explanation pages are not mislabeled as automatic-memory requirements", () => {
  const conceptualSteps = [
    ["intervals.lesson-3-perfect-fourth", "p4-payoff"],
    ["intervals.lesson-4-thirds", "third-payoff"],
    ["major-scales.lesson-1-formula", "formula-payoff"],
    ["major-scales.lesson-3-build-all-roots", "build-payoff"],
    ["major-scales.lesson-4-instant-recall", "balanced-roots"],
    ["major-scales.lesson-4-instant-recall", "recall-payoff"],
    ["minor-scales.lesson-1-natural-formula", "natural-minor-payoff"],
    ["minor-scales.lesson-2-natural-all-roots", "natural-all-roots-payoff"],
    ["minor-scales.lesson-3-harmonic-minor", "augmented-second-definition"],
    ["minor-scales.lesson-5-instant-recall", "minor-balanced-roots"],
    ["minor-scales.lesson-5-instant-recall", "minor-recall-payoff"],
    ["diatonic-chords.lesson-10-own-progressions", "goal"],
  ];
  for (const [skillId, stepId] of conceptualSteps) assert.equal(step(skillId, stepId).expectation, "understand", `${skillId}/${stepId}`);
});

test("advanced terms removed from early examples do not create unanswered detours", () => {
  const thirdsSpelling = step("intervals.lesson-4-thirds", "third-spelling");
  assert.doesNotMatch(`${thirdsSpelling.body} ${thirdsSpelling.workedExample}`, /augmented 2nd|diminished/i);
  const secondsSpelling = step("intervals.lesson-6-seconds", "seconds-spelling");
  assert.doesNotMatch(`${secondsSpelling.body} ${secondsSpelling.workedExample}`, /diminished 3rd|double flat|𝄫/i);
});
