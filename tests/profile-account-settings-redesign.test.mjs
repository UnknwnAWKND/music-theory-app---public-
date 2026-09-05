import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import test from "node:test";

const [controller, css, indexHtml, appearanceController, appBlock8, migration, floatingBack, dockCss] = await Promise.all([
  readFile(new URL("../web/profile-account-controller.js", import.meta.url), "utf8"),
  readFile(new URL("../web/profile-account-settings.css", import.meta.url), "utf8"),
  readFile(new URL("../web/index.html", import.meta.url), "utf8"),
  readFile(new URL("../web/appearance-controller.js", import.meta.url), "utf8"),
  readFile(new URL("../web/app-block8.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/202609052330_profile_avatar_storage.sql", import.meta.url), "utf8"),
  readFile(new URL("../web/floating-back.js", import.meta.url), "utf8"),
  readFile(new URL("../web/persistent-floating-dock.css", import.meta.url), "utf8"),
]);

function sourceBetween(startText, endText) {
  const start = controller.indexOf(startText);
  assert.ok(start >= 0, `missing ${startText}`);
  const end = controller.indexOf(endText, start);
  assert.ok(end > start, `missing ${endText}`);
  return controller.slice(start, end);
}

test("profile/account redesign assets load after the shared appearance and floating-back systems", () => {
  assert.ok(indexHtml.indexOf("profile-account-settings.css") > indexHtml.indexOf("floating-back.css"));
  assert.ok(indexHtml.indexOf("profile-account-controller.js") > indexHtml.indexOf("floating-back.js"));
});

test("new Profile hierarchy is identity, long-term progress, then one Settings entry", () => {
  const profile = sourceBetween("async function enhanceProfile()", "function settingsGroupByTitle");
  assert.match(profile, /profile-identity-card/);
  assert.match(profile, /display_name/);
  assert.match(profile, /loaded\.user\?\.email/);
  assert.match(profile, /Edit Profile/);
  assert.match(profile, /Overall Progress/);
  assert.match(profile, /Lessons Completed/);
  assert.match(profile, /Phases Completed/);
  assert.match(profile, /profileUxSettings/);
  assert.doesNotMatch(profile, />Sign Out</);
  assert.doesNotMatch(profile, />Current learning</i);
  assert.match(profile, /current-learning-final.*hidden/);
});

test("Profile progress is calculated only from persisted lesson completion and checkpoint completion", () => {
  const metrics = sourceBetween("export function profileProgressMetrics", "function friendlyError");
  assert.match(metrics, /contentKind !== "reference"/);
  assert.match(metrics, /completion_count.*completionCount/);
  assert.match(metrics, /completedLessons \/ lessonTotal/);
  assert.match(metrics, /checkpoint_passed_at.*checkpointPassedAt/);
  assert.match(metrics, /phaseBreakdown/);
  assert.doesNotMatch(metrics, /ready|retained|evidence|attempt/i);
});

test("Edit Profile Back and Cancel share discard-aware navigation and never imply Save", () => {
  const edit = sourceBetween("async function enhanceEditProfile()", "async function enhance()");
  assert.match(edit, /id="profileEditBack"/);
  assert.match(edit, /id="cancelProfileEdit"/);
  assert.match(edit, /Discard changes\?/);
  assert.match(edit, /profileEditBack.*requestExit/s);
  assert.match(edit, /cancelProfileEdit.*requestExit/s);
  assert.match(edit, /if \(!dirty\(\)\) return leaveProfileEdit\(\)/);
  assert.match(edit, /location\.hash = "#\/profile"/);
});

test("unsaved photo/name changes remain staged until Save Changes is submitted", () => {
  const edit = sourceBetween("async function enhanceEditProfile()", "async function enhance()");
  const submitIndex = edit.indexOf('profileIdentityForm")?.addEventListener("submit"');
  const uploadIndex = edit.indexOf(".upload(nextPath, stagedBlob");
  const profileWriteIndex = edit.indexOf('.from("user_profiles").upsert');
  assert.ok(submitIndex >= 0 && uploadIndex > submitIndex && profileWriteIndex > submitIndex);
  assert.match(edit, /stagedBlob = blob/);
  assert.match(edit, /stagedRemove = true/);
  assert.match(edit, /Save Changes/);
  assert.match(edit, /disabled>Save Changes/);
});

test("avatar can upload, replace, remove, and reload through a private signed URL", () => {
  assert.match(controller, /createSignedUrl\(path, 3600\)/);
  assert.match(controller, /storage\.from\(AVATAR_BUCKET\)\.upload\(nextPath, stagedBlob, \{ contentType: "image\/webp", cacheControl: "3600", upsert: true \}\)/);
  assert.match(controller, /storage\.from\(AVATAR_BUCKET\)\.remove\(\[originalPath\]\)/);
  assert.match(controller, /avatar_path: nextPath/);
  assert.match(controller, /1024/);
  assert.match(controller, /MAX_INPUT_BYTES = 8 \* 1024 \* 1024/);
  assert.match(controller, /MAX_OUTPUT_BYTES = 3 \* 1024 \* 1024/);
});

test("avatar database and Storage policies enforce authenticated user ownership", () => {
  assert.match(migration, /add column if not exists avatar_path text/i);
  assert.match(migration, /split_part\(avatar_path, '\/', 1\) = user_id::text/i);
  assert.match(migration, /'avatars'.*false.*3145728/s);
  for (const verb of ["select", "insert", "update", "delete"]) assert.match(migration, new RegExp(`for ${verb}`, "i"));
  assert.match(migration, /storage\.foldername\(name\)\)\[1\] = \(select auth\.jwt\(\)->>'sub'\)/i);
  assert.doesNotMatch(migration, /public\s*=\s*true/i);
});

test("Settings removes duplicate Edit Profile and contains only Appearance, Learning, and Account organization", () => {
  assert.match(controller, /settingsEditProfile"\)\?\.remove\(\)/);
  assert.match(controller, /settingsGroupByTitle\("Appearance"\)/);
  assert.match(controller, /settingsGroupByTitle\("Learning"\)/);
  assert.match(controller, /settingsGroupByTitle\("Account"\)/);
  assert.match(controller, /settingsEmailAccount/);
  assert.match(controller, /settingsPasswordAccount/);
});

test("email and password changes use Supabase Auth rather than profile-table credential fields", () => {
  assert.match(controller, /auth\.updateUser\(\{ email: nextEmail \}\)/);
  assert.match(controller, /Check your email to confirm the change/);
  assert.match(controller, /auth\.updateUser\(\{ password: first\.value \}\)/);
  assert.match(controller, /Password updated/);
  assert.doesNotMatch(migration, /add column[^\n]*(?:email|password)|\b(?:email|password)\s+(?:text|varchar)/i);
  assert.doesNotMatch(controller, /localStorage\.setItem\([^\n]*(password|email)/i);
});

test("account errors are friendly and raw provider error objects are not rendered", () => {
  assert.match(controller, /That email is already linked to another account/);
  assert.match(controller, /Your session expired\. Sign in again and retry/);
  assert.match(controller, /Could not connect\. Check your connection and try again/);
  assert.match(controller, /For security, sign in again before changing your password/);
  assert.match(controller, /status\.textContent = friendlyError\(error, "email"\)/);
  assert.match(controller, /status\.textContent = friendlyError\(error, "password"\)/);
  assert.doesNotMatch(controller, /status\.textContent\s*=\s*error(?:\?\.message)?/);
});

test("Theme and Accent Color use the same settings item and content-column alignment", () => {
  assert.match(controller, /themeItem\.className = "profile-settings-item"/);
  assert.match(controller, /accentItem\.className = "profile-settings-item"/);
  assert.match(controller, /id="accentSettingsMount"/);
  assert.match(appearanceController, /#accentSettingsMount/);
  assert.match(css, /\.profile-settings-item,[\s\S]*?padding:\s*16px 20px/);
  assert.match(css, /\.profile-settings-control \.theme-segmented,[\s\S]*?\.profile-settings-control \.accent-swatch-grid[\s\S]*?width:\s*100%/);
  assert.match(css, /accent-swatch-grid[\s\S]*?grid-template-columns:\s*repeat\(8/);
});

test("existing Theme, Accent and Require Previous Lessons persistence paths stay intact", () => {
  assert.match(appBlock8, /saveSettings\(\{ theme: nextTheme \}\)/);
  assert.match(appBlock8, /saveSettings\(\{ requirePreviousLessons: event\.target\.checked \}\)/);
  assert.match(appearanceController, /user_appearance_settings/);
  assert.match(appearanceController, /user_id: currentUserId/);
});

test("deep Profile screens keep the persistent bottom dock and floating Back contract", () => {
  assert.match(controller, /profile-deep-dock/);
  assert.match(controller, /data-profile-nav="home"/);
  assert.match(controller, /data-profile-nav="learn"/);
  assert.match(controller, /data-profile-nav="profile"/);
  assert.match(controller, /class="back-button" id="profileEditBack"/);
  assert.match(controller, /class="back-button" id="settingsAccountBack"/);
  assert.match(floatingBack, /\.page-header \.back-button/);
  assert.match(floatingBack, /IntersectionObserver/);
  assert.match(dockCss, /position:\s*fixed/);
  assert.match(dockCss, /safe-area-inset-bottom/);
});

test("new profile controller parses as valid JavaScript", () => {
  execFileSync(process.execPath, ["--check", new URL("../web/profile-account-controller.js", import.meta.url).pathname], { stdio: "pipe" });
});
