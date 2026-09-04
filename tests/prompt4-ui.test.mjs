import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("web/app.js", "utf8");
const css = fs.readFileSync("web/styles.css", "utf8");
const skills = fs.readFileSync("src/curriculum/skills.ts", "utf8");

test("display titles are short UI aliases while stable internal skill ids remain unchanged", () => {
  assert.match(app, /"interval\.quality-system": "Interval Quality"/);
  assert.match(app, /"guitar\.triads": "Triads on Guitar"/);
  assert.match(skills, /s\("interval\.quality-system", 1, "Perfect\/major\/minor\/augmented\/diminished quality system"/);
});

test("long user-facing text wraps instead of overflowing cards", () => {
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /\.page-subtitle \{ white-space: normal/);
  assert.match(css, /min-width: 0/);
});

test("Profile removes the standalone T brand and Recent Activity feed without deleting history infrastructure", () => {
  assert.match(app, /topbarHtml\("Profile", \{ eyebrow: "Your learning", hideLeading: true \}\)/);
  assert.doesNotMatch(app, /<span>Recent activity<\/span>/i);
  assert.doesNotMatch(app, /repo\.recentSessions\(USER_ID, 4\)/);
  assert.match(app, /service\.submitAttempt/);
});

test("Settings stays grouped and autosaves the access-only prerequisite toggle", () => {
  assert.match(app, /settings-title">Learning/);
  assert.match(app, /settings-title">Account/);
  assert.match(app, /await repo\.upsertSettings\(next\)/);
  assert.match(app, /Your actual completion and mastery progress will not change/);
});

test("browser history routing and logical Back targets are wired for deep screens", () => {
  assert.match(app, /window\.addEventListener\("popstate"/);
  assert.match(app, /syncRoute\(`study:\$\{item\.skillId\}`/);
  assert.match(app, /syncRoute\(`assessment:\$\{routeAssessment\.kind\}:\$\{routeAssessment\.phase\}`/);
  assert.match(app, /return goBack\(target\)\.catch\(showFatal\)/);
});

test("lesson teaching has reusable piano, inversion, circle, and fretboard visuals", () => {
  assert.match(app, /function pianoKeyboardHtml/);
  assert.match(app, /function inversionDiagramHtml/);
  assert.match(app, /function circleOfFifthsHtml/);
  assert.match(app, /function fretboardDiagramHtml/);
  assert.match(app, /lessonVisualHtml\(skill, page\)/);
  const practiceStart = app.indexOf("function renderPractice()");
  const practiceEnd = app.indexOf("function actionButtons", practiceStart);
  assert.ok(practiceStart >= 0 && practiceEnd > practiceStart);
  const practiceSource = app.slice(practiceStart, practiceEnd);
  assert.doesNotMatch(practiceSource, /lessonVisualHtml\(/);
});

test("Phase 0 remains absent from the active curriculum", () => {
  assert.doesNotMatch(skills, /phase\s*0|Phase 0|,\s*0,\s*"/);
});
