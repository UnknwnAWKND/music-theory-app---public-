import {
  createSupabaseBrowserClient,
  getSession,
  hasSupabaseConfig,
  runtimeConfig,
} from "./runtime.js";

const ACCENTS = Object.freeze(["red", "green", "purple", "yellow", "orange", "blue", "black", "white"]);
const SWATCH = Object.freeze({
  red: "#d95660",
  green: "#348562",
  purple: "#7861e2",
  yellow: "#d7aa22",
  orange: "#d77235",
  blue: "#4d76d2",
  black: "#17191e",
  white: "#ffffff",
});

const config = runtimeConfig();
const app = document.querySelector("#app");
let client = null;
let clientPromise = null;
let currentUserId = "local-preview";
let currentAccent = "purple";
let contextReady = false;
let refreshPromise = null;

function normalizeAccent(value) {
  const next = String(value ?? "").toLowerCase();
  return ACCENTS.includes(next) ? next : "purple";
}

function cacheKey(userId) {
  return `music-theory-tutor:accent:${encodeURIComponent(String(userId || "local-preview"))}`;
}

function readCached(userId) {
  try { return normalizeAccent(localStorage.getItem(cacheKey(userId))); }
  catch { return "purple"; }
}

function writeCached(userId, accent) {
  try { localStorage.setItem(cacheKey(userId), normalizeAccent(accent)); }
  catch { /* Persistent authenticated storage remains the source of truth. */ }
}

function updateMetaThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  meta.setAttribute("content", document.documentElement.dataset.theme === "light" ? "#efe5d6" : "#090e19");
}

function applyAccent(value) {
  currentAccent = normalizeAccent(value);
  document.documentElement.dataset.accent = currentAccent;
  updateMetaThemeColor();
  document.querySelectorAll("[data-accent-choice]").forEach((button) => {
    button.setAttribute("aria-checked", String(button.dataset.accentChoice === currentAccent));
  });
  return currentAccent;
}

async function getClient() {
  if (!hasSupabaseConfig(config)) return null;
  if (client) return client;
  if (!clientPromise) clientPromise = createSupabaseBrowserClient(config);
  client = await clientPromise;
  return client;
}

async function resolveContext() {
  const supabase = await getClient();
  if (!supabase) return { userId: "local-preview", authenticated: false, client: null };
  const session = await getSession(supabase);
  return { userId: session?.user?.id ?? "local-preview", authenticated: Boolean(session?.user?.id), client: supabase };
}

async function loadAccentForCurrentUser(force = false) {
  if (refreshPromise && !force) return refreshPromise;
  refreshPromise = (async () => {
    const context = await resolveContext();
    const userChanged = context.userId !== currentUserId;
    currentUserId = context.userId;
    const cached = readCached(currentUserId);
    if (userChanged || !contextReady || force) applyAccent(cached);

    if (context.authenticated && context.client) {
      const { data, error } = await context.client.from("user_appearance_settings").select("accent_color").eq("user_id", currentUserId).maybeSingle();
      if (!error && data?.accent_color) {
        const stored = applyAccent(data.accent_color);
        writeCached(currentUserId, stored);
      }
    }
    contextReady = true;
    return context;
  })();
  try { return await refreshPromise; }
  finally { refreshPromise = null; }
}

function setSaveStatus(text) {
  const status = document.querySelector(".appearance-save-status");
  if (status) status.textContent = text;
}

async function saveAccent(value) {
  const context = await loadAccentForCurrentUser();
  const next = applyAccent(value);
  writeCached(currentUserId, next);
  setSaveStatus("Saving…");
  if (context.authenticated && context.client) {
    const { error } = await context.client.from("user_appearance_settings").upsert({
      user_id: currentUserId,
      accent_color: next,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) {
      console.error("Accent color save failed", error);
      setSaveStatus("Could not save accent color.");
      return;
    }
  }
  setSaveStatus("Saved");
  window.setTimeout(() => setSaveStatus(""), 900);
}

function swatchMarkup() {
  const swatches = ACCENTS.map((accent) => `<button class="accent-swatch" data-accent-choice="${accent}" role="radio" aria-label="${accent[0].toUpperCase()}${accent.slice(1)}" aria-checked="${accent === currentAccent}" type="button" style="--swatch:${SWATCH[accent]}"><span class="accent-swatch-dot" aria-hidden="true"></span></button>`).join("");
  return `<div class="accent-swatch-grid" role="radiogroup" aria-label="Accent Color">${swatches}</div><div class="appearance-save-status" role="status" aria-live="polite"></div>`;
}

function bindSwatches(scope) {
  scope.querySelectorAll("[data-accent-choice]").forEach((button) => {
    if (button.dataset.accentBound === "true") return;
    button.dataset.accentBound = "true";
    button.addEventListener("click", () => saveAccent(button.dataset.accentChoice));
  });
  applyAccent(currentAccent);
}

function injectAccentSetting() {
  if (!app) return;
  const mount = app.querySelector("#accentSettingsMount");
  if (mount) {
    app.querySelectorAll(".accent-setting-block").forEach((old) => old.remove());
    if (!mount.querySelector(".accent-swatch-grid")) mount.innerHTML = swatchMarkup();
    bindSwatches(mount);
    return;
  }

  const groups = [...app.querySelectorAll(".settings-group")];
  const appearance = groups.find((group) => group.querySelector(".settings-group-title")?.textContent?.trim() === "Appearance");
  if (!appearance || appearance.querySelector(".accent-setting-block")) return;
  appearance.insertAdjacentHTML("beforeend", `<div class="accent-setting-block"><div class="accent-setting-copy"><strong>Accent Color</strong><small>Changes interactive highlights without changing success or error colors.</small></div>${swatchMarkup()}</div>`);
  bindSwatches(appearance);
}

let queued = false;
function scheduleEnhance() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    injectAccentSetting();
    updateMetaThemeColor();
  });
}

if (app) new MutationObserver(scheduleEnhance).observe(app, { childList: true, subtree: true });
new MutationObserver(() => {
  updateMetaThemeColor();
  applyAccent(currentAccent);
}).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

(async () => {
  try {
    const supabase = await getClient();
    if (supabase) {
      supabase.auth.onAuthStateChange(() => {
        contextReady = false;
        loadAccentForCurrentUser(true).then(scheduleEnhance).catch(console.error);
      });
    }
    await loadAccentForCurrentUser(true);
  } catch (error) {
    console.error("Appearance initialization failed", error);
    applyAccent("purple");
  }
  scheduleEnhance();
})();

window.addEventListener("hashchange", () => loadAccentForCurrentUser().then(scheduleEnhance).catch(console.error));
