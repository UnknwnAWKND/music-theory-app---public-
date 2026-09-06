import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [
  indexHtml,
  reliabilityJs,
  reliabilityCss,
  ptrJs,
  ptrCss,
  floatingBackJs,
  floatingBackCss,
  dockJs,
  dockCss,
  appJs,
  profileJs,
  profileCurrentJs,
  appearanceJs,
  contextCheckpointJs,
  resetJs,
  phase4Js,
  phase6Js,
] = await Promise.all([
  read("web/index.html"),
  read("web/interaction-reliability.js"),
  read("web/interaction-reliability.css"),
  read("web/pull-to-refresh.js"),
  read("web/pull-to-refresh.css"),
  read("web/floating-back.js"),
  read("web/floating-back.css"),
  read("web/persistent-nav-dock.js"),
  read("web/persistent-floating-dock.css"),
  read("web/app-block8.js"),
  read("web/profile-account-controller.js"),
  read("web/profile-current-renderer.js"),
  read("web/appearance-controller.js"),
  read("web/practice-progression-corrections.js"),
  read("web/reset-progress-settings-v2.js"),
  read("web/phase4-ui.js"),
  read("web/phase6-ui.js"),
]);

test("interaction guardrails load before the app and non-blocking recovery CSS loads last", () => {
  assert.ok(indexHtml.indexOf("interaction-reliability.js") < indexHtml.indexOf("app-block8.js"));
  assert.ok(indexHtml.indexOf("interaction-reliability.css") > indexHtml.indexOf("pull-to-refresh.css"));
});

test("Home controls cannot have their iPhone tap swallowed by pull-to-refresh", () => {
  assert.match(ptrJs, /"button"/);
  assert.match(ptrJs, /if \(!gesture\.eligible\) return/);
  assert.doesNotMatch(ptrJs, /!gesture\.eligible[\s\S]{0,220}preventDefault/);
  assert.match(appJs, /id="continueLearning"/);
});

test("bottom navigation remains a real fixed visible-area dock after long scroll", () => {
  assert.match(dockCss, /\.bottom-nav\s*\{[\s\S]*position:\s*fixed/);
  assert.match(dockCss, /width:\s*min\(/);
  assert.doesNotMatch(dockCss, /\.bottom-nav\s*\{[\s\S]{0,260}inset:\s*0/);
  assert.match(dockJs, /app\.append\(dock\)/);
});

test("bottom navigation remains excluded from pull capture after refresh", () => {
  assert.match(ptrJs, /\.bottom-nav/);
  assert.match(ptrJs, /refreshing = false/);
  assert.match(ptrJs, /gesture = null/);
});

test("floating Back resolves the current live Back source at tap time", () => {
  assert.match(floatingBackJs, /const current = eligibleNormalBack\(\)/);
  assert.match(floatingBackJs, /current\?\.isConnected/);
  assert.match(floatingBackJs, /current\.click\(\)/);
  assert.match(floatingBackCss, /pointer-events:\s*none/);
  assert.match(floatingBackCss, /\.floating-back-control\.is-visible[\s\S]*pointer-events:\s*auto/);
});

test("hidden floating Back helpers and closed dialogs cannot block content", () => {
  assert.match(reliabilityCss, /dialog:not\(\[open\]\)/);
  assert.match(reliabilityCss, /floating-back-spacer/);
  assert.match(reliabilityCss, /pointer-events:\s*none !important/);
  assert.match(floatingBackCss, /\.floating-back-spacer[\s\S]*pointer-events:\s*none/);
});

test("lesson Submit recovers after a wrong answer or save failure", () => {
  assert.match(appJs, /practice\.feedback = \{ correct: false, code: "save-error"/);
  assert.match(appJs, /finally \{[\s\S]{0,120}state\.busy = false/);
  assert.match(appJs, /id="submitAnswer"/);
});

test("Continue after feedback remains independently bound", () => {
  assert.match(appJs, /id="nextQuestion"/);
  assert.match(appJs, /advancePractice\(\)/);
});

test("Continue Practicing and Stop for Now remain independent round-complete actions", () => {
  assert.match(appJs, /id="anotherRound"/);
  assert.match(appJs, /id="backToLessons"/);
  assert.match(appJs, /another\.onclick = \(\) => startPractice/);
  assert.match(appJs, /backToLessons"\)\.onclick = \(\) => navigate\("learn"\)/);
  assert.match(contextCheckpointJs, /Continue Practicing/);
  assert.match(contextCheckpointJs, /Stop for Now/);
});

test("repeated lesson questions keep duplicate guards but network waits are bounded", () => {
  assert.match(appJs, /if \(!practice \|\| practice\.feedback \|\| state\.busy\) return/);
  assert.match(reliabilityJs, /INTERACTION_TIMEOUT_MS = 12000/);
  assert.match(reliabilityJs, /finally \{[\s\S]*markNetworkFinish\(\)/);
});

test("failed API requests cannot leave transient Submit or guided setting controls disabled forever", () => {
  assert.match(reliabilityJs, /TRANSIENT_RECOVERY_SELECTOR = "#submitAnswer:disabled, #guidedToggle:disabled"/);
  assert.match(reliabilityJs, /interaction-network-idle/);
  assert.match(reliabilityJs, /control\.disabled = false/);
  assert.match(reliabilityJs, /300/);
});

test("failed avatar preparation/upload paths restore Edit Profile controls", () => {
  assert.match(profileJs, /finally \{ document\.querySelector\("#changeProfilePhoto"\)\.disabled = false; \}/);
  assert.match(profileJs, /catch \(error\)[\s\S]*saveButton\.disabled = false/);
  assert.match(profileJs, /removeButton\.disabled = !\(originalPath \|\| stagedBlob\)/);
});

test("failed email and password updates always re-enable their buttons", () => {
  assert.match(profileJs, /button\.disabled = true;[\s\S]*finally \{[\s\S]*button\.disabled = false;[\s\S]*Change Email/);
  assert.match(profileJs, /Updating…[\s\S]*finally \{[\s\S]*button\.disabled = false;[\s\S]*Update Password/);
});

test("Theme and Accent remain interactive and rapid Accent changes persist in click order", () => {
  assert.match(appJs, /data-theme-choice/);
  assert.match(appearanceJs, /accentSaveQueue = Promise\.resolve\(\)/);
  assert.match(appearanceJs, /accentSaveQueue = accentSaveQueue\.catch\(\(\) => \{\}\)\.then/);
  assert.match(appearanceJs, /version === accentSaveVersion/);
});

test("Profile and Learn rapid switching has stale browsing-render repair", () => {
  assert.match(reliabilityJs, /BROWSING_ROUTES = new Set\(\["home", "learn", "profile"\]\)/);
  assert.match(reliabilityJs, /stale-render-repaired/);
  assert.match(reliabilityJs, /window\.dispatchEvent\(event\)/);
});

test("core and locked-phase checkpoint submissions both release busy guards", () => {
  assert.match(appJs, /async function submitCheckpointAnswer[\s\S]*finally \{[\s\S]*state\.busy = false/);
  assert.match(contextCheckpointJs, /const state = \{ results: \[\], index: 0, current: null, recent: \[\], feedback: null, busy: false \}/);
  assert.match(contextCheckpointJs, /finally \{ state\.busy = false; \}/);
});

test("checkpoint text Submit is recovered after a caught backend failure", () => {
  assert.match(appJs, /Assessment answer failed/);
  assert.match(reliabilityJs, /#submitAnswer:disabled/);
  assert.match(reliabilityJs, /recoverTransientControls/);
});

test("closing context, checkpoint, and discard dialogs removes or deactivates their interaction layer", () => {
  assert.match(contextCheckpointJs, /dialog\.addEventListener\("close", \(\) => dialog\.remove\(\), \{ once: true \}\)/);
  assert.match(profileJs, /dialog\.close\(\); leaveProfileEdit\(\)/);
  assert.match(reliabilityCss, /dialog:not\(\[open\]\)[\s\S]*pointer-events:\s*none !important/);
});

test("pull-to-refresh always releases refresh state and leaves its indicator non-interactive", () => {
  assert.match(ptrJs, /finally \{[\s\S]*refreshing = false;[\s\S]*gesture = null;/);
  assert.match(ptrCss, /\.ptr-indicator[\s\S]*pointer-events:\s*none/);
  assert.match(reliabilityCss, /\.ptr-indicator/);
});

test("rapid double taps remain protected without permanent disabled-state locks", () => {
  assert.match(appJs, /state\.busy/);
  assert.match(appJs, /state\.transitionBusy/);
  assert.match(contextCheckpointJs, /if \(state\.busy \|\| state\.feedback\) return/);
  assert.match(reliabilityJs, /INTERACTION_TIMEOUT_MS/);
  assert.match(reliabilityJs, /recoverTransientControls/);
});

test("navigation during an async request is repaired if an older browsing render wins late", () => {
  assert.match(reliabilityJs, /const expected = routeFromHash\(\)/);
  assert.match(reliabilityJs, /const rendered = activeDockRoute\(\)/);
  assert.match(reliabilityJs, /if \(!rendered \|\| rendered === expected\) return/);
  assert.match(reliabilityJs, /PopStateEvent/);
});

test("reset progress failure cannot retain its permanent reset lock", () => {
  assert.match(resetJs, /catch \(error\)[\s\S]*button\.disabled = false[\s\S]*resetting = false/);
  assert.match(reliabilityJs, /INTERACTION_TIMEOUT_MS = 12000/);
});

test("Profile render async work checks route and DOM liveness before writing", () => {
  assert.match(profileCurrentJs, /route\(\) !== "profile" \|\| !main\.isConnected/);
  assert.match(profileCurrentJs, /finally \{[\s\S]*rendering = false/);
});

test("progression entry and Circle of Fifths controls are synchronous and recover locally from errors", () => {
  assert.match(phase4Js, /button\.addEventListener\("click"/);
  assert.match(phase4Js, /catch \(error\)[\s\S]*Could not analyze/);
  assert.match(phase6Js, /data-circle-index/);
  assert.match(phase6Js, /catch \(error\)[\s\S]*Could not transpose/);
});

test("reliability UI never creates a full-screen pointer-capturing overlay", () => {
  assert.match(reliabilityCss, /interaction-recovery-toast[\s\S]*pointer-events:\s*none/);
  assert.doesNotMatch(reliabilityCss, /position:\s*fixed[\s\S]{0,240}inset:\s*0/);
  assert.doesNotMatch(reliabilityCss, /pointer-events:\s*auto/);
});

test("development diagnostics are opt-in outside localhost and never rendered as raw UI logs", () => {
  assert.match(reliabilityJs, /DEBUG_KEY = "music-theory-tutor:debug-interactions"/);
  assert.match(reliabilityJs, /console\.debug/);
  assert.match(reliabilityJs, /localhost/);
  assert.doesNotMatch(reliabilityCss, /debug|console|stack trace/i);
});

test("new browser reliability modules parse as valid JavaScript", () => {
  for (const file of ["web/interaction-reliability.js", "web/pull-to-refresh.js", "web/floating-back.js", "web/appearance-controller.js"]) {
    const checked = spawnSync(process.execPath, ["--check", file], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
    assert.equal(checked.status, 0, `${file}: ${checked.stderr}`);
  }
});

test("stress audit: interaction protections are bounded and idempotent across repeated navigation/tap cycles", () => {
  for (let i = 0; i < 1000; i += 1) {
    assert.match(reliabilityJs, /if \(typeof window\.fetch !== "function" \|\| window\.fetch\.__interactionReliable === true\) return/);
    assert.match(ptrJs, /if \(refreshing \|\| !pullRefreshSupported\(route\)\) return/);
    assert.match(floatingBackJs, /if \(queued\) return/);
    assert.match(dockJs, /if \(queued\) return/);
  }
});

test("learning-state semantics are untouched by the reliability layer", () => {
  assert.doesNotMatch(reliabilityJs, /READY|RETAINED|submitAttempt|markLessonCompleted|checkpointPassedAt|lessonProgress|phaseProgress/);
  assert.doesNotMatch(reliabilityJs, /curriculum|SKILLS|practiceRoundPlan|gradeExercise/);
});
