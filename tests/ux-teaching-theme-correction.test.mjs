import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  lessonForSkill,
  phase1Lessons,
  phase2Lessons,
  phase3Lessons,
  phase4Lessons,
  phase5Lessons,
  phase6Lessons,
} from "../dist/index.js";

const [indexHtml, appearanceCss, appearanceJs, floatingCss, floatingJs, dockCss, migration] = await Promise.all([
  readFile(new URL("../web/index.html", import.meta.url), "utf8"),
  readFile(new URL("../web/appearance-system.css", import.meta.url), "utf8"),
  readFile(new URL("../web/appearance-controller.js", import.meta.url), "utf8"),
  readFile(new URL("../web/floating-back.css", import.meta.url), "utf8"),
  readFile(new URL("../web/floating-back.js", import.meta.url), "utf8"),
  readFile(new URL("../web/persistent-floating-dock.css", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/202609052235_user_accent_color.sql", import.meta.url), "utf8"),
]);

function lessonText(id) {
  const lesson = lessonForSkill(id);
  assert.ok(lesson, `missing ${id}`);
  return lesson.teachingSteps.map((step) => [step.title, step.body, step.workedExample, step.payoff].filter(Boolean).join(" ")).join(" ");
}

test("Phase 1 Lesson 1 teaches interval number from letters without later quality jargon", () => {
  const text = lessonText("intervals.lesson-1-unison-octave");
  assert.match(text, /C.?D.?E.?F.?G/i);
  assert.match(text, /five letter names/i);
  assert.match(text, /interval number is a 5th/i);
  assert.doesNotMatch(text, /\bMajor\b|\bMinor\b|Augmented|Diminished|inversion/i);
  assert.doesNotMatch(text, /semitones?|half steps?/i);
});

test("Perfect 5th is named from five letters, not five whole steps or seven-semitone reasoning", () => {
  const text = lessonText("intervals.lesson-2-perfect-fifth");
  assert.match(text, /C.?D.?E.?F.?G/i);
  assert.match(text, /five letter names/i);
  assert.match(text, /called a Perfect 5th/i);
  assert.doesNotMatch(text, /five whole steps|5 whole steps/i);
  assert.doesNotMatch(text, /seven semitones|7 semitones|seven half steps|7 half steps/i);
  assert.doesNotMatch(text, /\bMajor\b|\bMinor\b|Augmented|Diminished|inversion/i);
});

test("exact chromatic-size comparison arrives with Major/Minor in Lesson 4", () => {
  const lesson3 = lessonText("intervals.lesson-3-perfect-fourth");
  const lesson4 = lessonText("intervals.lesson-4-thirds");
  assert.doesNotMatch(lesson3, /semitones?|half steps?/i);
  assert.match(lesson4, /interval number still comes from the written letter span/i);
  assert.match(lesson4, /Half steps help distinguish the exact Major or Minor version/i);
});

test("future interval terminology is progressively disclosed", () => {
  const firstTwo = [
    lessonText("intervals.lesson-1-unison-octave"),
    lessonText("intervals.lesson-2-perfect-fifth"),
  ].join(" ");
  assert.doesNotMatch(firstTwo, /Augmented|Diminished|\bM3\b|\bm3\b|inverts?|inversion/i);
  assert.match(lessonText("intervals.lesson-3-perfect-fourth"), /invert|inversion/i);
  assert.match(lessonText("intervals.lesson-4-thirds"), /Major|Minor/i);
  assert.match(lessonText("intervals.lesson-8-tritone"), /Augmented|Diminished/i);
});

test("all six phases remain present and ordered while dependency pass changes content only", () => {
  const phases = [phase1Lessons(), phase2Lessons(), phase3Lessons(), phase4Lessons(), phase5Lessons(), phase6Lessons()];
  assert.deepEqual(phases.map((lessons) => lessons.length), [10, 4, 5, 10, 4, 4]);
  assert.match(lessonText("major-scales.lesson-1-formula"), /scale is|tonic/i);
  assert.match(lessonText("relatives.lesson-1-relative-major-minor"), /Relative keys are/i);
  assert.match(lessonText("circle-of-fifths.lesson-1-what-it-represents"), /Circle of Fifths/i);
});

test("floating Back is viewport fixed, safe-area aware, and only mirrors eligible page-header back controls", () => {
  assert.match(indexHtml, /floating-back\.css/);
  assert.match(indexHtml, /floating-back\.js/);
  assert.match(floatingCss, /\.floating-back-control\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(floatingCss, /top:\s*calc\(env\(safe-area-inset-top\)\s*\+\s*10px\)/);
  assert.match(floatingJs, /IntersectionObserver/);
  assert.match(floatingJs, /!entry\.isIntersecting\s*&&\s*sourceHasScrolledAboveViewport/);
  assert.match(floatingJs, /\["exitPractice",\s*"exitCheckpoint"\]/);
  assert.match(floatingJs, /source\?\.click\(\)/);
});

test("persistent bottom dock remains viewport fixed and safe-area aware", () => {
  assert.match(dockCss, /\.bottom-nav\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(dockCss, /env\(safe-area-inset-bottom\)/);
});

test("Light theme uses visibly warm beige while piano white remains white", () => {
  assert.match(appearanceCss, /--bg-primary:\s*#efe5d6/i);
  assert.match(appearanceCss, /--bg-secondary:\s*#e7dac7/i);
  assert.match(appearanceCss, /--surface:\s*#f7efe3/i);
  assert.match(appearanceCss, /--piano-white:\s*#ffffff/i);
});

test("all eight accents have explicit Light and Dark variants", () => {
  const accents = ["red","green","purple","yellow","orange","blue","black","white"];
  for (const theme of ["light", "dark"]) {
    for (const accent of accents) {
      const selector = `html[data-theme="${theme}"][data-accent="${accent}"]`;
      assert.ok(appearanceCss.includes(selector), `${theme} + ${accent}`);
    }
  }
});

test("Yellow, White, and Black edge cases have deliberate contrast treatments", () => {
  assert.match(appearanceCss, /data-theme="dark"\]\[data-accent="yellow"\][^\n]*--accent-foreground:#241d06/);
  assert.match(appearanceCss, /data-theme="light"\]\[data-accent="yellow"\][^\n]*--accent-foreground:#241d06/);
  assert.match(appearanceCss, /data-theme="light"\]\[data-accent="white"\][^\n]*--accent-border:#8b8378/);
  assert.match(appearanceCss, /data-theme="dark"\]\[data-accent="black"\][^\n]*--accent-border:#697283/);
});

test("accent is centralized and semantic success/error colors are not reassigned", () => {
  assert.match(appearanceCss, /--accent-primary/);
  assert.match(appearanceCss, /--accent-strong/);
  assert.match(appearanceCss, /--accent-soft/);
  assert.match(appearanceCss, /--accent-border/);
  assert.match(appearanceCss, /--accent-foreground/);
  assert.doesNotMatch(appearanceCss, /--success\s*:/);
  assert.doesNotMatch(appearanceCss, /--error\s*:/);
});

test("Accent Color UI is compact, auto-saved, and persisted per authenticated user", () => {
  assert.match(appearanceJs, /const ACCENTS = Object\.freeze\(\["red", "green", "purple", "yellow", "orange", "blue", "black", "white"\]\)/);
  assert.match(appearanceJs, /accent-swatch-grid/);
  assert.match(appearanceJs, /saveAccent\(button\.dataset\.accentChoice\)/);
  assert.match(appearanceJs, /user_appearance_settings/);
  assert.match(appearanceJs, /user_id:\s*currentUserId/);
  assert.match(migration, /user_id uuid primary key references auth\.users\(id\)/);
  assert.match(migration, /accent_color in \('red','green','purple','yellow','orange','blue','black','white'\)/);
  assert.match(migration, /auth\.uid\(\).*user_id/);
});
