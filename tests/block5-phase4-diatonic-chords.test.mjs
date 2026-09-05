import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

import {
  PHASE4_CHORD_REFERENCE,
  PHASE4_DIATONIC_CHORD_SKILL_IDS,
  SKILLS,
  activeExerciseSkillIds,
  activeLessonSkillIds,
  analyzeStructuredProgression,
  basicChordFunction,
  checkpointDefinition,
  deriveDiatonicChord,
  exerciseForSkill,
  phase4Lessons,
  practiceRoundPlan,
  seventhQualityPattern,
  transposeRomanProgression,
  triadQualityPattern,
} from "../dist/index.js";
import { renderPracticeRoundCounter, renderTeachingLesson } from "../web/lesson-ui.js";
import { transformBlock4App, transformBlock4Index } from "../scripts/block4-app-transform.mjs";
import { transformBlock5App, transformBlock5Index } from "../scripts/block5-app-transform.mjs";

const IDS = [
  "diatonic-chords.lesson-1-stacking-thirds",
  "diatonic-chords.lesson-2-major-triads",
  "diatonic-chords.lesson-3-natural-minor-triads",
  "diatonic-chords.lesson-4-harmonic-minor-triads",
  "diatonic-chords.lesson-5-melodic-minor-triads",
  "diatonic-chords.lesson-6-seventh-chords",
  "diatonic-chords.lesson-7-reference",
  "diatonic-chords.lesson-8-function",
  "diatonic-chords.lesson-9-progressions",
  "diatonic-chords.lesson-10-own-progressions",
];
const TITLES = [
  "Stacking 3rds", "Major Key Triads", "Natural Minor Triads", "Harmonic Minor Triads",
  "Melodic Minor Triads", "Diatonic 7th Chords", "Chord-Type Reference Table", "Chord Function",
  "Common Progression Vocabulary", "Analyze Your Own Progressions",
];
const phase4Skills = () => SKILLS.filter((skill) => skill.phase === 4);
const generated = (id, count = 180) => Array.from({ length: count }, (_, index) => exerciseForSkill(id, index)).filter(Boolean);
const direct = (id, count = 180) => generated(id, count).filter((item) => item.skillId === id && !item.metadata?.crossPhaseReview);

test("Phase 4 contains exactly the requested ten curriculum positions and Phase 5 is absent", () => {
  assert.deepEqual(phase4Skills().map((skill) => skill.id), IDS);
  assert.deepEqual(phase4Skills().map((skill) => skill.title), TITLES);
  assert.deepEqual(phase4Lessons().map((lesson) => lesson.skillId), IDS);
  assert.deepEqual(activeLessonSkillIds().slice(19, 29), IDS);
  assert.deepEqual(activeExerciseSkillIds().slice(19), PHASE4_DIATONIC_CHORD_SKILL_IDS);
  assert.equal(SKILLS.some((skill) => skill.phase >= 5), false);
  assert.equal(checkpointDefinition(5), undefined);
});

test("Reference Lesson 7 is a real lookup card but never a mastery lesson", () => {
  const reference = phase4Skills().find((skill) => skill.id === IDS[6]);
  assert.ok(reference);
  assert.equal(reference.contentKind, "reference");
  assert.equal(reference.assessed, false);
  assert.equal(reference.blocksPhaseCompletion, false);
  assert.equal(reference.optional, true);
  assert.equal(reference.acquisitionRoundSize, undefined);
  assert.equal(exerciseForSkill(reference.id, 0), undefined);
  assert.equal(activeExerciseSkillIds().includes(reference.id), false);
  assert.equal(reference.automaticRecall, 0);
});

test("all four diatonic triad patterns are derived correctly", () => {
  assert.deepEqual(triadQualityPattern("major"), ["major", "minor", "minor", "major", "major", "minor", "diminished"]);
  assert.deepEqual(triadQualityPattern("natural-minor"), ["minor", "diminished", "major", "minor", "minor", "major", "major"]);
  assert.deepEqual(triadQualityPattern("harmonic-minor"), ["minor", "diminished", "augmented", "minor", "major", "major", "diminished"]);
  assert.deepEqual(triadQualityPattern("melodic-minor-ascending"), ["minor", "minor", "augmented", "major", "major", "diminished", "diminished"]);
});

test("all four diatonic seventh-chord patterns are derived correctly", () => {
  assert.deepEqual(seventhQualityPattern("major"), ["major7", "minor7", "minor7", "major7", "dominant7", "minor7", "halfDiminished7"]);
  assert.deepEqual(seventhQualityPattern("natural-minor"), ["minor7", "halfDiminished7", "major7", "minor7", "minor7", "major7", "dominant7"]);
  assert.deepEqual(seventhQualityPattern("harmonic-minor"), ["minorMajor7", "halfDiminished7", "augmentedMajor7", "minor7", "dominant7", "major7", "diminished7"]);
  assert.deepEqual(seventhQualityPattern("melodic-minor-ascending"), ["minorMajor7", "minor7", "augmentedMajor7", "dominant7", "dominant7", "halfDiminished7", "halfDiminished7"]);
});

test("harmonic-minor V and III+ come directly from raised degree 7", () => {
  const v = deriveDiatonicChord("A", "harmonic-minor", 5);
  const iii = deriveDiatonicChord("A", "harmonic-minor", 3);
  assert.deepEqual(v.notes, ["E", "G♯", "B"]);
  assert.equal(v.triadQuality, "major");
  assert.equal(v.romanNumeral, "V");
  assert.deepEqual(iii.notes, ["C", "E", "G♯"]);
  assert.equal(iii.triadQuality, "augmented");
  assert.equal(iii.romanNumeral, "III+");
});

test("algorithmic chord spelling remains theoretically exact in sharp and flat keys", () => {
  assert.deepEqual(deriveDiatonicChord("F#", "major", 5).notes, ["C♯", "E♯", "G♯"]);
  assert.deepEqual(deriveDiatonicChord("C#", "harmonic-minor", 3).notes, ["E", "G♯", "B♯"]);
  assert.deepEqual(deriveDiatonicChord("C#", "harmonic-minor", 7, true).notes, ["B♯", "D♯", "F♯", "A"]);
  assert.deepEqual(deriveDiatonicChord("Eb", "natural-minor", 2).notes, ["F", "A♭", "C♭"]);
  assert.deepEqual(deriveDiatonicChord("A", "melodic-minor-ascending", 4).notes, ["D", "F♯", "A"]);
});

test("reference card contains only required chord types with exact interval formulas and explicit roots", () => {
  assert.equal(PHASE4_CHORD_REFERENCE.length, 11);
  const byId = new Map(PHASE4_CHORD_REFERENCE.map((row) => [row.id, row]));
  const expected = new Map([
    ["major", "1–3–5"], ["minor", "1–♭3–5"], ["diminished", "1–♭3–♭5"], ["augmented", "1–3–♯5"],
    ["major7", "1–3–5–7"], ["minor7", "1–♭3–5–♭7"], ["dominant7", "1–3–5–♭7"],
    ["halfDiminished7", "1–♭3–♭5–♭7"], ["diminished7", "1–♭3–♭5–𝄫7"],
    ["minorMajor7", "1–♭3–5–7"], ["augmentedMajor7", "1–3–♯5–7"],
  ]);
  for (const [id, formula] of expected) {
    assert.equal(byId.get(id)?.intervalFormula, formula, id);
    assert.equal(byId.get(id)?.root, "C", id);
    assert.ok(byId.get(id)?.example, id);
  }
});

test("Roman numerals are derived from scale degree plus chord quality", () => {
  assert.equal(deriveDiatonicChord("Eb", "major", 2).romanNumeral, "ii");
  assert.equal(deriveDiatonicChord("Eb", "major", 7).romanNumeral, "vii°");
  assert.equal(deriveDiatonicChord("C", "natural-minor", 7).romanNumeral, "VII");
  assert.equal(deriveDiatonicChord("D", "harmonic-minor", 3).romanNumeral, "III+");
  assert.equal(deriveDiatonicChord("A", "harmonic-minor", 7, true).romanNumeral, "vii°7");
  assert.equal(deriveDiatonicChord("A", "harmonic-minor", 1, true).romanNumeral, "i(maj7)");
});

test("function teaching uses predominant broadly and does not falsely freeze iii/vi into one role", () => {
  assert.equal(basicChordFunction(1), "tonic");
  assert.equal(basicChordFunction(2), "predominant");
  assert.equal(basicChordFunction(4), "predominant");
  assert.equal(basicChordFunction(5), "dominant");
  assert.equal(basicChordFunction(7), "dominant");
  assert.equal(basicChordFunction(3), "context-dependent");
  assert.equal(basicChordFunction(6), "context-dependent");
});

test("common Roman-numeral progressions transpose into multiple keys", () => {
  assert.deepEqual(transposeRomanProgression("C", "major", [1, 5, 6, 4]).map((chord) => chord.chordSymbol), ["C", "G", "Am", "F"]);
  assert.deepEqual(transposeRomanProgression("Eb", "major", [1, 5, 6, 4]).map((chord) => chord.chordSymbol), ["E♭", "B♭", "Cm", "A♭"]);
  assert.deepEqual(transposeRomanProgression("A", "natural-minor", [1, 6, 3, 7]).map((chord) => chord.chordSymbol), ["Am", "F", "C", "G"]);
});

test("structured own-progression analysis distinguishes diatonic from outside-current-set safely", () => {
  const diatonic = analyzeStructuredProgression("C", "major", [
    { root: "C", quality: "major" }, { root: "D", quality: "minor" }, { root: "G", quality: "major" },
  ]);
  assert.deepEqual(diatonic.map((row) => row.romanNumeral), ["I", "ii", "V"]);
  assert.ok(diatonic.every((row) => row.diatonic));

  const outside = analyzeStructuredProgression("C", "major", [{ root: "D", quality: "major" }])[0];
  assert.equal(outside.diatonic, false);
  assert.match(outside.explanation, /outside this diatonic set/i);
  assert.doesNotMatch(outside.explanation, /wrong/i);

  const enharmonic = analyzeStructuredProgression("F#", "major", [{ root: "Gb", quality: "major" }])[0];
  assert.equal(enharmonic.diatonic, true);
  assert.equal(enharmonic.romanNumeral, "I");
  assert.equal(enharmonic.expectedRootSpelling, "F♯");
});

test("Phase 4 practice varies key, form, degree, quality, spelling, Roman numeral and task direction without adjacent duplicate spam", () => {
  for (const id of PHASE4_DIATONIC_CHORD_SKILL_IDS) {
    const items = direct(id, 180);
    assert.ok(items.length >= 120, id);
    for (let index = 1; index < items.length; index++) assert.notEqual(items[index].exampleSignature, items[index - 1].exampleSignature, `${id} duplicate at ${index}`);
  }
  const all = PHASE4_DIATONIC_CHORD_SKILL_IDS.flatMap((id) => direct(id, 180));
  assert.ok(new Set(all.map((item) => item.metadata?.root).filter(Boolean)).size >= 10);
  const forms = new Set(all.map((item) => item.metadata?.scaleForm).filter(Boolean));
  for (const form of ["major", "natural-minor", "harmonic-minor", "melodic-minor-ascending"]) assert.ok(forms.has(form), form);
  const directions = new Set(all.map((item) => item.metadata?.direction).filter(Boolean));
  for (const direction of ["construct-triad", "identify-quality", "roman-translation", "construct-seventh", "function", "transpose-progression", "structured-analysis"]) assert.ok(directions.has(direction), direction);
});

test("Phase 4 deliberately applies Phase 1 intervals and Phase 2/3 scales without stealing their evidence", () => {
  const all = PHASE4_DIATONIC_CHORD_SKILL_IDS.flatMap((id) => generated(id, 220));
  const cross = all.filter((item) => item.metadata?.crossPhaseReview);
  assert.ok(cross.some((item) => item.metadata?.reviewPhase === 1 && item.skillId.startsWith("intervals.")), "missing interval review");
  assert.ok(cross.some((item) => item.metadata?.reviewPhase === 2 && item.skillId.startsWith("major-scales.")), "missing major-scale review");
  assert.ok(cross.some((item) => item.metadata?.reviewPhase === 3 && item.skillId.startsWith("minor-scales.")), "missing minor-scale review");
  assert.ok(cross.every((item) => !item.skillId.startsWith("diatonic-chords.")));
});

test("automatic versus conceptual weighting is intentionally unequal", () => {
  const byId = new Map(phase4Skills().map((skill) => [skill.id, skill]));
  assert.equal(byId.get(IDS[1]).automaticRecall, 5, "major pattern is high automaticity");
  assert.equal(byId.get(IDS[2]).automaticRecall, 5, "natural minor pattern is high automaticity");
  assert.equal(byId.get(IDS[4]).automaticRecall, 2, "melodic-minor pattern is moderate/derive-first");
  assert.equal(byId.get(IDS[5]).automaticRecall, 3, "unusual seventh qualities are not drilled like the major triad pattern");
  assert.equal(byId.get(IDS[6]).automaticRecall, 0, "reference lookup is not mastery material");
  assert.ok(byId.get(IDS[3]).conceptualUnderstanding >= byId.get(IDS[3]).automaticRecall, "harmonic-minor reasons stay conceptual");
});

test("all assessed Phase 4 rounds use real 30+ counts while the reference has no question generator", () => {
  const expected = new Map([[IDS[0],36],[IDS[1],60],[IDS[2],48],[IDS[3],42],[IDS[4],30],[IDS[5],48],[IDS[7],42],[IDS[8],48],[IDS[9],30]]);
  for (const [id, size] of expected) {
    assert.equal(practiceRoundPlan(id, "new").size, size, id);
    assert.ok(practiceRoundPlan(id, "review").size >= 30, id);
  }
  assert.equal(exerciseForSkill(IDS[6], 0), undefined);
  assert.match(renderPracticeRoundCounter(11, 48, 2), /Question 12 of 48/);
});

test("Phase 4 teaching preserves replay and reference behavior without hints", () => {
  const regular = phase4Lessons()[1];
  const replay = { stage: "teaching", teachingStepIndex: 0, canSkipToReview: true, skipPlacement: "teaching-bottom" };
  const html = renderTeachingLesson({ lesson: regular, openingState: replay });
  assert.ok(html.indexOf("Skip to Review") > html.indexOf(regular.teachingSteps.at(-1).body));
  const reference = phase4Lessons()[6];
  assert.match(reference.teachingSteps.map((step) => `${step.title} ${step.body} ${step.payoff ?? ""}`).join(" "), /no mastery quiz/i);
  for (const path of ["src/practice/phase4-diatonic-chords.ts", "src/exercises/phase4-diatonic-chords.ts", "web/phase4-ui.js"]) {
    assert.doesNotMatch(fs.readFileSync(path, "utf8"), /show\s+hint|need\s+a\s+hint|hintbutton|hintbtn|inputHint|hintText/i, path);
  }
});

test("Phase 4 checkpoint represents every core category separately and excludes the reference card", () => {
  const checkpoint = checkpointDefinition(4);
  assert.ok(checkpoint);
  assert.ok(checkpoint.minItems >= 20);
  assert.ok(checkpoint.maxItems >= checkpoint.minItems);
  const ids = new Map(checkpoint.competencies.map((competency) => [competency.id, competency]));
  for (const id of ["stacking-thirds", "major-diatonic-triads", "natural-minor-triads", "harmonic-minor-triads", "harmonic-minor-reason", "melodic-minor-awareness", "seventh-chords", "correct-spelling", "roman-numeral-translation", "chord-function", "progression-application"]) assert.ok(ids.has(id), id);
  assert.ok(checkpoint.competencies.every((competency) => competency.critical));
  assert.ok(checkpoint.competencies.every((competency) => !competency.skillIds.includes(IDS[6])), "reference must not create checkpoint evidence");
  assert.ok(ids.get("major-diatonic-triads").minStrongEvidence >= 3);
  assert.ok(ids.get("seventh-chords").minStrongEvidence >= 3);
  assert.ok(ids.get("roman-numeral-translation").minDistinctSkills >= 2);
});

test("Block 5 production transform activates Phase 4, keeps Phase 5 future, and makes reference/analyzer behavior real", () => {
  const block3 = fs.readFileSync("web/app-block3.js", "utf8");
  const block4 = transformBlock4App(block3);
  const transformed = transformBlock5App(block4);
  assert.match(transformed, /const activeSections = \[1, 2, 3, 4\]/);
  assert.match(transformed, /phase\.phase >= 5/);
  assert.match(transformed, /Representative harmony check/);
  assert.match(transformed, /PHASE 3 MINOR-SCALE REVIEW/);
  assert.match(transformed, /contentKind === "reference"/);
  assert.match(transformed, /close-reference/);
  assert.match(transformed, /phase4ProgressionLabHtml/);
  assert.match(transformed, /analyzeStructuredProgression/);
  assert.match(transformed, /Phases 1–4 active/);
  assert.doesNotMatch(transformed, /show\s+hint|need\s+a\s+hint|hintbutton|hintbtn/i);
  const block4Index = transformBlock4Index(fs.readFileSync("web/index.html", "utf8"));
  const index = transformBlock5Index(block4Index);
  assert.match(index, /app-block5\.js/);
  assert.match(index, /phase4\.css/);
  const temp = "/tmp/music-theory-block5-app.js";
  fs.writeFileSync(temp, transformed);
  execFileSync(process.execPath, ["--check", temp]);
});
