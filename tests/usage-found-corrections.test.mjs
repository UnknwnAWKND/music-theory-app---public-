import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { execFileSync } from "node:child_process";

import {
  SKILLS,
  checkpointDefinition,
  evaluateCheckpoint,
  lessonForSkill,
  practiceRoundPlan,
} from "../dist/index.js";
import { pianoVisual } from "../web/theory-visuals.js";

const read = (path) => fs.readFileSync(path, "utf8");
const css = read("web/usage-correction-pass.css");
const practiceUx = read("web/practice-progression-corrections.js");
const profileRenderer = read("web/profile-current-renderer.js");
const index = read("web/index.html");

const LESSON1 = "intervals.lesson-1-unison-octave";

test("Phase 1 Lesson 1 is exactly the corrected three-screen sequence", () => {
  const lesson = lessonForSkill(LESSON1);
  assert.ok(lesson);
  assert.deepEqual(lesson.teachingSteps.map((step) => step.id), ["interval-name-parts", "p1", "p8"]);
  assert.equal(lesson.teachingSteps.length, 3);
  const [intro, p1, p8] = lesson.teachingSteps;
  assert.match(intro.body, /An interval is the distance in pitch between two notes\./);
  assert.match(intro.body, /size — the number of letter names spanned/);
  assert.match(intro.body, /quality — the exact size of that interval, determined by its number of half-steps or semitones/);
  assert.doesNotMatch(intro.body, /\bMajor\b|\bMinor\b|\bAugmented\b|\bDiminished\b|inversion/i);
  assert.match(p1.body, /C to C at the same octave\./);
  assert.match(p1.body, /interval size is 1 because only the letter C is spanned/i);
  assert.match(p1.body, /Perfect Unison, written P1/i);
  assert.deepEqual(p1.visual.data.highlightedKeys, ["C4"]);
  assert.match(p8.body, /C to the next C above\./);
  assert.match(p8.body, /C–D–E–F–G–A–B–C spans eight letter names/i);
  assert.match(p8.body, /Perfect Octave, written P8/i);
  assert.deepEqual(p8.visual.data.highlightedKeys, ["C4", "C5"]);
  assert.equal(lesson.teachingSteps.some((step) => ["perfect-family", "simple-term"].includes(step.id)), false);
});

test("educational piano renders a connected complete C-to-C octave with correct black-key geometry", () => {
  const html = pianoVisual({ highlightedKeys: ["C4", "C5"] });
  assert.equal((html.match(/class="piano-key white/g) ?? []).length, 8);
  assert.equal((html.match(/class="piano-key black/g) ?? []).length, 5);
  for (const key of ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]) assert.match(html, new RegExp(`data-key-id="${key.replace("#", "\\#")}"`));
  for (const position of ["12.5%", "25%", "50%", "62.5%", "75%"]) assert.match(html, new RegExp(position.replace(".", "\\.")));
  assert.doesNotMatch(html, /37\.5%|87\.5%/);
  assert.equal((html.match(/piano-key white active/g) ?? []).length, 2);
  assert.match(css, /\.piano-white-row[\s\S]*?gap:\s*0\s*!important/);
  assert.match(css, /\.piano-key\.active\.white,[\s\S]*?background:\s*linear-gradient/);
  assert.match(css, /\.piano-key\.active\.black[\s\S]*?background:\s*linear-gradient/);
});

test("all lesson piano visuals inherit at least one complete octave and phone geometry", () => {
  assert.match(read("web/theory-visuals.js"), /PIANO_WHITE_KEYS[\s\S]*?C4[\s\S]*?B4[\s\S]*?C5/);
  assert.match(css, /@media \(max-width:\s*520px\)[\s\S]*?piano-visual-v2/);
});

test("Home hero piano artwork is removed without replacing it with decorative music art", () => {
  assert.match(css, /\.home-focus::after\s*\{[\s\S]*?content:\s*none\s*!important/);
  assert.match(css, /display:\s*none\s*!important/);
  assert.doesNotMatch(css, /giant music|music note|decorative piano/i);
});

test("main Profile and Edit Profile use the same persisted avatar_path source and circular geometry", () => {
  assert.match(profileRenderer, /user_profiles[\s\S]*select\("display_name,avatar_path"\)/);
  assert.match(profileRenderer, /createSignedUrl\(path, 3600\)/);
  assert.match(profileRenderer, /data-profile-current="true"/);
  assert.match(css, /profile-avatar-xl,[\s\S]*?profile-avatar-edit-preview[\s\S]*?border-radius:\s*50%\s*!important/);
  const editController = read("web/profile-account-controller.js");
  assert.match(editController, /select\("display_name,avatar_path/);
  assert.match(editController, /avatar_path:\s*nextPath/);
});

test("current Profile renderer deterministically replaces legacy Profile after repeated navigation", () => {
  assert.match(profileRenderer, /if \(route\(\) !== "profile"\) return/);
  assert.match(profileRenderer, /main\.dataset\.profileUx = "profile"/);
  assert.match(profileRenderer, /MutationObserver/);
  assert.match(profileRenderer, /hashchange/);
  assert.match(profileRenderer, /!main\.querySelector\('\[data-profile-current="true"\]'/);
  assert.ok(index.indexOf("profile-current-renderer.js") > index.indexOf("profile-account-controller.js"));
});

test("only Phase 1 Lesson 1 acquisition uses 10 questions", () => {
  assert.equal(practiceRoundPlan(LESSON1, "new").size, 10);
  assert.equal(practiceRoundPlan(LESSON1, "review").size, 30);
  for (const skill of SKILLS.filter((skill) => skill.contentKind !== "reference" && skill.id !== LESSON1)) {
    assert.ok(practiceRoundPlan(skill.id, "new").size >= 30, skill.id);
  }
});

test("normal practice UI uses live first-attempt A/B correct counting and learner-facing retry copy", () => {
  assert.match(read("web/lesson-ui.js"), /data-live-correct>0\/0 correct/);
  assert.match(practiceUx, /scoredQuestions\.has\(question\)/);
  assert.match(practiceUx, /feedback\.classList\.contains\("correct"\)/);
  assert.match(practiceUx, /practiceStats\.answered \+= 1/);
  assert.match(practiceUx, /Skill not mastered yet/);
  assert.match(practiceUx, /Continue practicing this skill before moving on\./);
  assert.match(practiceUx, /Continue Practicing/);
  assert.match(practiceUx, /Stop for Now/);
});

test("standalone Placement Test is removed from normal flow and locked lessons offer prior phase checkpoints", () => {
  assert.match(practiceUx, /querySelector\("#placementButton"\)\?\.remove\(\)/);
  assert.match(practiceUx, /route\(\) === "placement"/);
  assert.match(practiceUx, /data-context-locked/);
  assert.match(practiceUx, /Pass the Phase \$\{required\} checkpoint/);
  assert.match(practiceUx, /targetPhase - 1/);
  assert.doesNotMatch(practiceUx, /placementDefinition/);
});

test("every phase checkpoint is exactly 200 and partial completion can never pass or unlock", () => {
  for (const phase of [1, 2, 3, 4, 5, 6]) {
    const definition = checkpointDefinition(phase);
    assert.ok(definition, `Phase ${phase}`);
    assert.equal(definition.minItems, 200);
    assert.equal(definition.maxItems, 200);
    const partial = evaluateCheckpoint(definition, []);
    assert.equal(partial.complete, false);
    assert.equal(partial.passed, false);
  }
  assert.match(practiceUx, /Question \$\{Math\.max\(1, question\)\} of 200/);
  assert.match(practiceUx, /firstSubmission:\s*true/);
  assert.match(practiceUx, /checkpointPassedAt:\s*now/);
  assert.match(practiceUx, /if \(evaluation\.passed\)/);
});

test("200-question checkpoint sampling stays balanced and suppresses recent duplicates", () => {
  const source = read("src/progression/checkpoints-block10.ts");
  assert.match(source, /demonstrated:\s*false/);
  assert.match(source, /results\.length >= CHECKPOINT_ITEMS/);
  assert.match(practiceUx, /sort\(\(a, b\) => \(counts\.get\(a\.id\)/);
  assert.match(practiceUx, /slice\(-24\)/);
  assert.match(practiceUx, /recent\.includes\(candidate\.exampleSignature\)/);
});

test("new browser correction modules parse as valid JavaScript", () => {
  for (const file of ["web/profile-current-renderer.js", "web/practice-progression-corrections.js", "web/theory-visuals.js", "web/lesson-ui.js"]) {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  }
});
