import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [dockJs, profileController] = await Promise.all([
  readFile(new URL("../web/persistent-nav-dock.js", import.meta.url), "utf8"),
  readFile(new URL("../web/profile-account-controller.js", import.meta.url), "utf8"),
]);

test("promoted Profile deep dock leaves an ignored shell sentinel to prevent remount loops", () => {
  assert.match(profileController, /shell\.querySelector\("\.bottom-nav"\)/);
  assert.match(dockJs, /profile-dock-anchor/);
  assert.match(dockJs, /\.bottom-nav:not\(\.profile-dock-anchor\)/);
  assert.match(dockJs, /anchor\.className = "bottom-nav profile-dock-anchor"/);
  assert.match(dockJs, /anchor\.hidden = true/);
  assert.match(dockJs, /ensureProfileDockAnchor\(dock\)/);
});

test("the real dock is still promoted to app for viewport-fixed mobile behavior", () => {
  assert.match(dockJs, /if \(dock\.parentElement !== app\)/);
  assert.match(dockJs, /app\.append\(dock\)/);
});
