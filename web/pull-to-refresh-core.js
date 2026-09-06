export const PULL_REFRESH_ROUTES = Object.freeze(["home", "learn", "profile"]);
export const PULL_REFRESH_DISABLED_ROUTES = Object.freeze([
  "lesson",
  "practice",
  "checkpoint",
  "placement",
  "settings",
  "edit-profile",
  "account-email",
  "account-password",
]);

// Keep the gesture intentional, but do not make iPhone users drag nearly a full
// thumb-length before they get feedback. iOS can also report a few fractional
// scroll pixels while the page visually rests at the top.
export const PULL_THRESHOLD_PX = 64;
export const MAX_PULL_DISTANCE_PX = 120;
export const PULL_RESISTANCE = 0.5;
export const TOP_SCROLL_TOLERANCE_PX = 4;

export function appRoute(hash = globalThis.location?.hash ?? "") {
  const value = String(hash).replace(/^#\/?/, "").split("?")[0];
  if (!value) return "home";
  return value.split("/")[0] || "home";
}

export function pullRefreshSupported(route) {
  return PULL_REFRESH_ROUTES.includes(String(route));
}

export function canStartPullRefresh({ route, scrollTop, interactive = false, refreshing = false, touchCount = 1 }) {
  return pullRefreshSupported(route)
    && Number(scrollTop) <= TOP_SCROLL_TOLERANCE_PX
    && !interactive
    && !refreshing
    && touchCount === 1;
}

export function pullGestureMetrics(startX, startY, currentX, currentY) {
  const dx = Number(currentX) - Number(startX);
  const dy = Number(currentY) - Number(startY);
  const downward = Math.max(0, dy);
  const directionValid = downward > 0 && Math.abs(dx) <= Math.max(28, downward * 0.8);
  const rawDistance = directionValid ? Math.min(MAX_PULL_DISTANCE_PX, downward) : 0;
  const visualDistance = Math.min(60, rawDistance * PULL_RESISTANCE);
  return {
    dx,
    dy,
    rawDistance,
    visualDistance,
    directionValid,
    ready: rawDistance >= PULL_THRESHOLD_PX,
    progress: Math.min(1, rawDistance / PULL_THRESHOLD_PX),
  };
}
