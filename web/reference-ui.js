import { uiIcon } from "./final-ui.js";

const app = document.querySelector("#app");
const THEME_COLORS = { dark: "#090e19", light: "#f4efe6" };

function setThemeChrome() {
  const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
}

function addMetricIcon(card, name) {
  if (!card || card.querySelector(".metric-orb")) return;
  const orb = document.createElement("div");
  orb.className = "metric-orb";
  orb.setAttribute("aria-hidden", "true");
  orb.innerHTML = uiIcon(name, 24);
  card.prepend(orb);
  card.classList.add("has-metric-icon");
}

function decorateHome(root) {
  const home = root.querySelector(".home-stack");
  if (!home) return false;

  const headerCopy = home.querySelector(".page-header > div");
  if (headerCopy && !headerCopy.querySelector(".page-subtitle")) {
    const subtitle = document.createElement("p");
    subtitle.className = "page-subtitle";
    subtitle.textContent = "Build your foundation. Play with confidence.";
    headerCopy.append(subtitle);
  }

  const hero = home.querySelector(".home-focus");
  if (hero) {
    hero.classList.add("reference-hero");
    const title = hero.querySelector("h1");
    const copy = hero.querySelector("p");
    const label = hero.querySelector(".eyebrow")?.textContent?.trim();
    if (title?.textContent?.trim() === "Keep it fresh") title.textContent = "Curriculum complete";
    if (label === "Review due" && copy) copy.textContent = "A spaced review is ready.";
  }

  const cards = [...home.querySelectorAll(".home-secondary-card")];
  const reviewCard = cards.find((card) => /Reviews due/i.test(card.textContent || ""));
  const progressCard = cards.find((card) => /Overall progress/i.test(card.textContent || ""));
  const curriculumCard = cards.find((card) => /Curriculum/i.test(card.textContent || ""));

  if (reviewCard) {
    reviewCard.classList.add("is-reviews");
    addMetricIcon(reviewCard, "check");
  }
  if (progressCard) {
    progressCard.classList.add("is-progress");
    addMetricIcon(progressCard, "target");
  }
  if (curriculumCard) {
    curriculumCard.classList.add("is-curriculum");
    addMetricIcon(curriculumCard, "learn");
    const button = curriculumCard.querySelector("#openCurriculum");
    if (button) {
      button.textContent = "›";
      button.setAttribute("aria-label", "Open curriculum");
      if (!curriculumCard.dataset.referenceBound) {
        curriculumCard.dataset.referenceBound = "true";
        curriculumCard.setAttribute("role", "button");
        curriculumCard.tabIndex = 0;
        curriculumCard.setAttribute("aria-label", "Open six-phase curriculum");
        curriculumCard.addEventListener("click", (event) => {
          if (event.target === button || button.contains(event.target)) return;
          button.click();
        });
        curriculumCard.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          button.click();
        });
      }
    }
  }
  return true;
}

function decorateLearn(root) {
  const header = root.querySelector(".curriculum-header");
  if (!header) return false;
  const eyebrow = header.querySelector(".eyebrow");
  const title = header.querySelector("h1");
  const copy = header.querySelector("p");
  if (eyebrow) eyebrow.textContent = "Curriculum";
  if (title) title.textContent = "Learn";
  if (copy) copy.textContent = "6 phases";
  return true;
}

function decorateProfile(root) {
  if (!root.querySelector(".profile-hero-final")) return false;
  const header = root.querySelector(".page-header");
  const eyebrow = header?.querySelector(".eyebrow");
  const title = header?.querySelector("h1");
  if (eyebrow) eyebrow.textContent = "Music Theory Tutor";
  if (title) title.textContent = "Profile";
  return true;
}

function decoratePlacement(root) {
  const intro = root.querySelector(".placement-intro");
  if (!intro) return false;
  const title = intro.querySelector("h1");
  const copy = intro.querySelector("p");
  if (title) title.textContent = "Test into a phase";
  if (copy) copy.textContent = "Show the prerequisite skills for the phase you want to start. Passing unlocks entry without marking earlier material complete or retained.";
  return true;
}

function decorateAuth(root) {
  const card = root.querySelector(".auth-card");
  if (!card) return false;
  const copy = card.querySelector(":scope > p");
  if (copy) copy.textContent = "Sign in to continue your learning.";
  return true;
}

function standardizeLabels(root) {
  root.querySelectorAll(".learning-expectation.automatic").forEach((label) => {
    if (label.textContent?.trim() === "KNOW THIS INSTANTLY") label.textContent = "KNOW THIS AUTOMATICALLY";
  });
  root.querySelectorAll(".loading-state > span").forEach((label) => {
    label.textContent = "Loading…";
  });
}

function markScreen(root) {
  const screen = root.querySelector(".screen");
  if (!screen) return;
  let name = "app";
  if (root.querySelector(".home-stack")) name = "home";
  else if (root.querySelector(".phase-list-final")) name = "learn";
  else if (root.querySelector(".placement-intro")) name = "placement";
  else if (root.querySelector(".profile-hero-final")) name = "profile";
  else if (root.querySelector(".settings-screen")) name = "settings";
  else if (root.querySelector("#profileForm")) name = "edit-profile";
  else if (root.querySelector(".practice-card")) name = root.querySelector(".assessment-meta") ? "assessment" : "practice";
  else if (root.querySelector(".lesson-content")) name = "lesson";
  screen.dataset.uiScreen = name;
}

let queued = false;
function decorate() {
  queued = false;
  if (!app) return;
  standardizeLabels(app);
  decorateHome(app);
  decorateLearn(app);
  decorateProfile(app);
  decoratePlacement(app);
  decorateAuth(app);
  markScreen(app);
  setThemeChrome();
}

function scheduleDecorate() {
  if (queued) return;
  queued = true;
  queueMicrotask(decorate);
}

if (app) {
  new MutationObserver(scheduleDecorate).observe(app, { childList: true, subtree: true, characterData: true });
}
new MutationObserver(setThemeChrome).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

decorate();
