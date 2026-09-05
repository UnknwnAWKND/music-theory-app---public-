import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [indexHtml, tokensCss, visualCss, referenceUi, appJs, lessonUi, finalUi] = await Promise.all([
  read("web/index.html"),
  read("web/reference-tokens.css"),
  read("web/reference-visual-system.css"),
  read("web/reference-ui.js"),
  read("web/app-block8.js"),
  read("web/lesson-ui.js"),
  read("web/final-ui.js"),
]);

test("reference visual system loads after the legacy design system without replacing the production app", () => {
  assert.match(indexHtml, /design-system\.css[\s\S]*reference-visual-system\.css[\s\S]*reference-tokens\.css/);
  assert.match(indexHtml, /app-block8\.js[\s\S]*reference-ui\.js/);
  assert.doesNotMatch(indexHtml, /app\.js"/);
});

test("dark-mode core colors match the premium navy and violet reference direction", () => {
  assert.match(tokensCss, /--bg-primary:\s*#090e19/);
  assert.match(tokensCss, /--surface:\s*#111a29/);
  assert.match(tokensCss, /--surface-raised:\s*#162135/);
  assert.match(tokensCss, /--text-primary:\s*#f7f8fc/);
  assert.match(tokensCss, /--accent-primary:\s*#8b6cff/);
  assert.match(tokensCss, /--success:\s*#63d3a0/);
  assert.match(tokensCss, /--progress:\s*#7391ff/);
  assert.match(tokensCss, /--gold:\s*#d1aa63/);
  assert.match(tokensCss, /--error:\s*#f07e89/);
});

test("light mode keeps the same system on a warm beige foundation", () => {
  assert.match(tokensCss, /html\[data-theme="light"\][\s\S]*--bg-primary:\s*#f4efe6/);
  assert.match(tokensCss, /html\[data-theme="light"\][\s\S]*--surface:\s*#fbf8f2/);
  assert.match(tokensCss, /html\[data-theme="light"\][\s\S]*--accent-primary:\s*#6f59d9/);
  assert.match(tokensCss, /--piano-white:\s*#ffffff/);
  assert.doesNotMatch(tokensCss, /--bg-primary:\s*#ffffff/);
});

test("spacing, radii, safe areas, responsive widths, and reduced motion are centralized", () => {
  for (const value of ["4px", "8px", "12px", "16px", "20px", "24px", "32px", "40px", "48px"]) assert.ok(tokensCss.includes(value));
  for (const value of ["10px", "14px", "22px", "28px"]) assert.ok(tokensCss.includes(value));
  assert.match(visualCss, /safe-area-inset-top/);
  assert.match(visualCss, /safe-area-inset-bottom/);
  assert.match(visualCss, /@media \(max-width: 420px\)/);
  assert.match(visualCss, /@media \(min-width: 700px\)/);
  assert.match(visualCss, /prefers-reduced-motion:\s*reduce/);
});

test("home uses a theory-oriented piano treatment and no giant music-note artwork", () => {
  assert.match(visualCss, /\.home-focus::after[\s\S]*repeating-linear-gradient/);
  assert.match(referenceUi, /Build your foundation\. Play with confidence\./);
  assert.match(referenceUi, /is-reviews/);
  assert.match(referenceUi, /is-progress/);
  assert.match(referenceUi, /is-curriculum/);
  assert.doesNotMatch(`${visualCss}\n${referenceUi}`, /[♪♫♬♩]|giant music note|music-note/i);
});

test("user-facing copy remains functional rather than marketing-style", () => {
  const combined = `${referenceUi}\n${indexHtml}`;
  for (const phrase of [
    "Learn. Hear. Create. Grow.",
    "Every note moves you forward",
    "stronger you",
    "Theory fuels freedom",
    "inner musician",
    "musical journey",
    "Better musicians, happier humans",
  ]) assert.equal(combined.toLowerCase().includes(phrase.toLowerCase()), false, phrase);
  assert.match(referenceUi, /Sign in to continue your learning\./);
  assert.match(referenceUi, /A spaced review is ready\./);
});

test("teaching, questions, feedback, settings, auth, loading, and error surfaces share the reference component system", () => {
  for (const selector of [
    ".lesson-content",
    ".practice-card",
    ".feedback.correct",
    ".feedback.incorrect",
    ".settings-group",
    ".auth-card",
    ".loading-skeleton",
    ".error-panel",
    ".bottom-nav",
    ".piano-visual",
    ".circle-key",
  ]) assert.ok(visualCss.includes(selector), selector);
  assert.match(referenceUi, /KNOW THIS AUTOMATICALLY/);
});

test("the redesign layer does not import or mutate learning-engine state", () => {
  assert.doesNotMatch(referenceUi, /core\/index|TutorService|Fsrs|submitAttempt|markLessonCompleted|phaseCoreReady|placementDefinition/);
  assert.match(appJs, /lessonCompletionEligibleAfterRound/);
  assert.match(appJs, /guidedLessonUnlocked/);
  assert.match(appJs, /phaseCoreReady/);
  assert.match(appJs, /placementDefinition/);
  assert.match(appJs, /requirePreviousLessons/);
  assert.match(appJs, /firstSubmission:\s*true/);
  assert.match(appJs, /dueReviews/);
  assert.match(appJs, /renderPracticeRoundCounter\(counterAnswered, practice\.roundSize, practice\.roundNumber\)/);
});

test("lesson replay and Skip to Review remain intact and no hints are introduced", () => {
  assert.match(lessonUi, /Skip to Review/);
  assert.match(lessonUi, /canSkipToReview/);
  assert.match(appJs, /skip-review/);
  assert.doesNotMatch(`${referenceUi}\n${visualCss}`, /\bhint\b/i);
  assert.match(finalUi, /guidedLessonUnlocked/);
});

test("reference UI module parses as valid JavaScript", () => {
  execFileSync(process.execPath, ["--check", new URL("../web/reference-ui.js", import.meta.url).pathname], { stdio: "pipe" });
});
