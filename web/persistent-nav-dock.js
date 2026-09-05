const app = document.querySelector("#app");

function ensureProfileDockAnchor(dock) {
  if (!dock?.classList.contains("profile-deep-dock")) return;
  const parent = dock.parentElement;
  if (!parent || parent === app || parent.querySelector(":scope > .profile-dock-anchor")) return;

  // The Profile enhancement checks its rendered shell for a .bottom-nav before
  // creating one. Once the real fixed dock is promoted to #app, leave this
  // hidden sentinel behind so the enhancement knows the dock already exists.
  // The mount routine intentionally ignores this sentinel as a real dock.
  const anchor = document.createElement("span");
  anchor.className = "bottom-nav profile-dock-anchor";
  anchor.hidden = true;
  anchor.setAttribute("aria-hidden", "true");
  parent.append(anchor);
}

function mountPersistentPrimaryDock() {
  if (!app) return;

  const docks = [...app.querySelectorAll(".bottom-nav:not(.profile-dock-anchor)")];
  if (!docks.length) return;

  // The active screen render owns the newest real dock. Keep exactly that one.
  const dock = docks[docks.length - 1];
  for (const candidate of docks) {
    if (candidate !== dock) candidate.remove();
  }

  // A transformed/animated .screen ancestor creates a containing block for
  // position: fixed descendants on mobile browsers. Move the shared dock to
  // the app-shell itself so fixed positioning is truly viewport-relative.
  if (dock.parentElement !== app) {
    ensureProfileDockAnchor(dock);
    app.append(dock);
  }
}

let queued = false;
function scheduleDockMount() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    mountPersistentPrimaryDock();
  });
}

if (app) {
  new MutationObserver(scheduleDockMount).observe(app, {
    childList: true,
    subtree: true,
  });
}

mountPersistentPrimaryDock();
