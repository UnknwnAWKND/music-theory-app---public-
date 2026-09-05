import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [indexHtml, cleanupJs, cleanupCss, dockCss] = await Promise.all([
  readFile(new URL("../web/index.html", import.meta.url), "utf8"),
  readFile(new URL("../web/home-ui-cleanup.js", import.meta.url), "utf8"),
  readFile(new URL("../web/home-hero-cleanup.css", import.meta.url), "utf8"),
  readFile(new URL("../web/persistent-floating-dock.css", import.meta.url), "utf8"),
]);

test("focused Home cleanup loads after the persistent dock layer", () => {
  const dock = indexHtml.indexOf("persistent-floating-dock.css");
  const home = indexHtml.indexOf("home-hero-cleanup.css");
  assert.ok(dock >= 0);
  assert.ok(home > dock);
  assert.match(indexHtml, /home-ui-cleanup\.js/);
});

test("redundant Home curriculum card is removed from the rendered Home screen", () => {
  assert.match(cleanupJs, /querySelector\("#openCurriculum"\)/);
  assert.match(cleanupJs, /closest\("\.home-secondary-card"\)/);
  assert.match(cleanupJs, /curriculumCard\.remove\(\)/);
  assert.doesNotMatch(cleanupJs, /append|insertAdjacentHTML|createElement/);
});

test("Home remains only hero plus the two learning summary stat cards", () => {
  assert.match(cleanupCss, /\.home-secondary-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/);
  assert.doesNotMatch(cleanupCss, /motivational|quote|badge|curriculum summary/i);
});

test("hero piano is softly embedded instead of a hard rectangular block", () => {
  assert.match(cleanupCss, /\.home-focus::after\s*\{[\s\S]*?repeating-linear-gradient/);
  assert.match(cleanupCss, /\.home-focus::after\s*\{[\s\S]*?mask-image:\s*radial-gradient/);
  assert.match(cleanupCss, /\.home-focus::after\s*\{[\s\S]*?perspective\(620px\)/);
  assert.match(cleanupCss, /\.home-focus::before\s*\{[\s\S]*?filter:\s*blur\(5px\)/);
});

test("persistent floating dock behavior remains intact", () => {
  assert.match(dockCss, /\.bottom-nav\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(dockCss, /bottom:\s*calc\(env\(safe-area-inset-bottom\)/);
  assert.match(dockCss, /border-radius:\s*24px/);
  assert.match(dockCss, /padding-bottom:\s*calc\([\s\S]*?floating-dock-height[\s\S]*?safe-area-inset-bottom/);
});
