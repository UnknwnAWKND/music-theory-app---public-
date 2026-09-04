import {
  BrowserStorageTutorRepository,
  CURRICULUM_PHASES,
  CURRICULUM_VERSION,
  SKILLS,
  SupabaseRestTutorRepository,
} from "./core/index.js";
import {
  createSupabaseBrowserClient,
  getAccessToken,
  getSession,
  hasSupabaseConfig,
  runtimeConfig,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from "./runtime.js";

const config = runtimeConfig();
const root = document.querySelector("#app");
const LOCAL_USER_ID = "local-preview";
const LOCAL_STORAGE_KEY = "music-theory-tutor:block1-empty";
const LEGACY_APP_STORAGE_KEYS = ["music-theory-tutor:v0.7-preview", "music-theory-tutor:v1"];
const DEFAULT_SETTINGS = (userId) => ({
  userId,
  desiredRetention: 0.9,
  maximumIntervalDays: 36500,
  requirePreviousLessons: true,
  curriculumVersion: CURRICULUM_VERSION,
  schedulerVersion: "fsrs-6",
});

const state = {
  client: null,
  repo: null,
  session: null,
  userId: null,
  profile: null,
  settings: null,
  screen: "home",
  busy: false,
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function purgeLegacyLocalAppData() {
  for (const key of LEGACY_APP_STORAGE_KEYS) localStorage.removeItem(key);
}

function safeMessage(error) {
  const text = String(error?.message ?? error ?? "Something went wrong.");
  if (/supabase|postgres|rest\/v1|permission|jwt|sql/i.test(text)) return "The app could not load your account data. Please try again.";
  return text;
}

function navigate(screen, replace = false) {
  state.screen = screen;
  const hash = `#/${screen}`;
  if (replace) history.replaceState({ screen }, "", hash);
  else if (location.hash !== hash) history.pushState({ screen }, "", hash);
  render();
}

function screenFromLocation() {
  const value = location.hash.replace(/^#\/?/, "");
  return ["home", "learn", "profile", "settings"].includes(value) ? value : "home";
}

function shell(content, active = state.screen) {
  return `<div class="screen block1-shell">
    <main class="screen-content">${content}</main>
    <nav class="bottom-nav" aria-label="Primary">
      <button class="nav-item ${active === "home" ? "active" : ""}" data-nav="home" type="button"><span>Home</span></button>
      <button class="nav-item ${active === "learn" ? "active" : ""}" data-nav="learn" type="button"><span>Learn</span></button>
      <button class="nav-item ${active === "profile" || active === "settings" ? "active" : ""}" data-nav="profile" type="button"><span>Profile</span></button>
    </nav>
  </div>`;
}

function bindNav() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });
}

function emptyCurriculumCard() {
  return `<section class="focus-card empty-curriculum-state">
    <div class="eyebrow">Curriculum</div>
    <h1>Curriculum is being rebuilt.</h1>
    <p>The previous curriculum has been removed. New lessons will be added from a clean foundation.</p>
  </section>`;
}

async function ensureFreshAccountState() {
  const userId = state.userId;
  let profile = await state.repo.getProfile(userId);
  if (!profile) {
    const fallback = state.session?.user?.email?.split("@")[0] || "Learner";
    await state.repo.upsertProfile(userId, fallback);
    profile = await state.repo.getProfile(userId);
  }
  let settings = await state.repo.getSettings(userId);
  if (!settings || settings.curriculumVersion !== CURRICULUM_VERSION) {
    settings = { ...(settings ?? DEFAULT_SETTINGS(userId)), curriculumVersion: CURRICULUM_VERSION, schedulerVersion: "fsrs-6" };
    await state.repo.upsertSettings(settings);
  }
  state.profile = profile;
  state.settings = settings;
}

async function bootstrapSignedIn() {
  state.userId = state.session?.user?.id ?? LOCAL_USER_ID;
  if (state.client) {
    state.repo = new SupabaseRestTutorRepository({
      url: config.supabaseUrl,
      publishableKey: config.supabasePublishableKey,
      getAccessToken: () => getAccessToken(state.client),
    });
  } else {
    purgeLegacyLocalAppData();
    state.repo = new BrowserStorageTutorRepository(localStorage, LOCAL_STORAGE_KEY);
  }
  await ensureFreshAccountState();
  state.screen = screenFromLocation();
  navigate(state.screen, true);
}

function renderAuth(message = "") {
  root.innerHTML = `<div class="auth-shell">
    <section class="auth-card">
      <div class="eyebrow">Music Theory</div>
      <h1>Sign in</h1>
      <p>Your account stays the same while the curriculum is rebuilt.</p>
      ${message ? `<div class="auth-message">${esc(message)}</div>` : ""}
      <form id="authForm">
        <label>Email<input id="email" type="email" autocomplete="email" required></label>
        <label>Password<input id="password" type="password" autocomplete="current-password" required></label>
        <button class="primary" type="submit">Sign in</button>
        <button class="secondary" id="createAccount" type="button">Create account</button>
      </form>
    </section>
  </div>`;
  document.querySelector("#authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.busy) return;
    state.busy = true;
    try {
      const email = document.querySelector("#email").value.trim();
      const password = document.querySelector("#password").value;
      state.session = await signInWithPassword(state.client, email, password);
      await bootstrapSignedIn();
    } catch (error) { renderAuth(safeMessage(error)); }
    finally { state.busy = false; }
  });
  document.querySelector("#createAccount").addEventListener("click", async () => {
    if (state.busy) return;
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    if (!email || !password) return renderAuth("Enter an email and password first.");
    state.busy = true;
    try {
      const result = await signUpWithPassword(state.client, email, password);
      if (result.session) { state.session = result.session; await bootstrapSignedIn(); }
      else renderAuth("Account created. Check your email if confirmation is required, then sign in.");
    } catch (error) { renderAuth(safeMessage(error)); }
    finally { state.busy = false; }
  });
}

async function renderHome() {
  const states = await state.repo.allSkillStates(state.userId);
  const due = await state.repo.dueReviews(state.userId, new Date().toISOString());
  const ready = states.filter((row) => row.evidence.ready).length;
  const retained = states.filter((row) => row.evidence.retained).length;
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Music Theory</div><h1>Home</h1></div></header>
    ${emptyCurriculumCard()}
    <section class="stats-grid">
      <div class="stat-card"><strong>${ready}</strong><span>Ready</span></div>
      <div class="stat-card"><strong>${retained}</strong><span>Retained</span></div>
      <div class="stat-card"><strong>${due.length}</strong><span>Reviews due</span></div>
    </section>`);
  bindNav();
}

async function renderLearn() {
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Learning</div><h1>Learn</h1></div></header>
    ${emptyCurriculumCard()}
    <section class="soft-note">The six-phase curriculum structure is ready, but Block 1 intentionally contains zero lessons and zero question pools.</section>`, "learn");
  bindNav();
}

async function renderProfile() {
  const name = state.profile?.displayName || "Learner";
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Account</div><h1>${esc(name)}</h1></div></header>
    <section class="menu-card">
      <button class="menu-row" id="settingsButton" type="button"><span>Settings</span><span>›</span></button>
      ${state.client ? `<button class="menu-row danger" id="signOutButton" type="button"><span>Sign out</span><span>›</span></button>` : ""}
    </section>`, "profile");
  bindNav();
  document.querySelector("#settingsButton").onclick = () => navigate("settings");
  const signOutButton = document.querySelector("#signOutButton");
  if (signOutButton) signOutButton.onclick = async () => {
    await signOut(state.client);
    state.session = null; state.repo = null; state.userId = null; state.profile = null; state.settings = null;
    history.replaceState({}, "", location.pathname);
    renderAuth();
  };
}

async function renderSettings() {
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Profile</div><h1>Settings</h1></div></header>
    <section class="settings-screen">
      <div class="settings-group">
        <div class="settings-group-title">Learning</div>
        <label class="settings-row"><span><strong>Require Previous Lessons</strong><small>Keep prerequisite locking on when the new curriculum arrives.</small></span><input id="guidedToggle" type="checkbox" ${state.settings?.requirePreviousLessons !== false ? "checked" : ""}></label>
      </div>
      <div class="settings-group">
        <div class="settings-group-title">Account</div>
        <label class="settings-row settings-field"><span><strong>Display name</strong></span><input id="displayName" type="text" maxlength="80" value="${esc(state.profile?.displayName || "Learner")}"></label>
      </div>
      <div class="soft-note">Curriculum version: ${esc(CURRICULUM_VERSION)} · ${CURRICULUM_PHASES.length} future phases · ${SKILLS.length} active lessons</div>
    </section>`, "profile");
  bindNav();
  document.querySelector("#guidedToggle").addEventListener("change", async (event) => {
    state.settings = { ...state.settings, requirePreviousLessons: event.target.checked, curriculumVersion: CURRICULUM_VERSION, schedulerVersion: "fsrs-6" };
    await state.repo.upsertSettings(state.settings);
  });
  document.querySelector("#displayName").addEventListener("change", async (event) => {
    const displayName = event.target.value.trim() || "Learner";
    await state.repo.upsertProfile(state.userId, displayName, state.profile?.createdAt);
    state.profile = await state.repo.getProfile(state.userId);
  });
}

async function render() {
  if (!state.repo) return;
  try {
    if (state.screen === "learn") return await renderLearn();
    if (state.screen === "profile") return await renderProfile();
    if (state.screen === "settings") return await renderSettings();
    return await renderHome();
  } catch (error) {
    root.innerHTML = `<div class="auth-shell"><section class="auth-card"><h1>Could not load the app.</h1><p>${esc(safeMessage(error))}</p><button class="primary" id="retry" type="button">Try again</button></section></div>`;
    document.querySelector("#retry").onclick = () => render();
  }
}

window.addEventListener("popstate", () => { state.screen = screenFromLocation(); render(); });
window.addEventListener("hashchange", () => { state.screen = screenFromLocation(); render(); });

async function initialize() {
  root.innerHTML = `<div class="loading-state"><span>Loading…</span></div>`;
  try {
    if (hasSupabaseConfig(config)) {
      state.client = await createSupabaseBrowserClient(config);
      state.session = await getSession(state.client);
      if (!state.session) return renderAuth();
    }
    await bootstrapSignedIn();
  } catch (error) {
    if (state.client && !state.session) return renderAuth(safeMessage(error));
    root.innerHTML = `<div class="auth-shell"><section class="auth-card"><h1>Could not start the app.</h1><p>${esc(safeMessage(error))}</p></section></div>`;
  }
}

initialize();
