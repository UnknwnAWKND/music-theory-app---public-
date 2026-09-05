import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

import {
  RELATIVE_KEY_PAIRS,
  SKILLS,
  activeExerciseSkillIds,
  activeLessonSkillIds,
  checkpointDefinition,
  exerciseForSkill,
  harmonicMinorMatchesRelativeMajorCollection,
  harmonicMinorScaleNames,
  lessonForSkill,
  majorDegreeToRelativeMinorDegree,
  majorScaleNames,
  majorToRelativeMinorSemitones,
  melodicMinorMatchesRelativeMajorCollection,
  minorDegreeToRelativeMajorDegree,
  minorToRelativeMajorSemitones,
  naturalMinorScaleNames,
  phase5Lessons,
  practiceRoundPlan,
  relativeMajorName,
  relativeMinorName,
  relativeNaturalMinorChordRenumbering,
  shareRelativeNaturalMinorCollection,
} from "../dist/index.js";
import { renderTeachingLesson } from "../web/lesson-ui.js";
import { transformBlock4App, transformBlock4Index } from "../scripts/block4-app-transform.mjs";
import { transformBlock5App, transformBlock5Index } from "../scripts/block5-app-transform.mjs";
import { transformBlock6App, transformBlock6Index } from "../scripts/block6-app-transform.mjs";

const IDS = [
  "relatives.lesson-1-relative-major-minor",
  "relatives.lesson-2-same-chords-different-numbers",
  "relatives.lesson-3-fast-identification",
  "relatives.lesson-4-instant-recall",
];
const TITLES = [
  "Relative Major / Minor",
  "Same Chords, Different Numbers",
  "Fast Identification",
  "Relative-Key Instant Recall Drill",
];
const EXPECTED_PAIRS = [
  ["C", "A"], ["G", "E"], ["D", "B"], ["A", "F♯"], ["E", "C♯"],
  ["B", "G♯"], ["F#", "D♯"], ["C#", "A♯"], ["F", "D"], ["Bb", "G"],
  ["Eb", "C"], ["Ab", "F"], ["Db", "B♭"], ["Gb", "E♭"], ["Cb", "A♭"],
];
const generated = (id, count = 240) => Array.from({ length: count }, (_, index) => exerciseForSkill(id, index)).filter(Boolean);
const normalize = (value) => String(value).replaceAll("#", "♯").replaceAll("b", "♭");

test("Phase 5 is exactly four lessons and Phase 6 remains unbuilt", () => {
  const skills = SKILLS.filter((skill) => skill.phase === 5);
  assert.deepEqual(skills.map((skill) => skill.id), IDS);
  assert.deepEqual(skills.map((skill) => skill.title), TITLES);
  assert.deepEqual(phase5Lessons().map((lesson) => lesson.skillId), IDS);
  assert.deepEqual(activeLessonSkillIds().slice(-4), IDS);
  assert.deepEqual(activeExerciseSkillIds().slice(-4), IDS);
  assert.equal(SKILLS.some((skill) => skill.phase === 6), false);
  assert.equal(checkpointDefinition(6), undefined);
});

test("all conventional relative pairs through seven accidentals are exact", () => {
  assert.equal(RELATIVE_KEY_PAIRS.length, 15);
  assert.deepEqual(RELATIVE_KEY_PAIRS.map((pair) => [normalize(pair.major), normalize(pair.minor)]), EXPECTED_PAIRS.map(([major, minor]) => [normalize(major), normalize(minor)]));
  for (const pair of RELATIVE_KEY_PAIRS) {
    assert.equal(normalize(relativeMinorName(pair.major)), normalize(pair.minor), pair.major);
    assert.equal(normalize(relativeMajorName(pair.minor)), normalize(pair.major), pair.minor);
  }
});

test("major to relative minor is down m3 and minor to relative major is up m3", () => {
  for (const pair of RELATIVE_KEY_PAIRS) {
    assert.equal(majorToRelativeMinorSemitones(pair.major), 3, `${pair.major} -> ${pair.minor}`);
    assert.equal(minorToRelativeMajorSemitones(pair.minor), 3, `${pair.minor} -> ${pair.major}`);
  }
});

test("relative major and NATURAL minor share the exact collection; altered minor forms do not", () => {
  for (const pair of RELATIVE_KEY_PAIRS) {
    assert.equal(shareRelativeNaturalMinorCollection(pair.major, pair.minor), true, `${pair.major}/${pair.minor}`);
    assert.equal(harmonicMinorMatchesRelativeMajorCollection(pair.major, pair.minor), false, `${pair.minor} harmonic`);
    assert.equal(melodicMinorMatchesRelativeMajorCollection(pair.major, pair.minor), false, `${pair.minor} melodic`);
    const major = new Set(majorScaleNames(pair.major));
    const natural = new Set(naturalMinorScaleNames(pair.minor));
    assert.deepEqual([...major].sort(), [...natural].sort());
  }
  assert.deepEqual(majorScaleNames("C"), ["C", "D", "E", "F", "G", "A", "B"]);
  assert.deepEqual(naturalMinorScaleNames("A"), ["A", "B", "C", "D", "E", "F", "G"]);
  assert.ok(harmonicMinorScaleNames("A").includes("G♯"));
});

test("enharmonic key spelling follows the shared key signature rather than piano pitch alone", () => {
  assert.equal(relativeMinorName("Db"), "B♭");
  assert.notEqual(relativeMinorName("Db"), "A♯");
  assert.equal(relativeMinorName("C#"), "A♯");
  assert.equal(relativeMinorName("Gb"), "E♭");
  assert.equal(relativeMinorName("Cb"), "A♭");
  assert.equal(relativeMajorName("Bb"), "D♭");
  assert.equal(relativeMajorName("A#"), "C♯");
});

test("relative natural-minor degree rotation is exact in both directions", () => {
  assert.deepEqual([1,2,3,4,5,6,7].map(majorDegreeToRelativeMinorDegree), [3,4,5,6,7,1,2]);
  assert.deepEqual([1,2,3,4,5,6,7].map(minorDegreeToRelativeMajorDegree), [6,7,1,2,3,4,5]);
});

test("Roman numeral renumbering matches the same chord under the new tonic", () => {
  const mapping = relativeNaturalMinorChordRenumbering("C");
  assert.deepEqual(mapping.map((item) => item.majorRomanNumeral), ["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
  assert.deepEqual(mapping.map((item) => item.minorRomanNumeral), ["III", "iv", "v", "VI", "VII", "i", "ii°"]);
  assert.deepEqual(mapping.map((item) => item.chordRoot), ["C", "D", "E", "F", "G", "A", "B"]);
  for (const pair of RELATIVE_KEY_PAIRS) {
    const rows = relativeNaturalMinorChordRenumbering(pair.major);
    assert.equal(rows.length, 7);
    assert.equal(new Set(rows.map((row) => row.chordRoot)).size, 7);
    assert.deepEqual(rows.map((row) => row.minorDegree), [3,4,5,6,7,1,2]);
  }
});

test("lesson teaching states the natural-minor limitation and connects tonic, chords, and m3", () => {
  const text = phase5Lessons().flatMap((lesson) => lesson.teachingSteps).map((step) => `${step.title} ${step.body} ${step.workedExample ?? ""}`).join(" ");
  assert.match(text, /natural minor/i);
  assert.match(text, /harmonic minor/i);
  assert.match(text, /melodic minor/i);
  assert.match(text, /different tonic|tonic changed/i);
  assert.match(text, /minor 3rd|m3/i);
  assert.match(text, /Roman numeral/i);
  assert.match(text, /D♭ major.*B♭ minor/i);
  assert.ok(phase5Lessons()[0].teachingSteps.filter((step) => step.visual?.kind === "piano").length >= 2, "Lesson 1 should show C major and A natural minor on piano");
});

test("Phase 5 practice covers both directions, shared collections, renumbering, and all written pairs", () => {
  const items = IDS.flatMap((id) => generated(id, 320));
  const directions = new Set(items.map((item) => item.metadata?.direction).filter(Boolean));
  for (const direction of ["major-to-minor", "minor-to-major", "compare-collections", "major-rn-to-minor-rn", "minor-rn-to-major-rn"]) assert.ok(directions.has(direction), direction);

  const seenMajors = new Set(items.filter((item) => item.skillId.startsWith("relatives.")).map((item) => normalize(item.metadata?.majorKey ?? "")).filter(Boolean));
  const seenMinors = new Set(items.filter((item) => item.skillId.startsWith("relatives.")).map((item) => normalize(item.metadata?.minorKey ?? "")).filter(Boolean));
  for (const pair of RELATIVE_KEY_PAIRS) {
    assert.ok(seenMajors.has(normalize(pair.major)), `missing ${pair.major} major`);
    assert.ok(seenMinors.has(normalize(pair.minor)), `missing ${pair.minor} minor`);
  }
});

test("Phase 5 avoids duplicate-question spam", () => {
  for (const id of IDS) {
    const items = generated(id, 120);
    const signatures = items.map((item) => item.exampleSignature);
    const unique = new Set(signatures);
    assert.ok(unique.size >= 30, `${id} only produced ${unique.size} distinct semantic examples`);
    for (let i = 1; i < signatures.length; i++) assert.notEqual(signatures[i], signatures[i - 1], `${id} repeated ${signatures[i]} back-to-back`);
  }
});

test("Phase 5 continues interval, scale, minor-scale, and harmony retrieval with original skill credit", () => {
  const cross = IDS.flatMap((id) => generated(id, 420)).filter((item) => item.metadata?.crossPhaseReview);
  const phases = new Set(cross.map((item) => item.metadata?.reviewPhase));
  for (const phase of [1,2,3,4]) assert.ok(phases.has(phase), `missing Phase ${phase} review`);
  assert.ok(cross.filter((item) => item.metadata?.reviewPhase === 1).every((item) => item.skillId.startsWith("intervals.")));
  assert.ok(cross.filter((item) => item.metadata?.reviewPhase === 2).every((item) => item.skillId.startsWith("major-scales.")));
  assert.ok(cross.filter((item) => item.metadata?.reviewPhase === 3).every((item) => item.skillId.startsWith("minor-scales.")));
  assert.ok(cross.filter((item) => item.metadata?.reviewPhase === 4).every((item) => item.skillId.startsWith("diatonic-chords.")));
});

test("relative-key automaticity is high priority without matching interval drilling volume", () => {
  const phase1Max = Math.max(...SKILLS.filter((skill) => skill.phase === 1).map((skill) => practiceRoundPlan(skill.id, "new").size));
  const phase5 = SKILLS.filter((skill) => skill.phase === 5);
  assert.deepEqual(phase5.map((skill) => practiceRoundPlan(skill.id, "new").size), [30,36,36,48]);
  assert.ok(Math.max(...phase5.map((skill) => practiceRoundPlan(skill.id, "new").size)) < phase1Max);
  assert.equal(phase5[1].automaticRecall, 3, "Roman-renumbering concept should not be treated like pure instant pair recall");
  assert.equal(phase5[2].automaticRecall, 5);
  assert.equal(phase5[3].automaticRecall, 5);
});

test("no hints and completed Phase 5 lessons replay teaching before Skip to Review", () => {
  for (const path of ["src/practice/phase5-relatives.ts", "src/exercises/phase5-relatives.ts", "scripts/block6-app-transform.mjs"]) {
    assert.doesNotMatch(fs.readFileSync(path, "utf8"), /show\s+hint|need\s+a\s+hint|hintbutton|hintbtn|inputHint|hintText|showHint/i, path);
  }
  for (const id of IDS) {
    const lesson = lessonForSkill(id);
    assert.ok(lesson);
    const first = { stage: "teaching", teachingStepIndex: 0, canSkipToReview: false, skipPlacement: null };
    const replay = { stage: "teaching", teachingStepIndex: 0, canSkipToReview: true, skipPlacement: "teaching-bottom" };
    assert.doesNotMatch(renderTeachingLesson({ lesson, openingState: first }), /Skip to Review/);
    const html = renderTeachingLesson({ lesson, openingState: replay });
    assert.ok(html.indexOf("Skip to Review") > html.indexOf(lesson.teachingSteps.at(-1).body));
  }
});

test("Phase 5 checkpoint targets relatives without over-testing altered minor forms", () => {
  const checkpoint = checkpointDefinition(5);
  assert.ok(checkpoint);
  assert.ok(checkpoint.minItems >= 14);
  const ids = new Set(checkpoint.competencies.map((item) => item.id));
  for (const id of ["relative-major-to-minor", "relative-minor-to-major", "shared-natural-minor-collection", "roman-renumbering", "key-variety"]) assert.ok(ids.has(id), id);
  assert.equal(ids.has("harmonic-alteration"), false);
  assert.equal(ids.has("melodic-alteration"), false);
  assert.ok(checkpoint.competencies.every((item) => item.critical));
  assert.equal(checkpointDefinition(6), undefined);
});

test("Block 6 production transform activates only Phase 5 and leaves Phase 6 future", () => {
  const source = fs.readFileSync("web/app-block3.js", "utf8");
  const index = fs.readFileSync("web/index.html", "utf8");
  const block4 = transformBlock4App(source);
  const block5 = transformBlock5App(block4);
  const block6 = transformBlock6App(block5);
  assert.match(block6, /const activeSections = \[1, 2, 3, 4, 5\]/);
  assert.match(block6, /phase\.phase >= 6/);
  assert.match(block6, /Representative relative-key check/);
  assert.match(block6, /PHASE 4 HARMONY REVIEW/);
  assert.match(block6, /Phases 1–5 active/);
  assert.doesNotMatch(block6, /const activeSections = \[1, 2, 3, 4, 5, 6\]/);
  const temp = "/tmp/music-theory-block6-app.js";
  fs.writeFileSync(temp, block6);
  execFileSync(process.execPath, ["--check", temp]);
  assert.match(transformBlock6Index(transformBlock5Index(transformBlock4Index(index))), /app-block6\.js/);
});
