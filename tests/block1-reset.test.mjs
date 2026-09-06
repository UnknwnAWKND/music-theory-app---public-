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
const app = read("web/app-block8.js");
const OLD_CURRICULUM_FILES = ["src/curriculum/skills-v09.ts", "src/exercises/catalog-v09.ts", "src/practice/lessons-v09.ts", "src/progression/checkpoints-v09.ts"];

test("Block 1 six-phase shell remains exact", () => {
  assert.deepEqual(CURRICULUM_PHASES.map((phase) => phase.phase), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(CURRICULUM_PHASES.map((phase) => phase.title), ["Intervals", "Major Scales", "Minor Scales", "Diatonic Chords / Roman Numerals", "Relatives", "Circle of Fifths"]);
});

test("old pre-rebuild curriculum files remain absent and only Phases 1-6 are active", () => {
  for (const path of OLD_CURRICULUM_FILES) assert.equal(fs.existsSync(path), false, path);
  assert.equal(SKILLS.some((skill) => skill.phase > 6), false, "No Phase 7 skills may exist");
  assert.equal(SKILLS.filter((skill) => skill.phase === 1).length, 10);
  assert.equal(SKILLS.filter((skill) => skill.phase === 2).length, 4);
  assert.equal(SKILLS.filter((skill) => skill.phase === 3).length, 5);
  assert.equal(SKILLS.filter((skill) => skill.phase === 4).length, 10);
  assert.equal(SKILLS.filter((skill) => skill.phase === 5).length, 4);
  assert.equal(SKILLS.filter((skill) => skill.phase === 6).length, 4);
  assert.equal(activeLessonSkillIds().length, 37);
  assert.equal(activeExerciseSkillIds().length, 36, "Reference Lesson 7 must remain the only lesson without an exercise generator");
  assert.equal(allCheckpointDefinitions().length, 6);
});

test("placement now tests prerequisites for Phases 2-6 without sampling destination material", () => {
  for (const targetPhase of [2, 3, 4, 5, 6]) {
    const definition = placementDefinition(targetPhase);
    assert.ok(definition.competencies.length > 0, `Phase ${targetPhase} placement must contain prerequisite competencies`);
    for (const competency of definition.competencies) {
      assert.match(competency.id, /^placement-p[1-5]--/);
      for (const skillId of competency.skillIds) {
        const skill = SKILLS.find((candidate) => candidate.id === skillId);
        assert.ok(skill, skillId);
        assert.ok(skill.phase < targetPhase, `${skillId} must be prerequisite material for Phase ${targetPhase}`);
      }
    }
  }
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
  assert.match(read("web/config.js"), /buildVersion:\s*"rebuild-block8-final"/);
});

test("active app and schemas do not reintroduce hint UI/content", () => {
  for (const path of ["web/app-block8.js", "web/lesson-ui.js", "web/styles.css", "web/design-system.css", "src/exercises/types.ts", "src/exercises/generators.ts", "src/practice/types.ts", "src/practice/lessons.ts", "src/practice/phase2-major-scales.ts", "src/exercises/phase2-major-scales.ts", "src/practice/phase3-minor-scales.ts", "src/exercises/phase3-minor-scales.ts", "src/practice/phase4-diatonic-chords.ts", "src/exercises/phase4-diatonic-chords.ts", "web/phase4-ui.js"]) {
    assert.doesNotMatch(read(path), /show\s+hint|need\s+a\s+hint|hintbutton|hintbtn|inputHint|hintText|showHint|class=["'][^"']*\bhint\b/i, path);
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

test("assessed practice keeps the 30-question floor except the explicit Lesson 1 acquisition correction, and rounds never grant mastery", () => {
  const shortId = "intervals.lesson-1-unison-octave";
  for (const skill of SKILLS.filter((skill) => skill.assessed)) {
    const round = practiceRoundPlan(skill.id, "new");
    if (skill.id === shortId) assert.equal(round.size, 10, skill.id);
    else assert.ok(round.size >= 30, skill.id);
  }
  assert.equal(practiceRoundPlan(shortId, "review").size, 30);
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

test("Block 8 final app is the production source and no longer depends on historical app transforms", () => {
  execFileSync(process.execPath, ["--check", "web/app-block8.js"]);
  execFileSync(process.execPath, ["--check", "web/final-ui.js"]);
  const index = read("web/index.html");
  assert.match(index, /app-block8\.js/);
  assert.match(index, /design-system\.css/);
  assert.doesNotMatch(index, /app-block3\.js/);
  assert.match(app, /CURRICULUM_PHASES/);
  assert.match(app, /placementDefinition/);
  assert.match(app, /renderSettings/);
  assert.match(app, /phase4SavedProgressionKey|bindPhase4ProgressionLab/);
});
