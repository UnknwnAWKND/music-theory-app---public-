import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  phase1Lessons,
  phase2Lessons,
  phase3Lessons,
  phase4Lessons,
  phase5Lessons,
  phase6Lessons,
} from "../dist/index.js";

const phases = [phase1Lessons(), phase2Lessons(), phase3Lessons(), phase4Lessons(), phase5Lessons(), phase6Lessons()];
const lessons = phases.flat();
const byId = new Map(lessons.map((lesson) => [lesson.skillId, lesson]));
const step = (lessonId, stepId) => byId.get(lessonId)?.teachingSteps.find((item) => item.id === stepId);
const fullStepText = (item) => [item.title, item.body, item.workedExample, item.payoff].filter(Boolean).join(" ");
const allTeachingText = lessons.flatMap((lesson) => lesson.teachingSteps).map(fullStepText).join("\n");

function normalizeNoteLabel(value) {
  return String(value).replace(/♯/g, "#").replace(/♭/g, "b").replace(/[0-9]/g, "");
}

function labelPitchClass(value) {
  const match = /^([A-G])([#b]*)$/.exec(normalizeNoteLabel(value));
  assert.ok(match, `Unexpected piano label: ${value}`);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1]];
  const delta = [...match[2]].reduce((sum, accidental) => sum + (accidental === "#" ? 1 : -1), 0);
  return ((base + delta) % 12 + 12) % 12;
}

test("human-readability pass preserves the exact six-phase lesson structure", () => {
  assert.deepEqual(phases.map((items) => items.length), [10, 4, 5, 10, 4, 4]);
  assert.equal(lessons.length, 37);
  assert.equal(lessons.flatMap((lesson) => lesson.teachingSteps).length, 174);
});

test("Lesson 1 headings do not get pointlessly restated in the body", () => {
  const lesson = byId.get("intervals.lesson-1-unison-octave");
  const [intro, p1, p8] = lesson.teachingSteps;
  assert.equal(intro.title, "Intervals");
  assert.equal(p1.title, "Perfect Unison (P1)");
  assert.equal(p8.title, "Perfect Octave (P8)");
  assert.doesNotMatch(p1.body, /Its name is Perfect Unison|is called a Perfect Unison, written P1/i);
  assert.doesNotMatch(p8.body, /Its name is Perfect Octave|is called a Perfect Octave, written P8/i);
  assert.match(p1.body, /same pitch/i);
  assert.match(p1.body, /same piano key/i);
  assert.match(p8.body, /eight note names/i);
  assert.match(p8.body, /different piano keys/i);
});

test("early Phase 1 does not depend on later quality categories", () => {
  const firstTwo = phase1Lessons().slice(0, 2).flatMap((lesson) => lesson.teachingSteps).map(fullStepText).join("\n");
  assert.doesNotMatch(firstTwo, /\bMajor\b|\bMinor\b|\bAugmented\b|\bDiminished\b|inversion/i);

  const beforeTritone = phase1Lessons().slice(0, 7).flatMap((lesson) => lesson.teachingSteps).map(fullStepText).join("\n");
  assert.doesNotMatch(beforeTritone, /\bAugmented\b|\bDiminished\b/i);

  const thirds = byId.get("intervals.lesson-4-thirds").teachingSteps.map(fullStepText).join("\n");
  assert.match(thirds, /Major/i);
  assert.match(thirds, /Minor/i);
  assert.match(thirds, /half step/i);
});

test("accidental vocabulary is defined before the first non-obvious P5 spelling example", () => {
  const spelling = step("intervals.lesson-2-perfect-fifth", "p5-spelling");
  assert.match(spelling.body, /An accidental is a sharp, flat, or natural sign/i);
  assert.match(spelling.workedExample, /B–C–D–E–F/);
  assert.match(spelling.workedExample, /F♯/);
  assert.doesNotMatch(spelling.workedExample, /G♭ is.*correct/i);
});

test("Phase 3 does not use Phase 4 chord theory to explain minor-scale construction", () => {
  const phase3Text = phase3Lessons().flatMap((lesson) => lesson.teachingSteps).map(fullStepText).join("\n");
  assert.doesNotMatch(phase3Text, /dominant triad becomes|build the V chord|diatonic triad pattern|Roman numeral/i);
  assert.match(step("minor-scales.lesson-3-harmonic-minor", "harmonic-why").body, /leading tone/i);
});

test("Phase 4 introduces triad vocabulary before relying on it", () => {
  const method = step("diatonic-chords.lesson-1-stacking-thirds", "method");
  const terms = step("diatonic-chords.lesson-1-stacking-thirds", "terms");
  assert.doesNotMatch(method.body, /tertian harmony|root, 3rd, 5th/i);
  assert.match(method.body, /skip the next scale note, take the following note/i);
  assert.match(terms.body, /A chord is a group of notes sounding together/i);
  assert.match(terms.body, /A triad is a three-note chord/i);
  assert.match(terms.body, /Diatonic means/i);
});

test("Roman numeral number and quality conventions are disclosed in order", () => {
  const derive = step("diatonic-chords.lesson-2-major-triads", "derive");
  const pattern = step("diatonic-chords.lesson-2-major-triads", "pattern");
  assert.match(derive.body, /Roman numeral labels the scale degree of the chord root/i);
  assert.doesNotMatch(derive.body, /uppercase.*major|lowercase.*minor|°.*diminished/i);
  assert.match(pattern.body, /Uppercase numerals mean major triads/i);
  assert.match(pattern.body, /lowercase mean minor triads/i);
  assert.match(pattern.body, /° marks diminished/i);
});

test("learner-facing teaching copy does not expose internal mastery-engine labels", () => {
  assert.doesNotMatch(allTeachingText, /\bREADY\b|\bRETAINED\b|evidence threshold|scheduler confidence|memory strength/i);
});

test("known redundant or premature wording does not return", () => {
  assert.doesNotMatch(allTeachingText, /Its name is Perfect (?:Unison|Octave)/i);
  assert.doesNotMatch(allTeachingText, /Tertian harmony means/i);
  assert.doesNotMatch(allTeachingText, /creates no READY evidence/i);
  assert.doesNotMatch(allTeachingText, /pivot-chord modulation/i);
});

test("overview piano labels use contextual enharmonic spellings instead of slash labels", () => {
  const theoryVisuals = fs.readFileSync("web/theory-visuals.js", "utf8");
  assert.doesNotMatch(theoryVisuals, /label:\s*"(?:C#\/Db|D#\/Eb|F#\/Gb|G#\/Ab|A#\/Bb)"/);
  assert.match(theoryVisuals, /label:\s*"C♯"/);
  assert.match(theoryVisuals, /label:\s*"A♯"/);

  for (const lesson of lessons) {
    for (const teaching of lesson.teachingSteps) {
      if (teaching.visual?.kind !== "piano") continue;
      const labels = teaching.visual.data?.displayLabels ?? {};
      for (const [physicalKey, displayLabel] of Object.entries(labels)) {
        assert.equal(labelPitchClass(physicalKey), labelPitchClass(displayLabel), `${lesson.skillId}/${teaching.id}: ${physicalKey} vs ${displayLabel}`);
        assert.doesNotMatch(String(displayLabel), /\//, `${lesson.skillId}/${teaching.id} uses a slash label on a piano key`);
      }
    }
  }
});

test("piano black-key labels are constrained to their own key on phone layouts", () => {
  const css = fs.readFileSync("web/usage-correction-pass.css", "utf8");
  assert.match(css, /\.piano-visual-v2 \.piano-key\.black[\s\S]*?white-space:\s*nowrap/);
  assert.match(css, /\.piano-visual-v2 \.piano-key\.black[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /@media \(max-width:\s*520px\)[\s\S]*?\.piano-key\.black/);
});

test("far-side circle examples use correct circle distances and spellings", () => {
  const far = step("circle-of-fifths.lesson-4-far-side-transposition", "far-side-rule");
  assert.match(far.workedExample, /E major and A♭ major are 4 steps away/i);
  assert.match(far.workedExample, /B major and D♭\/C♯ major are 5/i);
  assert.match(far.workedExample, /F♯\/G♭ major is 6/i);
});
