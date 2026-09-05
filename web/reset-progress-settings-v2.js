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
  if (!session?.user?.id) throw new Error("not-authenticated");
  const token = await getAccessToken(authClient);
  const base = `${String(config.supabaseUrl).replace(/\/$/, "")}/rest/v1`;
  const response = await fetch(`${base}/rpc/reset_my_learning_progress`, {
    method: "POST",
    headers: { apikey: config.supabasePublishableKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("Reset progress request failed", response.status, detail);
    throw new Error("reset-failed");
  }
}

async function handleReset(button) {
  if (resetting) return;
  const confirmed = window.confirm("Reset all learning progress?\n\nThis permanently clears lesson progress, review history, checkpoints, and learning evidence. Your account, profile, and settings stay.");
  if (!confirmed || !window.confirm("Are you sure? This cannot be undone.")) return;
  resetting = true;
  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = "Resetting…";
  try {
    if (hasSupabaseConfig(config)) await resetSupabaseProgress(); else resetLocalProgress();
    window.location.hash = "";
    window.location.reload();
  } catch (error) {
    console.error("Reset progress failed", error);
    window.alert("Could not reset progress. Please try again.");
    button.disabled = false;
    button.innerHTML = original;
    resetting = false;
  }
}

function trashIcon() {
  return '<svg class="ui-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 6.5h11M8 3.5h4M6.5 6.5l.7 10h5.6l.7-10"/></svg>';
}

function installResetSetting() {
  const account = document.querySelector("[data-settings-account]");
  if (!account || account.querySelector("[data-reset-all-progress]")) return;
  const button = document.createElement("button");
  button.className = "settings-action-row danger";
  button.dataset.resetAllProgress = "";
  button.type = "button";
  button.innerHTML = `<span>${trashIcon()} Reset Progress</span><span aria-hidden="true"></span>`;
  account.appendChild(button);
  const help = document.createElement("div");
  help.className = "setting-help";
  help.textContent = "Clears learning and review progress. Your account, profile, theme, and learning settings stay.";
  account.appendChild(help);
  button.addEventListener("click", (event) => handleReset(event.currentTarget));
}

const observer = new MutationObserver(installResetSetting);
observer.observe(document.querySelector("#app"), { childList: true, subtree: true });
installResetSetting();
