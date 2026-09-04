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
const app = read("web/app.js");

const OLD_CURRICULUM_FILES = [
  "src/curriculum/skills-v09.ts",
  "src/exercises/catalog-v09.ts",
  "src/practice/lessons-v09.ts",
  "src/progression/checkpoints-v09.ts",
];

test("1. no old phase remains active", () => {
  assert.deepEqual(CURRICULUM_PHASES.map((phase) => phase.phase), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(CURRICULUM_PHASES.map((phase) => phase.title), ["Intervals", "Major Scales", "Minor Scales", "Diatonic Chords / Roman Numerals", "Relatives", "Circle of Fifths"]);
});

test("2. no old lesson remains", () => {
  assert.deepEqual(activeLessonSkillIds(), []);
  for (const path of OLD_CURRICULUM_FILES) assert.equal(fs.existsSync(path), false, path);
});

test("3. no old active question pool remains", () => {
  assert.deepEqual(activeExerciseSkillIds(), []);
  assert.equal(SKILLS.length, 0);
});

test("4. no old checkpoint competency map remains", () => {
  assert.deepEqual(allCheckpointDefinitions(), []);
});

test("5. no old placement map remains", () => {
  for (const phase of CURRICULUM_PHASES) assert.deepEqual(placementDefinition(phase.phase).competencies, []);
});

test("6. rebuild migration deletes every application-level user dataset", () => {
  for (const table of ["lesson_progress", "scheduler_reviews", "scheduler_cards", "skill_state", "phase_progress", "retired_skill_history", "learning_attempts", "study_sessions", "user_learning_settings", "user_profiles"]) {
    assert.match(migration, new RegExp(`delete from public\\.${table};`, "i"), table);
  }
});

test("7. destructive reset leaves Supabase Auth identities untouched", () => {
  assert.doesNotMatch(migration, /delete\s+from\s+auth\.users/i);
  const runtime = read("web/runtime.js");
  assert.match(runtime, /signInWithPassword/);
  assert.match(runtime, /getSession/);
});

test("8. login lazily creates or loads fresh profile and settings state", () => {
  assert.match(app, /ensureFreshAccountState/);
  assert.match(app, /getProfile\(userId\)/);
  assert.match(app, /upsertProfile\(userId/);
  assert.match(app, /getSettings\(userId\)/);
  assert.match(app, /upsertSettings\(settings\)/);
  assert.match(read("web/config.js"), /buildVersion:\s*"rebuild-block1"/);
});

test("9. active rebuilt UI has no assistance button", () => {
  for (const path of ["web/app.js", "web/lesson-ui.js"]) {
    const source = read(path);
    assert.doesNotMatch(source, /show\s+hint|need\s+a\s+hint|hintbutton|hintbtn/i, path);
  }
});

test("10. active question and lesson schemas contain no question assistance content", () => {
  for (const path of ["src/exercises/types.ts", "src/exercises/generators.ts", "src/practice/types.ts", "src/practice/lessons.ts"]) {
    assert.doesNotMatch(read(path), /inputHint|hintText|showHint|need a hint/i, path);
  }
});

test("11. corrective feedback still gives the correct answer and explanation", () => {
  const exercise = createExercise({ skillId: "test.skill", prompt: "Choose it", answerSpec: { kind: "text", expected: "correct" }, explanation: "Because this relationship resolves the task.", exampleSignature: "one" });
  const result = gradeExercise(exercise, "wrong");
  assert.equal(result.correct, false);
  assert.match(result.detail, /Correct answer: correct/);
  assert.match(result.detail, /Because this relationship/);
});

test("12. a completed lesson reopens at the beginning of teaching", () => {
  const done = markLessonCompleted(freshLessonProgress("lesson.test"), "2026-09-04T00:00:00Z");
  assert.deepEqual(lessonOpeningState(done), { stage: "teaching", teachingStepIndex: 0, canSkipToReview: true, skipPlacement: "teaching-bottom" });
});

test("13. first-time lesson access has no Skip to Review", () => {
  const opening = lessonOpeningState(freshLessonProgress("lesson.test"));
  assert.equal(opening.canSkipToReview, false);
  assert.equal(opening.skipPlacement, null);
});

test("14. completed replay renders Skip to Review only at the bottom of teaching", () => {
  const progress = markLessonCompleted(freshLessonProgress("lesson.test"), "2026-09-04T00:00:00Z");
  const html = renderTeachingLesson({ lesson: { skillId: "lesson.test", title: "Test", teachingSteps: [{ id: "a", title: "Start", body: "Teach first." }] }, openingState: lessonOpeningState(progress) });
  const teachIndex = html.indexOf("Teach first.");
  const skipIndex = html.indexOf("Skip to Review");
  assert.ok(teachIndex >= 0 && skipIndex > teachIndex);
});

test("15. abandoning a first attempt does not unlock skipping", () => {
  const abandoned = markLessonAbandoned(freshLessonProgress("lesson.test"));
  assert.equal(abandoned.completionCount, 0);
  assert.equal(lessonOpeningState(abandoned).canSkipToReview, false);
});

test("16. practice rounds expose the real current question count", () => {
  const round = practiceRoundPlan("future.skill", "new");
  assert.ok(round.size >= 30);
  assert.equal(practiceRoundQuestionNumber(7, round.size), 8);
  assert.match(renderPracticeRoundCounter(7, round.size, 1), new RegExp(`Question 8 of ${round.size}`));
});

test("17. finishing a round does not automatically grant READY or RETAINED", () => {
  const before = deriveSkillEvidence([]);
  practiceRoundPlan("future.skill", "new");
  const after = deriveSkillEvidence([]);
  assert.equal(before.ready, false);
  assert.equal(after.ready, false);
  assert.equal(after.retained, false);
});

test("18. app safely loads with zero active curriculum lessons", () => {
  execFileSync(process.execPath, ["--check", "web/app.js"]);
  assert.equal(SKILLS.length, 0);
  assert.match(app, /Curriculum is being rebuilt\./);
});

test("19. Phase 0 does not exist", () => {
  assert.equal(CURRICULUM_PHASES.some((phase) => phase.phase === 0), false);
  const phaseType = read("src/curriculum/types.ts").split("\n").find((line) => line.includes("type PhaseNumber")) ?? "";
  assert.match(phaseType, /PhaseNumber = 1 \| 2 \| 3 \| 4 \| 5 \| 6;/);
  assert.doesNotMatch(phaseType, /\b0\b/);
});

test("20. reusable adaptive learning infrastructure remains intact", () => {
  assert.equal(typeof decideAdaptivePractice, "function");
  assert.equal(typeof deriveSkillEvidence, "function");
  assert.match(read("src/scheduler/fsrs6.ts"), /FSRS|Fsrs/i);
});

test("reference content can be non-assessed and non-blocking", () => {
  const validReference = {
    id: "reference.future",
    phase: 4,
    title: "Future lookup",
    prerequisites: [], evidence: [], tags: [], contentKind: "reference", assessed: false, blocksPhaseCompletion: false,
    foundationality: 1, automaticRecall: 0, conceptualUnderstanding: 1, reviewPriority: 0, longTermRecurrence: 0, prerequisiteImportance: 0,
  };
  assert.equal(validateCurriculumGraph([validReference]).valid, true);
  assert.equal(validateCurriculumGraph([{ ...validReference, assessed: true }]).valid, false);
});

test("priority metadata exposes independent curriculum-weight dimensions", () => {
  const source = read("src/curriculum/types.ts");
  for (const field of ["foundationality", "automaticRecall", "conceptualUnderstanding", "reviewPriority", "longTermRecurrence", "prerequisiteImportance"]) assert.match(source, new RegExp(field));
});

test("old source-mutating curriculum build scripts are absent", () => {
  assert.equal(fs.existsSync("scripts/apply-curriculum-v09.py"), false);
  assert.equal(fs.existsSync("scripts/redesign-ui.py"), false);
  assert.equal(fs.existsSync("bootstrap"), false);
});
