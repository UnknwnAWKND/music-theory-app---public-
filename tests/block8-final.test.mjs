import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  CURRICULUM_PHASES,
  SKILLS,
  SKILL_BY_ID,
  placementDefinition,
  placementPrerequisitePhases,
  practiceRoundPlan,
} from "../dist/index.js";
import {
  activeAssessedSkills,
  learningSummary,
  normalizeTheme,
  phaseSummary,
  themeCacheKey,
} from "../web/final-ui.js";
import { phase4SavedProgressionKey } from "../web/phase4-ui.js";

const read = (path) => fs.readFileSync(path, "utf8");
const app = read("web/app-block8.js");
const design = read("web/design-system.css");
const index = read("web/index.html");
const reset = read("web/reset-progress-settings-v2.js");
const themeMigration = read("supabase/migrations/202609050700_block8_user_theme.sql");
const rlsMigration = read("supabase/migrations/202609050800_block8_lesson_progress_rls_perf.sql");

test("Block 8 final curriculum is still exactly six phases with the requested lesson counts", () => {
  assert.deepEqual(CURRICULUM_PHASES.map((phase) => phase.phase), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((phase) => SKILLS.filter((skill) => skill.phase === phase).length), [10, 4, 5, 10, 4, 4]);
  assert.equal(SKILLS.some((skill) => skill.phase === 0 || skill.phase > 6), false);
});

test("placement utilities remain prerequisite-based and never sample destination material", () => {
  assert.deepEqual(placementPrerequisitePhases(2), [1]);
  assert.deepEqual(placementPrerequisitePhases(6), [1, 2, 3, 4, 5]);
  for (const targetPhase of [2, 3, 4, 5, 6]) {
    const definition = placementDefinition(targetPhase);
    assert.ok(definition.competencies.length > 0, `Phase ${targetPhase}`);
    for (const competency of definition.competencies) {
      for (const skillId of competency.skillIds) {
        const skill = SKILL_BY_ID.get(skillId);
        assert.ok(skill, skillId);
        assert.ok(skill.phase < targetPhase, `${skillId} must be prerequisite material for Phase ${targetPhase}`);
      }
    }
  }
});

test("legacy placement copy never pretends a diagnostic pass grants mastery or retention", () => {
  assert.match(app, /does not mark earlier material retained/i);
  assert.match(app, /does not mark earlier skills retained or complete/i);
  assert.match(app, /prerequisite skills needed before that phase/i);
});

test("only Phase 1 Lesson 1 has the explicit 10-question acquisition exception", () => {
  const shortId = "intervals.lesson-1-unison-octave";
  assert.equal(practiceRoundPlan(shortId, "new").size, 10);
  assert.equal(practiceRoundPlan(shortId, "review").size, 30);
  for (const skill of activeAssessedSkills(SKILLS).filter((skill) => skill.id !== shortId)) {
    assert.ok(practiceRoundPlan(skill.id, "new").size >= 30, skill.id);
    assert.ok(practiceRoundPlan(skill.id, "review").size >= 30, skill.id);
  }
});

test("final progress summaries use lesson completion, not READY, and exclude the Phase 4 reference card", () => {
  const assessed = activeAssessedSkills(SKILLS);
  assert.equal(assessed.length, 36);
  assert.equal(assessed.some((skill) => skill.contentKind === "reference"), false);
  const reference = SKILLS.find((skill) => skill.contentKind === "reference");
  assert.ok(reference);
  const allReadyRows = assessed.map((skill) => ({ skillId: skill.id, evidence: { ready: true, fragile: false, state: "ready" } }));
  const noCompletion = learningSummary(SKILLS, allReadyRows, [], []);
  assert.equal(noCompletion.completed, 0);
  assert.equal(noCompletion.learning, 36);
  assert.equal(noCompletion.overallPercent, 0);
  const completedLessons = assessed.map((skill) => ({ lessonId: skill.id, completionCount: 1 }));
  const summary = learningSummary(SKILLS, allReadyRows, [], completedLessons);
  assert.equal(summary.completed, 36);
  assert.equal(summary.overallPercent, 100);
  const phase4 = phaseSummary(SKILLS, 4, allReadyRows, [], completedLessons);
  assert.equal(phase4.required.length, 9);
  assert.equal(phase4.percent, 100);
});

test("theme behavior is explicit, user-scoped, and defaults safely to dark", () => {
  assert.equal(normalizeTheme("light"), "light");
  assert.equal(normalizeTheme("dark"), "dark");
  assert.equal(normalizeTheme("system"), "dark");
  assert.notEqual(themeCacheKey("user-a"), themeCacheKey("user-b"));
  assert.match(app, /theme:\s*"dark"/);
  assert.match(app, /cacheTheme\(state\.userId, nextTheme\)/);
});

test("Light and Dark share one final design system with warm light background and neutral dark background", () => {
  assert.match(design, /html\[data-theme="light"\]/);
  assert.match(design, /#f3efe7/i);
  assert.match(design, /#111318/i);
  assert.match(design, /--space-1:\s*4px/);
  assert.match(design, /--space-2:\s*8px/);
  assert.match(design, /--space-4:\s*16px/);
  assert.match(design, /--space-6:\s*24px/);
  assert.match(design, /--control-height:\s*48px/);
  assert.match(design, /min-height:\s*var\(--control-height\)/);
});

test("production now loads the final Block 8 app directly", () => {
  assert.match(index, /app-block8\.js/);
  assert.match(index, /design-system\.css/);
  assert.doesNotMatch(index, /app-block3\.js|app-block4\.js|app-block5\.js|app-block6\.js|app-block7\.js/);
  const build = read("scripts/build-site.mjs");
  assert.match(build, /await cp\("web", OUT/);
  assert.match(build, /"app-block3\.js"/);
  assert.match(build, /Built Block 8 final polished site/);
});

test("primary navigation is intentionally limited to Home, Learn, and Profile", () => {
  assert.match(app, /data-nav="home"[\s\S]*>Home</);
  assert.match(app, /data-nav="learn"[\s\S]*>Learn</);
  assert.match(app, /data-nav="profile"[\s\S]*>Profile</);
  assert.doesNotMatch(app, /data-nav="settings"/);
  assert.match(app, /id="settingsButton"/);
});

test("Settings is learner-facing and keeps Appearance, Learning, and Account separate", () => {
  assert.match(app, />Appearance<\/div>/);
  assert.match(app, />Learning<\/div>/);
  assert.match(app, />Account<\/div>/);
  assert.match(app, /Require Previous Lessons/);
  assert.doesNotMatch(app, />Testing<\/div>/);
  assert.match(reset, /data-settings-account/);
  assert.match(reset, /Your account, profile, theme, and learning settings stay/);
});

test("Phase 4 and Phase 6 saved progression state is scoped per user", () => {
  assert.notEqual(phase4SavedProgressionKey("user-a"), phase4SavedProgressionKey("user-b"));
  assert.match(read("web/phase4-ui.js"), /phase4SavedProgressionKey\(userId\)/);
  assert.match(read("web/phase6-ui.js"), /phase4SavedProgressionKey\(userId\)/);
  assert.match(app, /bindPhase4ProgressionLab\(analyzeStructuredProgression, \{ userId: state\.userId \}\)/);
  assert.match(app, /bindPhase6Ui\([\s\S]*userId: state\.userId/);
});

test("reset progress still preserves account, profile, theme, and settings", () => {
  assert.match(reset, /snapshot\.sessions = \[\]/);
  assert.match(reset, /snapshot\.skillStates = \[\]/);
  assert.match(reset, /snapshot\.phaseProgress = \[\]/);
  assert.match(reset, /snapshot\.lessonProgress = \[\]/);
  assert.doesNotMatch(reset, /snapshot\.settings = \[\]/);
  assert.doesNotMatch(reset, /snapshot\.profiles = \[\]/);
});

test("final write paths guard against rapid duplicate state transitions", () => {
  assert.match(app, /if \(!checkpoint \|\| state\.transitionBusy\) return/);
  assert.match(app, /if \(state\.busy\) return/);
  assert.match(app, /button\.disabled = true/);
});

test("active final UI contains no learner-facing hint controls", () => {
  for (const path of ["web/app-block8.js", "web/lesson-ui.js", "web/final-ui.js", "web/design-system.css", "web/reset-progress-settings-v2.js"]) {
    assert.doesNotMatch(read(path), /show\s+hint|need\s+a\s+hint|hintbutton|hintbtn|data-hint/i, path);
  }
});

test("theme schema and lesson-progress RLS migrations are narrow and backward compatible", () => {
  assert.match(themeMigration, /add column if not exists theme text not null default 'dark'/i);
  assert.match(themeMigration, /theme in \('light', 'dark'\)/i);
  assert.match(rlsMigration, /\(select auth\.uid\(\)\) = user_id/i);
  assert.doesNotMatch(rlsMigration, /for delete|grant\s+delete/i);
});
