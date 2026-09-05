import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [indexHtml, dockCss, mountJs, appJs, referenceCss] = await Promise.all([
  readFile(new URL("../web/index.html", import.meta.url), "utf8"),
  readFile(new URL("../web/persistent-floating-dock.css", import.meta.url), "utf8"),
  readFile(new URL("../web/persistent-nav-dock.js", import.meta.url), "utf8"),
  readFile(new URL("../web/app-block8.js", import.meta.url), "utf8"),
  readFile(new URL("../web/reference-visual-system.css", import.meta.url), "utf8"),
]);

test("persistent dock layers load last", () => {
  const homeCorrection = indexHtml.indexOf("home-layout-correction.css");
  const dockCssIndex = indexHtml.indexOf("persistent-floating-dock.css");
  const referenceUi = indexHtml.indexOf("reference-ui.js");
  const mountScript = indexHtml.indexOf("persistent-nav-dock.js");

  assert.ok(homeCorrection >= 0);
  assert.ok(dockCssIndex > homeCorrection, "final dock CSS must override earlier bottom-nav rules");
  assert.ok(referenceUi >= 0);
  assert.ok(mountScript > referenceUi, "dock promotion should observe the final rendered app shell");
});

test("dock is fixed to the viewport and floats above the iPhone safe area", () => {
  assert.match(dockCss, /\.bottom-nav\s*\{[\s\S]*?position:\s*fixed;/);
  assert.match(dockCss, /bottom:\s*calc\(env\(safe-area-inset-bottom\)\s*\+\s*var\(--floating-dock-edge-gap\)\)/);
  assert.match(dockCss, /width:\s*min\([\s\S]*?560px[\s\S]*?floating-dock-side-gap/);
  assert.match(dockCss, /border-radius:\s*24px/);
  assert.match(dockCss, /backdrop-filter:\s*blur\(24px\)/);
});

test("page content reserves dock, safe-area, edge gap, and clearance", () => {
  assert.match(dockCss, /\.app-shell\s*\{[\s\S]*?padding-bottom:\s*calc\([\s\S]*?--floating-dock-height[\s\S]*?safe-area-inset-bottom[\s\S]*?--floating-dock-edge-gap[\s\S]*?--floating-dock-content-clearance/);
  assert.match(dockCss, /scroll-padding-bottom:\s*calc\(/);
  assert.match(dockCss, /100dvh/);
});

test("shared nav is promoted out of the transformed screen containing block", () => {
  assert.match(referenceCss, /\.screen\s*\{\s*animation:\s*reference-screen-in/);
  assert.match(referenceCss, /transform:\s*translateY\(/);
  assert.match(mountJs, /if \(dock\.parentElement !== app\)/);
  assert.match(mountJs, /app\.append\(dock\)/);
  assert.match(mountJs, /new MutationObserver\(scheduleDockMount\)/);
});

test("only one primary-nav template exists and duplicate rendered docks are removed", () => {
  const templates = appJs.match(/<nav class=\"bottom-nav\"/g) ?? [];
  assert.equal(templates.length, 1, "the shared shell should define exactly one primary-nav template");
  assert.match(mountJs, /candidate !== dock/);
  assert.match(mountJs, /candidate\.remove\(\)/);
});

test("active tab mapping remains Home, Learn, and Profile", () => {
  assert.match(appJs, /active === \"home\" \? \"active\"/);
  assert.match(appJs, /\[\"learn\",\"lesson\",\"practice\",\"checkpoint\",\"placement\"\]\.includes\(active\)/);
  assert.match(appJs, /\[\"profile\",\"settings\",\"edit-profile\"\]\.includes\(active\)/);
});

test("focused lesson screens can still intentionally suppress main navigation", () => {
  assert.match(appJs, /function shell\(content, active = state\.screen, showNav = true\)/);
  assert.match(appJs, /shell\([\s\S]*?\"learn\", false\)/);
});
