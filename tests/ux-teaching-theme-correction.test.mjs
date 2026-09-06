import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  exerciseForSkill,
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

function exerciseText(item) {
  const choices = item?.answerSpec?.kind === "choice" ? item.answerSpec.choices ?? [] : [];
  return [item?.prompt, ...choices, item?.explanation].filter(Boolean).join(" ");
}

function generatedText(skillId, count = 80) {
  return Array.from({ length: count }, (_, index) => exerciseForSkill(skillId, index)).filter(Boolean).map(exerciseText).join("\n");
}

function paletteVars(theme, accent) {
  const selector = `html[data-theme="${theme}"][data-accent="${accent}"]`;
  const start = appearanceCss.indexOf(selector);
  assert.ok(start >= 0, `missing ${theme} + ${accent}`);
  const open = appearanceCss.indexOf("{", start);
  const close = appearanceCss.indexOf("}", open);
  const body = appearanceCss.slice(open + 1, close);
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})/g)].map((match) => [match[1], match[2]]));
}

function rgb(hex) {
  let value = hex.replace("#", "");
  if (value.length === 3) value = value.split("").map((char) => char + char).join("");
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
}

function luminance(hex) {
  const channels = rgb(hex).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

test("Phase 1 Lesson 1 introduces interval size and quality without teaching later quality categories", () => {
  const text = lessonText("intervals.lesson-1-unison-octave");
  assert.match(text, /distance in pitch between two notes/i);
  assert.match(text, /size.*note names.*counted by letter/i);
  assert.match(text, /quality.*half-step.*semitone/i);
  assert.match(text, /C to C at the same octave/i);
  assert.match(text, /C–D–E–F–G–A–B–C spans eight note names/i);
  assert.doesNotMatch(text, /\bMajor\b|\bMinor\b|Augmented|Diminished|inversion/i);
});

test("Perfect 5th is named from five written note names, not five whole steps or seven-semitone reasoning", () => {
  const text = lessonText("intervals.lesson-2-perfect-fifth");
  assert.match(text, /C.?D.?E.?F.?G/i);
  assert.match(text, /five note names/i);
  assert.match(text, /reference Perfect 5th|quality name here is Perfect/i);
  assert.doesNotMatch(text, /five whole steps|5 whole steps/i);
  assert.doesNotMatch(text, /seven semitones|7 semitones|seven half steps|7 half steps/i);
  assert.doesNotMatch(text, /\bMajor\b|\bMinor\b|Augmented|Diminished|inversion/i);
});

test("exact chromatic-size comparison arrives with Major/Minor in Lesson 4", () => {
  const lesson3 = lessonText("intervals.lesson-3-perfect-fourth");
  const lesson4 = lessonText("intervals.lesson-4-thirds");
  assert.doesNotMatch(lesson3, /semitones?|half steps?/i);
  assert.match(lesson4, /interval number still comes from the written note-letter span/i);
  assert.match(lesson4, /half steps distinguish the exact quality/i);
});

test("early Phase 1 questions, choices, and corrective feedback do not leak later concepts", () => {
  const lesson1 = generatedText("intervals.lesson-1-unison-octave");
  const lesson2 = generatedText("intervals.lesson-2-perfect-fifth");
  const lesson3 = generatedText("intervals.lesson-3-perfect-fourth");

  assert.doesNotMatch(lesson1, /\bP4\b|\bP5\b|\bMajor\b|\bMinor\b|Augmented|Diminished|semitones?|half steps?|invert|inversion/i);
  assert.doesNotMatch(lesson2, /\bP4\b|\bMajor\b|\bMinor\b|Augmented|Diminished|semitones?|half steps?|invert|inversion/i);
  assert.doesNotMatch(lesson3, /\bMajor\b|\bMinor\b|Augmented|Diminished|semitones?|half steps?/i);
  assert.match(generatedText("intervals.lesson-4-thirds"), /semitone|half step/i);
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

test("future-concept audit removes identified forward references across all later phases", () => {
  const phase2Lesson1 = lessonText("major-scales.lesson-1-formula");
  assert.doesNotMatch(phase2Lesson1, /\bscale degree\b|Roman numerals?|diatonic chords?|transposition|harmonic function/i);

  assert.doesNotMatch(lessonText("minor-scales.lesson-1-natural-formula"), /harmonic minor|melodic minor/i);
  assert.doesNotMatch(lessonText("minor-scales.lesson-3-harmonic-minor"), /dominant chord|dominant-to-tonic/i);
  assert.doesNotMatch(lessonText("diatonic-chords.lesson-10-own-progressions"), /chromatic harmony/i);
  assert.doesNotMatch(lessonText("relatives.lesson-1-relative-major-minor"), /cadences?/i);
  assert.doesNotMatch(lessonText("circle-of-fifths.lesson-2-close-vs-distant"), /pivot-chord|modulation theory/i);
});

test("all six phases remain present and ordered while dependency pass changes content only", () => {
  const phases = [phase1Lessons(), phase2Lessons(), phase3Lessons(), phase4Lessons(), phase5Lessons(), phase6Lessons()];
  assert.deepEqual(phases.map((lessons) => lessons.length), [10, 4, 5, 10, 4, 4]);
  assert.match(lessonText("major-scales.lesson-1-formula"), /scale is|tonic/i);
  assert.match(lessonText("relatives.lesson-1-relative-major-minor"), /relative natural minor.*same seven pitch classes.*same key signature/i);
  assert.match(lessonText("circle-of-fifths.lesson-1-what-it-represents"), /Circle of Fifths/i);
});

test("floating Back is viewport fixed, safe-area aware, mirrors eligible page-header Back, and reserves a non-overlap lane", () => {
  assert.match(indexHtml, /floating-back\.css/);
  assert.match(indexHtml, /floating-back\.js/);
  assert.match(floatingCss, /\.floating-back-control\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(floatingCss, /top:\s*calc\(env\(safe-area-inset-top\)\s*\+\s*10px\)/);
  assert.match(floatingCss, /\.floating-back-spacer\.is-active\s*\{[\s\S]*?height:\s*calc\(env\(safe-area-inset-top\)\s*\+\s*68px\)/);
  assert.match(floatingJs, /IntersectionObserver/);
  assert.match(floatingJs, /!entry\.isIntersecting\s*&&\s*sourceHasScrolledAboveViewport/);
  assert.match(floatingJs, /\["exitPractice",\s*"exitCheckpoint"\]/);
  assert.match(floatingJs, /header\.insertAdjacentElement\("afterend",\s*spacer\)/);
  assert.match(floatingJs, /setFloatingVisible\(shouldFloat\)/);
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

test("all 16 theme/accent combinations keep primary-button text readable", () => {
  const accents = ["red","green","purple","yellow","orange","blue","black","white"];
  for (const theme of ["light", "dark"]) {
    for (const accent of accents) {
      const vars = paletteVars(theme, accent);
      for (const endpoint of ["accent-button-start", "accent-button-end"]) {
        assert.ok(vars[endpoint], `${theme} + ${accent} missing ${endpoint}`);
        assert.ok(vars["accent-foreground"], `${theme} + ${accent} missing foreground`);
        assert.ok(contrast(vars["accent-foreground"], vars[endpoint]) >= 4.5, `${theme} + ${accent} ${endpoint} contrast`);
      }
    }
  }
});

test("Yellow, White, and Black edge cases have deliberate contrast treatments", () => {
  const darkYellow = paletteVars("dark", "yellow");
  const lightYellow = paletteVars("light", "yellow");
  const lightWhite = paletteVars("light", "white");
  const darkBlack = paletteVars("dark", "black");
  assert.equal(darkYellow["accent-foreground"].toLowerCase(), "#241d06");
  assert.equal(lightYellow["accent-foreground"].toLowerCase(), "#241d06");
  assert.equal(lightWhite["accent-ink"].toLowerCase(), "#4f4941");
  assert.equal(darkBlack["accent-ink"].toLowerCase(), "#eef1f5");
  assert.match(appearanceCss, /data-theme="light"\]\[data-accent="white"\][^\n]*--accent-border:#8b8378/);
  assert.match(appearanceCss, /data-theme="dark"\]\[data-accent="black"\][^\n]*--accent-border:#697283/);
});

test("accent is centralized and semantic success/error colors are not reassigned", () => {
  assert.match(appearanceCss, /--accent-primary/);
  assert.match(appearanceCss, /--accent-strong/);
  assert.match(appearanceCss, /--accent-soft/);
  assert.match(appearanceCss, /--accent-border/);
  assert.match(appearanceCss, /--accent-foreground/);
  assert.match(appearanceCss, /--accent-ink/);
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