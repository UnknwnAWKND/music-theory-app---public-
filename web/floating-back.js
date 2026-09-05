const app = document.querySelector("#app");
let observer = null;
let source = null;
let floating = null;
let queued = false;

function backIcon() {
  return `<svg class="ui-icon" width="22" height="22" viewBox="0 0 20 20" aria-hidden="true"><path d="m12.8 4.5-5.5 5.5 5.5 5.5"/></svg>`;
}

function removeFloating() {
  observer?.disconnect();
  observer = null;
  source = null;
  floating?.remove();
  floating = null;
}

function eligibleNormalBack() {
  if (!app) return null;
  const candidate = app.querySelector(".page-header .back-button");
  if (!candidate) return null;
  // Active question screens already have their intentionally focused exit behavior.
  if (["exitPractice", "exitCheckpoint"].includes(candidate.id)) return null;
  return candidate;
}

function sourceHasScrolledAboveViewport(element) {
  const rect = element.getBoundingClientRect();
  const safeTop = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-top-px")) || 0;
  return rect.bottom <= Math.max(0, safeTop);
}

function mountFor(candidate) {
  if (source === candidate && floating?.isConnected) return;
  removeFloating();
  source = candidate;

  const label = candidate.textContent?.trim() || "Back";
  floating = document.createElement("button");
  floating.className = "floating-back-control";
  floating.type = "button";
  floating.setAttribute("aria-label", label.startsWith("Back") ? label : `Back to ${label}`);
  floating.innerHTML = backIcon();
  floating.addEventListener("click", () => source?.click());
  document.body.appendChild(floating);

  observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (!entry || !floating) return;
    const shouldFloat = !entry.isIntersecting && sourceHasScrolledAboveViewport(candidate);
    floating.classList.toggle("is-visible", shouldFloat);
  }, { root: null, threshold: 0.01 });
  observer.observe(candidate);
}

function refreshFloatingBack() {
  const candidate = eligibleNormalBack();
  if (!candidate) return removeFloating();
  mountFor(candidate);
}

function scheduleRefresh() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    refreshFloatingBack();
  });
}

if (app) new MutationObserver(scheduleRefresh).observe(app, { childList: true, subtree: true });
window.addEventListener("hashchange", scheduleRefresh);
window.addEventListener("popstate", scheduleRefresh);
window.addEventListener("resize", scheduleRefresh);
scheduleRefresh();
