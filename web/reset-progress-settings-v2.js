import {
  createSupabaseBrowserClient,
  getAccessToken,
  getSession,
  hasSupabaseConfig,
  runtimeConfig,
} from "./runtime.js";

const config = runtimeConfig();
const LOCAL_STORAGE_KEY = "music-theory-tutor:block2-phase1";
let resetting = false;

function resetLocalProgress() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return;
  let snapshot;
  try { snapshot = JSON.parse(raw); }
  catch { localStorage.removeItem(LOCAL_STORAGE_KEY); return; }
  snapshot.sessions = [];
  snapshot.attempts = [];
  snapshot.skillStates = [];
  snapshot.cards = [];
  snapshot.schedulerReviews = [];
  snapshot.phaseProgress = [];
  snapshot.lessonProgress = [];
  snapshot.retiredSkillHistory = [];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
}

async function resetSupabaseProgress() {
  const authClient = await createSupabaseBrowserClient(config);
  const session = await getSession(authClient);
  if (!session?.user?.id) throw new Error("You must be signed in to reset progress.");
  const token = await getAccessToken(authClient);
  const base = `${String(config.supabaseUrl).replace(/\/$/, "")}/rest/v1`;
  const response = await fetch(`${base}/rpc/reset_my_learning_progress`, {
    method: "POST",
    headers: { apikey: config.supabasePublishableKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Could not reset progress (${response.status}). ${detail}`);
  }
}

async function handleReset(button) {
  if (resetting) return;
  const confirmed = window.confirm("Reset ALL progress?\n\nThis permanently deletes lesson progress, READY/RETAINED states, question history, review schedules, checkpoint/placement progress, and study-session history.\n\nYour account, profile, and settings will stay. This cannot be undone.");
  if (!confirmed || !window.confirm("Are you sure? This will put the app back at the beginning for this account.")) return;
  resetting = true;
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Resetting…";
  try {
    if (hasSupabaseConfig(config)) await resetSupabaseProgress(); else resetLocalProgress();
    window.location.hash = "";
    window.location.reload();
  } catch (error) {
    console.error(error);
    window.alert(error?.message ?? "Could not reset progress.");
    button.disabled = false;
    button.textContent = original;
    resetting = false;
  }
}

function installResetSetting() {
  const screen = document.querySelector(".settings-screen");
  if (!screen || screen.querySelector("[data-reset-all-progress]")) return;
  const section = document.createElement("section");
  section.className = "settings-group";
  section.dataset.resetProgressSection = "";
  section.innerHTML = `<div class="settings-group-title">Testing</div><button class="menu-row danger" data-reset-all-progress type="button"><span>Reset All Progress</span><span>›</span></button><div class="setting-help">Clears learning and review progress. Your account, profile, and settings are kept.</div>`;
  screen.appendChild(section);
  section.querySelector("[data-reset-all-progress]").addEventListener("click", (event) => handleReset(event.currentTarget));
}

const observer = new MutationObserver(installResetSetting);
observer.observe(document.querySelector("#app"), { childList: true, subtree: true });
installResetSetting();
