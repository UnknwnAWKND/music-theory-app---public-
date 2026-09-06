import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  PULL_REFRESH_ROUTES,
  PULL_REFRESH_DISABLED_ROUTES,
  PULL_THRESHOLD_PX,
  TOP_SCROLL_TOLERANCE_PX,
  appRoute,
  canStartPullRefresh,
  pullGestureMetrics,
  pullRefreshSupported,
} from "../web/pull-to-refresh-core.js";

const [indexHtml, ptrJs, ptrCss, dockCss] = await Promise.all([
  readFile(new URL("../web/index.html", import.meta.url), "utf8"),
  readFile(new URL("../web/pull-to-refresh.js", import.meta.url), "utf8"),
  readFile(new URL("../web/pull-to-refresh.css", import.meta.url), "utf8"),
  readFile(new URL("../web/persistent-floating-dock.css", import.meta.url), "utf8"),
]);

test("pull-to-refresh assets load after the existing render/navigation layers", () => {
  assert.match(indexHtml, /pull-to-refresh\.css/);
  assert.match(indexHtml, /pull-to-refresh\.js/);
  assert.ok(indexHtml.indexOf("pull-to-refresh.css") > indexHtml.indexOf("usage-correction-pass.css"));
  assert.ok(indexHtml.indexOf("pull-to-refresh.js") > indexHtml.indexOf("practice-progression-corrections.js"));
});

test("only Home, Learn, and Profile are supported browsing routes", () => {
  assert.deepEqual(PULL_REFRESH_ROUTES, ["home", "learn", "profile"]);
  assert.equal(pullRefreshSupported("home"), true);
  assert.equal(pullRefreshSupported("learn"), true);
  assert.equal(pullRefreshSupported("profile"), true);
  for (const route of PULL_REFRESH_DISABLED_ROUTES) assert.equal(pullRefreshSupported(route), false);
  assert.equal(appRoute("#/lesson/intervals.lesson-1-unison-octave"), "lesson");
  assert.equal(appRoute("#/profile"), "profile");
});

test("refresh can begin at the visual top with a small iPhone scroll-position tolerance", () => {
  assert.equal(TOP_SCROLL_TOLERANCE_PX, 4);
  assert.equal(canStartPullRefresh({ route: "home", scrollTop: 0 }), true);
  assert.equal(canStartPullRefresh({ route: "home", scrollTop: 4 }), true);
  assert.equal(canStartPullRefresh({ route: "home", scrollTop: 5 }), false);
  assert.equal(canStartPullRefresh({ route: "home", scrollTop: 12 }), false);
  assert.equal(canStartPullRefresh({ route: "learn", scrollTop: 0, interactive: true }), false);
  assert.equal(canStartPullRefresh({ route: "profile", scrollTop: 0, refreshing: true }), false);
  assert.equal(canStartPullRefresh({ route: "profile", scrollTop: 0, touchCount: 2 }), false);
  assert.equal(canStartPullRefresh({ route: "practice", scrollTop: 0 }), false);
});

test("gesture threshold is easier to reach while remaining intentional and vertical", () => {
  assert.equal(PULL_THRESHOLD_PX, 64);
  const below = pullGestureMetrics(10, 100, 12, 100 + PULL_THRESHOLD_PX - 1);
  assert.equal(below.ready, false);
  const ready = pullGestureMetrics(10, 100, 12, 100 + PULL_THRESHOLD_PX + 4);
  assert.equal(ready.ready, true);
  assert.equal(ready.directionValid, true);
  const sideways = pullGestureMetrics(10, 100, 120, 150);
  assert.equal(sideways.directionValid, false);
  assert.equal(sideways.rawDistance, 0);
});

test("ordinary CTA buttons do not block pull-to-refresh, but drag/input controls still do", () => {
  const selectorBlock = ptrJs.match(/const INTERACTIVE_SELECTOR = \[[\s\S]*?\]\.join\(", "\);/)?.[0] ?? "";
  assert.ok(selectorBlock);
  assert.doesNotMatch(selectorBlock, /^|[\s,]"button"/);
  assert.match(selectorBlock, /input/);
  assert.match(selectorBlock, /role='slider'/);
  assert.match(selectorBlock, /role='switch'/);
  assert.match(selectorBlock, /bottom-nav/);
  assert.match(selectorBlock, /floating-back-control/);
});

test("iPhone touch handling uses non-passive capture listeners so Safari overscroll can be cancelled", () => {
  assert.match(ptrJs, /document\.addEventListener\("touchstart", beginGesture, \{ passive: false, capture: true \}\)/);
  assert.match(ptrJs, /document\.addEventListener\("touchmove", moveGesture, \{ passive: false, capture: true \}\)/);
  assert.match(ptrJs, /metrics\.dy > 2 && event\.cancelable/);
  assert.match(ptrJs, /event\.preventDefault\(\)/);
});

test("refresh is data-only and never hard reloads or writes learning state", () => {
  assert.doesNotMatch(ptrJs, /location\.reload|window\.location\.reload|document\.location\.reload/);
  assert.match(ptrJs, /allSkillStates/);
  assert.match(ptrJs, /allLessonProgress/);
  assert.match(ptrJs, /phaseProgress/);
  assert.match(ptrJs, /dueReviews/);
  assert.match(ptrJs, /user_profiles/);
  assert.doesNotMatch(ptrJs, /submitAttempt|markLessonCompleted|upsertPhaseProgress|upsertSkillState|checkpointPassedAt\s*:/);
});

test("Profile preflight includes identity, avatar, auth-session, and progress data", () => {
  assert.match(ptrJs, /refreshSession\(\)/);
  assert.match(ptrJs, /select\("display_name,avatar_path"\)/);
  assert.match(ptrJs, /lesson_progress/);
  assert.match(ptrJs, /phase_progress/);
});

test("active lessons, assessments, settings, and edit/account forms stay outside pull refresh", () => {
  for (const route of ["lesson", "practice", "checkpoint", "placement", "settings", "edit-profile", "account-email", "account-password"]) {
    assert.ok(PULL_REFRESH_DISABLED_ROUTES.includes(route));
  }
  assert.match(ptrJs, /prevents Safari\/PWA native pull-to-refresh from hard-reloading in-progress state/);
});

test("duplicate refreshes are rejected and failures preserve the existing view before rerender", () => {
  assert.match(ptrJs, /if \(refreshing \|\| !pullRefreshSupported\(route\)\) return/);
  assert.match(ptrJs, /Read first so ordinary network failures leave the currently rendered screen untouched/);
  assert.match(ptrJs, /Couldn't refresh\. Try again\./);
});

test("indicator uses a recognizable refresh-arrow icon and appears with minimal pull distance", () => {
  assert.match(ptrJs, /ptr-refresh-icon/);
  assert.match(ptrJs, /<svg viewBox="0 0 24 24"/);
  assert.match(ptrJs, /visible: metrics\.rawDistance > 2/);
  assert.match(ptrCss, /\.ptr-refresh-icon/);
  assert.match(ptrCss, /stroke:\s*currentColor/);
});

test("indicator is safe-area aware, accent-aware, subtle, and not a full-screen overlay", () => {
  assert.match(ptrCss, /env\(safe-area-inset-top\)/);
  assert.match(ptrCss, /var\(--accent-primary\)/);
  assert.match(ptrCss, /border-radius:\s*999px/);
  assert.match(ptrCss, /overscroll-behavior-y:\s*none/);
  assert.doesNotMatch(ptrCss, /position:\s*fixed[\s\S]{0,220}inset:\s*0/);
});

test("persistent bottom dock remains viewport-fixed and independent of content pull", () => {
  assert.match(dockCss, /position:\s*fixed/);
  assert.match(dockCss, /safe-area-inset-bottom/);
  assert.match(ptrCss, /#app\.ptr-pulling \.screen-content/);
  assert.doesNotMatch(ptrCss, /\.bottom-nav\s*\{/);
});
