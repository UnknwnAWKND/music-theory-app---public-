const app = document.querySelector("#app");

function mountPersistentPrimaryDock() {
  if (!app) return;

  const docks = [...app.querySelectorAll(".bottom-nav")];
  if (!docks.length) return;

  // The active screen render owns the newest dock. Keep exactly that one.
  const dock = docks[docks.length - 1];
  for (const candidate of docks) {
    if (candidate !== dock) candidate.remove();
  }

  // A transformed/animated .screen ancestor creates a containing block for
  // position: fixed descendants on mobile browsers. Move the shared dock to
  // the app-shell itself so fixed positioning is truly viewport-relative.
  if (dock.parentElement !== app) {
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
