import { CURRICULUM_PHASES, SKILLS } from "./core/index.js";
import { createSupabaseBrowserClient, getSession, hasSupabaseConfig, runtimeConfig } from "./runtime.js";
import { uiIcon } from "./final-ui.js";

const app = document.querySelector("#app");
const config = runtimeConfig();
const AVATAR_BUCKET = "avatars";
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

let clientPromise = null;
let queued = false;
let enhancing = false;
let accountSubview = null;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function currentRoute() {
  return location.hash.replace(/^#\/?/, "").split("?")[0] || "home";
}

async function getClient() {
  if (!hasSupabaseConfig(config)) return null;
  if (!clientPromise) clientPromise = createSupabaseBrowserClient(config);
  return clientPromise;
}

async function context() {
  const client = await getClient();
  if (!client) return { client: null, session: null, user: null };
  const session = await getSession(client);
  return { client, session, user: session?.user ?? null };
}

function initialFor(name, email) {
  return String(name || email || "L").trim().charAt(0).toUpperCase() || "L";
}

function avatarMarkup(url, name, email, className = "profile-avatar-xl") {
  const initial = esc(initialFor(name, email));
  if (url) return `<div class="${className}"><img src="${esc(url)}" alt="${esc(name || "Profile")} profile photo"></div>`;
  return `<div class="${className} profile-avatar-fallback" aria-label="Profile photo placeholder">${initial}</div>`;
}

async function signedAvatarUrl(client, path) {
  if (!client || !path) return "";
  const { data, error } = await client.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return "";
  return `${data.signedUrl}${data.signedUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

async function loadProfileData() {
  const ctx = await context();
  if (!ctx.client || !ctx.user) return { ...ctx, profile: null, avatarUrl: "", lessonRows: [], phaseRows: [] };
  const [profileResult, lessonResult, phaseResult] = await Promise.all([
    ctx.client.from("user_profiles").select("display_name,avatar_path,created_at,updated_at").eq("user_id", ctx.user.id).maybeSingle(),
    ctx.client.from("lesson_progress").select("lesson_id,completion_count").eq("user_id", ctx.user.id),
    ctx.client.from("phase_progress").select("phase_number,checkpoint_passed_at").eq("user_id", ctx.user.id),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (lessonResult.error) throw lessonResult.error;
  if (phaseResult.error) throw phaseResult.error;
  const profile = profileResult.data ?? { display_name: ctx.user.email?.split("@")[0] || "Learner", avatar_path: null };
  const avatarUrl = await signedAvatarUrl(ctx.client, profile.avatar_path);
  return { ...ctx, profile, avatarUrl, lessonRows: lessonResult.data ?? [], phaseRows: phaseResult.data ?? [] };
}

export function profileProgressMetrics(skills, lessonRows, phaseRows) {
  const assessed = skills.filter((skill) => skill.contentKind !== "reference");
  const completedIds = new Set((lessonRows ?? []).filter((row) => Number(row.completion_count ?? row.completionCount ?? 0) > 0).map((row) => row.lesson_id ?? row.lessonId));
  const completedLessons = assessed.filter((skill) => completedIds.has(skill.id)).length;
  const lessonTotal = assessed.length;
  const overallPercent = lessonTotal ? Math.round((completedLessons / lessonTotal) * 100) : 0;
  const checkpointPhases = new Set((phaseRows ?? []).filter((row) => row.checkpoint_passed_at ?? row.checkpointPassedAt).map((row) => Number(row.phase_number ?? row.phase)));
  const phaseBreakdown = CURRICULUM_PHASES.map((phase) => {
    const phaseSkills = assessed.filter((skill) => skill.phase === phase.phase);
    const complete = phaseSkills.filter((skill) => completedIds.has(skill.id)).length;
    return {
      phase: phase.phase,
      title: phase.title,
      completed: complete,
      total: phaseSkills.length,
      percent: phaseSkills.length ? Math.round((complete / phaseSkills.length) * 100) : 0,
    };
  });
  return {
    completedLessons,
    lessonTotal,
    curriculumItemTotal: skills.length,
    overallPercent,
    phasesCompleted: checkpointPhases.size,
    phaseTotal: CURRICULUM_PHASES.length,
    phaseBreakdown,
  };
}

function friendlyError(error, kind = "account") {
  console.error(error);
  const text = String(error?.message ?? error ?? "").toLowerCase();
  if (/network|fetch|failed to fetch/.test(text)) return "Could not connect. Check your connection and try again.";
  if (/session|jwt|refresh token|not authenticated/.test(text)) return "Your session expired. Sign in again and retry.";
  if (kind === "email") {
    if (/invalid.*email|email.*invalid/.test(text)) return "Enter a valid email address.";
    if (/already.*registered|already.*exists|email.*taken|user.*exists/.test(text)) return "That email is already linked to another account.";
    if (/rate limit|too many/.test(text)) return "Too many email requests. Wait a little and try again.";
    return "Could not start the email change. Please try again.";
  }
  if (kind === "password") {
    if (/reauth|nonce|recent|security/.test(text)) return "For security, sign in again before changing your password.";
    if (/weak|password.*short|characters/.test(text)) return "Choose a stronger password that meets the requirements.";
    return "Could not update the password. Please try again.";
  }
  if (kind === "avatar") return "Could not update the profile photo. Please try again.";
  return "Something went wrong. Please try again.";
}

function deepDockMarkup() {
  return `<nav class="bottom-nav profile-deep-dock" aria-label="Primary navigation">
    <button class="nav-item" data-profile-nav="home" type="button">${uiIcon("home")}<span>Home</span></button>
    <button class="nav-item" data-profile-nav="learn" type="button">${uiIcon("learn")}<span>Learn</span></button>
    <button class="nav-item active" data-profile-nav="profile" type="button">${uiIcon("user")}<span>Profile</span></button>
  </nav>`;
}

function ensureDeepDock() {
  const shell = app?.querySelector(".final-shell");
  if (!shell || shell.querySelector(".bottom-nav")) return;
  shell.insertAdjacentHTML("beforeend", deepDockMarkup());
  shell.querySelectorAll("[data-profile-nav]").forEach((button) => button.addEventListener("click", () => {
    accountSubview = null;
    location.hash = `#/${button.dataset.profileNav}`;
  }));
}

async function enhanceProfile() {
  const main = app?.querySelector(".screen-content");
  if (!main || main.dataset.profileUx === "profile") return;
  main.querySelector(".current-learning-final")?.setAttribute("hidden", "");
  main.dataset.profileUx = "loading";

  const loaded = await loadProfileData();
  if (currentRoute() !== "profile") return;
  const fallbackName = main.querySelector(".profile-hero-final h1")?.textContent?.trim() || "Learner";
  const name = loaded.profile?.display_name || fallbackName;
  const email = loaded.user?.email || "Local preview";
  const metrics = profileProgressMetrics(SKILLS, loaded.lessonRows, loaded.phaseRows);
  const phases = metrics.phaseBreakdown.map((phase) => `<div class="profile-phase-row">
    <div class="profile-phase-row-top"><span>Phase ${phase.phase} · ${esc(phase.title)}</span><strong>${phase.percent}%</strong></div>
    <div class="profile-mini-track"><span style="width:${phase.percent}%"></span></div>
  </div>`).join("");

  main.innerHTML = `<header class="page-header profile-page-title"><div><div class="eyebrow">Profile</div><h1>Profile</h1></div></header>
    <section class="profile-identity-card">
      ${avatarMarkup(loaded.avatarUrl, name, email)}
      <div class="profile-identity-copy"><h2>${esc(name)}</h2><p>${esc(email)}</p><button class="secondary profile-edit-button" id="profileUxEdit" type="button">${uiIcon("edit")} Edit Profile</button></div>
    </section>
    <section class="profile-progress-redesign" aria-labelledby="profileProgressHeading">
      <div class="profile-section-heading"><div><div class="eyebrow">Progress</div><h2 id="profileProgressHeading">Overall Progress</h2></div><strong class="profile-progress-percent">${metrics.overallPercent}%</strong></div>
      <div class="progress-track profile-progress-track"><div class="progress-bar" style="width:${metrics.overallPercent}%"></div></div>
      <div class="profile-course-metrics">
        <div><strong>${metrics.completedLessons} / ${metrics.lessonTotal}</strong><span>Lessons Completed</span></div>
        <div><strong>${metrics.phasesCompleted} / ${metrics.phaseTotal}</strong><span>Phases Completed</span></div>
      </div>
      <div class="profile-phase-breakdown">${phases}</div>
      ${metrics.curriculumItemTotal !== metrics.lessonTotal ? `<p class="profile-progress-note">${metrics.curriculumItemTotal} curriculum items total, including ${metrics.curriculumItemTotal - metrics.lessonTotal} non-assessed reference card.</p>` : ""}
    </section>
    <section class="profile-settings-entry"><button class="settings-action-row" id="profileUxSettings" type="button"><span>${uiIcon("settings")}<span><strong>Settings</strong><small>Appearance, learning preferences, and account</small></span></span>${uiIcon("chevron")}</button></section>`;
  main.dataset.profileUx = "profile";
  document.querySelector("#profileUxEdit")?.addEventListener("click", () => { location.hash = "#/edit-profile"; });
  document.querySelector("#profileUxSettings")?.addEventListener("click", () => { location.hash = "#/settings"; });
}

function settingsGroupByTitle(title) {
  return [...app.querySelectorAll(".settings-group")].find((group) => group.querySelector(".settings-group-title")?.textContent?.trim().toLowerCase() === title.toLowerCase());
}

function transformAppearanceGroup(group) {
  if (!group || group.dataset.profileAppearance === "true") return;
  group.dataset.profileAppearance = "true";
  const title = group.querySelector(".settings-group-title");
  const themeRow = group.querySelector(":scope > .settings-row");
  const themeControl = group.querySelector(":scope > .theme-segmented");
  const oldAccent = group.querySelector(":scope > .accent-setting-block");

  const themeItem = document.createElement("div");
  themeItem.className = "profile-settings-item";
  themeItem.dataset.settingsField = "theme";
  if (themeRow) {
    themeRow.classList.add("profile-setting-copy-row");
    themeItem.appendChild(themeRow);
  }
  const themeControlWrap = document.createElement("div");
  themeControlWrap.className = "profile-settings-control";
  if (themeControl) themeControlWrap.appendChild(themeControl);
  themeItem.appendChild(themeControlWrap);

  const accentItem = document.createElement("div");
  accentItem.className = "profile-settings-item";
  accentItem.dataset.settingsField = "accent";
  accentItem.innerHTML = `<div class="setting-copy"><strong>Accent Color</strong><small>Changes interactive highlights without changing correct or error colors.</small></div><div class="profile-settings-control" id="accentSettingsMount"></div>`;
  const mount = accentItem.querySelector("#accentSettingsMount");
  if (oldAccent) {
    const grid = oldAccent.querySelector(".accent-swatch-grid");
    const status = oldAccent.querySelector(".appearance-save-status");
    if (grid) mount.appendChild(grid);
    if (status) mount.appendChild(status);
    oldAccent.remove();
  }

  if (title) {
    title.insertAdjacentElement("afterend", themeItem);
    themeItem.insertAdjacentElement("afterend", accentItem);
  } else {
    group.append(themeItem, accentItem);
  }
}

function transformLearningGroup(group) {
  if (!group || group.dataset.profileLearning === "true") return;
  group.dataset.profileLearning = "true";
  const row = group.querySelector(".settings-row");
  if (row) row.classList.add("profile-settings-item", "profile-settings-inline");
}

function openAccountSubview(kind) {
  accountSubview = kind;
  history.pushState({ profileAccountSubview: kind }, "", location.href);
  if (kind === "email") renderEmailSubview();
  else renderPasswordSubview();
}

function transformAccountGroup(group, email) {
  if (!group || group.dataset.profileAccount === "true") return;
  group.dataset.profileAccount = "true";
  group.querySelector("#settingsEditProfile")?.remove();
  const signOut = group.querySelector("#settingsSignOut");

  const emailButton = document.createElement("button");
  emailButton.className = "settings-action-row profile-account-row";
  emailButton.id = "settingsEmailAccount";
  emailButton.type = "button";
  emailButton.innerHTML = `<span>${uiIcon("mail")}<span><strong>Email</strong><small>${esc(email || "Manage email")}</small></span></span>${uiIcon("chevron")}`;
  emailButton.addEventListener("click", () => openAccountSubview("email"));

  const passwordButton = document.createElement("button");
  passwordButton.className = "settings-action-row profile-account-row";
  passwordButton.id = "settingsPasswordAccount";
  passwordButton.type = "button";
  passwordButton.innerHTML = `<span>${uiIcon("lock")}<span><strong>Password</strong><small>Change password</small></span></span>${uiIcon("chevron")}`;
  passwordButton.addEventListener("click", () => openAccountSubview("password"));

  if (signOut) {
    group.insertBefore(emailButton, signOut);
    group.insertBefore(passwordButton, signOut);
    signOut.classList.add("profile-account-row");
  } else {
    group.append(emailButton, passwordButton);
  }
}

async function enhanceSettings() {
  const main = app?.querySelector(".screen-content");
  if (!main || main.dataset.profileUx === "settings") {
    ensureDeepDock();
    return;
  }
  main.dataset.profileUx = "settings";
  main.querySelector(".settings-screen")?.classList.add("profile-settings-redesign");
  const ctx = await context();
  if (currentRoute() !== "settings" || accountSubview) return;
  transformAppearanceGroup(settingsGroupByTitle("Appearance"));
  transformLearningGroup(settingsGroupByTitle("Learning"));
  transformAccountGroup(settingsGroupByTitle("Account"), ctx.user?.email || "Local preview");
  ensureDeepDock();
}

function accountScreenShell(title, eyebrow, body) {
  return `<header class="page-header lesson-header"><button class="back-button" id="settingsAccountBack" type="button">${uiIcon("back")}<span>Settings</span></button><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1></div></header>${body}`;
}

function bindAccountBack() {
  document.querySelector("#settingsAccountBack")?.addEventListener("click", () => {
    accountSubview = null;
    history.back();
  });
  ensureDeepDock();
}

async function renderEmailSubview() {
  const main = app?.querySelector(".screen-content");
  if (!main) return;
  const ctx = await context();
  if (!ctx.client || !ctx.user) return;
  const currentEmail = ctx.user.email || "";
  main.innerHTML = accountScreenShell("Email", "Account", `<section class="account-detail-card">
    <div class="account-current-value"><span>Current email</span><strong>${esc(currentEmail)}</strong></div>
    <form class="account-form" id="emailChangeForm" novalidate>
      <label for="newAccountEmail"><strong>New Email</strong><small>We'll use Supabase Auth's secure email-change flow.</small></label>
      <input id="newAccountEmail" type="email" inputmode="email" autocomplete="email" required value="">
      <button class="primary" id="submitEmailChange" type="submit">Change Email</button>
      <div class="account-status" id="emailChangeStatus" role="status" aria-live="polite"></div>
    </form>
  </section>`);
  main.dataset.profileUx = "account-email";
  bindAccountBack();
  document.querySelector("#emailChangeForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#newAccountEmail");
    const button = document.querySelector("#submitEmailChange");
    const status = document.querySelector("#emailChangeStatus");
    const nextEmail = input.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(nextEmail)) { status.textContent = "Enter a valid email address."; return; }
    if (nextEmail.toLowerCase() === currentEmail.toLowerCase()) { status.textContent = "That is already your current email."; return; }
    button.disabled = true;
    button.textContent = "Sending…";
    status.textContent = "";
    try {
      const { data, error } = await ctx.client.auth.updateUser({ email: nextEmail });
      if (error) throw error;
      const refreshed = await getSession(ctx.client);
      if (refreshed?.user?.email?.toLowerCase() === nextEmail.toLowerCase()) status.textContent = "Email updated.";
      else status.textContent = "Check your email to confirm the change.";
      input.value = "";
    } catch (error) {
      status.textContent = friendlyError(error, "email");
    } finally {
      button.disabled = false;
      button.textContent = "Change Email";
    }
  });
}

async function renderPasswordSubview() {
  const main = app?.querySelector(".screen-content");
  if (!main) return;
  const ctx = await context();
  if (!ctx.client || !ctx.user) return;
  main.innerHTML = accountScreenShell("Password", "Account", `<section class="account-detail-card">
    <form class="account-form" id="passwordChangeForm" novalidate>
      <label for="newAccountPassword"><strong>New Password</strong><small>Use at least 8 characters. Your password is handled only by Supabase Auth.</small></label>
      <input id="newAccountPassword" type="password" autocomplete="new-password" minlength="8" required>
      <label for="confirmAccountPassword"><strong>Confirm New Password</strong></label>
      <input id="confirmAccountPassword" type="password" autocomplete="new-password" minlength="8" required>
      <button class="password-visibility-toggle" id="toggleAccountPassword" type="button" aria-pressed="false">Show passwords</button>
      <button class="primary" id="submitPasswordChange" type="submit">Update Password</button>
      <div class="account-status" id="passwordChangeStatus" role="status" aria-live="polite"></div>
    </form>
  </section>`);
  main.dataset.profileUx = "account-password";
  bindAccountBack();
  document.querySelector("#toggleAccountPassword")?.addEventListener("click", (event) => {
    const show = event.currentTarget.getAttribute("aria-pressed") !== "true";
    event.currentTarget.setAttribute("aria-pressed", String(show));
    event.currentTarget.textContent = show ? "Hide passwords" : "Show passwords";
    document.querySelector("#newAccountPassword").type = show ? "text" : "password";
    document.querySelector("#confirmAccountPassword").type = show ? "text" : "password";
  });
  document.querySelector("#passwordChangeForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const first = document.querySelector("#newAccountPassword");
    const second = document.querySelector("#confirmAccountPassword");
    const button = document.querySelector("#submitPasswordChange");
    const status = document.querySelector("#passwordChangeStatus");
    if (first.value.length < 8) { status.textContent = "Use at least 8 characters."; return; }
    if (first.value !== second.value) { status.textContent = "The passwords do not match."; return; }
    button.disabled = true;
    button.textContent = "Updating…";
    status.textContent = "";
    try {
      const { error } = await ctx.client.auth.updateUser({ password: first.value });
      if (error) throw error;
      first.value = "";
      second.value = "";
      status.textContent = "Password updated.";
    } catch (error) {
      status.textContent = friendlyError(error, "password");
    } finally {
      button.disabled = false;
      button.textContent = "Update Password";
    }
  });
}

async function imageElementForFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return { image, revoke: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image conversion failed")), type, quality));
}

async function compressAvatar(file) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Choose a JPEG, PNG, or WebP image.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("Choose an image smaller than 8 MB.");
  const { image, revoke } = await imageElementForFile(file);
  try {
    const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    let blob = await canvasBlob(canvas, "image/webp", .84);
    if (blob.size > MAX_OUTPUT_BYTES) blob = await canvasBlob(canvas, "image/webp", .68);
    if (blob.size > MAX_OUTPUT_BYTES) throw new Error("The processed image is still too large. Choose a smaller photo.");
    return blob;
  } finally { revoke(); }
}

function setAvatarEditorPreview(container, url, name, email) {
  container.innerHTML = avatarMarkup(url, name, email, "profile-avatar-edit-preview");
}

async function enhanceEditProfile() {
  const main = app?.querySelector(".screen-content");
  if (!main || main.dataset.profileUx === "edit") { ensureDeepDock(); return; }
  main.dataset.profileUx = "loading-edit";
  const loaded = await loadProfileData();
  if (currentRoute() !== "edit-profile") return;
  const originalName = loaded.profile?.display_name || "Learner";
  const originalPath = loaded.profile?.avatar_path || null;
  const email = loaded.user?.email || "";
  let stagedBlob = null;
  let stagedRemove = false;
  let previewObjectUrl = "";

  main.innerHTML = `<header class="page-header lesson-header"><button class="back-button" id="profileEditBack" type="button">${uiIcon("back")}<span>Profile</span></button><div><div class="eyebrow">Profile</div><h1>Edit Profile</h1></div></header>
    <section class="edit-profile-card">
      <form id="profileIdentityForm" novalidate>
        <div class="profile-photo-editor">
          <div id="profileAvatarEditorPreview">${avatarMarkup(loaded.avatarUrl, originalName, email, "profile-avatar-edit-preview")}</div>
          <div class="profile-photo-actions">
            <input id="profilePhotoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden>
            <button class="secondary" id="changeProfilePhoto" type="button">${originalPath ? "Change Photo" : "Add Photo"}</button>
            <button class="text-button danger-text" id="removeProfilePhoto" type="button" ${originalPath ? "" : "disabled"}>Remove Photo</button>
            <small>JPEG, PNG, or WebP. Large photos are resized before upload.</small>
          </div>
        </div>
        <label class="edit-profile-field" for="profileDisplayName"><strong>Display Name</strong><small>This is the name shown inside the app.</small></label>
        <input id="profileDisplayName" type="text" maxlength="80" autocomplete="name" value="${esc(originalName)}">
        <div class="edit-profile-actions"><button class="secondary" id="cancelProfileEdit" type="button">Cancel</button><button class="primary" id="saveProfileChanges" type="submit" disabled>Save Changes</button></div>
        <div class="account-status" id="profileSaveStatus" role="status" aria-live="polite"></div>
      </form>
    </section>
    <dialog class="discard-dialog" id="discardProfileDialog"><form method="dialog"><h2>Discard changes?</h2><p>Your unsaved profile changes will be lost.</p><div class="discard-dialog-actions"><button class="secondary" value="keep" type="submit">Keep Editing</button><button class="primary" id="confirmDiscardProfile" value="discard" type="button">Discard</button></div></form></dialog>`;
  main.dataset.profileUx = "edit";
  ensureDeepDock();

  const nameInput = document.querySelector("#profileDisplayName");
  const fileInput = document.querySelector("#profilePhotoInput");
  const preview = document.querySelector("#profileAvatarEditorPreview");
  const removeButton = document.querySelector("#removeProfilePhoto");
  const saveButton = document.querySelector("#saveProfileChanges");
  const status = document.querySelector("#profileSaveStatus");
  const dialog = document.querySelector("#discardProfileDialog");

  const dirty = () => nameInput.value.trim() !== originalName || Boolean(stagedBlob) || stagedRemove;
  const syncDirty = () => { saveButton.disabled = !dirty(); };
  const cleanPreviewUrl = () => { if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl); previewObjectUrl = ""; };
  const leaveProfileEdit = () => { cleanPreviewUrl(); location.hash = "#/profile"; };
  const requestExit = () => {
    if (!dirty()) return leaveProfileEdit();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else if (confirm("Discard changes?")) leaveProfileEdit();
  };

  nameInput.addEventListener("input", syncDirty);
  document.querySelector("#profileEditBack")?.addEventListener("click", requestExit);
  document.querySelector("#cancelProfileEdit")?.addEventListener("click", requestExit);
  document.querySelector("#confirmDiscardProfile")?.addEventListener("click", () => { dialog.close(); leaveProfileEdit(); });
  document.querySelector("#changeProfilePhoto")?.addEventListener("click", () => fileInput.click());
  removeButton.addEventListener("click", () => {
    cleanPreviewUrl();
    stagedBlob = null;
    stagedRemove = true;
    setAvatarEditorPreview(preview, "", nameInput.value.trim() || originalName, email);
    removeButton.disabled = true;
    syncDirty();
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    status.textContent = "Preparing photo…";
    document.querySelector("#changeProfilePhoto").disabled = true;
    try {
      const blob = await compressAvatar(file);
      cleanPreviewUrl();
      stagedBlob = blob;
      stagedRemove = false;
      previewObjectUrl = URL.createObjectURL(blob);
      setAvatarEditorPreview(preview, previewObjectUrl, nameInput.value.trim() || originalName, email);
      removeButton.disabled = false;
      status.textContent = "Photo ready to save.";
      syncDirty();
    } catch (error) {
      const text = String(error?.message ?? "");
      status.textContent = /JPEG|PNG|WebP|8 MB|too large/.test(text) ? text : friendlyError(error, "avatar");
      fileInput.value = "";
    } finally { document.querySelector("#changeProfilePhoto").disabled = false; }
  });

  document.querySelector("#profileIdentityForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!dirty() || saveButton.disabled || !loaded.client || !loaded.user) return;
    const displayName = nameInput.value.trim();
    if (!displayName) { status.textContent = "Enter a display name."; return; }
    saveButton.disabled = true;
    saveButton.textContent = "Saving…";
    document.querySelector("#changeProfilePhoto").disabled = true;
    removeButton.disabled = true;
    status.textContent = "";
    try {
      let nextPath = originalPath;
      if (stagedBlob) {
        nextPath = `${loaded.user.id}/avatar.webp`;
        const { error: uploadError } = await loaded.client.storage.from(AVATAR_BUCKET).upload(nextPath, stagedBlob, { contentType: "image/webp", cacheControl: "3600", upsert: true });
        if (uploadError) throw uploadError;
      } else if (stagedRemove) {
        nextPath = null;
      }

      const { error: profileError } = await loaded.client.from("user_profiles").upsert({
        user_id: loaded.user.id,
        display_name: displayName,
        avatar_path: nextPath,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (profileError) throw profileError;

      if (stagedRemove && originalPath) {
        const { error: removeError } = await loaded.client.storage.from(AVATAR_BUCKET).remove([originalPath]);
        if (removeError) console.error("Avatar cleanup failed", removeError);
      } else if (stagedBlob && originalPath && originalPath !== nextPath) {
        const { error: removeOldError } = await loaded.client.storage.from(AVATAR_BUCKET).remove([originalPath]);
        if (removeOldError) console.error("Old avatar cleanup failed", removeOldError);
      }
      status.textContent = "Profile updated.";
      cleanPreviewUrl();
      setTimeout(() => { location.hash = "#/profile"; }, 250);
    } catch (error) {
      status.textContent = friendlyError(error, stagedBlob || stagedRemove ? "avatar" : "account");
      saveButton.disabled = false;
      document.querySelector("#changeProfilePhoto").disabled = false;
      removeButton.disabled = !(originalPath || stagedBlob);
      saveButton.textContent = "Save Changes";
    }
  });
}

async function enhance() {
  if (!app || enhancing) return;
  enhancing = true;
  try {
    const route = currentRoute();
    if (route !== "settings") accountSubview = null;
    if (route === "profile") await enhanceProfile();
    else if (route === "settings") {
      if (accountSubview === "email") return;
      if (accountSubview === "password") return;
      await enhanceSettings();
    } else if (route === "edit-profile") await enhanceEditProfile();
  } catch (error) {
    console.error("Profile/account enhancement failed", error);
  } finally { enhancing = false; }
}

function scheduleEnhance() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; enhance(); });
}

if (app) new MutationObserver(scheduleEnhance).observe(app, { childList: true, subtree: true });
window.addEventListener("hashchange", scheduleEnhance);
window.addEventListener("popstate", () => { accountSubview = null; scheduleEnhance(); });
scheduleEnhance();
