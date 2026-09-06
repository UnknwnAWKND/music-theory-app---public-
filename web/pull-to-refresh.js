import { SupabaseRestTutorRepository } from "./core/index.js";
import {
  createSupabaseBrowserClient,
  getAccessToken,
  getSession,
  hasSupabaseConfig,
  runtimeConfig,
} from "./runtime.js";
import {
  appRoute,
  canStartPullRefresh,
  pullGestureMetrics,
  pullRefreshSupported,
} from "./pull-to-refresh-core.js";

const app = document.querySelector("#app");
const config = runtimeConfig();
const DRAG_CAPTURE_PX = 12;

// A tap target must win over pull-to-refresh. On iPhone, cancelling touchmove on
// a button can suppress the synthetic click and make a perfectly normal button
// look intermittently dead. Start pull gestures only from non-control content.
const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "label",
  "summary",
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[role='slider']",
  "[role='switch']",
  ".accent-swatch-grid",
  ".theme-segmented",
  ".bottom-nav",
  ".floating-back-control",
  "[data-ptr-ignore]",
].join(", ");

let clientPromise = null;
let gesture = null;
let refreshing = false;
let settleTimer = null;

function pageScrollTop() {
  const candidates = [
    document.scrollingElement?.scrollTop,
    document.documentElement?.scrollTop,
    document.body?.scrollTop,
    window.scrollY,
  ].map((value) => Number(value ?? 0)).filter(Number.isFinite);
  return Math.max(0, ...candidates);
}

function interactiveTarget(target) {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
}

function refreshIconMarkup() {
  return `<span class="ptr-refresh-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></svg></span>`;
}

function indicator() {
  let node = document.querySelector("#pullRefreshIndicator");
  if (node) return node;
  node = document.createElement("div");
  node.id = "pullRefreshIndicator";
  node.className = "ptr-indicator";
  node.setAttribute("role", "status");
  node.setAttribute("aria-live", "polite");
  node.setAttribute("aria-atomic", "true");
  node.innerHTML = `${refreshIconMarkup()}<span class="ptr-label">Pull to refresh</span>`;
  document.body.append(node);
  return node;
}

function setIndicator({ visible, ready = false, progress = 0, y = 0, label = "Pull to refresh", isRefreshing = false }) {
  const node = indicator();
  node.dataset.visible = String(Boolean(visible));
  node.dataset.ready = String(Boolean(ready));
  node.dataset.refreshing = String(Boolean(isRefreshing));
  node.style.setProperty("--ptr-progress", String(Math.max(0, Math.min(1, progress))));
  node.style.setProperty("--ptr-y", `${Math.max(0, y)}px`);
  const copy = node.querySelector(".ptr-label");
  if (copy) copy.textContent = label;
}

function clearSettleTimer() {
  if (settleTimer) window.clearTimeout(settleTimer);
  settleTimer = null;
}

function settlePull(delay = 0) {
  clearSettleTimer();
  if (!app) return;
  app.classList.remove("ptr-pulling");
  app.classList.add("ptr-settling");
  app.style.setProperty("--ptr-content-y", "0px");
  settleTimer = window.setTimeout(() => {
    app.classList.remove("ptr-settling");
    if (!refreshing) setIndicator({ visible: false });
  }, Math.max(170, delay));
}

function showPull(metrics) {
  if (!app) return;
  clearSettleTimer();
  app.classList.remove("ptr-settling");
  app.classList.add("ptr-pulling");
  app.style.setProperty("--ptr-content-y", `${metrics.visualDistance}px`);
  setIndicator({
    visible: metrics.rawDistance > 2,
    ready: metrics.ready,
    progress: metrics.progress,
    y: Math.max(0, metrics.visualDistance - 2),
    label: metrics.ready ? "Release to refresh" : "Pull to refresh",
  });
}

async function supabaseClient() {
  if (!hasSupabaseConfig(config)) return null;
  if (!clientPromise) clientPromise = createSupabaseBrowserClient(config);
  return clientPromise;
}

function assertQuery(result) {
  if (result?.error) throw result.error;
  return result?.data;
}

async function preflightFreshData(route) {
  const supabase = await supabaseClient();
  if (!supabase) return;
  let session = await getSession(supabase);
  if (!session?.user?.id) throw new Error("Session unavailable");

  if (route === "profile") {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) throw refreshed.error;
    session = refreshed.data.session ?? session;
    const userId = session.user.id;
    const results = await Promise.all([
      supabase.from("user_profiles").select("display_name,avatar_path").eq("user_id", userId).maybeSingle(),
      supabase.from("lesson_progress").select("lesson_id,completion_count").eq("user_id", userId),
      supabase.from("phase_progress").select("phase_number,checkpoint_passed_at").eq("user_id", userId),
    ]);
    results.forEach(assertQuery);
    return;
  }

  const repo = new SupabaseRestTutorRepository({
    url: config.supabaseUrl,
    publishableKey: config.supabasePublishableKey,
    getAccessToken: () => getAccessToken(supabase),
  });
  const userId = session.user.id;
  if (route === "home") {
    await Promise.all([
      repo.allSkillStates(userId),
      repo.allLessonProgress(userId),
      repo.phaseProgress(userId),
      repo.dueReviews(userId, new Date().toISOString()),
    ]);
  } else if (route === "learn") {
    await Promise.all([
      repo.allSkillStates(userId),
      repo.allLessonProgress(userId),
      repo.phaseProgress(userId),
    ]);
  }
}

function rerenderCurrentBrowsingScreen(route) {
  if (!app) return Promise.resolve();
  const previousMain = app.querySelector(".screen-content");
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      observer.disconnect();
      window.clearTimeout(timeout);
      error ? reject(error) : resolve();
    };
    const check = () => {
      const currentMain = app.querySelector(".screen-content");
      const errorPanel = app.querySelector(".error-panel");
      if (errorPanel && currentMain !== previousMain) return finish(new Error("Refresh render failed"));
      if (!currentMain || currentMain === previousMain) return;
      if (route === "profile" && !currentMain.querySelector('[data-profile-current="true"]')) return;
      finish();
    };
    const observer = new MutationObserver(check);
    observer.observe(app, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => finish(new Error("Refresh timed out")), 8000);
    const event = typeof PopStateEvent === "function"
      ? new PopStateEvent("popstate", { state: history.state })
      : new Event("popstate");
    window.dispatchEvent(event);
    queueMicrotask(check);
  });
}

async function performRefresh(route) {
  if (refreshing || !pullRefreshSupported(route)) return;
  refreshing = true;
  settlePull();
  setIndicator({ visible: true, progress: 1, y: 0, label: "Refreshing…", isRefreshing: true });
  const startedAt = performance.now();
  try {
    // Read first so ordinary network failures leave the currently rendered screen untouched.
    await preflightFreshData(route);
    await rerenderCurrentBrowsingScreen(route);
    const elapsed = performance.now() - startedAt;
    if (elapsed < 320) await new Promise((resolve) => window.setTimeout(resolve, 320 - elapsed));
    setIndicator({ visible: true, progress: 1, y: 0, label: "Updated" });
    window.setTimeout(() => { if (!refreshing) setIndicator({ visible: false }); }, 500);
  } catch (error) {
    console.error("Pull-to-refresh failed", error);
    setIndicator({ visible: true, progress: 0, y: 0, label: "Couldn't refresh. Try again." });
    window.setTimeout(() => { if (!refreshing) setIndicator({ visible: false }); }, 1500);
  } finally {
    refreshing = false;
    gesture = null;
    app?.classList.remove("ptr-pulling", "ptr-settling");
    app?.style.setProperty("--ptr-content-y", "0px");
  }
}

function beginGesture(event) {
  if (!event.touches?.length) return;
  const touch = event.touches[0];
  const route = appRoute();
  const interactive = interactiveTarget(event.target);
  const atTop = pageScrollTop() <= 4;
  gesture = {
    route,
    startX: touch.clientX,
    startY: touch.clientY,
    atTop,
    interactive,
    eligible: canStartPullRefresh({
      route,
      scrollTop: pageScrollTop(),
      interactive,
      refreshing,
      touchCount: event.touches.length,
    }),
    metrics: null,
  };
}

function moveGesture(event) {
  if (!gesture || !event.touches?.length) return;
  const touch = event.touches[0];
  const metrics = pullGestureMetrics(gesture.startX, gesture.startY, touch.clientX, touch.clientY);
  gesture.metrics = metrics;

  if (pageScrollTop() > 4) {
    gesture.eligible = false;
    settlePull();
    return;
  }

  // Disabled routes and touches that began on controls never cancel browser touch
  // delivery. This guarantees that a small finger drift cannot suppress a tap.
  if (!gesture.eligible) return;

  if (!metrics.directionValid) {
    if (metrics.dy <= 0) settlePull();
    return;
  }

  // Once a non-control gesture is clearly a vertical drag, take ownership from
  // Safari so native rubber-band refresh cannot compete with the app gesture.
  if (metrics.dy >= DRAG_CAPTURE_PX && event.cancelable) event.preventDefault();
  showPull(metrics);
}

function endGesture() {
  const ended = gesture;
  gesture = null;
  if (!ended?.eligible) return;
  if (ended.metrics?.ready) {
    performRefresh(ended.route);
    return;
  }
  settlePull();
}

function cancelGesture() {
  gesture = null;
  if (!refreshing) settlePull();
}

if (app) {
  document.documentElement.classList.add("ptr-managed");
  indicator();
  document.addEventListener("touchstart", beginGesture, { passive: false, capture: true });
  document.addEventListener("touchmove", moveGesture, { passive: false, capture: true });
  document.addEventListener("touchend", endGesture, { passive: true, capture: true });
  document.addEventListener("touchcancel", cancelGesture, { passive: true, capture: true });
}

// Exposed only for deterministic browser tests/debugging; it still obeys the
// supported-route and duplicate-request guards and performs read/refetch only.
window.__theoryTutorPullRefresh = () => performRefresh(appRoute());
