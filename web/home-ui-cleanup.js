const app = document.querySelector("#app");

function removeRedundantHomeCurriculumCard() {
  if (!app) return;
  const home = app.querySelector(".home-stack");
  if (!home) return;

  const curriculumButton = home.querySelector("#openCurriculum");
  const curriculumCard = curriculumButton?.closest(".home-secondary-card");
  if (curriculumCard) curriculumCard.remove();
}

let queued = false;
function scheduleHomeCleanup() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    removeRedundantHomeCurriculumCard();
  });
}

if (app) {
  new MutationObserver(scheduleHomeCleanup).observe(app, { childList: true, subtree: true });
}

removeRedundantHomeCurriculumCard();
