from pathlib import Path


def replace_between(text: str, start_marker: str, end_marker: str, replacement: str, label: str) -> str:
    try:
        start = text.index(start_marker)
        end = text.index(end_marker, start)
    except ValueError as exc:
        raise RuntimeError(f"Missing range anchor for {label}") from exc
    return text[:start] + replacement + text[end:]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing anchor for {label}")
    return text.replace(old, new, 1)


# ---------- App shell + screen renderers ----------
path = Path("web/app.js")
s = path.read_text()
if "UI_REDESIGN_2026" not in s:
    shell = r'''// UI_REDESIGN_2026
function icon(name, size = 20) {
  const paths = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
    learn: '<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2H10V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/>',
    xCircle: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
    review: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    spark: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8Z"/>',
  };
  return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.spark}</svg>`;
}

function topbarHtml(title = "", options = {}) {
  const { backTarget = "", eyebrow = "", subtitle = "", action = "" } = options;
  return `<header class="page-header">
    <div class="page-header-leading">${backTarget ? `<button class="icon-button" data-back="${esc(backTarget)}" type="button" aria-label="Back">${icon("back", 22)}</button>` : '<div class="brand-mark">T</div>'}</div>
    <div class="page-header-copy">${eyebrow ? `<div class="page-kicker">${esc(eyebrow)}</div>` : ""}<div class="page-title">${esc(title || "Theory")}</div>${subtitle ? `<div class="page-subtitle">${esc(subtitle)}</div>` : ""}</div>
    <div class="page-header-action">${action}</div>
  </header>`;
}

function bottomNavHtml(active = "home") {
  const items = [
    ["home", "Home", "home"],
    ["learn", "Learn", "learn"],
    ["profile", "Profile", "profile"],
  ];
  return `<nav class="bottom-nav" aria-label="Main navigation">${items.map(([id, label, iconName]) => `<button class="nav-item ${active === id ? "active" : ""}" data-nav="${id}" type="button" ${active === id ? 'aria-current="page"' : ""}>${icon(iconName, 21)}<span>${label}</span></button>`).join("")}</nav>`;
}

function shellHtml(content, options = {}) {
  const { activeNav = "", className = "" } = options;
  return `<div class="screen ${className}">${content}</div>${activeNav ? bottomNavHtml(activeNav) : ""}`;
}

function progressBarHtml(value, label = "") {
  const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return `<div class="progress-block">${label ? `<div class="progress-label"><span>${esc(label)}</span><strong>${pct}%</strong></div>` : ""}<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div class="progress-bar" style="width:${pct}%"></div></div></div>`;
}

function footerHtml() { return ""; }

'''
    s = replace_between(s, 'function topbarHtml(label = "") {', 'function defaultLearningSettings(userId) {', shell, "app shell")

    auth = r'''function renderAuth(message = "", isError = false) {
  resetSessionUiState();
  root.innerHTML = shellHtml(`
    <div class="auth-wrap">
      <div class="auth-brand"><div class="auth-logo">${icon("learn", 26)}</div><div><strong>Theory</strong><span>Music theory that sticks.</span></div></div>
      <section class="auth-panel">
        <div class="page-kicker">Welcome</div>
        <h1>Pick up where you left off.</h1>
        <p class="muted">Your lessons, reviews, and progress stay synced to your account.</p>
        ${message ? `<div class="inline-message ${isError ? "error" : ""}" role="status">${esc(message)}</div>` : ""}
        <form id="authForm" class="form-stack">
          <label class="field-group"><span>Email</span><input class="answer-input" id="authEmail" type="email" autocomplete="email" required value="${esc(authEmail)}"></label>
          <label class="field-group"><span>Password</span><input class="answer-input" id="authPassword" type="password" autocomplete="current-password" minlength="6" required></label>
          <button class="primary" id="signInBtn" type="submit">Sign in</button>
          <button class="secondary" id="signUpBtn" type="button">Create account</button>
        </form>
      </section>
    </div>`, { className: "auth-screen" });
  const emailEl = document.querySelector("#authEmail");
  const passwordEl = document.querySelector("#authPassword");
  const readCredentials = () => ({ email: emailEl.value.trim(), password: passwordEl.value });
  const busy = (on) => {
    document.querySelector("#signInBtn").disabled = on;
    document.querySelector("#signUpBtn").disabled = on;
  };
  document.querySelector("#authForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const { email, password } = readCredentials();
    authEmail = email;
    busy(true);
    try {
      const session = await signInWithPassword(authClient, email, password);
      if (!session) return renderAuth("Sign-in did not create a session. Check whether your email has been confirmed.", true);
      await initializeSupabaseRuntime(session);
      await loadToday();
    } catch (err) { renderAuth(err?.message ?? "Could not sign in.", true); }
  });
  document.querySelector("#signUpBtn").addEventListener("click", async () => {
    const { email, password } = readCredentials();
    authEmail = email;
    if (!email || password.length < 6) return renderAuth("Enter an email and a password of at least 6 characters.", true);
    busy(true);
    try {
      const result = await signUpWithPassword(authClient, email, password);
      if (result.session) {
        await initializeSupabaseRuntime(result.session);
        await loadToday();
      } else {
        renderAuth("Account created. Check your email for the confirmation link, then sign in.");
      }
    } catch (err) { renderAuth(err?.message ?? "Could not create the account.", true); }
  });
}

'''
    s = replace_between(s, 'function renderAuth(message = "", isError = false) {', 'async function boot() {', auth, "auth screen")

    clicks = r'''root.addEventListener("click", async (ev) => {
  const nav = ev.target.closest?.("[data-nav]");
  if (nav) {
    const target = nav.dataset.nav;
    if (target === "home") return renderToday().catch(showFatal);
    if (target === "learn") return renderCurriculum().catch(showFatal);
    if (target === "profile") return renderProfile().catch(showFatal);
  }

  const back = ev.target.closest?.("[data-back]");
  if (back) {
    const target = back.dataset.back;
    if (target === "home") return renderToday().catch(showFatal);
    if (target === "learn") return renderCurriculum().catch(showFatal);
    if (target === "profile") return renderProfile().catch(showFatal);
    if (target === "session") return leaveStudyToPrevious().catch(showFatal);
  }

  const profileButton = ev.target.closest?.("[data-profile]");
  if (profileButton) return renderProfile().catch(showFatal);
  const settingsButton = ev.target.closest?.("[data-settings]");
  if (settingsButton) return renderSettings().catch(showFatal);
  const editButton = ev.target.closest?.("[data-edit-profile]");
  if (editButton) return renderEditProfile().catch(showFatal);

  const button = ev.target.closest?.("[data-signout]");
  if (!button || !authClient) return;
  button.disabled = true;
  try {
    if (state.session?.sessionId && service && USER_ID) {
      await service.finishSession(USER_ID, state.session.sessionId, "signed-out", new Date());
    }
    await supabaseSignOut(authClient);
    persistenceMode = "supabase";
    USER_ID = "";
    repo = undefined;
    service = undefined;
    userSettings = null;
    userProfile = null;
    renderAuth();
  } catch (err) { showFatal(err); }
});

'''
    s = replace_between(s, 'root.addEventListener("click", async (ev) => {', 'function buildQueue(plan) {', clicks, "navigation handler")

    load_today = r'''async function loadToday() {
  state.manualStudy = null;
  state.session = await service.startSession(USER_ID, new Date());
  state.queue = buildQueue(state.session.plan);
  state.itemIndex = 0;
  state.fastPathPasses = 0;
  await renderToday();
}

'''
    s = replace_between(s, 'async function loadToday() {', 'const PHASE_TITLES = Object.freeze({', load_today, "load today")

    curriculum_account = r'''function skillStatus(skill, evidence, readyIds, accessAllowed = true) {
  if (evidence?.fragile) return { label: "Repair", cls: "repair" };
  if (evidence?.retained || evidence?.state === "retained") return { label: "Retained", cls: "retained" };
  if (evidenceReady(evidence)) return { label: "Ready", cls: "ready" };
  if (evidence?.state === "acquiring") return { label: "In progress", cls: "current" };
  return accessAllowed ? { label: "Available", cls: "available" } : { label: "Locked", cls: "locked" };
}

function curriculumAccessAllowed(skill, readyIds) {
  if (userSettings?.requirePreviousLessons === false) return true;
  return skill.prerequisites.every((id) => readyIds.has(id));
}

function progressSummary(records) {
  const byId = new Map(records.map((record) => [record.skillId, record.evidence]));
  const readyIds = new Set(records.filter((record) => evidenceReady(record.evidence)).map((record) => record.skillId));
  const required = SKILLS.filter((skill) => !skill.optional);
  const requiredReady = required.filter((skill) => readyIds.has(skill.id)).length;
  return {
    byId,
    readyIds,
    overall: required.length ? Math.round((requiredReady / required.length) * 100) : 0,
    mastered: records.filter((record) => evidenceReady(record.evidence)).length,
    learning: records.filter((record) => record.evidence?.state === "acquiring" || record.evidence?.fragile).length,
  };
}

function phaseSummary(phase, byId, readyIds) {
  const skills = SKILLS.filter((skill) => skill.phase === phase);
  const required = skills.filter((skill) => !skill.optional);
  const readyCount = required.filter((skill) => evidenceReady(byId.get(skill.id))).length;
  const complete = required.length > 0 && readyCount === required.length;
  const percent = required.length ? Math.round((readyCount / required.length) * 100) : 0;
  const canOpen = complete || skills.some((skill) => curriculumAccessAllowed(skill, readyIds));
  return { phase, skills, required, readyCount, complete, percent, canOpen };
}

async function renderCurriculum() {
  const records = await repo.allSkillStates(USER_ID);
  const { byId, readyIds } = progressSummary(records);
  const locking = userSettings?.requirePreviousLessons !== false;
  const summaries = Array.from({ length: 13 }, (_, phase) => phaseSummary(phase, byId, readyIds));
  const firstIncomplete = summaries.find((x) => !x.complete)?.phase ?? 12;
  const cards = summaries.map((summary) => {
    const open = !locking || summary.canOpen;
    const stateName = summary.complete ? "Complete" : summary.phase === firstIncomplete ? "Current" : open ? "Available" : "Locked";
    const stateClass = stateName.toLowerCase();
    const statusIcon = summary.complete ? icon("check", 17) : stateName === "Locked" ? icon("lock", 16) : icon("chevron", 17);
    return `<button class="phase-card ${stateClass}" type="button" ${open ? `data-open-phase="${summary.phase}"` : "disabled"}>
      <div class="phase-card-top"><div><span class="phase-label">Phase ${summary.phase}</span><h2>${esc(PHASE_TITLES[summary.phase] ?? `Phase ${summary.phase}`)}</h2></div><span class="phase-state ${stateClass}">${statusIcon}<span>${stateName}</span></span></div>
      ${progressBarHtml(summary.percent)}
      <div class="phase-card-meta"><span>${summary.readyCount} of ${summary.required.length} core lessons ready</span><strong>${summary.percent}%</strong></div>
    </button>`;
  }).join("");

  root.innerHTML = shellHtml(`
    ${topbarHtml("Learn", { eyebrow: "Curriculum", subtitle: "See the whole path." })}
    ${!locking ? '<div class="soft-note">Jump-ahead mode is on. You can open any lesson without changing its real progress.</div>' : ""}
    <section class="phase-list">${cards}</section>`, { activeNav: "learn", className: "curriculum-screen" });
  document.querySelectorAll("[data-open-phase]").forEach((button) => {
    button.addEventListener("click", () => renderPhase(Number(button.dataset.openPhase)).catch(showFatal));
  });
}

async function renderPhase(phase) {
  const records = await repo.allSkillStates(USER_ID);
  const { byId, readyIds } = progressSummary(records);
  const summary = phaseSummary(phase, byId, readyIds);
  const locking = userSettings?.requirePreviousLessons !== false;
  if (locking && !summary.canOpen) return renderCurriculum();
  const intro = PHASE_INTROS[phase]?.[1] ?? "Work through these lessons at your own pace.";
  const rows = summary.skills.map((skill) => {
    const evidence = byId.get(skill.id);
    const accessAllowed = curriculumAccessAllowed(skill, readyIds);
    const status = skillStatus(skill, evidence, readyIds, accessAllowed);
    return `<button class="lesson-row ${status.cls}" type="button" ${accessAllowed ? `data-open-skill="${esc(skill.id)}"` : "disabled"}>
      <span class="lesson-row-copy"><strong>${esc(skill.title)}</strong>${!accessAllowed ? '<small>Complete previous material to unlock.</small>' : skill.optional ? '<small>Optional</small>' : ""}</span>
      <span class="lesson-row-end"><span class="status-chip ${status.cls}">${esc(status.label)}</span>${accessAllowed ? icon("chevron", 17) : icon("lock", 16)}</span>
    </button>`;
  }).join("");
  root.innerHTML = shellHtml(`
    ${topbarHtml(PHASE_TITLES[phase] ?? `Phase ${phase}`, { backTarget: "learn", eyebrow: `Phase ${phase}`, subtitle: intro })}
    <section class="phase-overview">${progressBarHtml(summary.percent, "Phase progress")}</section>
    <section class="lesson-list">${rows}</section>`, { activeNav: "learn", className: "phase-screen" });
  document.querySelectorAll("[data-open-skill]").forEach((button) => {
    button.addEventListener("click", () => openCurriculumSkill(button.dataset.openSkill).catch(showFatal));
  });
}

function manualStudyKind(evidence) {
  if (evidence?.fragile) return "repair";
  if (evidence?.retained || evidenceReady(evidence)) return "review";
  if (evidence?.state === "acquiring") return "acquisition";
  return "new";
}

async function openCurriculumSkill(skillId) {
  const skill = SKILL_BY_ID.get(skillId);
  if (!skill) return;
  const records = await repo.allSkillStates(USER_ID);
  const readyIds = new Set(records.filter((record) => evidenceReady(record.evidence)).map((record) => record.skillId));
  if (!curriculumAccessAllowed(skill, readyIds)) return renderPhase(skill.phase);
  const evidence = records.find((record) => record.skillId === skillId)?.evidence;
  const kind = manualStudyKind(evidence);
  state.manualStudy = {
    queue: state.queue,
    itemIndex: state.itemIndex,
    fastPathPasses: state.fastPathPasses,
    phase: skill.phase,
  };
  state.queue = [{ skillId, kind, firstProbe: kind === "review" || kind === "repair" }];
  state.itemIndex = 0;
  state.fastPathPasses = 0;
  await beginItem();
}

async function leaveStudyToPrevious() {
  if (state.manualStudy) {
    const previous = state.manualStudy;
    state.manualStudy = null;
    state.queue = previous.queue;
    state.itemIndex = previous.itemIndex;
    state.fastPathPasses = previous.fastPathPasses;
    return renderPhase(previous.phase);
  }
  return renderToday();
}

function formatProfileDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function profileMonogram() {
  const name = userProfile?.displayName ?? defaultDisplayName(authEmail);
  return (String(name).trim()[0] || "T").toUpperCase();
}

async function renderProfile(message = "") {
  const [records, due, sessions] = await Promise.all([
    repo.allSkillStates(USER_ID),
    repo.dueReviews(USER_ID, new Date().toISOString()),
    repo.recentSessions(USER_ID, 4),
  ]);
  const summary = progressSummary(records);
  const plan = state.session?.plan ?? await service.previewPlan(USER_ID, new Date());
  const currentSkillId = plan.acquiringSkillId ?? plan.newSkillId ?? null;
  const currentSkill = currentSkillId ? SKILL_BY_ID.get(currentSkillId) : null;
  const name = userProfile?.displayName ?? defaultDisplayName(authEmail);
  const history = sessions.length ? sessions.map((session) => `<div class="activity-row"><span>${esc(formatProfileDate(session.startedAt))}</span><strong>${session.completedAt ? "Studied" : "Started"}</strong></div>`).join("") : '<div class="empty-row">No study sessions yet.</div>';

  root.innerHTML = shellHtml(`
    ${topbarHtml("Profile", { eyebrow: "Your learning" })}
    ${message ? `<div class="inline-message" role="status">${esc(message)}</div>` : ""}
    <section class="profile-hero">
      <div class="profile-avatar" aria-hidden="true">${esc(profileMonogram())}</div>
      <div class="profile-identity-copy"><h1>${esc(name)}</h1><p>${currentSkill ? `Phase ${currentSkill.phase}` : "All caught up"} <span>•</span> ${summary.overall}% complete</p></div>
      <button class="ghost-button" data-edit-profile type="button">${icon("edit", 16)} Edit Profile</button>
    </section>
    <section class="profile-progress">${progressBarHtml(summary.overall, "Overall progress")}</section>
    <section class="stat-strip" aria-label="Learning stats">
      <div><strong>${summary.mastered}</strong><span>Mastered</span></div>
      <div><strong>${summary.learning}</strong><span>Learning</span></div>
      <div><strong>${due.length}</strong><span>Reviews</span></div>
    </section>
    ${currentSkill ? `<section class="compact-section"><div class="section-heading"><span>Current learning</span></div><div class="current-learning-row"><div><span>Phase ${currentSkill.phase}</span><strong>${esc(currentSkill.title)}</strong></div><button class="icon-button" data-nav="home" type="button" aria-label="Continue from Home">${icon("chevron", 20)}</button></div></section>` : ""}
    <section class="compact-section"><div class="section-heading"><span>Recent activity</span></div><div class="activity-list">${history}</div><div class="member-since">Member since ${esc(formatProfileDate(userProfile?.createdAt))}</div></section>
    <section class="menu-list">
      <button class="menu-row" data-settings type="button"><span class="menu-row-icon">${icon("settings", 19)}</span><span>Settings</span>${icon("chevron", 18)}</button>
      ${persistenceMode === "supabase" ? `<button class="menu-row danger" data-signout type="button"><span class="menu-row-icon">${icon("logout", 19)}</span><span>Sign out</span></button>` : ""}
    </section>`, { activeNav: "profile", className: "profile-screen" });
}

async function renderEditProfile(message = "") {
  const name = userProfile?.displayName ?? defaultDisplayName(authEmail);
  root.innerHTML = shellHtml(`
    ${topbarHtml("Edit profile", { backTarget: "profile", subtitle: "Keep it simple." })}
    <section class="form-panel">
      ${message ? `<div class="inline-message" role="status">${esc(message)}</div>` : ""}
      <form id="profileForm" class="form-stack">
        <label class="field-group"><span>Display name</span><input class="answer-input" id="displayName" maxlength="80" autocomplete="name" required value="${esc(name)}"></label>
        <button class="primary" type="submit">Save changes</button>
      </form>
    </section>`, { className: "edit-profile-screen" });
  document.querySelector("#profileForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const displayName = document.querySelector("#displayName").value.trim();
    if (!displayName) return;
    await repo.upsertProfile(USER_ID, displayName);
    userProfile = await repo.getProfile(USER_ID);
    await renderProfile("Profile updated.");
  });
}

async function renderSettings() {
  const locking = userSettings?.requirePreviousLessons !== false;
  const description = locking
    ? "Complete lessons in order before later lessons unlock."
    : "You can open any lesson. Your actual completion and mastery progress will not change.";
  // This changes access only; learning state remains untouched.
  root.innerHTML = shellHtml(`
    ${topbarHtml("Settings", { backTarget: "profile" })}
    <section class="settings-group">
      <div class="settings-title">Learning</div>
      <div class="settings-surface">
        <div class="setting-row">
          <div class="setting-copy"><strong>Require Previous Lessons</strong><span id="lockingDescription">${esc(description)}</span><small id="settingSaveState" class="save-state" aria-live="polite"></small></div>
          <label class="switch" aria-label="Require Previous Lessons"><input id="requirePreviousLessons" type="checkbox" ${locking ? "checked" : ""}><span class="switch-track"></span></label>
        </div>
      </div>
    </section>
    <section class="settings-group">
      <div class="settings-title">Account</div>
      <div class="settings-surface">
        <button class="settings-link" data-edit-profile type="button"><span>${icon("edit", 18)} Edit Profile</span>${icon("chevron", 18)}</button>
        ${authEmail ? `<div class="settings-info"><span>Email</span><strong>${esc(authEmail)}</strong></div>` : ""}
        ${persistenceMode === "supabase" ? `<button class="settings-link danger" data-signout type="button"><span>${icon("logout", 18)} Sign Out</span></button>` : ""}
      </div>
    </section>`, { className: "settings-screen" });

  const toggle = document.querySelector("#requirePreviousLessons");
  const descriptionEl = document.querySelector("#lockingDescription");
  const saveState = document.querySelector("#settingSaveState");
  toggle.addEventListener("change", async () => {
    const checked = Boolean(toggle.checked);
    const previous = userSettings;
    const next = { ...userSettings, requirePreviousLessons: checked };
    descriptionEl.textContent = checked
      ? "Complete lessons in order before later lessons unlock."
      : "You can open any lesson. Your actual completion and mastery progress will not change.";
    saveState.textContent = "Saving…";
    try {
      await repo.upsertSettings(next);
      userSettings = next;
      saveState.textContent = "Saved";
      setTimeout(() => { if (saveState) saveState.textContent = ""; }, 1400);
    } catch (err) {
      userSettings = previous;
      toggle.checked = previous?.requirePreviousLessons !== false;
      descriptionEl.textContent = toggle.checked
        ? "Complete lessons in order before later lessons unlock."
        : "You can open any lesson. Your actual completion and mastery progress will not change.";
      saveState.textContent = "Couldn’t save";
    }
  });
}

'''
    s = replace_between(s, 'function skillStatus(skill, evidence, readyIds, accessAllowed = true) {', 'function renderToday() {', curriculum_account, "curriculum/profile/settings")

    home = r'''async function renderToday() {
  const p = state.session.plan;
  const [records, due] = await Promise.all([
    repo.allSkillStates(USER_ID),
    repo.dueReviews(USER_ID, new Date().toISOString()),
  ]);
  const summary = progressSummary(records);
  const item = state.queue[state.itemIndex] ?? null;
  const skill = item ? SKILL_BY_ID.get(item.skillId) : null;
  const kindLabel = item?.kind === "review" ? "Review due" : item?.kind === "repair" || item?.kind === "review-repair" ? "Quick repair" : "Continue learning";
  const mainTitle = skill?.title ?? "You’re caught up.";
  const mainCopy = skill ? `${skillPhase(skill.id)} • ${planCountLabel(p)}` : "Nothing meaningful is due right now.";

  root.innerHTML = shellHtml(`
    ${topbarHtml("Today", { eyebrow: "Theory Tutor", subtitle: persistenceMode === "supabase" ? "Synced to your account" : "Saved on this device" })}
    <section class="focus-card">
      <div class="focus-kicker">${esc(kindLabel)}</div>
      <div class="focus-phase">${skill ? esc(skillPhase(skill.id)) : "Today"}</div>
      <h1>${esc(mainTitle)}</h1>
      <p>${esc(mainCopy)}</p>
      <button class="primary" id="startBtn" type="button">${state.queue.length ? (item?.kind === "review" || item?.kind === "repair" ? "Start review" : "Continue") : "Finish for today"}</button>
    </section>
    <section class="home-summary">
      <div class="summary-card"><div class="summary-icon">${icon("review", 19)}</div><div><strong>${due.length}</strong><span>Reviews due</span></div></div>
      <div class="summary-card"><div class="summary-icon">${icon("spark", 19)}</div><div><strong>${summary.overall}%</strong><span>Overall progress</span></div></div>
    </section>
    <button class="row-link" id="curriculumBtn" type="button"><span><strong>Curriculum</strong><small>Browse phases and lessons</small></span>${icon("chevron", 20)}</button>`, { activeNav: "home", className: "home-screen" });
  document.querySelector("#startBtn").onclick = state.queue.length ? () => beginItem().catch(showFatal) : () => finishSession().catch(showFatal);
  document.querySelector("#curriculumBtn").onclick = () => renderCurriculum().catch(showFatal);
}

'''
    s = replace_between(s, 'function renderToday() {', 'async function beginItem() {', home, "home screen")

    lesson = r'''function renderLessonStep(item, label = "Learn", pageIndex = 0) {
  const pages = lessonPagesFor(item);
  const page = pages[Math.min(pageIndex, pages.length - 1)];
  const skill = SKILL_BY_ID.get(item.skillId);
  const pct = pages.length ? Math.round(((pageIndex + 1) / pages.length) * 100) : 100;
  state.lessonVisible = true;
  root.innerHTML = shellHtml(`
    ${topbarHtml("Lesson", { backTarget: "session", eyebrow: skill ? `Phase ${skill.phase}` : label, subtitle: skill?.title ?? "" })}
    <div class="study-progress">${progressBarHtml(pct)}</div>
    <section class="lesson-content">
      <div class="lesson-type">${esc(page.eyebrow)}</div>
      <h1>${esc(page.title)}</h1>
      <div class="lesson-copy">${esc(page.body)}</div>
      ${page.example ? `<div class="lesson-example"><span>Example</span><strong>${esc(page.example)}</strong></div>` : ""}
      <div class="lesson-footer"><span>${pageIndex + 1} of ${pages.length}</span><button class="primary" id="lessonTry" type="button">${pageIndex < pages.length - 1 ? "Continue" : (item.kind === "review-repair" ? "Try again" : "Try it")}</button></div>
    </section>`, { className: "lesson-screen" });
  document.querySelector("#lessonTry").onclick = async () => {
    if (pageIndex < pages.length - 1) return renderLessonStep(item, label, pageIndex + 1);
    state.lessonVisible = false;
    if (item.kind === "review-repair") state.supportedNext = true;
    await loadExercise(item);
  };
}

'''
    s = replace_between(s, 'function renderLessonStep(item, label = "Learn", pageIndex = 0) {', 'async function loadExercise(item) {', lesson, "lesson screen")

    practice = r'''function answerHtml(spec) {
  if (spec.kind === "self-check") {
    return `<div class="practice-note">Do this on your instrument, then choose how it went.</div>`;
  }
  if (spec.kind === "choice") {
    return `<div class="answer-stack choices">${spec.choices.map((c) => `<button class="choice" data-choice="${esc(c)}" type="button">${esc(c)}</button>`).join("")}</div>`;
  }
  if (spec.kind === "two-sequences") {
    return `<div class="form-stack">
      <label class="field-group"><span>Ascending</span><input class="answer-input" id="ascending" autocomplete="off" placeholder="A B C D…"></label>
      <label class="field-group"><span>Descending</span><input class="answer-input" id="descending" autocomplete="off" placeholder="A G F E…"></label>
      <div class="hint">You can type #, ♯, sharp, b, ♭, or flat. Spaces and hyphens are fine.</div>
    </div>`;
  }
  if (spec.kind === "key-signature") {
    return `<div class="form-stack"><input class="answer-input" id="count" type="number" min="0" max="7" placeholder="Number of accidentals"><select id="accType"><option value="none">None</option><option value="sharp">Sharps</option><option value="flat">Flats</option></select></div>`;
  }
  const placeholder = spec.kind === "sequence" ? "C E G" : spec.kind === "progression" ? "C G Am F" : spec.kind === "number" ? "6" : "Your answer";
  const hint = spec.kind === "sequence" ? "Separate notes with spaces or commas. You can type #, ♯, sharp, b, ♭, or flat." : spec.kind === "progression" ? "Enter chord symbols separated by spaces or commas, e.g. C G Am F." : "";
  return `<div class="form-stack"><input class="answer-input" id="mainAnswer" ${spec.kind === "number" ? 'type="number"' : 'type="text"'} autocomplete="off" placeholder="${esc(placeholder)}">${hint ? `<div class="hint">${esc(hint)}</div>` : ""}</div>`;
}

function feedbackHtml() {
  if (!state.feedback) return "";
  const f = state.feedback;
  const expected = f.expected ? `<div class="expected"><span>Correct answer</span><strong>${esc(f.expected)}</strong></div>` : "";
  return `<div class="feedback ${f.correct ? "correct" : "wrong"}" role="status">
    <div class="feedback-head">${icon(f.correct ? "checkCircle" : "xCircle", 22)}<strong>${f.correct ? "Correct" : "Not quite"}</strong></div>
    ${expected}
    <div class="feedback-detail">${esc(f.detail ?? (f.correct ? "Nice retrieval." : "Use the correction, then try the next one."))}</div>
  </div>`;
}

function renderPractice() {
  const item = state.queue[state.itemIndex];
  const e = state.currentExercise;
  const skill = SKILL_BY_ID.get(item.skillId);
  const pct = Math.round(((state.itemIndex + 1) / Math.max(1, state.queue.length)) * 100);
  const contextLabel = item.kind === "review" ? "Review" : item.kind === "repair" || item.kind === "review-repair" ? "Repair" : item.kind === "new" ? "New" : "Practice";
  root.innerHTML = shellHtml(`
    ${topbarHtml(contextLabel, { backTarget: "session", eyebrow: skill ? `Phase ${skill.phase}` : "Practice", subtitle: skill?.title ?? "" })}
    <div class="study-progress">${progressBarHtml(pct)}</div>
    <section class="question-shell">
      <div class="question-meta"><span>Question ${state.itemIndex + 1} of ${state.queue.length}</span><span>${esc(contextLabel)}</span></div>
      ${state.supportedNext ? `<div class="practice-note"><strong>Quick retry</strong><span>Use the example if you need it. This one is practice, not a mastery check.</span></div>` : ""}
      <div class="prompt">${esc(e.prompt)}</div>
      ${exerciseVisualHtml(e)}
      ${answerHtml(state.currentSpec)}
      ${feedbackHtml()}
      <div class="actions" id="actionArea">${actionButtons(item)}</div>
    </section>`, { className: "practice-screen" });
  bindPracticeHandlers(item);
}

'''
    s = replace_between(s, 'function answerHtml(spec) {', 'function actionButtons(item) {', practice, "practice screen")

    old_manual = '''  if (state.itemIndex >= state.queue.length && state.manualStudy) {
    const previous = state.manualStudy;
    state.manualStudy = null;
    state.queue = previous.queue;
    state.itemIndex = previous.itemIndex;
    state.fastPathPasses = previous.fastPathPasses;
    return renderCurriculum();
  }
'''
    new_manual = '''  if (state.itemIndex >= state.queue.length && state.manualStudy) {
    const previous = state.manualStudy;
    state.manualStudy = null;
    state.queue = previous.queue;
    state.itemIndex = previous.itemIndex;
    state.fastPathPasses = previous.fastPathPasses;
    return renderPhase(previous.phase);
  }
'''
    s = replace_once(s, old_manual, new_manual, "manual study return")

    done = r'''async function finishSession() {
  if (state.session?.sessionId) await service.finishSession(USER_ID, state.session.sessionId, "planned-work-complete", new Date());
  root.innerHTML = shellHtml(`
    ${topbarHtml("Done", { eyebrow: "Session complete" })}
    <section class="completion-panel">
      <div class="completion-icon">${icon("check", 28)}</div>
      <h1>Nice work.</h1>
      <p>Your results are saved. Reviews will come back when they are useful again.</p>
      ${state.stoppedSkillIds.size ? `<div class="soft-note">One skill needs another short pass later. The app stopped instead of drilling it.</div>` : ""}
      <button class="primary" id="backToday" type="button">Back to Home</button>
    </section>`, { className: "completion-screen" });
  document.querySelector("#backToday").onclick = () => loadToday().catch(showFatal);
}

function showFatal(err) {
  console.error(err);
  root.innerHTML = shellHtml(`
    ${topbarHtml("Something went wrong")}
    <section class="error-panel"><div class="error-icon">${icon("xCircle", 24)}</div><p>${esc(err?.message ?? err)}</p><button class="primary" id="retry" type="button">Reload</button></section>`, { className: "error-screen" });
  document.querySelector("#retry").onclick = () => location.reload();
}

'''
    s = replace_between(s, 'async function finishSession() {', 'boot().catch(showFatal);', done, "completion/error")
    path.write_text(s)


# ---------- 2026 design system ----------
Path("web/styles.css").write_text(r''':root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color-scheme: dark;
  font-synthesis: none;
  --bg: #0b0d12;
  --surface: #12151c;
  --surface-2: #171b24;
  --surface-3: #1d2230;
  --text: #f5f7fb;
  --muted: #9aa3b2;
  --subtle: #6f7888;
  --border: rgba(255,255,255,.08);
  --border-strong: rgba(255,255,255,.14);
  --accent: #8b7cff;
  --accent-hover: #9b8fff;
  --accent-soft: rgba(139,124,255,.13);
  --success: #72d6a1;
  --success-soft: rgba(114,214,161,.10);
  --danger: #ff8f8f;
  --danger-soft: rgba(255,143,143,.10);
  --radius-sm: 12px;
  --radius: 16px;
  --radius-lg: 22px;
  --shadow: 0 18px 50px rgba(0,0,0,.24);
}
* { box-sizing: border-box; }
html { background: var(--bg); }
body { margin: 0; min-height: 100vh; background: var(--bg); color: var(--text); overflow-x: hidden; }
button, input, select { font: inherit; }
button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
button:disabled { cursor: default; }
button, input, select { min-height: 48px; }
button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.app-shell { width: min(100%, 720px); min-height: 100vh; margin: 0 auto; padding: max(18px, env(safe-area-inset-top)) 16px calc(104px + env(safe-area-inset-bottom)); }
.screen { animation: screen-in .16s ease-out; }
@keyframes screen-in { from { opacity: .6; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
.ui-icon { display: block; flex: 0 0 auto; }
.page-header { min-height: 62px; display: grid; grid-template-columns: 44px minmax(0,1fr) 44px; gap: 10px; align-items: center; margin-bottom: 18px; }
.page-header-leading, .page-header-action { min-width: 44px; }
.page-header-copy { min-width: 0; text-align: center; }
.page-kicker { color: var(--accent); font-size: .72rem; font-weight: 750; letter-spacing: .04em; margin-bottom: 3px; }
.page-title { font-size: 1.28rem; font-weight: 780; letter-spacing: -.025em; line-height: 1.15; }
.page-subtitle { color: var(--muted); font-size: .78rem; line-height: 1.35; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.brand-mark, .auth-logo { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 13px; background: var(--accent-soft); color: var(--accent); font-weight: 850; }
.icon-button { width: 44px; height: 44px; min-height: 44px; display: grid; place-items: center; border: 0; border-radius: 12px; background: transparent; color: var(--muted); padding: 0; transition: background .14s ease, color .14s ease, transform .1s ease; }
.icon-button:hover { background: var(--surface-2); color: var(--text); }
.icon-button:active { transform: scale(.96); }
.bottom-nav { position: fixed; z-index: 20; left: 50%; bottom: 0; transform: translateX(-50%); width: min(100%, 560px); display: grid; grid-template-columns: repeat(3,1fr); gap: 4px; padding: 8px 12px max(8px, env(safe-area-inset-bottom)); background: #11141b; border-top: 1px solid var(--border); box-shadow: 0 -12px 30px rgba(0,0,0,.18); }
.nav-item { min-height: 56px; border: 0; border-radius: 14px; background: transparent; color: var(--subtle); display: grid; place-items: center; align-content: center; gap: 4px; padding: 6px 10px; font-size: .7rem; font-weight: 700; transition: color .14s ease, background .14s ease, transform .1s ease; }
.nav-item .ui-icon { width: 21px; height: 21px; }
.nav-item.active { color: var(--accent); background: var(--accent-soft); }
.nav-item:active { transform: scale(.97); }
.primary, .secondary, .ghost-button, .choice { border-radius: 14px; border: 1px solid transparent; padding: 13px 16px; font-weight: 760; transition: background .14s ease, border-color .14s ease, transform .1s ease, opacity .14s ease; }
.primary { width: 100%; background: var(--accent); color: #fff; box-shadow: 0 8px 22px rgba(88,70,210,.22); }
.primary:hover { background: var(--accent-hover); }
.primary:active, .secondary:active, .choice:active, .ghost-button:active { transform: scale(.985); }
.primary:disabled, .secondary:disabled { opacity: .45; }
.secondary { width: 100%; background: var(--surface-2); border-color: var(--border); color: var(--text); }
.ghost-button { min-height: 42px; background: transparent; color: var(--muted); padding: 9px 10px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; }
.muted { color: var(--muted); line-height: 1.55; }
.focus-card { padding: 22px; background: var(--surface); border: 1px solid rgba(139,124,255,.28); border-radius: var(--radius-lg); box-shadow: var(--shadow); }
.focus-kicker { color: var(--accent); font-size: .78rem; font-weight: 780; margin-bottom: 20px; }
.focus-phase { color: var(--muted); font-size: .78rem; font-weight: 700; margin-bottom: 6px; }
.focus-card h1 { margin: 0; font-size: clamp(1.7rem, 7vw, 2.35rem); line-height: 1.06; letter-spacing: -.045em; }
.focus-card p { margin: 10px 0 22px; color: var(--muted); line-height: 1.5; font-size: .9rem; }
.home-summary { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; margin: 12px 0; }
.summary-card { min-height: 84px; display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.summary-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px; background: var(--accent-soft); color: var(--accent); }
.summary-card div:last-child { display: grid; gap: 2px; }
.summary-card strong { font-size: 1.12rem; }
.summary-card span { color: var(--muted); font-size: .74rem; }
.row-link { width: 100%; min-height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 13px 15px; text-align: left; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); }
.row-link > span { display: grid; gap: 3px; }
.row-link strong { font-size: .92rem; }
.row-link small { color: var(--muted); font-size: .75rem; }
.soft-note { margin-bottom: 14px; padding: 12px 14px; border-radius: 13px; background: var(--accent-soft); color: #c9c3ff; font-size: .8rem; line-height: 1.45; }
.progress-block { display: grid; gap: 8px; }
.progress-label, .phase-card-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: .76rem; color: var(--muted); }
.progress-label strong, .phase-card-meta strong { color: var(--text); }
.progress-track { height: 7px; border-radius: 999px; overflow: hidden; background: #252a36; }
.progress-bar { height: 100%; border-radius: inherit; background: var(--accent); transition: width .22s ease; }
.phase-list { display: grid; gap: 10px; }
.phase-card { width: 100%; text-align: left; display: grid; gap: 12px; padding: 16px; border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: var(--radius); transition: background .14s ease, border-color .14s ease, transform .1s ease; }
.phase-card:not(:disabled):hover { background: var(--surface-2); border-color: var(--border-strong); }
.phase-card:not(:disabled):active { transform: scale(.992); }
.phase-card.current { border-color: rgba(139,124,255,.45); background: var(--accent-soft); }
.phase-card.locked { opacity: .5; }
.phase-card-top { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
.phase-card h2 { margin: 3px 0 0; font-size: 1rem; letter-spacing: -.018em; }
.phase-label { color: var(--muted); font-size: .7rem; font-weight: 760; }
.phase-state { display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; font-size: .7rem; color: var(--muted); font-weight: 720; }
.phase-state.current, .phase-state.available { color: var(--accent); }
.phase-state.complete { color: var(--success); }
.phase-card-meta { font-size: .7rem; }
.phase-overview { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 12px; }
.lesson-list { overflow: hidden; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.lesson-row { width: 100%; min-height: 66px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 15px; text-align: left; border: 0; border-bottom: 1px solid var(--border); background: transparent; color: var(--text); }
.lesson-row:last-child { border-bottom: 0; }
.lesson-row:not(:disabled):hover { background: var(--surface-2); }
.lesson-row:disabled { opacity: .48; }
.lesson-row-copy { min-width: 0; display: grid; gap: 3px; }
.lesson-row-copy strong { font-size: .88rem; line-height: 1.3; }
.lesson-row-copy small { color: var(--subtle); font-size: .7rem; }
.lesson-row-end { display: flex; align-items: center; gap: 8px; color: var(--subtle); }
.status-chip { border-radius: 999px; padding: 5px 8px; border: 1px solid var(--border); background: var(--surface-2); color: var(--muted); font-size: .66rem; font-weight: 740; white-space: nowrap; }
.status-chip.ready, .status-chip.retained { color: var(--success); background: var(--success-soft); border-color: rgba(114,214,161,.20); }
.status-chip.current, .status-chip.available { color: var(--accent); background: var(--accent-soft); border-color: rgba(139,124,255,.22); }
.status-chip.repair { color: var(--danger); background: var(--danger-soft); border-color: rgba(255,143,143,.2); }
.profile-hero { display: grid; grid-template-columns: 58px minmax(0,1fr); gap: 14px; align-items: center; padding: 4px 2px 16px; }
.profile-avatar { width: 58px; height: 58px; display: grid; place-items: center; border-radius: 18px; background: var(--accent-soft); border: 1px solid rgba(139,124,255,.22); color: var(--accent); font-size: 1.4rem; font-weight: 820; }
.profile-identity-copy { min-width: 0; }
.profile-identity-copy h1 { margin: 0; font-size: 1.55rem; letter-spacing: -.035em; overflow: hidden; text-overflow: ellipsis; }
.profile-identity-copy p { margin: 4px 0 0; color: var(--muted); font-size: .78rem; }
.profile-identity-copy p span { color: var(--subtle); margin: 0 3px; }
.profile-hero .ghost-button { grid-column: 1 / -1; justify-self: start; }
.profile-progress { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.stat-strip { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); margin: 12px 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.stat-strip > div { display: grid; gap: 4px; padding: 14px 8px; text-align: center; border-right: 1px solid var(--border); }
.stat-strip > div:last-child { border-right: 0; }
.stat-strip strong { font-size: 1.18rem; }
.stat-strip span { color: var(--muted); font-size: .68rem; }
.compact-section { margin-top: 12px; }
.section-heading { padding: 8px 3px; color: var(--muted); font-size: .74rem; font-weight: 740; }
.current-learning-row, .activity-list, .menu-list, .settings-surface, .form-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.current-learning-row { min-height: 68px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.current-learning-row > div { display: grid; gap: 3px; }
.current-learning-row span { color: var(--muted); font-size: .7rem; }
.current-learning-row strong { font-size: .88rem; }
.activity-row { min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: .78rem; color: var(--muted); }
.activity-row:last-child { border-bottom: 0; }
.activity-row strong { color: var(--text); font-weight: 650; }
.empty-row { padding: 14px; color: var(--muted); font-size: .78rem; }
.member-since { color: var(--subtle); font-size: .7rem; padding: 8px 3px 0; }
.menu-list { margin-top: 16px; }
.menu-row, .settings-link { width: 100%; min-height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border: 0; border-bottom: 1px solid var(--border); background: transparent; color: var(--text); text-align: left; }
.menu-row:last-child, .settings-link:last-child { border-bottom: 0; }
.menu-row > span:nth-child(2) { flex: 1; }
.menu-row-icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 10px; color: var(--accent); background: var(--accent-soft); }
.danger { color: var(--danger) !important; }
.settings-group { margin-bottom: 18px; }
.settings-title { color: var(--muted); font-size: .74rem; font-weight: 760; padding: 0 4px 8px; }
.setting-row { min-height: 78px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 13px 14px; }
.setting-copy { min-width: 0; display: grid; gap: 4px; }
.setting-copy strong { font-size: .9rem; }
.setting-copy span { color: var(--muted); font-size: .76rem; line-height: 1.4; }
.save-state { min-height: 14px; color: var(--success); font-size: .68rem; }
.switch { position: relative; flex: 0 0 auto; width: 48px; height: 28px; }
.switch input { position: absolute; opacity: 0; width: 1px; height: 1px; min-height: 0; }
.switch-track { position: absolute; inset: 0; border-radius: 999px; background: #2b303d; border: 1px solid var(--border-strong); transition: background .16s ease, border-color .16s ease; }
.switch-track::after { content: ""; position: absolute; width: 20px; height: 20px; top: 3px; left: 3px; border-radius: 50%; background: #aab1bd; transition: transform .16s ease, background .16s ease; }
.switch input:checked + .switch-track { background: var(--accent); border-color: var(--accent); }
.switch input:checked + .switch-track::after { transform: translateX(20px); background: white; }
.settings-link > span { display: flex; align-items: center; gap: 10px; }
.settings-info { min-height: 58px; display: grid; gap: 3px; padding: 10px 14px; border-bottom: 1px solid var(--border); }
.settings-info span { color: var(--muted); font-size: .7rem; }
.settings-info strong { font-size: .8rem; overflow-wrap: anywhere; }
.form-panel { padding: 16px; }
.form-stack { display: grid; gap: 12px; }
.field-group { display: grid; gap: 7px; color: var(--muted); font-size: .76rem; font-weight: 650; }
.answer-input, select { width: 100%; min-height: 50px; border: 1px solid var(--border-strong); background: #0f1218; color: var(--text); border-radius: 13px; padding: 12px 14px; outline: none; }
.answer-input:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.auth-wrap { width: min(100%, 440px); margin: 7vh auto 0; }
.auth-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 0 3px; }
.auth-brand > div:last-child { display: grid; gap: 2px; }
.auth-brand strong { font-size: 1rem; }
.auth-brand span { color: var(--muted); font-size: .75rem; }
.auth-panel { padding: 22px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow); }
.auth-panel h1 { margin: 5px 0 8px; font-size: 1.85rem; line-height: 1.08; letter-spacing: -.04em; }
.auth-panel > p { margin: 0 0 18px; font-size: .86rem; }
.inline-message { margin: 0 0 14px; padding: 11px 13px; border-radius: 12px; color: var(--success); background: var(--success-soft); border: 1px solid rgba(114,214,161,.16); font-size: .78rem; line-height: 1.4; }
.inline-message.error { color: var(--danger); background: var(--danger-soft); border-color: rgba(255,143,143,.18); }
.study-progress { margin: -8px 0 18px; }
.lesson-content, .question-shell, .completion-panel, .error-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
.lesson-type { color: var(--accent); font-size: .72rem; font-weight: 760; margin-bottom: 8px; }
.lesson-content h1 { margin: 0; font-size: clamp(1.7rem,7vw,2.35rem); line-height: 1.08; letter-spacing: -.04em; }
.lesson-copy { margin: 20px 0; font-size: 1.04rem; line-height: 1.6; color: #e8ebf1; }
.lesson-example { display: grid; gap: 6px; margin: 18px 0 22px; padding: 14px; border-radius: 13px; background: var(--surface-2); border: 1px solid var(--border); }
.lesson-example span { color: var(--muted); font-size: .7rem; font-weight: 720; }
.lesson-example strong { line-height: 1.45; font-size: .92rem; }
.lesson-footer { display: grid; gap: 12px; }
.lesson-footer > span { color: var(--subtle); font-size: .72rem; text-align: center; }
.question-meta { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); font-size: .72rem; margin-bottom: 18px; }
.prompt { font-size: clamp(1.35rem,5vw,1.8rem); line-height: 1.32; font-weight: 760; letter-spacing: -.025em; margin: 0 0 22px; }
.answer-stack { display: grid; gap: 10px; }
.choice { width: 100%; min-height: 54px; text-align: left; background: var(--surface-2); border-color: var(--border); color: var(--text); font-weight: 650; }
.choice:hover { border-color: var(--border-strong); background: var(--surface-3); }
.choice.selected { border-color: var(--accent); background: var(--accent-soft); color: #fff; }
.hint, .practice-note { color: var(--muted); font-size: .76rem; line-height: 1.45; }
.practice-note { margin-bottom: 16px; padding: 12px 13px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; display: grid; gap: 4px; }
.practice-note strong { color: var(--text); }
.feedback { margin-top: 16px; padding: 14px; border-radius: 13px; border: 1px solid transparent; display: grid; gap: 8px; }
.feedback.correct { color: var(--success); background: var(--success-soft); border-color: rgba(114,214,161,.18); }
.feedback.wrong { color: var(--danger); background: var(--danger-soft); border-color: rgba(255,143,143,.18); }
.feedback-head { display: flex; align-items: center; gap: 8px; }
.feedback-detail { color: #d4d8e0; font-size: .8rem; line-height: 1.45; }
.expected { display: grid; gap: 3px; padding-top: 4px; color: var(--text); }
.expected span { color: var(--muted); font-size: .68rem; }
.actions { margin-top: 16px; }
.self-check-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mini-keyboard { position: relative; height: 126px; display: grid; grid-template-columns: repeat(7,1fr); margin: -4px 0 22px; border: 1px solid var(--border-strong); border-radius: 12px; overflow: hidden; background: #050609; }
.white-key { position: relative; background: #eceef2; border-right: 1px solid #a8adb6; min-width: 0; }
.white-key:last-child { border-right: 0; }
.white-key.active { background: #d9d5ff; box-shadow: inset 0 -7px 0 rgba(139,124,255,.55); }
.black-key { position: absolute; z-index: 2; top: 0; right: -18%; width: 36%; height: 62%; background: #090a0d; border-radius: 0 0 4px 4px; }
.completion-panel { text-align: center; padding-top: 28px; }
.completion-icon, .error-icon { width: 58px; height: 58px; display: grid; place-items: center; margin: 0 auto 16px; border-radius: 18px; background: var(--accent-soft); color: var(--accent); }
.completion-panel h1 { margin: 0; font-size: 2rem; letter-spacing: -.04em; }
.completion-panel p { color: var(--muted); line-height: 1.5; margin: 8px auto 20px; max-width: 420px; }
.error-panel { text-align: center; }
.error-panel p { color: var(--muted); line-height: 1.5; overflow-wrap: anywhere; }
.loading-state { min-height: 50vh; display: grid; place-items: center; align-content: center; gap: 12px; color: var(--muted); font-size: .8rem; }
.loading-mark { width: 28px; height: 28px; border: 2px solid var(--border-strong); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (min-width: 700px) {
  .app-shell { padding-left: 24px; padding-right: 24px; padding-top: max(30px, env(safe-area-inset-top)); }
  .page-header { grid-template-columns: 48px minmax(0,1fr) 48px; margin-bottom: 22px; }
  .page-title { font-size: 1.42rem; }
  .focus-card { padding: 28px; }
  .profile-hero { grid-template-columns: 64px minmax(0,1fr) auto; padding: 8px 2px 18px; }
  .profile-avatar { width: 64px; height: 64px; }
  .profile-hero .ghost-button { grid-column: auto; justify-self: end; }
  .lesson-content, .question-shell, .completion-panel, .error-panel { padding: 28px; }
  .bottom-nav { bottom: 12px; border: 1px solid var(--border); border-radius: 20px; padding: 7px 10px; box-shadow: 0 16px 44px rgba(0,0,0,.34); }
}

@media (max-width: 390px) {
  .app-shell { padding-left: 12px; padding-right: 12px; }
  .page-header { grid-template-columns: 42px minmax(0,1fr) 42px; gap: 6px; }
  .home-summary { gap: 8px; }
  .summary-card { padding: 12px 10px; gap: 9px; }
  .summary-icon { width: 31px; height: 31px; }
  .stat-strip > div { padding-left: 5px; padding-right: 5px; }
  .stat-strip span { font-size: .64rem; }
  .lesson-row { padding-left: 12px; padding-right: 12px; }
  .status-chip { display: none; }
  .self-check-actions { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
}
''')


# ---------- Index shell ----------
index = Path("web/index.html")
html = index.read_text()
html = html.replace('<meta name="theme-color" content="#f7f6f2">', '<meta name="theme-color" content="#0b0d12">')
html = html.replace('<main class="app-shell" id="app"><div class="card">Loading…</div></main>', '<main class="app-shell" id="app"><div class="loading-state"><div class="loading-mark"></div><span>Loading your study plan…</span></div></main>')
index.write_text(html)


# ---------- Static UI contract tests ----------
Path("tests/ui-redesign.test.mjs").write_text(r'''import assert from "node:assert/strict";
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
''')

print("2026 UI redesign applied")
