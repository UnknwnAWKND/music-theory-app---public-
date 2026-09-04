import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("web/app.js", "utf8");
const css = fs.readFileSync("web/styles.css", "utf8");
const lessons = fs.readFileSync("src/practice/lessons.ts", "utf8");

test("curriculum roadmap keeps prerequisite locking by default and supports explicit access-only unlocking", () => {
  assert.match(app, /See the whole path/);
  assert.match(app, /async function renderPhase/);
  assert.match(app, /requirePreviousLessons:\s*true/);
  assert.match(app, /function curriculumAccessAllowed/);
  assert.match(app, /userSettings\?\.requirePreviousLessons === false/);
  assert.match(app, /prerequisites\.every/);
  assert.match(app, /You can open any lesson/);
  assert.match(app, /This changes access only/i);
});

test("app keeps a tokenized dark-only design", () => {
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /--bg:\s*#0b0d12/);
  assert.match(css, /--surface:/);
  assert.match(css, /--accent:\s*#8b7cff/);
  assert.doesNotMatch(css, /prefers-color-scheme:\s*light/i);
});

test("Phase 1 introduces required enharmonic vocabulary without a separate Phase 0 lesson", () => {
  assert.match(app, /\["Enharmonic",\s*"Two note names that use the same piano key and make the same sound\./);
  assert.match(app, /C♯ and D♭ are enharmonic names for the same black key/);
  assert.match(lessons, /F♯ up a major 3rd is A♯, not B♭/);
  assert.doesNotMatch(app, /Phase 0/);
  assert.doesNotMatch(lessons, /"pitch\.accidentals"|"pitch\.half-whole"/);
});
