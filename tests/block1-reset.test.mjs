import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  CURRICULUM_PHASES,
  SKILLS,
  activeExerciseSkillIds,
  activeLessonSkillIds,
  allCheckpointDefinitions,
  placementDefinition,
  createExercise,
  gradeExercise,
  deriveSkillEvidence,
  freshLessonProgress,
  lessonOpeningState,
  markLessonAbandoned,
  markLessonCompleted,
  practiceRoundPlan,
  practiceRoundQuestionNumber,
  decideAdaptivePractice,
  validateCurriculumGraph,
} from "../dist/index.js";
import { renderPracticeRoundCounter, renderTeachingLesson } from "../web/lesson-ui.js";

const read = (path) => fs.readFileSync(path, "utf8");
const migrationPath = "supabase/migrations/202609041700_block1_empty_curriculum.sql";
const migration = read(migrationPath);
const app = read("web/app-block3.js");
const OLD_CURRICULUM_FILES = ["src/curriculum/skills-v09.ts", "src/exercises/catalog-v09.ts", "src/practice/lessons-v09.ts", "src/progression/checkpoints-v09.ts"];

test("Block 1 six-phase shell remains exact", () => {
  assert.deepEqual(CURRICULUM_PHASES.map((phase) => phase.phase), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(CURRICULUM_PHASES.map((phase) => phase.title), ["Intervals", "Major Scales", "Minor Scales", "Diatonic Chords / Roman Numerals", "Relatives", "Circle of Fifths"]);
});

test("old pre-rebuild curriculum files remain absent and only Phases 1-5 are active", () => {
  for (const path of OLD_CURRICULUM_FILES) assert.equal(fs.existsSync(path), false, path);
  assert.equal(SKILLS.some((skill) => skill.phase > 5), false, "Block 6 must not add Phase 6 skills");
  assert.equal(SKILLS.filter((skill) => skill.phase === 1).length, 10);
  assert.equal(SKILLS.filter((skill) => skill.phase === 2).length, 4);
  assert.equal(SKILLS.filter((skill) => skill.phase === 3).length, 5);
  assert.equal(SKILLS.filter((skill) => skill.phase === 4).length, 10);
  assert.equal(SKILLS.filter((skill) => skill.phase === 5).length, 4);
  assert.equal(activeLessonSkillIds().length, 33);
  assert.equal(activeExerciseSkillIds().length, 32, "Reference Lesson 7 must remain the only lesson without an exercise generator");
  assert.equal(allCheckpointDefinitions().length, 5);
});

test("no Phase 6 placement competency content is invented", () => {
  for (const phase of CURRICULUM_PHASES.filter((x) => x.phase >= 6)) assert.deepEqual(placementDefinition(phase.phase).competencies, []);
});

test("rebuild migration still preserves auth and clears application data", () => {
  for (const table of ["lesson_progress", "scheduler_reviews", "scheduler_cards", "skill_state", "phase_progress", "retired_skill_history", "learning_attempts", "study_sessions", "user_learning_settings", "user_profiles"]) {
    assert.match(migration, new RegExp(`delete from public\\.${table};`, "i"), table);
  }
  assert.doesNotMatch(migration, /delete\s+from\s+auth\.users/i);
  assert.match(read("web/runtime.js"), /signInWithPassword/);
  assert.match(read("web/runtime.js"), /getSession/);
});

test("login still lazily creates profile/settings without wiping prior progress", () => {
  assert.match(app, /ensureFreshAccountState/);
  assert.match(app, /getProfile\(userId\)/);
  assert.match(app, /upsertProfile\(userId/);
  assert.match(app, /getSettings\(userId\)/);
  assert.match(app, /upsertSettings\(settings\)/);
  assert.match(app, /music-theory-tutor:block2-phase1/);
  assert.match(read("web/config.js"), /buildVersion:\s*"rebuild-block6-phase5-relatives"/);
});

test("active app and schemas do not reintroduce hint UI/content", () => {
  for (const path of ["web/app-block3.js", "web/lesson-ui.js", "src/exercises/types.ts", "src/exercises/generators.ts", "src/practice/types.ts", "src/practice/lessons.ts", "src/practice/phase2-major-scales.ts", "src/exercises/phase2-major-scales.ts", "src/practice/phase3-minor-scales.ts", "src/exercises/phase3-minor-scales.ts", "src/practice/phase4-diatonic-chords.ts", "src/exercises/phase4-diatonic-chords.ts", "web/phase4-ui.js"]) {
    assert.doesNotMatch(read(path), /show\s+hint|need\s+a\s+hint|hintbutton|hintbtn|inputHint|hintText|showHint/i, path);
  }
});

test("corrective feedback remains after hints were removed", () => {
  const exercise = createExercise({ skillId: "test.skill", prompt: "Choose it", answerSpec: { kind: "text", expected: "correct" }, explanation: "Because this relationship resolves the task.", exampleSignature: "one" });
  const result = gradeExercise(exercise, "wrong");
  assert.equal(result.correct, false);
  assert.match(result.detail, /Correct answer: correct/);
  assert.match(result.detail, /Because this relationship/);
});

test("lesson replay behavior remains global", () => {
  const fresh = freshLessonProgress("lesson.test");
  assert.equal(lessonOpeningState(fresh).canSkipToReview, false);
  const abandoned = markLessonAbandoned(fresh);
  assert.equal(lessonOpeningState(abandoned).canSkipToReview, false);
  const done = markLessonCompleted(fresh, "2026-09-04T00:00:00Z");
  assert.deepEqual(lessonOpeningState(done), { stage: "teaching", teachingStepIndex: 0, canSkipToReview: true, skipPlacement: "teaching-bottom" });
  const html = renderTeachingLesson({ lesson: { skillId: "lesson.test", title: "Test", teachingSteps: [{ id: "a", title: "Start", body: "Teach first." }] }, openingState: lessonOpeningState(done) });
  assert.ok(html.indexOf("Skip to Review") > html.indexOf("Teach first."));
});

test("real assessed practice rounds still have a 30-question minimum and do not grant mastery", () => {
  for (const skill of SKILLS.filter((skill) => skill.assessed)) {
    const round = practiceRoundPlan(skill.id, "new");
    assert.ok(round.size >= 30, skill.id);
  }
  const reference = SKILLS.find((skill) => skill.contentKind === "reference");
  assert.ok(reference);
  assert.equal(reference.assessed, false);
  assert.equal(reference.blocksPhaseCompletion, false);
  const round = practiceRoundPlan(SKILLS[0].id, "new");
  assert.equal(practiceRoundQuestionNumber(7, round.size), 8);
  assert.match(renderPracticeRoundCounter(7, round.size, 1), new RegExp(`Question 8 of ${round.size}`));
  const before = deriveSkillEvidence([]);
  practiceRoundPlan(SKILLS[0].id, "new");
  const after = deriveSkillEvidence([]);
  assert.equal(before.ready, false);
  assert.equal(after.ready, false);
  assert.equal(after.retained, false);
});

test("Phase 0 remains nonexistent", () => {
  assert.equal(CURRICULUM_PHASES.some((phase) => phase.phase === 0), false);
  const phaseType = read("src/curriculum/types.ts").split("\n").find((line) => line.includes("type PhaseNumber")) ?? "";
  assert.match(phaseType, /PhaseNumber = 1 \| 2 \| 3 \| 4 \| 5 \| 6;/);
  assert.doesNotMatch(phaseType, /\b0\b/);
});

test("adaptive/READY/RETAINED infrastructure remains intact", () => {
  assert.equal(typeof decideAdaptivePractice, "function");
  assert.equal(typeof deriveSkillEvidence, "function");
  assert.match(read("src/scheduler/fsrs6.ts"), /FSRS|Fsrs/i);
});

test("reference content can still be non-assessed and non-blocking", () => {
  const validReference = {
    id: "reference.future", phase: 4, title: "Future lookup", prerequisites: [], evidence: [], tags: [], contentKind: "reference", assessed: false, blocksPhaseCompletion: false,
    foundationality: 1, automaticRecall: 0, conceptualUnderstanding: 1, reviewPriority: 0, longTermRecurrence: 0, prerequisiteImportance: 0,
  };
  assert.equal(validateCurriculumGraph([validReference]).valid, true);
  assert.equal(validateCurriculumGraph([{ ...validReference, assessed: true }]).valid, false);
});

test("priority metadata remains multi-dimensional", () => {
  const source = read("src/curriculum/types.ts");
  for (const field of ["foundationality", "automaticRecall", "conceptualUnderstanding", "reviewPriority", "longTermRecurrence", "prerequisiteImportance"]) assert.match(source, new RegExp(field));
});

test("old source-mutating build scripts and stale schema remain absent", () => {
  assert.equal(fs.existsSync("scripts/apply-curriculum-v09.py"), false);
  assert.equal(fs.existsSync("scripts/redesign-ui.py"), false);
  assert.equal(fs.existsSync("bootstrap"), false);
  assert.equal(fs.existsSync("supabase/schema.sql"), false);
});

test("Block 3 source app remains a stable baseline for pure later-phase production transforms", () => {
  execFileSync(process.execPath, ["--check", "web/app-block3.js"]);
  assert.match(read("web/index.html"), /app-block3\.js/);
  assert.match(app, /Phase 2/);
  assert.match(app, /major scale|Major Scales/i);
  assert.doesNotMatch(app, /minor-scales\.lesson-/);
  assert.ok(fs.existsSync("scripts/block4-app-transform.mjs"));
  assert.ok(fs.existsSync("scripts/block5-app-transform.mjs"));
});
