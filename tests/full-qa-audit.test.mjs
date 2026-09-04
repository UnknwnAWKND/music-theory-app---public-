import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  SKILLS,
  SKILL_BY_ID,
  checkpointDefinition,
  deriveSkillEvidence,
  evidencePolicyForModes,
  exerciseForSkill,
  majorScale,
  parseNote,
  pitchClass,
  selectAdaptiveExercise,
  semanticExerciseSignature,
} from "../dist/index.js";

function attempt(overrides = {}) {
  return {
    skillId: "interval.generic-number",
    sessionId: "qa-session",
    promptSignature: "p1",
    occurredAt: "2026-09-03T12:00:00.000Z",
    outcome: "correct",
    independent: true,
    directEvidence: true,
    context: "acquisition",
    eventKind: "response",
    firstSubmission: true,
    submissionIndex: 1,
    stage: "initial",
    responseMode: "recognition",
    guidance: "none",
    solutionSeen: false,
    evidenceVersion: "v2",
    ...overrides,
  };
}

test("checkpoint definitions contain only live curriculum skill ids and preserve intended seventh-chord coverage", () => {
  for (let phase = 1; phase <= 11; phase++) {
    const def = checkpointDefinition(phase);
    assert.ok(def);
    for (const competency of def.competencies) {
      assert.ok(competency.skillIds.length > 0, `phase ${phase} ${competency.id} is empty`);
      for (const id of competency.skillIds) assert.ok(SKILL_BY_ID.has(id), `stale checkpoint id ${id}`);
    }
  }
  const phase8 = checkpointDefinition(8);
  const core = phase8.competencies.find((c) => c.id === "seventh-core");
  assert.deepEqual(core.skillIds, ["seventh.major7", "seventh.minor7", "seventh.dominant7"]);
  const diatonic = phase8.competencies.find((c) => c.id === "seventh-diatonic");
  assert.ok(diatonic.skillIds.includes("seventh.major-diatonic"));
});

test("atomic READY cannot be earned by the same semantic question under different generated ids", () => {
  const policy = evidencePolicyForModes(["identify"]);
  const evidence = deriveSkillEvidence([
    attempt({ promptSignature: "interval.generic-number:0", exampleSignature: "same-visible-example" }),
    attempt({ promptSignature: "interval.generic-number:99", exampleSignature: "same-visible-example", occurredAt: "2026-09-03T12:01:00.000Z" }),
  ], policy);
  assert.equal(evidence.ready, false);
});

test("every atomic curriculum skill exposes more than one semantic example in its working pool", () => {
  const relational = new Set(["construct", "translate", "transform", "diagnose", "apply"]);
  const atomic = SKILLS.filter((skill) => skill.evidence.length > 0 && !skill.evidence.some((mode) => relational.has(mode)));
  assert.ok(atomic.length > 0);
  for (const skill of atomic) {
    const signatures = new Set(Array.from({ length: 16 }, (_, i) => semanticExerciseSignature(exerciseForSkill(skill.id, i))));
    assert.ok(signatures.size > 1, `${skill.id} repeats one semantic example across its pool`);
  }
});

test("every curriculum skill has enough semantic example variety to satisfy its readiness model", () => {
  const broken = [];
  for (const skill of SKILLS) {
    const signatures = new Set(Array.from({ length: 24 }, (_, i) => semanticExerciseSignature(exerciseForSkill(skill.id, i))));
    if (signatures.size < 2) broken.push(skill.id);
  }
  assert.deepEqual(broken, [], `skills with one semantic example: ${broken.join(", ")}`);
});

test("adaptive selection changes the visible generic-interval question when alternatives exist", () => {
  const first = selectAdaptiveExercise("interval.generic-number", [], 0, 8);
  const history = [attempt({ promptSignature: first.exercise.id, exampleSignature: first.semanticSignature })];
  const next = selectAdaptiveExercise("interval.generic-number", history, first.index, 8);
  assert.notEqual(next.exercise.id, first.exercise.id);
  assert.notEqual(next.exercise.prompt, first.exercise.prompt);
  assert.notEqual(next.semanticSignature, first.semanticSignature);
});

test("major-key membership negative examples are actually outside the generated major key", () => {
  for (let index = 0; index < 120; index++) {
    const exercise = exerciseForSkill("major.membership", index);
    const prompt = exercise.prompt;
    const match = prompt.match(/^Is (.+) diatonic to (.+) major\?$/);
    assert.ok(match, prompt);
    const [, noteName, tonic] = match;
    const scalePcs = new Set(majorScale(parseNote(tonic)).map(pitchClass));
    const actualMembership = scalePcs.has(pitchClass(parseNote(noteName)));
    assert.equal(exercise.payload.expected, actualMembership ? "yes" : "no", `wrong key-membership key at index ${index}: ${prompt}`);
  }
});

test("browser UI closes double-submit races and restores deep Back/Forward routes", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  assert.match(app, /function runExclusiveAction\(action\)/);
  assert.match(app, /if \(state\.actionPending\) return/);
  assert.match(app, /runExclusiveAction\(\(\) => submitObjective\(item\)\)/);
  assert.match(app, /runExclusiveAction\(\(\) => submitAssessmentAnswer\(\)\)/);
  assert.match(app, /route\.startsWith\("study:"\)/);
  assert.match(app, /route\.startsWith\("assessment:"\)/);
});

test("Profile recalculates current learning and Settings serializes autosaves", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  assert.match(app, /const plan = await service\.previewPlan\(USER_ID, new Date\(\)\);/);
  assert.doesNotMatch(app, /const plan = state\.session\?\.plan \?\? await service\.previewPlan/);
  assert.match(app, /toggle\.disabled = true/);
  assert.match(app, /finally \{\s*toggle\.disabled = false/);
});

test("fatal error screen does not expose raw Supabase REST/database bodies", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  const start = app.indexOf("function showFatal(err)");
  assert.ok(start >= 0);
  const body = app.slice(start, app.indexOf("boot().catch", start));
  assert.match(body, /Your saved progress is safe/);
  assert.doesNotMatch(body, /<p>\$\{esc\(err\?\.message \?\? err\)\}<\/p>/);
});

test("teaching copy has no duplicate tonicization key and Circle visual labels enharmonic boundaries explicitly", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  const wordsStart = app.indexOf("const NEW_WORD_CARDS");
  const wordsEnd = app.indexOf("function evidenceReady", wordsStart);
  const wordCards = app.slice(wordsStart, wordsEnd);
  const matches = wordCards.match(/"modulation\.tonicization-vs-keychange":/g) ?? [];
  assert.equal(matches.length, 1);
  assert.match(app, /F♯ \/ G♭/);
  assert.match(app, /C♯ \/ D♭/);
});

test("active source and browser runtime contain no Phase 0 curriculum or retired pitch skill ids", () => {
  const files = ["src/curriculum/skills.ts", "src/session/planner.ts", "src/progression/checkpoints.ts", "web/app.js"];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, /Phase 0|phase0|phase_0|pitch\.accidentals|pitch\.half-whole/i, file);
  }
});
