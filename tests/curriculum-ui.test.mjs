import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("web/app.js", "utf8");
const css = fs.readFileSync("web/styles.css", "utf8");
const lessons = fs.readFileSync("src/practice/lessons.ts", "utf8");

test("curriculum roadmap is visible without becoming a skip menu", () => {
  assert.match(app, /View full curriculum/);
  assert.match(app, /See the whole path/);
  assert.match(app, /not a skip menu/i);
  assert.match(app, /prerequisites\.every/);
});

test("app is dark-only", () => {
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /background:\s*#0b0c0f/);
  assert.doesNotMatch(css, /prefers-color-scheme:\s*light/i);
});

test("first theory lesson teaches enharmonic notes simply", () => {
  assert.match(lessons, /Sometimes the same piano key has two different note names/);
  assert.match(lessons, /C♯ and D♭ are the same black key on the piano/);
  assert.doesNotMatch(lessons, /The new idea here is enharmonic spelling/);
});
