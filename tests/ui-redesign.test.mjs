import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { execFileSync } from "node:child_process";

const app = fs.readFileSync("web/app.js", "utf8");
const css = fs.readFileSync("web/styles.css", "utf8");
const html = fs.readFileSync("web/index.html", "utf8");

test("browser UI source parses after the redesign", () => {
  execFileSync(process.execPath, ["--check", "web/app.js"], { stdio: "pipe" });
});

test("design system is dark, tokenized, accented, responsive, and safe-area aware", () => {
  assert.match(css, /--bg:\s*#0b0d12/);
  assert.match(css, /--accent:\s*#8b7cff/);
  assert.match(css, /--surface:/);
  assert.match(css, /\.bottom-nav/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /@media \(min-width: 700px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /theme-color" content="#0b0d12"/);
});

test("main navigation is app-like and keeps settings/sign-out out of the permanent nav", () => {
  const navStart = app.indexOf("function bottomNavHtml");
  const navEnd = app.indexOf("function shellHtml", navStart);
  const nav = app.slice(navStart, navEnd);
  assert.match(nav, /Home/);
  assert.match(nav, /Learn/);
  assert.match(nav, /Profile/);
  assert.doesNotMatch(nav, /Settings/);
  assert.doesNotMatch(nav, /Sign out|Logout/i);
});

test("profile is compact, hides raw IDs, and uses a separate edit screen", () => {
  const start = app.indexOf("async function renderProfile");
  const end = app.indexOf("async function renderEditProfile", start);
  const profile = app.slice(start, end);
  assert.match(profile, /Overall progress/);
  assert.match(profile, /Mastered/);
  assert.match(profile, /Learning/);
  assert.match(profile, /Reviews/);
  assert.match(profile, /data-edit-profile/);
  assert.doesNotMatch(profile, /Profile ID|<code>/i);
  assert.match(app, /async function renderEditProfile/);
});

test("settings use grouped rows, human language, a normal toggle, and automatic persistence", () => {
  assert.match(app, /settings-title">Learning/);
  assert.match(app, /settings-title">Account/);
  assert.match(app, /Require Previous Lessons/);
  assert.match(app, /Complete lessons in order before later lessons unlock/);
  assert.match(app, /Your actual completion and mastery progress will not change/);
  assert.match(app, /toggle\.addEventListener\("change"/);
  assert.match(app, /await repo\.upsertSettings\(next\)/);
  assert.match(app, /Saved/);
});

test("curriculum has compact phase navigation and focused phase detail screens", () => {
  assert.match(app, /class="phase-card/);
  assert.match(app, /async function renderPhase/);
  assert.match(app, /Phase progress/);
  assert.match(app, /class="lesson-row/);
  assert.doesNotMatch(app, /🔒/);
});

test("lesson and question flows use focused study layouts with inline feedback", () => {
  assert.match(app, /class="lesson-content"/);
  assert.match(app, /class="question-shell"/);
  assert.match(app, /Question \$\{state\.itemIndex \+ 1\} of/);
  assert.match(app, /feedback-detail/);
  assert.match(app, /f\.detail/);
});
