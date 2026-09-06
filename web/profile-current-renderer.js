import { CURRICULUM_PHASES, SKILLS } from "./core/index.js";
import { createSupabaseBrowserClient, getSession, hasSupabaseConfig, runtimeConfig } from "./runtime.js";
import { uiIcon } from "./final-ui.js";

const app = document.querySelector("#app");
const config = runtimeConfig();
const AVATAR_BUCKET = "avatars";
let clientPromise = null;
let rendering = false;
let queued = false;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function route() { return location.hash.replace(/^#\/?/, "").split("?")[0] || "home"; }
function initialFor(name, email) { return String(name || email || "L").trim().charAt(0).toUpperCase() || "L"; }
async function client() {
  if (!hasSupabaseConfig(config)) return null;
  if (!clientPromise) clientPromise = createSupabaseBrowserClient(config);
  return clientPromise;
}
async function signedAvatarUrl(supabase, path) {
  if (!supabase || !path) return "";
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return "";
  return `${data.signedUrl}${data.signedUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
}
function avatarMarkup(url, name, email) {
  if (url) return `<div class="profile-avatar-xl"><img src="${esc(url)}" alt="${esc(name || "Profile")} profile photo"></div>`;
  return `<div class="profile-avatar-xl profile-avatar-fallback" aria-label="Profile photo placeholder">${esc(initialFor(name, email))}</div>`;
}
function metrics(lessonRows, phaseRows) {
  const assessed = SKILLS.filter((skill) => skill.contentKind !== "reference");
  const completed = new Set((lessonRows ?? []).filter((row) => Number(row.completion_count ?? 0) > 0).map((row) => row.lesson_id));
  const completedLessons = assessed.filter((skill) => completed.has(skill.id)).length;
  const phasePasses = new Set((phaseRows ?? []).filter((row) => row.checkpoint_passed_at).map((row) => Number(row.phase_number)));
  const phaseBreakdown = CURRICULUM_PHASES.map((phase) => {
    const lessons = assessed.filter((skill) => skill.phase === phase.phase);
    const done = lessons.filter((skill) => completed.has(skill.id)).length;
    return { phase: phase.phase, title: phase.title, percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0 };
  });
  return {
    completedLessons,
    lessonTotal: assessed.length,
    overallPercent: assessed.length ? Math.round((completedLessons / assessed.length) * 100) : 0,
    phasesCompleted: phasePasses.size,
    phaseTotal: CURRICULUM_PHASES.length,
    phaseBreakdown,
  };
}

async function renderCurrentProfile() {
  if (!app || rendering || route() !== "profile") return;
  const main = app.querySelector(".screen-content");
  if (!main) return;
  if (main.querySelector('[data-profile-current="true"]')) {
    main.dataset.profileUx = "profile";
    return;
  }
  rendering = true;
  /* Mark the shell before awaiting so the older enhancement cannot race in. */
  main.dataset.profileUx = "profile";
  try {
    const supabase = await client();
    const session = supabase ? await getSession(supabase) : null;
    if (route() !== "profile" || !main.isConnected) return;
    const user = session?.user ?? null;
    let profile = null;
    let lessonRows = [];
    let phaseRows = [];
    if (supabase && user) {
      const [profileResult, lessonResult, phaseResult] = await Promise.all([
        supabase.from("user_profiles").select("display_name,avatar_path").eq("user_id", user.id).maybeSingle(),
        supabase.from("lesson_progress").select("lesson_id,completion_count").eq("user_id", user.id),
        supabase.from("phase_progress").select("phase_number,checkpoint_passed_at").eq("user_id", user.id),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (lessonResult.error) throw lessonResult.error;
      if (phaseResult.error) throw phaseResult.error;
      profile = profileResult.data;
      lessonRows = lessonResult.data ?? [];
      phaseRows = phaseResult.data ?? [];
    }
    if (route() !== "profile" || !main.isConnected) return;
    const email = user?.email || "Local preview";
    const name = profile?.display_name || user?.email?.split("@")[0] || "Learner";
    const avatarUrl = await signedAvatarUrl(supabase, profile?.avatar_path || null);
    const progress = metrics(lessonRows, phaseRows);
    const phaseRowsHtml = progress.phaseBreakdown.map((phase) => `<div class="profile-phase-row"><div class="profile-phase-row-top"><span>Phase ${phase.phase} · ${esc(phase.title)}</span><strong>${phase.percent}%</strong></div><div class="profile-mini-track"><span style="width:${phase.percent}%"></span></div></div>`).join("");
    main.innerHTML = `<div data-profile-current="true">
      <header class="page-header profile-page-title"><div><div class="eyebrow">Profile</div><h1>Profile</h1></div></header>
      <section class="profile-identity-card">
        ${avatarMarkup(avatarUrl, name, email)}
        <div class="profile-identity-copy"><h2>${esc(name)}</h2><p>${esc(email)}</p><button class="secondary profile-edit-button" id="profileCurrentEdit" type="button">${uiIcon("edit")} Edit Profile</button></div>
      </section>
      <section class="profile-progress-redesign" aria-labelledby="profileCurrentProgressHeading">
        <div class="profile-section-heading"><div><div class="eyebrow">Progress</div><h2 id="profileCurrentProgressHeading">Overall Progress</h2></div><strong class="profile-progress-percent">${progress.overallPercent}%</strong></div>
        <div class="progress-track profile-progress-track"><div class="progress-bar" style="width:${progress.overallPercent}%"></div></div>
        <div class="profile-course-metrics"><div><strong>${progress.completedLessons} / ${progress.lessonTotal}</strong><span>Lessons Completed</span></div><div><strong>${progress.phasesCompleted} / ${progress.phaseTotal}</strong><span>Phases Completed</span></div></div>
        <div class="profile-phase-breakdown">${phaseRowsHtml}</div>
      </section>
      <section class="profile-settings-entry"><button class="settings-action-row" id="profileCurrentSettings" type="button"><span>${uiIcon("settings")}<span><strong>Settings</strong><small>Appearance, learning preferences, and account</small></span></span>${uiIcon("chevron")}</button></section>
    </div>`;
    main.dataset.profileUx = "profile";
    document.querySelector("#profileCurrentEdit")?.addEventListener("click", () => { location.hash = "#/edit-profile"; });
    document.querySelector("#profileCurrentSettings")?.addEventListener("click", () => { location.hash = "#/settings"; });
  } catch (error) {
    console.error("Current Profile render failed", error);
    main.dataset.profileUx = "";
  } finally {
    rendering = false;
  }
}

function schedule() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; renderCurrentProfile(); });
}

if (app) new MutationObserver(() => {
  if (route() !== "profile") return;
  const main = app.querySelector(".screen-content");
  if (main && !main.querySelector('[data-profile-current="true"]')) schedule();
}).observe(app, { childList: true, subtree: true });
window.addEventListener("hashchange", schedule);
window.addEventListener("popstate", schedule);
window.addEventListener("profile-data-changed", schedule);
schedule();
