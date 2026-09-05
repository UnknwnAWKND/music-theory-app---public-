import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  CIRCLE_MAJOR_ORDER,
  CIRCLE_POSITIONS,
  CURRICULUM_PHASES,
  SKILLS,
  activeExerciseSkillIds,
  activeLessonSkillIds,
  allCheckpointDefinitions,
  checkpointDefinition,
  circleDistanceBetweenMajors,
  circleMoveMajor,
  closelyRelatedKeysForMajor,
  exerciseForSkill,
  farSideMajorTargets,
  isFarSideMajorTarget,
  phase6Lessons,
  practiceRoundPlan,
  relativeMinorAtMajorKey,
  resolveFarSideProgression,
  selectFarSideMajorTarget,
  sharedMajorScaleNoteCount,
  transposeMajorRomanProgression,
} from "../dist/index.js";
import { renderPracticeRoundCounter, renderTeachingLesson } from "../web/lesson-ui.js";
import { circleOfFifthsVisual } from "../web/theory-visuals.js";
import { phase6TranspositionLabHtml } from "../web/phase6-ui.js";
import { transformBlock4App, transformBlock4Index } from "../scripts/block4-app-transform.mjs";
import { transformBlock5App, transformBlock5Index } from "../scripts/block5-app-transform.mjs";
import { transformBlock6App, transformBlock6Index } from "../scripts/block6-app-transform.mjs";
import { transformBlock7App, transformBlock7Index } from "../scripts/block7-app-transform.mjs";

const IDS = [
  "circle-of-fifths.lesson-1-what-it-represents",
  "circle-of-fifths.lesson-2-close-vs-distant",
  "circle-of-fifths.lesson-3-target-unfamiliar-keys",
  "circle-of-fifths.lesson-4-far-side-transposition",
];
const TITLES = [
  "What the Circle Represents",
  "Closely Related vs Distant Keys",
  "Use the Circle to Target Unfamiliar Keys",
  "Practical Far-Side Transposition Drill",
];
const generated = (id, count = 240) => Array.from({ length: count }, (_, index) => exerciseForSkill(id, index)).filter(Boolean);

function pc(name) {
  const map = { C:0, "C♯":1, "D♭":1, D:2, "D♯":3, "E♭":3, E:4, "F♭":4, "E♯":5, F:5, "F♯":6, "G♭":6, G:7, "G♯":8, "A♭":8, A:9, "A♯":10, "B♭":10, B:11, "C♭":11 };
  const normalized = String(name).replaceAll("#", "♯").replaceAll("b", "♭");
  return map[normalized];
}

test("Phase 6 is exactly four lessons; curriculum is exactly Phases 1-6 with no Phase 0 or 7", () => {
  const skills = SKILLS.filter((skill) => skill.phase === 6);
  assert.deepEqual(skills.map((skill) => skill.id), IDS);
  assert.deepEqual(skills.map((skill) => skill.title), TITLES);
  assert.deepEqual(phase6Lessons().map((lesson) => lesson.skillId), IDS);
  assert.deepEqual(CURRICULUM_PHASES.map((phase) => phase.phase), [1,2,3,4,5,6]);
  assert.equal(SKILLS.some((skill) => skill.phase === 0 || skill.phase > 6), false);
  assert.deepEqual(SKILLS.map((skill) => skill.phase).filter((phase) => phase === 6).length, 4);
  assert.deepEqual(activeLessonSkillIds().slice(-4), IDS);
  assert.deepEqual(activeExerciseSkillIds().slice(-4), IDS);
});

test("clockwise circle order and P5 pitch-class movement are exact", () => {
  assert.deepEqual([...CIRCLE_MAJOR_ORDER], ["C","G","D","A","E","B","F#","Db","Ab","Eb","Bb","F"]);
  for (let i = 0; i < CIRCLE_MAJOR_ORDER.length; i++) {
    const from = CIRCLE_MAJOR_ORDER[i];
    const move = circleMoveMajor(from, "clockwise");
    assert.equal((pc(move.to) - pc(from) + 12) % 12, 7, `${from} -> ${move.to}`);
    assert.equal(move.relationship, "P5 up");
  }
  assert.equal(circleMoveMajor("C", "counterclockwise").to, "F");
  assert.equal(circleMoveMajor("C", "counterclockwise").relationship, "P5 down / P4 up");
});

test("every adjacent major-key pair shares exactly six of seven pitch classes", () => {
  for (let i = 0; i < CIRCLE_MAJOR_ORDER.length; i++) {
    const left = CIRCLE_MAJOR_ORDER[i];
    const right = CIRCLE_MAJOR_ORDER[(i + 1) % CIRCLE_MAJOR_ORDER.length];
    assert.equal(circleDistanceBetweenMajors(left, right), 1, `${left}/${right}`);
    assert.equal(sharedMajorScaleNoteCount(left, right), 6, `${left}/${right}`);
  }
  assert.equal(sharedMajorScaleNoteCount("C", "F#"), 2);
});

test("enharmonic seam labels and matching relatives are explicit", () => {
  assert.deepEqual(CIRCLE_POSITIONS[5].majorAliases, ["B", "C♭"]);
  assert.deepEqual(CIRCLE_POSITIONS[6].majorAliases, ["F♯", "G♭"]);
  assert.deepEqual(CIRCLE_POSITIONS[7].majorAliases, ["C♯", "D♭"]);
  assert.deepEqual(CIRCLE_POSITIONS[6].relativeMinorAliases, ["D♯", "E♭"]);
  assert.deepEqual(CIRCLE_POSITIONS[7].relativeMinorAliases, ["A♯", "B♭"]);
  assert.equal(relativeMinorAtMajorKey("F#"), "D♯");
  assert.equal(relativeMinorAtMajorKey("Gb"), "E♭");
  assert.equal(relativeMinorAtMajorKey("Db"), "B♭");
});

test("closely related major family integrates adjacent majors and their relative minors", () => {
  assert.deepEqual(closelyRelatedKeysForMajor("C"), { majors: ["F", "G"], minors: ["D", "A", "E"] });
  assert.deepEqual(closelyRelatedKeysForMajor("Gb"), { majors: ["C♭", "D♭"], minors: ["A♭", "E♭", "B♭"] });
});

test("far-side target selection is deliberately 4-6 circle steps away", () => {
  for (const home of ["C","G","F","D","Bb","A","Eb","E","Ab","B","F#","Gb","Db"]) {
    const targets = farSideMajorTargets(home);
    assert.ok(targets.length >= 5, home);
    for (const target of targets) {
      const distance = circleDistanceBetweenMajors(home, target);
      assert.ok(distance >= 4 && distance <= 6, `${home}/${target}=${distance}`);
      assert.equal(isFarSideMajorTarget(home, target), true);
    }
    const selected = selectFarSideMajorTarget(home, 3);
    assert.ok(circleDistanceBetweenMajors(home, selected) >= 4);
  }
});

test("Roman-numeral progression transposition preserves relationships with exact spelling", () => {
  assert.deepEqual(transposeMajorRomanProgression("F#", ["I","V","vi","IV"]).map((chord) => chord.root), ["F♯","C♯","D♯","B"]);
  assert.deepEqual(transposeMajorRomanProgression("Db", ["I","V","vi","IV"]).map((chord) => chord.root), ["D♭","A♭","B♭","G♭"]);
  assert.deepEqual(transposeMajorRomanProgression("E", "ii–V–I").map((chord) => chord.root), ["F♯","B","E"]);
});

test("saved Phase 4 major progression is reused, otherwise Phase 6 falls back safely", () => {
  assert.deepEqual(resolveFarSideProgression({ form: "major", romanNumerals: ["ii","V","I"] }), { source: "saved", romanNumerals: ["ii","V","I"] });
  assert.deepEqual(resolveFarSideProgression({ form: "natural-minor", romanNumerals: ["i","VI","III","VII"] }), { source: "fallback", romanNumerals: ["I","V","vi","IV"] });
  assert.deepEqual(resolveFarSideProgression(undefined), { source: "fallback", romanNumerals: ["I","V","vi","IV"] });
  assert.match(fs.readFileSync("web/phase4-ui.js", "utf8"), /PHASE4_SAVED_PROGRESSION_KEY/);
  assert.match(phase6TranspositionLabHtml(), /Load saved \/ fallback/);
});

test("Phase 6 teaching is practical and integrates P5, scales, harmony, relatives, and transposition", () => {
  const text = phase6Lessons().flatMap((lesson) => lesson.teachingSteps).map((step) => `${step.title} ${step.body} ${step.workedExample ?? ""}`).join(" ");
  assert.match(text, /Perfect 5th/i);
  assert.match(text, /Perfect 4th/i);
  assert.match(text, /share 6 of 7|six notes/i);
  assert.match(text, /closely related/i);
  assert.match(text, /distant/i);
  assert.match(text, /relative minor/i);
  assert.match(text, /Roman-numeral/i);
  assert.match(text, /play|program|MIDI/i);
  assert.ok(phase6Lessons().flatMap((lesson) => lesson.teachingSteps).some((step) => step.visual?.kind === "circle"));
});

test("interactive circle visual is readable, relationship-focused, and mobile-styled", () => {
  const html = circleOfFifthsVisual({ interactive: true, selected: "C", adjacent: ["G","F"], distant: ["F♯ / G♭"] });
  assert.match(html, /data-circle-of-fifths/);
  assert.match(html, /button/);
  assert.match(html, /B \/ C♭/);
  assert.match(html, /F♯ \/ G♭/);
  assert.match(html, /D♯m \/ E♭m/);
  assert.match(html, /is-selected/);
  assert.match(html, /is-adjacent/);
  assert.match(html, /is-distant/);
  const css = fs.readFileSync("web/phase6.css", "utf8");
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /@media \(max-width: 380px\)/);
});

test("Phase 6 practice covers required task types without duplicate spam", () => {
  const items = IDS.flatMap((id) => generated(id, 360));
  const directions = new Set(items.filter((item) => item.skillId.startsWith("circle-of-fifths.")).map((item) => item.metadata?.direction).filter(Boolean));
  for (const direction of ["clockwise","counterclockwise","shared-note-count","relative-integration","choose-unfamiliar","transpose-chord","preserve-romans"]) assert.ok(directions.has(direction), direction);
  for (const id of IDS) {
    const lessonItems = generated(id, 140);
    const signatures = lessonItems.map((item) => item.exampleSignature);
    assert.ok(new Set(signatures).size >= 40, `${id} variety`);
    for (let i = 1; i < signatures.length; i++) assert.notEqual(signatures[i], signatures[i - 1], `${id} repeated ${signatures[i]}`);
  }
});

test("Phase 6 actively reuses Phases 1-5 with original skill credit", () => {
  const cross = IDS.flatMap((id) => generated(id, 600)).filter((item) => item.metadata?.crossPhaseReview);
  const phases = new Set(cross.map((item) => item.metadata?.reviewPhase));
  assert.deepEqual([...phases].sort(), [1,2,3,4,5]);
  assert.ok(cross.filter((item) => item.metadata?.reviewPhase === 1).every((item) => item.skillId.startsWith("intervals.")));
  assert.ok(cross.filter((item) => item.metadata?.reviewPhase === 2).every((item) => item.skillId.startsWith("major-scales.")));
  assert.ok(cross.filter((item) => item.metadata?.reviewPhase === 3).every((item) => item.skillId.startsWith("minor-scales.")));
  assert.ok(cross.filter((item) => item.metadata?.reviewPhase === 4).every((item) => item.skillId.startsWith("diatonic-chords.")));
  assert.ok(cross.filter((item) => item.metadata?.reviewPhase === 5).every((item) => item.skillId.startsWith("relatives.")));
});

test("Phase 6 uses actual 30+ round counts without turning the circle into interval-volume drilling", () => {
  const phase6 = SKILLS.filter((skill) => skill.phase === 6);
  assert.deepEqual(phase6.map((skill) => practiceRoundPlan(skill.id, "new").size), [30,30,36,48]);
  assert.match(renderPracticeRoundCounter(11, 30, 1), /Question 12 of 30/);
  assert.doesNotMatch(renderPracticeRoundCounter(0, 30, 1), /1 of 1/);
});

test("no hints and completed Phase 6 lessons replay teaching from the beginning before Skip to Review", () => {
  for (const path of ["src/practice/phase6-circle-of-fifths.ts", "src/exercises/phase6-circle-of-fifths.ts", "scripts/block7-app-transform.mjs", "web/phase6-ui.js"]) {
    assert.doesNotMatch(fs.readFileSync(path, "utf8"), /show\s+hint|need\s+a\s+hint|hintbutton|hintbtn|inputHint|hintText|showHint/i, path);
  }
  for (const lesson of phase6Lessons()) {
    const first = { stage: "teaching", teachingStepIndex: 0, canSkipToReview: false, skipPlacement: null };
    const replay = { stage: "teaching", teachingStepIndex: 0, canSkipToReview: true, skipPlacement: "teaching-bottom" };
    assert.doesNotMatch(renderTeachingLesson({ lesson, openingState: first }), /Skip to Review/);
    const html = renderTeachingLesson({ lesson, openingState: replay });
    assert.ok(html.indexOf("Skip to Review") > html.indexOf(lesson.teachingSteps.at(-1).body));
  }
});

test("Phase 6 checkpoint assesses actual circle competency, not an invented Phase 7", () => {
  const checkpoint = checkpointDefinition(6);
  assert.ok(checkpoint);
  assert.ok(checkpoint.minItems >= 16);
  const ids = new Set(checkpoint.competencies.map((item) => item.id));
  for (const id of ["circle-fifth-movement","adjacent-six-of-seven","circle-proximity","relative-key-integration","practical-transposition","unfamiliar-key-application"]) assert.ok(ids.has(id), id);
  assert.ok(checkpoint.competencies.every((item) => item.critical));
  assert.equal(allCheckpointDefinitions().length, 6);
  assert.equal(checkpointDefinition(7), undefined);
});

test("Block 7 production transform activates all six phases and no future Phase 7", () => {
  const source = fs.readFileSync("web/app-block3.js", "utf8");
  const index = fs.readFileSync("web/index.html", "utf8");
  const block4 = transformBlock4App(source);
  const block5 = transformBlock5App(block4);
  const block6 = transformBlock6App(block5);
  const block7 = transformBlock7App(block6);
  assert.match(block7, /const activeSections = \[1, 2, 3, 4, 5, 6\]/);
  assert.match(block7, /phase\.phase >= 7/);
  assert.match(block7, /Representative Circle-of-Fifths check/);
  assert.match(block7, /PHASE 5 RELATIVE-KEY REVIEW/);
  assert.match(block7, /Phases 1–6 active/);
  assert.match(block7, /phase6TranspositionLabHtml/);
  assert.doesNotMatch(block7, /Phase 7/);
  const finalIndex = transformBlock7Index(transformBlock6Index(transformBlock5Index(transformBlock4Index(index))));
  assert.match(finalIndex, /app-block7\.js/);
  assert.match(finalIndex, /phase6\.css/);
});
