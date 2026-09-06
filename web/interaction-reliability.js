const app = document.querySelector("#app");

export const INTERACTION_TIMEOUT_MS = 12000;
const BROWSING_ROUTES = new Set(["home", "learn", "profile"]);
const DEBUG_KEY = "music-theory-tutor:debug-interactions";
const TRANSIENT_RECOVERY_SELECTOR = "#submitAnswer:disabled, #guidedToggle:disabled";

export class InteractionTimeoutError extends Error {
  constructor(message = "The request took too long. Please try again.") {
    super(message);
    this.name = "InteractionTimeoutError";
    this.code = "interaction-timeout";
  }
}

function routeFromHash(hash = location.hash) {
  const value = String(hash).replace(/^#\/?/, "").split("?")[0];
  return value ? value.split("/")[0] : "home";
}

function diagnosticsEnabled() {
  if (["localhost", "127.0.0.1"].includes(location.hostname)) return true;
  try { return localStorage.getItem(DEBUG_KEY) === "1"; }
  catch { return false; }
}

export function interactionDebug(event, detail = {}) {
  if (!diagnosticsEnabled()) return;
  console.debug(`[interaction] ${event}`, detail);
}

function combinedSignal(existing, timeoutSignal) {
  if (!existing) return { signal: timeoutSignal, cleanup: () => {} };
  if (typeof AbortSignal?.any === "function") {
    return { signal: AbortSignal.any([existing, timeoutSignal]), cleanup: () => {} };
  }
  const controller = new AbortController();
  const forward = (signal) => {
    if (!controller.signal.aborted) controller.abort(signal.reason);
  };
  const onExisting = () => forward(existing);
  const onTimeout = () => forward(timeoutSignal);
  existing.addEventListener("abort", onExisting, { once: true });
  timeoutSignal.addEventListener("abort", onTimeout, { once: true });
  if (existing.aborted) forward(existing);
  else if (timeoutSignal.aborted) forward(timeoutSignal);
  return {
    signal: controller.signal,
    cleanup: () => {
      existing.removeEventListener("abort", onExisting);
      timeoutSignal.removeEventListener("abort", onTimeout);
    },
  };
}

let activeFetches = 0;
let networkIdleTimer = null;
function markNetworkStart() {
  activeFetches += 1;
  if (networkIdleTimer) window.clearTimeout(networkIdleTimer);
  networkIdleTimer = null;
}

function markNetworkFinish() {
  activeFetches = Math.max(0, activeFetches - 1);
  if (activeFetches !== 0) return;
  if (networkIdleTimer) window.clearTimeout(networkIdleTimer);
  networkIdleTimer = window.setTimeout(() => {
    networkIdleTimer = null;
    window.dispatchEvent(new CustomEvent("interaction-network-idle"));
  }, 300);
}

function installFetchTimeout() {
  if (typeof window.fetch !== "function" || window.fetch.__interactionReliable === true) return;
  const nativeFetch = window.fetch.bind(window);
  const reliableFetch = async (input, init = {}) => {
    const controller = new AbortController();
    const merged = combinedSignal(init?.signal, controller.signal);
    let timedOut = false;
    markNetworkStart();
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort(new InteractionTimeoutError());
    }, INTERACTION_TIMEOUT_MS);
    try {
      return await nativeFetch(input, { ...init, signal: merged.signal });
    } catch (error) {
      if (timedOut && !init?.signal?.aborted) {
        interactionDebug("request-timeout", { input: String(input) });
        throw new InteractionTimeoutError();
      }
      throw error;
    } finally {
      window.clearTimeout(timer);
      merged.cleanup();
      markNetworkFinish();
    }
  };
  reliableFetch.__interactionReliable = true;
  window.fetch = reliableFetch;
}

let toastTimer = null;
function showRecoveryMessage(message = "That took too long. Please try again.") {
  let toast = document.querySelector("#interactionRecoveryToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "interactionRecoveryToast";
    toast.className = "interaction-recovery-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.dataset.visible = "true";
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.dataset.visible = "false"; }, 2600);
}

function timeoutLike(error) {
  const text = String(error?.message ?? error ?? "").toLowerCase();
  return error?.name === "InteractionTimeoutError" || error?.code === "interaction-timeout" || /took too long|timed out|timeout/.test(text);
}

function recoverTransientControls() {
  document.querySelectorAll(TRANSIENT_RECOVERY_SELECTOR).forEach((control) => {
    if (!control.isConnected) return;
    control.disabled = false;
    control.removeAttribute("aria-busy");
    interactionDebug("transient-control-reenabled", { id: control.id });
  });
}

function activeDockRoute() {
  const active = app?.querySelector(".bottom-nav:not(.profile-dock-anchor) [data-nav].active, .bottom-nav:not(.profile-dock-anchor) [data-profile-nav].active");
  return active?.dataset.nav ?? active?.dataset.profileNav ?? null;
}

let reconcileQueued = false;
let lastRepairAt = 0;
function reconcileBrowsingRoute() {
  reconcileQueued = false;
  if (!app) return;
  const expected = routeFromHash();
  if (!BROWSING_ROUTES.has(expected)) return;
  const rendered = activeDockRoute();
  if (!rendered || rendered === expected) return;
  const now = performance.now();
  if (now - lastRepairAt < 80) return;
  lastRepairAt = now;
  interactionDebug("stale-render-repaired", { expected, rendered });
  const event = typeof PopStateEvent === "function"
    ? new PopStateEvent("popstate", { state: history.state })
    : new Event("popstate");
  window.dispatchEvent(event);
}

function scheduleReconcile() {
  if (reconcileQueued) return;
  reconcileQueued = true;
  queueMicrotask(reconcileBrowsingRoute);
}

installFetchTimeout();

window.addEventListener("interaction-network-idle", recoverTransientControls);
window.addEventListener("unhandledrejection", (event) => {
  const settingsToggle = document.querySelector("#guidedToggle:disabled");
  if (settingsToggle) {
    settingsToggle.disabled = false;
    showRecoveryMessage("Could not save that setting. Please try again.");
  }
  if (!timeoutLike(event.reason)) return;
  interactionDebug("unhandled-timeout-recovered", { reason: String(event.reason?.message ?? event.reason) });
  showRecoveryMessage();
  event.preventDefault();
});

if (app) new MutationObserver(scheduleReconcile).observe(app, { childList: true, subtree: true });
window.addEventListener("hashchange", scheduleReconcile);
window.addEventListener("popstate", scheduleReconcile);
scheduleReconcile();
