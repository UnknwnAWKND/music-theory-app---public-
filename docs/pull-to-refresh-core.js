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

export const PULL_THRESHOLD_PX = 84;
export const MAX_PULL_DISTANCE_PX = 116;
export const PULL_RESISTANCE = 0.44;

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
    && Number(scrollTop) <= 1
    && !interactive
    && !refreshing
    && touchCount === 1;
}

export function pullGestureMetrics(startX, startY, currentX, currentY) {
  const dx = Number(currentX) - Number(startX);
  const dy = Number(currentY) - Number(startY);
  const downward = Math.max(0, dy);
  const directionValid = downward > 0 && Math.abs(dx) <= Math.max(24, downward * 0.72);
  const rawDistance = directionValid ? Math.min(MAX_PULL_DISTANCE_PX, downward) : 0;
  const visualDistance = Math.min(54, rawDistance * PULL_RESISTANCE);
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
