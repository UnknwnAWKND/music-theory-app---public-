import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  CURRICULUM_PHASES,
  SKILLS,
  deriveSkillEvidence,
  freshLessonProgress,
  lessonOpeningState,
  markLessonAbandoned,
  markLessonCompleted,
  practiceRoundPlan,
  practiceRoundQuestionNumber,
} from "../dist/index.js";
import { renderPracticeRoundCounter, renderTeachingLesson } from "../web/lesson-ui.js";

const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const resetMigration = await readFile(new URL("../supabase/migrations/202609031930_rebuild_block1_empty_curriculum.sql", import.meta.url), "utf8");
const app = await readFile(new URL("../web/app-block8.js", import.meta.url), "utf8");

test("Block 1 six-phase shell remains exact", () => {
  assert.deepEqual(CURRICULUM_PHASES.map(({ phase }) => phase), [1, 2, 3, 4, 5, 6]);
  assert.equal(SKILLS.some((skill) => skill.phase === 0), false);
  assert.equal(SKILLS.some((skill) => skill.phase > 6), false);
});

test("old pre-rebuild curriculum files remain absent and only Phases 1-6 are active", async () => {
  for (const oldFile of ["../src/curriculum.ts", "../src/content.ts", "../src/practice.ts"]) {
    await assert.rejects(readFile(new URL(oldFile, import.meta.url), "utf8"));
  }
  assert.deepEqual([...new Set(SKILLS.map((skill) => skill.phase))], [1, 2, 3, 4, 5, 6]);
});

test("placement now tests prerequisites for Phases 2-6 without sampling destination material", async () => {
  const { placementDefinition } = await import("../dist/index.js");
  for (const phase of [2, 3, 4, 5, 6]) {
    const definition = placementDefinition(phase);
    assert.ok(definition);
    assert.equal(definition.phase, phase);
    assert.ok(definition.competencies.length > 0);
    assert.ok(definition.competencies.every((competency) => competency.skillIds.every((skillId) => SKILLS.find((skill) => skill.id === skillId)?.phase < phase)));
  }
});

test("rebuild migration still preserves auth and clears application data", () => {
  assert.doesNotMatch(resetMigration, /auth\.users|drop schema auth/i);
  assert.match(resetMigration, /delete from public\.review_log/i);
  assert.match(resetMigration, /delete from public\.skill_state/i);
  assert.match(resetMigration, /delete from public\.phase_progress/i);
  assert.match(resetMigration, /delete from public\.lesson_progress/i);
  assert.doesNotMatch(resetMigration, /delete from public\.user_profiles/i);
  assert.doesNotMatch(resetMigration, /delete from public\.user_settings/i);
});

test("login still lazily creates profile/settings without wiping prior progress", () => {
  assert.match(app, /getProfile\(userId\)/);
  assert.match(app, /upsertProfile\(userId, fallback\)/);
  assert.match(app, /getSettings\(userId\)/);
  assert.match(app, /upsertSettings\(settings\)/);
  assert.doesNotMatch(app, /clearAll\(|resetAll\(/);
});

test("active app and schemas do not reintroduce hint UI/content", () => {
  assert.doesNotMatch(app, /Show hint|Need a hint|hint-button/i);
  assert.doesNotMatch(schema, /hint_/i);
});

test("corrective feedback remains after hints were removed", () => {
  assert.match(app, /Correct\./);
  assert.match(app, /Not quite\./);
  assert.match(app, /explanation/);
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

test("assessed practice keeps substantial rounds except the explicit Lesson 1 initial ten-question pass and does not grant mastery", () => {
  for (const skill of SKILLS.filter((skill) => skill.assessed)) {
    const round = practiceRoundPlan(skill.id, "new");
    if (skill.id === "intervals.lesson-1-unison-octave") assert.equal(round.size, 10);
    else assert.ok(round.size >= 30, skill.id);
    assert.ok(practiceRoundPlan(skill.id, "review").size >= 30, `${skill.id} review`);
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
  assert.deepEqual(after, before);
});

test("Phase 0 remains nonexistent", () => {
  assert.equal(CURRICULUM_PHASES.some(({ phase }) => phase === 0), false);
  assert.equal(SKILLS.some(({ phase }) => phase === 0), false);
});

test("adaptive/READY/RETAINED infrastructure remains intact", async () => {
  const source = await readFile(new URL("../src/learning/evidence.ts", import.meta.url), "utf8");
  assert.match(source, /ready/i);
  assert.match(source, /retained/i);
});

test("reference content can still be non-assessed and non-blocking", () => {
  const reference = SKILLS.find((skill) => skill.contentKind === "reference");
  assert.ok(reference);
  assert.equal(reference.assessed, false);
  assert.equal(reference.blocksPhaseCompletion, false);
});

test("priority metadata remains multi-dimensional", () => {
  for (const skill of SKILLS) {
    assert.ok(skill.foundationality >= 1 && skill.foundationality <= 5);
    assert.ok(skill.reviewPriority >= 1 && skill.reviewPriority <= 5);
    assert.ok(skill.longTermRecurrence >= 1 && skill.longTermRecurrence <= 5);
  }
});

test("old source-mutating build scripts and stale schema remain absent", async () => {
  await assert.rejects(readFile(new URL("../scripts/build-curriculum.mjs", import.meta.url), "utf8"));
  assert.doesNotMatch(schema, /phase_0/i);
});

test("Block 8 final app is the production source and no longer depends on historical app transforms", async () => {
  const index = await readFile(new URL("../web/index.html", import.meta.url), "utf8");
  assert.match(index, /app-block8\.js/);
  assert.doesNotMatch(index, /app-block[1-7]\.js/);
});
