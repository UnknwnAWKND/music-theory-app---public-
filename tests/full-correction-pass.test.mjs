import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  allCheckpointDefinitions,
  checkpointDefinition,
  lessonForSkill,
  practiceRoundPlan,
} from "../dist/index.js";
import { transformAppBlock8, transformProfileController } from "../scripts/full-correction-app-transform.mjs";

const [appSource, profileSource, pianoSource, lessonUi, css, homeCss] = await Promise.all([
  readFile(new URL("../web/app-block8.js", import.meta.url), "utf8"),
  readFile(new URL("../web/profile-account-controller.js", import.meta.url), "utf8"),
  readFile(new URL("../web/theory-visuals.js", import.meta.url), "utf8"),
  readFile(new URL("../web/lesson-ui.js", import.meta.url), "utf8"),
  readFile(new URL("../web/full-correction-pass.css", import.meta.url), "utf8"),
  readFile(new URL("../web/home-hero-cleanup.css", import.meta.url), "utf8"),
]);
const productionApp = transformAppBlock8(appSource);
const productionProfile = transformProfileController(profileSource);

test("Phase 1 Lesson 1 is exactly the simplified three-screen teaching sequence", () => {
  const lesson = lessonForSkill("intervals.lesson-1-unison-octave");
  assert.ok(lesson);
  assert.deepEqual(lesson.teachingSteps.map((step) => step.id), ["interval-means-distance", "p1", "p8"]);
  assert.equal(lesson.teachingSteps.length, 3);
  assert.match(lesson.teachingSteps[0].body, /An interval is the distance in pitch between two notes/);
  assert.match(lesson.teachingSteps[0].body, /size — the number of letter names spanned/);
  assert.match(lesson.teachingSteps[0].body, /quality — the exact size of that interval, determined by its number of half-steps or semitones/);
  assert.doesNotMatch(lesson.teachingSteps.map((s) => s.body).join(" "), /Major vs Minor|Augmented vs Diminished/i);
});

test("P1 and P8 are parallel, octave-aware piano examples", () => {
  const lesson = lessonForSkill("intervals.lesson-1-unison-octave");
  const p1 = lesson.teachingSteps[1];
  const p8 = lesson.teachingSteps[2];
  assert.match(`${p1.body} ${p1.workedExample}`, /C to C at the same octave/);
  assert.match(p1.body, /interval size is 1/);
  assert.match(p1.body, /written P1/);
  assert.deepEqual(p1.visual.data.highlighted, ["C4"]);
  assert.match(p8.body, /C–D–E–F–G–A–B–C spans eight letter names/);
  assert.match(p8.body, /interval size is 8/);
  assert.match(p8.body, /written P8/);
  assert.deepEqual(p8.visual.data.highlighted, ["C4", "C5"]);
});

test("educational piano renders one connected C4-to-C5 octave with correct black-key gaps", () => {
  assert.match(pianoSource, /data-full-octave=\"C4-C5\"/);
  for (const key of ["C4","D4","E4","F4","G4","A4","B4","C5"]) assert.match(pianoSource, new RegExp(`id: \\"${key.replace("#", "\\#")}\\"`));
  for (const key of ["C#4","D#4","F#4","G#4","A#4"]) assert.match(pianoSource, new RegExp(key.replace("#", "\\#")));
  assert.doesNotMatch(pianoSource, /E#4|B#4/);
  assert.match(css, /\.piano-white-row[\s\S]*grid-template-columns:\s*repeat\(8/);
  assert.match(css, /\.piano-visual \.piano-key\.black[\s\S]*position:\s*absolute/);
  assert.match(css, /\.piano-key\.white\.active,[\s\S]*\.piano-key\.black\.active[\s\S]*background:\s*var\(--accent-primary\)/);
});

test("Home decorative piano is disabled and hero content expands naturally", () => {
  assert.match(css, /\.home-focus::after[\s\S]*content:\s*none\s*!important/);
  assert.match(css, /\.home-focus h1,[\s\S]*max-width:\s*min\(760px, 100%\)/);
  assert.ok(homeCss.includes(".home-focus"));
});

test("avatars are circular and Profile enhancement reruns after navigation races", () => {
  assert.match(css, /profile-avatar-xl[\s\S]*border-radius:\s*50%\s*!important/);
  assert.match(css, /profile-avatar-edit-preview[\s\S]*border-radius:\s*50%\s*!important/);
  assert.match(productionProfile, /let enhancePending = false/);
  assert.match(productionProfile, /!main\.isConnected/);
  assert.match(productionProfile, /enhancePending = true/);
  assert.match(productionProfile, /scheduleEnhance\(\)/);
  assert.match(productionApp, /profile-controller-host loading-state/);
  assert.doesNotMatch(productionApp, /<section class=\"profile-hero-final\"/);
  assert.doesNotMatch(productionApp, /current-learning-final/);
});

test("Lesson 1 alone gets a 10-question initial acquisition round", () => {
  assert.equal(practiceRoundPlan("intervals.lesson-1-unison-octave", "new").size, 10);
  assert.equal(practiceRoundPlan("intervals.lesson-1-unison-octave", "acquisition").size, 10);
  assert.equal(practiceRoundPlan("intervals.lesson-1-unison-octave", "acquisition", true).size, 30);
  assert.ok(practiceRoundPlan("intervals.lesson-2-perfect-fifth", "new").size >= 30);
  assert.ok(practiceRoundPlan("major-scales.lesson-1-formula", "new").size >= 30);
});

test("normal practice header reports first-attempt A/B accuracy instead of round number", () => {
  assert.match(lessonUi, /correctFirstAttempt/);
  assert.match(lessonUi, /\$\{safeCorrect\}\/\$\{safeAnswered\} correct/);
  assert.doesNotMatch(lessonUi, /Round \$\{/);
  assert.match(productionApp, /if \(grade\.correct\) practice\.correctFirstAttempt \+= 1/);
  assert.match(productionApp, /renderPracticeRoundCounter\(counterAnswered, practice\.roundSize, practice\.correctFirstAttempt, practice\.answered\)/);
});

test("insufficient round copy is learner-facing and contains no evidence jargon", () => {
  assert.match(productionApp, /Skill not mastered yet/);
  assert.match(productionApp, /Continue practicing this skill before moving on\./);
  assert.match(productionApp, />Continue Practicing</);
  assert.match(productionApp, />Stop for Now</);
  assert.doesNotMatch(productionApp, /More evidence needed\.|One round is not enough evidence yet/);
});

test("standalone Placement Test is removed from Learn and locked phases offer prerequisite checkpoints", () => {
  assert.doesNotMatch(productionApp, /id=\"placementButton\"/);
  assert.doesNotMatch(productionApp, />Placement Test<\/button>/);
  assert.match(productionApp, /firstMissingPrerequisiteCheckpoint/);
  assert.match(productionApp, /Phase \$\{targetPhase\} is locked/);
  assert.match(productionApp, /Take Phase \$\{requiredPhase\} Checkpoint/);
  assert.match(productionApp, /data-locked-phase/);
  assert.match(productionApp, /state\.screen === \"placement\"\) return navigate\(\"learn\", true\)/);
});

test("every phase checkpoint is exactly 200 questions and retains competency breadth", () => {
  const definitions = allCheckpointDefinitions();
  assert.equal(definitions.length, 6);
  for (const definition of definitions) {
    assert.equal(definition.minItems, 200, `phase ${definition.phase} min`);
    assert.equal(definition.maxItems, 200, `phase ${definition.phase} max`);
    assert.ok(definition.competencies.length >= 4, `phase ${definition.phase} competency breadth`);
    assert.ok(new Set(definition.competencies.flatMap((c) => c.skillIds)).size >= 2, `phase ${definition.phase} skill breadth`);
    assert.equal(checkpointDefinition(definition.phase).maxItems, 200);
  }
  assert.match(productionApp, /Question \$\{Math\.max\(1,itemNumber\)\} of \$\{checkpoint\.definition\.maxItems\}/);
  assert.match(productionApp, /checkpoint\.recentSignatures = \[\.\.\.checkpoint\.recentSignatures, selected\.exercise\.exampleSignature\];/);
});

test("contextual checkpoint completion remains pass-gated and partial exit cannot unlock", () => {
  assert.match(productionApp, /if \(evaluation\.passed\) \{/);
  assert.match(productionApp, /checkpointPassedAt: now/);
  assert.match(productionApp, /evaluation\.passed && checkpoint\.prerequisiteTargetPhase/);
  assert.match(productionApp, /exitCheckpoint[\s\S]*renderPrerequisiteCheckpointGate/);
  assert.doesNotMatch(productionApp, /results\.length\s*===\s*200[\s\S]*checkpointPassedAt/);
});
