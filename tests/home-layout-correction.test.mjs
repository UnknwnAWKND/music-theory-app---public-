import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [indexHtml, baseCss, correctionCss, appJs] = await Promise.all([
  readFile(new URL("../web/index.html", import.meta.url), "utf8"),
  readFile(new URL("../web/styles.css", import.meta.url), "utf8"),
  readFile(new URL("../web/home-layout-correction.css", import.meta.url), "utf8"),
  readFile(new URL("../web/app-block8.js", import.meta.url), "utf8"),
]);

test("Home correction stylesheet loads after the reference visual layers", () => {
  const tokens = indexHtml.indexOf("reference-tokens.css");
  const correction = indexHtml.indexOf("home-layout-correction.css");
  assert.ok(tokens >= 0, "reference tokens should still be loaded");
  assert.ok(correction > tokens, "layout correction must load last so structural fixes win the cascade");
});

test("primary navigation is a true fixed bottom dock", () => {
  assert.match(baseCss, /\.bottom-nav\s*\{[\s\S]*?position:\s*fixed;/);
  assert.match(correctionCss, /\.bottom-nav\s*\{[\s\S]*?bottom:\s*0;/);
  assert.match(correctionCss, /\.bottom-nav\s*\{[\s\S]*?env\(safe-area-inset-bottom\)/);
  assert.doesNotMatch(correctionCss, /bottom:\s*max\([^;]*safe-area-inset-bottom/);
});

test("shared page shell reserves the full dock and safe-area footprint", () => {
  assert.match(correctionCss, /--bottom-dock-core-height:\s*84px/);
  assert.match(correctionCss, /--bottom-dock-clearance:\s*24px/);
  assert.match(correctionCss, /\.app-shell\s*\{[\s\S]*?padding-bottom:\s*calc\([\s\S]*?--bottom-dock-core-height[\s\S]*?safe-area-inset-bottom[\s\S]*?--bottom-dock-clearance/);
  assert.match(correctionCss, /100dvh/);
});

test("Home keeps the approved two-stat and full-width curriculum hierarchy on phones", () => {
  assert.match(correctionCss, /@media \(max-width:\s*699px\)[\s\S]*?\.home-secondary-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/);
  assert.match(correctionCss, /@media \(max-width:\s*699px\)[\s\S]*?\.home-secondary-card\.is-curriculum\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1/);
  assert.match(correctionCss, /\.home-focus \.primary\s*\{[\s\S]*?width:\s*min\(70%,\s*490px\)/);
});

test("Home, Learn, and Profile still use the same shared navigation shell", () => {
  assert.match(appJs, /function shell\(content, active = state\.screen, showNav = true\)/);
  assert.match(appJs, /data-nav="home"/);
  assert.match(appJs, /data-nav="learn"/);
  assert.match(appJs, /data-nav="profile"/);
});
