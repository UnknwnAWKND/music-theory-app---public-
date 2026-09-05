import {
  BrowserStorageTutorRepository,
  analyzeStructuredProgression,
  resolveFarSideProgression,
  selectFarSideMajorTarget,
  transposeMajorRomanProgression,
  CURRICULUM_PHASES,
  CURRICULUM_VERSION,
  SKILLS,
  SKILL_BY_ID,
  SupabaseRestTutorRepository,
  TutorService,
  Fsrs6LongTermSchedulerAdapter,
  checkpointDefinition,
  placementDefinition,
  evaluateCheckpoint,
  exerciseForSkill,
  freshLessonProgress,
  gradeExercise,
  lessonForSkill,
  lessonOpeningState,
  markLessonCompleted,
  phaseCoreReady,
  practiceRoundPlan,
  selectAdaptiveExercise,
} from "./core/index.js";
import {
  createSupabaseBrowserClient,
  getAccessToken,
  getSession,
  hasSupabaseConfig,
  runtimeConfig,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from "./runtime.js";
import { renderPracticeRoundCounter, renderTeachingStep } from "./lesson-ui.js";
import { pianoVisual } from "./theory-visuals.js";
import { bindPhase4ProgressionLab, phase4ProgressionLabHtml } from "./phase4-ui.js";
import { bindPhase6Ui, phase6TranspositionLabHtml } from "./phase6-ui.js";
import {
  activeAssessedSkills,
  applyTheme,
  cacheTheme,
  cachedTheme,
  learningSummary,
  normalizeTheme,
  phaseSummary,
  uiIcon,
} from "./final-ui.js";

const config = runtimeConfig();
const root = document.querySelector("#app");
const LOCAL_USER_ID = "local-preview";
const LOCAL_STORAGE_KEY = "music-theory-tutor:block2-phase1";
const LEGACY_APP_STORAGE_KEYS = ["music-theory-tutor:v0.7-preview", "music-theory-tutor:v1", "music-theory-tutor:block1-empty"];
const DEFAULT_SETTINGS = (userId) => ({
  userId,
  desiredRetention: 0.9,
  maximumIntervalDays: 36500,
  requirePreviousLessons: true,
  theme: "dark",
  curriculumVersion: CURRICULUM_VERSION,
  schedulerVersion: "fsrs-6",
});

const state = {
  client: null,
  repo: null,
  tutor: null,
  session: null,
  userId: null,
  profile: null,
  settings: null,
  screen: "home",
  busy: false,
  transitionBusy: false,
  lessonSkillId: null,
  teachingStep: 0,
  practice: null,
  checkpoint: null,
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function phaseSkills(phase) {
  return SKILLS.filter((skill) => skill.phase === phase);
}

function phaseDescriptor(phase) {
  return CURRICULUM_PHASES.find((item) => item.phase === phase);
}

function skillPhase(skillId) {
  return SKILL_BY_ID.get(skillId)?.phase ?? 1;
}

function lessonNumberInPhase(skillId) {
  const phase = skillPhase(skillId);
  return phaseSkills(phase).findIndex((skill) => skill.id === skillId) + 1;
}

function purgeLegacyLocalAppData() {
  for (const key of LEGACY_APP_STORAGE_KEYS) localStorage.removeItem(key);
}

function safeMessage(error) {
  console.error(error);
  const text = String(error?.message ?? error ?? "");
  if (/session expired/i.test(text)) return "Your session expired. Please sign in again.";
  if (/network|fetch/i.test(text)) return "The app could not connect. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}

function setLocation(path, replace = false) {
  const hash = `#/${path}`;
  if (replace) history.replaceState({ path }, "", hash);
  else if (location.hash !== hash) history.pushState({ path }, "", hash);
}

function navigate(screen, replace = false) {
  state.screen = screen;
  state.lessonSkillId = null;
  state.practice = null;
  state.checkpoint = null;
  setLocation(screen, replace);
  render();
}

function openLesson(skillId, replace = false) {
  state.screen = "lesson";
  state.lessonSkillId = skillId;
  state.teachingStep = 0;
  state.practice = null;
  state.checkpoint = null;
  setLocation(`lesson/${encodeURIComponent(skillId)}`, replace);
  render();
}

function locationState() {
  const value = location.hash.replace(/^#\/?/, "");
  if (value.startsWith("lesson/")) return { screen: "lesson", skillId: decodeURIComponent(value.slice(7)) };
  if (["home", "learn", "profile", "settings", "edit-profile", "placement"].includes(value)) return { screen: value, skillId: null };
  return { screen: "home", skillId: null };
}

function shell(content, active = state.screen, showNav = true) {
  return `<div class="screen final-shell">
    <main class="screen-content">${content}</main>
    ${showNav ? `<nav class="bottom-nav" aria-label="Primary navigation">
      <button class="nav-item ${active === "home" ? "active" : ""}" data-nav="home" type="button">${uiIcon("home")}<span>Home</span></button>
      <button class="nav-item ${["learn","lesson","practice","checkpoint","placement"].includes(active) ? "active" : ""}" data-nav="learn" type="button">${uiIcon("learn")}<span>Learn</span></button>
      <button class="nav-item ${["profile","settings","edit-profile"].includes(active) ? "active" : ""}" data-nav="profile" type="button">${uiIcon("user")}<span>Profile</span></button>
    </nav>` : ""}
  </div>`;
}

function bindNav() {
  document.querySelectorAll("[data-nav]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.nav)));
}

async function ensureFreshAccountState() {
  const userId = state.userId;
  let profile = await state.repo.getProfile(userId);
  if (!profile) {
    const fallback = state.session?.user?.email?.split("@")[0] || "Learner";
    await state.repo.upsertProfile(userId, fallback);
    profile = await state.repo.getProfile(userId);
  }

  let settings = await state.repo.getSettings(userId);
  if (!settings) settings = DEFAULT_SETTINGS(userId);
  settings = {
    ...DEFAULT_SETTINGS(userId),
    ...settings,
    theme: normalizeTheme(settings.theme),
    curriculumVersion: CURRICULUM_VERSION,
    schedulerVersion: "fsrs-6",
  };
  await state.repo.upsertSettings(settings);

  state.profile = profile;
  state.settings = settings;
  applyTheme(settings.theme);
  cacheTheme(userId, settings.theme);
  state.tutor = new TutorService({
    repository: state.repo,
    scheduler: new Fsrs6LongTermSchedulerAdapter({
      desiredRetention: settings.desiredRetention,
      maximumIntervalDays: settings.maximumIntervalDays,
    }),
  });
}

async function bootstrapSignedIn() {
  state.userId = state.session?.user?.id ?? LOCAL_USER_ID;
  applyTheme(cachedTheme(state.userId));
  if (state.client) {
    state.repo = new SupabaseRestTutorRepository({
      url: config.supabaseUrl,
      publishableKey: config.supabasePublishableKey,
      getAccessToken: () => getAccessToken(state.client),
    });
  } else {
    purgeLegacyLocalAppData();
    state.repo = new BrowserStorageTutorRepository(localStorage, LOCAL_STORAGE_KEY);
  }
  await ensureFreshAccountState();
  const located = locationState();
  state.screen = located.screen;
  state.lessonSkillId = located.skillId;
  setLocation(located.skillId ? `lesson/${encodeURIComponent(located.skillId)}` : located.screen, true);
  render();
}

function renderAuth(message = "") {
  root.innerHTML = `<div class="auth-shell">
    <section class="auth-card">
      <div class="eyebrow">Music Theory Tutor</div>
      <h1>Welcome back</h1>
      <p>Practical theory, built around retrieval, real musical relationships, and long-term review.</p>
      ${message ? `<div class="auth-message" role="status">${esc(message)}</div>` : ""}
      <form id="authForm">
        <label>Email<input id="email" type="email" autocomplete="email" required></label>
        <label>Password<input id="password" type="password" autocomplete="current-password" required></label>
        <button class="primary" id="signInAction" type="submit">Sign in</button>
        <button class="secondary" id="createAccount" type="button">Create account</button>
      </form>
    </section>
  </div>`;

  document.querySelector("#authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.busy) return;
    state.busy = true;
    const action = document.querySelector("#signInAction");
    if (action) { action.disabled = true; action.textContent = "Signing in…"; }
    try {
      const email = document.querySelector("#email").value.trim();
      const password = document.querySelector("#password").value;
      state.session = await signInWithPassword(state.client, email, password);
      await bootstrapSignedIn();
    } catch (error) {
      renderAuth(safeMessage(error));
    } finally {
      state.busy = false;
    }
  });

  document.querySelector("#createAccount").addEventListener("click", async () => {
    if (state.busy) return;
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    if (!email || !password) return renderAuth("Enter an email and password first.");
    state.busy = true;
    try {
      const result = await signUpWithPassword(state.client, email, password);
      if (result.session) {
        state.session = result.session;
        await bootstrapSignedIn();
      } else {
        renderAuth("Account created. Check your email if confirmation is required, then sign in.");
      }
    } catch (error) {
      renderAuth(safeMessage(error));
    } finally {
      state.busy = false;
    }
  });
}

function evidenceMap(states) {
  return new Map(states.map((row) => [row.skillId, row.evidence]));
}

function statusFor(evidence) {
  if (evidence?.fragile) return { label: "Needs review", cls: "repair" };
  if (evidence?.ready) return { label: "Complete", cls: "complete" };
  if (evidence && evidence.state !== "new") return { label: "Learning", cls: "current" };
  return { label: "New", cls: "new" };
}

function checkpointPassed(progressRows, phase) {
  return Boolean(progressRows.find((row) => row.phase === phase)?.checkpointPassedAt);
}

function phaseEntryAllowed(phase, progressRows) {
  if (state.settings?.requirePreviousLessons === false || phase === 1) return true;
  if (checkpointPassed(progressRows, phase - 1)) return true;
  return Boolean(progressRows.find((row) => row.phase === phase)?.validatedEntryAt);
}

function lessonUnlocked(skill, indexInPhase, bySkill, progressRows) {
  if (state.settings?.requirePreviousLessons === false) return true;
  if (!phaseEntryAllowed(skill.phase, progressRows)) return false;
  if (skill.contentKind === "reference") return true;
  if (indexInPhase === 0) return true;
  const siblings = phaseSkills(skill.phase);
  const previous = [...siblings.slice(0, indexInPhase)].reverse().find((item) => item.blocksPhaseCompletion !== false && item.assessed !== false);
  const evidence = previous ? bySkill.get(previous.id) : undefined;
  return Boolean(evidence?.ready && !evidence.fragile);
}

function phaseIntro(phase) {
  if (phase === 1) return "Build fast, correctly spelled interval relationships. These continue returning after you move forward.";
  if (phase === 2) return "Construct major scales accurately, then make the notes and scale-degree relationships fast to recall.";
  if (phase === 3) return "Build natural minor first, then understand exactly how harmonic and classical melodic minor alter it.";
  if (phase === 4) return "Turn scales into chords, Roman numerals, harmonic function, and portable progression relationships.";
  if (phase === 5) return "Connect relative major and natural minor: same collection, different tonic and different Roman-number meaning.";
  return "Use the Circle of Fifths as a practical map for fifth relationships, key similarity, key choice, and transposition.";
}

function lessonSubcopy(skill, indexInPhase) {
  if (skill.phase === 1) return indexInPhase === 9 ? "Broad mixed interval practice" : "Teaching + cumulative retrieval";
  if (skill.phase === 2) return ["Formula + interval connection","Scale-degree numbers and names","All 12 pitch classes + exact spelling","Distributed major-scale recall"][indexInPhase];
  if (skill.phase === 3) return ["Natural-minor formula + interval connection","All 12 roots + exact spelling","Raised 7, leading tone + augmented 2nd","Classical melodic minor up and down","Distributed recall across minor forms"][indexInPhase];
  if (skill.phase === 4) return ["Stack scale-tone 3rds into triads","Major-key diatonic pattern","Natural-minor triads + Roman numerals","Raised 7 changes minor harmony","Ascending melodic-minor harmony","Stack one more 3rd for seventh chords","Reference only · no mastery quiz","Tonic, predominant, dominant","Portable progression vocabulary","Analyze your own progressions"][indexInPhase];
  if (skill.phase === 5) return ["Same seven pitch classes · different tonic","Same chords · new Roman numerals","Minor-3rd shortcut both ways","Fast two-way recall"][indexInPhase];
  return ["P5/P4 movement · adjacent keys share 6 of 7","Nearby family vs farther relationships","Choose keys outside your habits","Keep Roman numerals in a far target"][indexInPhase];
}

function checkpointCopy(phase) {
  if (phase === 1) return "Intervals across construction, identification, inversion, quality, spelling, and varied roots.";
  if (phase === 2) return "Major-scale construction, exact spelling, scale degrees, key variety, and fast recall.";
  if (phase === 3) return "Minor forms, alterations, spelling, leading tone, augmented 2nd, and varied keys.";
  if (phase === 4) return "Diatonic triads and sevenths, Roman numerals, function, spelling, and progression application.";
  if (phase === 5) return "Relative keys both ways, shared natural-minor collections, renumbering, and spelling.";
  return "Fifth movement, nearby and distant keys, relatives, unfamiliar-key choice, and transposition.";
}

function nextLearningSkill(summary, states, progressRows) {
  const bySkill = evidenceMap(states);
  for (let phase = 1; phase <= 6; phase += 1) {
    if (!phaseEntryAllowed(phase, progressRows)) continue;
    const skills = phaseSkills(phase);
    for (let index = 0; index < skills.length; index += 1) {
      const skill = skills[index];
      if (skill.contentKind === "reference") continue;
      const evidence = bySkill.get(skill.id);
      if (!(evidence?.ready && !evidence?.fragile) && lessonUnlocked(skill, index, bySkill, progressRows)) return skill;
    }
  }
  return null;
}

async function renderHome() {
  const states = await state.repo.allSkillStates(state.userId);
  const due = (await state.repo.dueReviews(state.userId, new Date().toISOString())).filter((review) => SKILL_BY_ID.has(review.skillId));
  const progress = await state.repo.phaseProgress(state.userId);
  const summary = learningSummary(SKILLS, states, progress);
  const nextSkill = nextLearningSkill(summary, states, progress);
  const firstDue = due[0];
  const focusSkill = firstDue ? SKILL_BY_ID.get(firstDue.skillId) : nextSkill;
  const focusPhase = focusSkill?.phase ?? summary.currentPhase;
  const focusTitle = firstDue ? `Review ${focusSkill?.title ?? "your learning"}` : nextSkill ? nextSkill.title : "Keep it fresh";
  const focusCopy = firstDue
    ? "A spaced review is due. Recall it before the answer is shown so the evidence reflects what you can retrieve now."
    : nextSkill
      ? `Continue Phase ${focusPhase} — ${phaseDescriptor(focusPhase)?.title ?? "Learning"}.`
      : "You have reached the end of the six-phase curriculum. Reviews will continue to keep the foundations durable.";

  root.innerHTML = shell(`<div class="home-stack">
    <header class="page-header"><div><div class="eyebrow">Music Theory Tutor</div><h1>Home</h1></div></header>
    <section class="focus-card home-focus">
      <div class="eyebrow">${firstDue ? "Review due" : nextSkill ? `Phase ${focusPhase}` : "Curriculum complete"}</div>
      <h1>${esc(focusTitle)}</h1>
      <p>${esc(focusCopy)}</p>
      <button class="primary" id="continueLearning" type="button">${firstDue ? "Start Review" : nextSkill ? "Continue Learning" : "Open Learn"}</button>
    </section>
    <section class="home-secondary-grid" aria-label="Learning summary">
      <div class="home-secondary-card"><strong>${due.length}</strong><span>Reviews due</span><p>${due.length ? "Review what is due now." : "You're caught up."}</p></div>
      <div class="home-secondary-card"><strong>${summary.overallPercent}%</strong><span>Overall progress</span><div class="progress-track" aria-label="${summary.overallPercent}% complete"><div class="progress-bar" style="width:${summary.overallPercent}%"></div></div></div>
      <div class="home-secondary-card"><strong>6 phases</strong><span>Curriculum</span><button class="secondary" id="openCurriculum" type="button">View curriculum</button></div>
    </section>
  </div>`, "home");
  bindNav();
  document.querySelector("#continueLearning").onclick = () => firstDue ? startPractice(firstDue.skillId, "review", { dueReview: true }) : nextSkill ? openLesson(nextSkill.id) : navigate("learn");
  document.querySelector("#openCurriculum").onclick = () => navigate("learn");
}

async function renderLearn() {
  const states = await state.repo.allSkillStates(state.userId);
  const bySkill = evidenceMap(states);
  const readyIds = new Set(states.filter((row) => row.evidence.ready && !row.evidence.fragile).map((row) => row.skillId));
  const progress = await state.repo.phaseProgress(state.userId);
  const summary = learningSummary(SKILLS, states, progress);

  const sections = CURRICULUM_PHASES.map(({ phase, title }) => {
    const skills = phaseSkills(phase);
    const phaseInfo = phaseSummary(SKILLS, phase, states, progress);
    const entryAllowed = phaseEntryAllowed(phase, progress);
    const phaseProgress = progress.find((row) => row.phase === phase);
    const checkpointReady = entryAllowed && phaseCoreReady(phase, readyIds);
    const open = phase === summary.currentPhase || Boolean(phaseProgress?.validatedEntryAt && !phaseProgress?.checkpointPassedAt);
    const stateLabel = phaseInfo.checkpointPassed ? "Complete" : !entryAllowed ? "Locked" : phase === summary.currentPhase ? "Current" : "Available";
    const stateClass = phaseInfo.checkpointPassed ? "complete" : phase === summary.currentPhase ? "current" : "";

    const rows = skills.map((skill, index) => {
      const unlocked = lessonUnlocked(skill, index, bySkill, progress);
      const status = skill.contentKind === "reference" ? { label: "Reference", cls: "" } : statusFor(bySkill.get(skill.id));
      const lockedCopy = !entryAllowed ? "Pass the previous checkpoint or Placement Test" : "Complete the previous lesson first";
      return `<button class="lesson-row ${unlocked ? "" : "locked"}" data-skill="${esc(skill.id)}" ${unlocked ? "" : "disabled"} type="button">
        <span class="lesson-number">${index + 1}</span>
        <span class="lesson-copy"><strong>${esc(skill.title)}</strong><small>${esc(unlocked ? lessonSubcopy(skill, index) : lockedCopy)}</small></span>
        <span class="lesson-status ${status.cls}">${unlocked ? status.label : "Locked"}</span>
      </button>`;
    }).join("");

    return `<details class="phase-section-final" data-phase="${phase}" ${open ? "open" : ""}>
      <summary class="phase-summary-final">
        <span class="phase-number-final">${phase}</span>
        <span class="phase-copy-final"><strong>${esc(title)}</strong><small>${phaseInfo.completed} of ${phaseInfo.required.length} assessed lessons complete · ${phaseInfo.percent}%</small></span>
        <span class="phase-state-final ${stateClass}">${stateLabel}</span>
      </summary>
      <div class="phase-body-final">
        <section class="phase-intro"><p>${esc(phaseIntro(phase))}</p></section>
        <section class="lesson-list">${rows}</section>
        <section class="checkpoint-card ${checkpointReady ? "" : "locked"}">
          <div class="eyebrow">Phase ${phase} checkpoint</div>
          <h2>${phaseInfo.checkpointPassed ? "Checkpoint passed" : "Ready when the phase is ready"}</h2>
          <p>${esc(checkpointCopy(phase))}</p>
          <button class="${checkpointReady ? "primary" : "secondary"}" data-checkpoint-phase="${phase}" type="button" ${checkpointReady ? "" : "disabled"}>${phaseInfo.checkpointPassed ? "Retake Checkpoint" : checkpointReady ? "Take Checkpoint" : entryAllowed ? "Complete the assessed lessons first" : "Phase locked"}</button>
        </section>
      </div>
    </details>`;
  }).join("");

  root.innerHTML = shell(`<header class="curriculum-header"><div><div class="eyebrow">Learn</div><h1>Six-phase curriculum</h1><p>Open the phase you are working on. Earlier foundations continue in review.</p></div><button class="ghost-button" id="placementButton" type="button">${uiIcon("target")} Placement Test</button></header>
    <section class="phase-list-final">${sections}</section>`, "learn");
  bindNav();
  document.querySelector("#placementButton").onclick = () => navigate("placement");
  document.querySelectorAll("[data-skill]").forEach((button) => button.addEventListener("click", () => openLesson(button.dataset.skill)));
  document.querySelectorAll("[data-checkpoint-phase]").forEach((button) => {
    if (!button.disabled) button.addEventListener("click", () => startCheckpoint(Number(button.dataset.checkpointPhase)));
  });
}

async function renderLesson() {
  const skillId = state.lessonSkillId;
  const lesson = lessonForSkill(skillId);
  const skill = SKILL_BY_ID.get(skillId);
  if (!lesson || !skill) return navigate("learn", true);
  const progress = await state.repo.getLessonProgress(state.userId, skillId) ?? freshLessonProgress(skillId);
  const openingState = lessonOpeningState(progress);
  let html = renderTeachingStep({ lesson, openingState, stepIndex: state.teachingStep });
  const atLastTeachingStep = state.teachingStep >= lesson.teachingSteps.length - 1;
  if (skillId === "diatonic-chords.lesson-10-own-progressions" && atLastTeachingStep) html += phase4ProgressionLabHtml();
  if (skillId === "circle-of-fifths.lesson-4-far-side-transposition" && atLastTeachingStep) html += phase6TranspositionLabHtml();

  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="backToLearn" type="button">${uiIcon("back")}<span>Learn</span></button><div><div class="eyebrow">Phase ${skill.phase} · Lesson ${lessonNumberInPhase(skillId)}</div><h1>${esc(lesson.title)}</h1></div></header>${html}`, "learn", false);
  document.querySelector("#backToLearn").onclick = () => navigate("learn");
  const startAction = document.querySelector('[data-action="start-practice"]');
  if (skill.contentKind === "reference" && startAction) {
    startAction.textContent = "Back to Phase 4";
    startAction.dataset.action = "close-reference";
    startAction.addEventListener("click", () => navigate("learn"));
  }
  bindPhase4ProgressionLab(analyzeStructuredProgression, { userId: state.userId });
  bindPhase6Ui({ selectFarSideMajorTarget, transposeMajorRomanProgression, resolveFarSideProgression, userId: state.userId });
  document.querySelector('[data-action="previous-teaching"]')?.addEventListener("click", () => { state.teachingStep = Math.max(0, state.teachingStep - 1); render(); });
  document.querySelector('[data-action="next-teaching"]')?.addEventListener("click", () => { state.teachingStep += 1; render(); });
  document.querySelector('[data-action="start-practice"]')?.addEventListener("click", () => startPractice(skillId, "new", { lessonProgress: progress }));
  document.querySelector('[data-action="skip-review"]')?.addEventListener("click", () => startPractice(skillId, "review", { lessonProgress: progress, replay: true }));
}

function answerInput(exercise) {
  const spec = exercise.answerSpec;
  if (spec.kind === "choice") {
    return `<div class="choice-grid">${spec.choices.map((choice) => `<button class="answer-choice" data-answer="${esc(choice)}" type="button">${esc(choice)}</button>`).join("")}</div>`;
  }
  const inputMode = spec.kind === "number" || spec.kind === "number-sequence" ? "numeric" : "text";
  let placeholder = "Type your answer";
  if (spec.kind === "note") placeholder = "Example: F# or G flat";
  if (spec.kind === "note-sequence") placeholder = "Example: D E F# G A B C#";
  if (spec.kind === "number") placeholder = "Enter a number";
  if (spec.kind === "number-sequence") placeholder = "Example: 1 3 5";
  return `<form id="answerForm" class="answer-form"><input id="answerInput" type="text" inputmode="${inputMode}" autocomplete="off" spellcheck="false" placeholder="${esc(placeholder)}" aria-label="Answer"><button class="primary" id="submitAnswer" type="submit">Submit</button></form>`;
}

function parseSubmittedAnswer(exercise, raw) {
  const value = String(raw ?? "").trim();
  if (exercise.answerSpec.kind === "number") return Number(value);
  if (exercise.answerSpec.kind === "number-sequence") return value.split(/[\s,]+/).filter(Boolean).map(Number);
  if (exercise.answerSpec.kind === "note-sequence") return value.split(/[\s,]+/).filter(Boolean);
  return value;
}

function practicePiano(exercise, reveal) {
  const metadata = exercise.metadata ?? {};
  const highlighted = [];
  if (Array.isArray(metadata.pianoHighlights)) highlighted.push(...metadata.pianoHighlights);
  else if (metadata.root) highlighted.push(metadata.root);
  if (reveal && Array.isArray(metadata.revealPianoNotes)) {
    for (const note of metadata.revealPianoNotes) if (!highlighted.includes(note)) highlighted.push(note);
  }
  return highlighted.length ? pianoVisual({ highlighted }) : "";
}

function nextExerciseForPractice(practice) {
  const candidates = Array.from({ length: 40 }, (_, offset) => exerciseForSkill(practice.skillId, practice.generatorIndex + offset)).filter(Boolean);
  const selected = selectAdaptiveExercise(candidates, practice.recentSignatures, practice.answered);
  if (!selected) throw new Error(`No exercise generator for ${practice.skillId}`);
  practice.generatorIndex += 1;
  practice.recentSignatures = [...practice.recentSignatures, selected.exampleSignature].slice(-12);
  return selected;
}

async function startPractice(skillId, kind = "new", options = {}) {
  if (!SKILL_BY_ID.has(skillId) || state.transitionBusy) return;
  state.transitionBusy = true;
  try {
    const round = practiceRoundPlan(skillId, kind);
    const session = await state.repo.createSession(state.userId, new Date().toISOString(), {
      repairSkillIds: [], reviewSkillIds: kind === "review" ? [skillId] : [], acquiringSkillId: kind === "new" ? skillId : undefined,
      newSkillId: kind === "new" ? skillId : undefined, interleaveSkillIds: [],
    });
    state.screen = "practice";
    state.lessonSkillId = skillId;
    state.practice = {
      skillId, kind, roundSize: round.size, roundNumber: 1, answered: 0,
      generatorIndex: Math.floor(Date.now() / 1000) % 997,
      recentSignatures: [], current: null, feedback: null, evidence: null,
      sessionId: session.id, startedAt: Date.now(), dueReview: Boolean(options.dueReview),
      lessonProgress: options.lessonProgress ?? await state.repo.getLessonProgress(state.userId, skillId) ?? freshLessonProgress(skillId),
      replay: Boolean(options.replay),
    };
    state.practice.current = nextExerciseForPractice(state.practice);
    setLocation(`lesson/${encodeURIComponent(skillId)}`);
    render();
  } finally {
    state.transitionBusy = false;
  }
}

async function submitPracticeAnswer(answer) {
  const practice = state.practice;
  if (!practice || practice.feedback || state.busy) return;
  state.busy = true;
  const submit = document.querySelector("#submitAnswer");
  if (submit) submit.disabled = true;
  try {
    const exercise = practice.current;
    const grade = gradeExercise(exercise, answer);
    const metadata = exercise.metadata ?? {};
    const mode = ["recognition", "constructed", "discrimination", "application"].includes(metadata.responseMode) ? metadata.responseMode : (exercise.answerSpec.kind === "choice" ? "recognition" : "constructed");
    const occurredAt = new Date().toISOString();
    const attemptSkillId = exercise.skillId || practice.skillId;
    const crossPhaseReview = Boolean(metadata.crossPhaseReview && attemptSkillId !== practice.skillId);
    const attemptContext = crossPhaseReview || practice.kind === "review" ? "review" : "acquisition";
    const evidence = await state.tutor.submitAttempt({
      userId: state.userId,
      sessionId: practice.sessionId,
      skillId: attemptSkillId,
      promptSignature: exercise.promptSignature,
      occurredAt,
      outcome: grade.correct ? "correct" : "incorrect",
      independent: true,
      directEvidence: exercise.directEvidence,
      context: attemptContext,
      coldProbe: Boolean(practice.dueReview && attemptSkillId === practice.skillId && practice.answered === 0),
      evidenceSource: "objective",
      eventKind: "response",
      submissionIndex: 1,
      firstSubmission: true,
      stage: "initial",
      responseMode: mode,
      guidance: "none",
      solutionSeen: false,
      exampleSignature: exercise.exampleSignature,
      exampleAttributes: {
        interval: metadata.interval ?? "", root: metadata.root ?? "", target: metadata.target ?? "", direction: metadata.direction ?? "",
        scale: metadata.scale ?? [], degree: metadata.degree ?? null, pitchClassRoot: metadata.pitchClassRoot ?? null, crossPhaseReview,
      },
      responseMs: Math.max(0, Date.now() - practice.startedAt),
      assessmentCode: grade.code,
      metadata,
    });
    if (attemptSkillId === practice.skillId) practice.evidence = evidence;
    practice.feedback = grade;
    practice.answered += 1;
    render();
  } catch (error) {
    practice.feedback = { correct: false, code: "save-error", detail: safeMessage(error) };
    render();
  } finally {
    state.busy = false;
  }
}

async function advancePractice() {
  const practice = state.practice;
  if (!practice || state.transitionBusy) return;
  state.transitionBusy = true;
  try {
    if (practice.answered >= practice.roundSize) return await finishPracticeRound();
    practice.feedback = null;
    practice.startedAt = Date.now();
    practice.current = nextExerciseForPractice(practice);
    render();
  } finally {
    state.transitionBusy = false;
  }
}

async function finishPracticeRound() {
  const practice = state.practice;
  if (!practice) return;
  await state.repo.completeSession(state.userId, practice.sessionId, new Date().toISOString(), "practice-round-complete");
  const evidence = practice.evidence;
  const ready = Boolean(evidence?.ready && !evidence.fragile);
  if (ready && practice.lessonProgress.completionCount === 0) {
    practice.lessonProgress = markLessonCompleted(practice.lessonProgress, new Date().toISOString());
    await state.repo.upsertLessonProgress(state.userId, practice.lessonProgress);
  }
  const phase = skillPhase(practice.skillId);
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Round ${practice.roundNumber} complete</div><h1>${esc(SKILL_BY_ID.get(practice.skillId)?.title ?? "Practice")}</h1></div></header>
    <section class="focus-card round-complete">
      <h2>${ready ? "Ready to move forward." : "More evidence needed."}</h2>
      <p>${ready ? "You can continue. This skill will still return in spaced and cumulative review." : "One round is not enough evidence yet. You can do another focused round or stop for now."}</p>
      <div class="lesson-actions">
        ${ready ? `<button class="primary" id="backToLessons" type="button">Back to Phase ${phase}</button>` : `<button class="primary" id="anotherRound" type="button">Start another ${practiceRoundPlan(practice.skillId, "acquisition", true).size}-question round</button><button class="secondary" id="backToLessons" type="button">Stop for now</button>`}
      </div>
    </section>`, "learn", false);
  document.querySelector("#backToLessons").onclick = () => navigate("learn");
  const another = document.querySelector("#anotherRound");
  if (another) another.onclick = () => startPractice(practice.skillId, practice.kind, { lessonProgress: practice.lessonProgress, replay: practice.replay });
}

function renderPractice() {
  const practice = state.practice;
  if (!practice) return navigate("learn", true);
  const exercise = practice.current;
  const feedback = practice.feedback;
  const counterAnswered = feedback ? Math.max(0, practice.answered - 1) : practice.answered;
  const phase = skillPhase(practice.skillId);
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="exitPractice" type="button">${uiIcon("back")}<span>Learn</span></button><div><div class="eyebrow">Phase ${phase} practice</div><h1>${esc(SKILL_BY_ID.get(practice.skillId)?.title ?? "Practice")}</h1></div></header>
    <section class="practice-card">
      ${renderPracticeRoundCounter(counterAnswered, practice.roundSize, practice.roundNumber)}
      ${exercise.metadata?.crossPhaseReview ? `<div class="learning-expectation conceptual">Earlier skill review</div>` : ""}
      <h2>${esc(exercise.prompt)}</h2>
      ${practicePiano(exercise, Boolean(feedback))}
      ${feedback ? `<div class="feedback ${feedback.correct ? "correct" : "incorrect"}" role="status"><strong>${feedback.correct ? "Correct" : "Not quite"}</strong><p>${esc(feedback.detail ?? "")}</p></div>
        <button class="primary" id="nextQuestion" type="button">${practice.answered >= practice.roundSize ? "Finish round" : "Next question"}</button>` : answerInput(exercise)}
    </section>`, "learn", false);
  document.querySelector("#exitPractice").onclick = async () => {
    if (state.transitionBusy) return;
    state.transitionBusy = true;
    try { await state.repo.completeSession(state.userId, practice.sessionId, new Date().toISOString(), "learner-stopped"); navigate("learn"); }
    finally { state.transitionBusy = false; }
  };
  document.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => submitPracticeAnswer(button.dataset.answer)));
  const form = document.querySelector("#answerForm");
  if (form) form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitPracticeAnswer(parseSubmittedAnswer(exercise, document.querySelector("#answerInput").value));
  });
  document.querySelector("#nextQuestion")?.addEventListener("click", () => advancePractice());
}

function phase1CheckpointCandidateMatches(desired, candidate) {
  const metadata = candidate.metadata ?? {};
  if (desired.includes("construction") && metadata.direction !== "construct") return false;
  if (desired === "interval-identification" && metadata.direction !== "identify") return false;
  if (desired === "interval-inversion" && metadata.family !== "interval-inversion") return false;
  if (desired === "tritone-spelling" && metadata.family !== "tritone-spelling" && !(["A4", "d5"].includes(metadata.interval) && metadata.direction === "construct")) return false;
  if (desired === "varied-root-spelling" && metadata.direction === "construct" && !/[♯♭#b]/.test(String(metadata.root))) return false;
  if (desired === "quality-discrimination" && !["discrimination", "recognition"].includes(metadata.responseMode)) return false;
  return true;
}

function checkpointExerciseFor(definition, competency, index, recentSignatures = []) {
  const placementMatch = competency.id.match(/^placement-p([1-6])--(.+)$/);
  const sourcePhase = placementMatch ? Number(placementMatch[1]) : definition.phase;
  const desired = placementMatch ? placementMatch[2] : competency.id;
  for (let offset = 0; offset < 320; offset += 1) {
    const skillId = competency.skillIds[(index + offset) % competency.skillIds.length];
    const candidate = exerciseForSkill(skillId, index * 19 + offset);
    if (!candidate || recentSignatures.includes(candidate.exampleSignature)) continue;
    const metadata = candidate.metadata ?? {};
    if (sourcePhase >= 2) {
      if (candidate.skillId !== skillId) continue;
      const competencies = Array.isArray(metadata.checkpointCompetencies) ? metadata.checkpointCompetencies : [];
      if (!competencies.includes(desired)) continue;
      if (desired === "key-variety" && metadata.unfamiliarKey !== true) continue;
      if (desired === "instant-recall" && metadata.automaticRecall !== true) continue;
      return { skillId, exercise: candidate };
    }
    if (!phase1CheckpointCandidateMatches(desired, candidate)) continue;
    return { skillId, exercise: candidate };
  }
  const skillId = competency.skillIds[index % competency.skillIds.length];
  return { skillId, exercise: exerciseForSkill(skillId, index) };
}

function startAssessment(definition, kind, targetPhase = definition.phase) {
  if (!definition?.competencies?.length) return;
  state.screen = "checkpoint";
  state.checkpoint = { definition, kind, targetPhase, results: [], index: 0, current: null, feedback: null, recentSignatures: [] };
  prepareCheckpointItem();
  render();
}

function startCheckpoint(phase) {
  const definition = checkpointDefinition(phase);
  if (definition) startAssessment(definition, "checkpoint", phase);
}

function startPlacement(targetPhase) {
  const definition = placementDefinition(targetPhase);
  if (definition?.competencies?.length) startAssessment(definition, "placement", targetPhase);
}

function prepareCheckpointItem() {
  const checkpoint = state.checkpoint;
  const evaluation = evaluateCheckpoint(checkpoint.definition, checkpoint.results);
  const counts = new Map();
  for (const result of checkpoint.results) counts.set(result.competencyId, (counts.get(result.competencyId) ?? 0) + 1);
  const unresolved = checkpoint.definition.competencies.filter((competency) => !evaluation.competencies.find((row) => row.competencyId === competency.id)?.demonstrated);
  const pool = unresolved.length ? unresolved : checkpoint.definition.competencies;
  const competency = [...pool].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
  const selected = checkpointExerciseFor(checkpoint.definition, competency, checkpoint.index, checkpoint.recentSignatures);
  checkpoint.current = { competency, ...selected };
  checkpoint.recentSignatures = [...checkpoint.recentSignatures, selected.exercise.exampleSignature].slice(-12);
  checkpoint.feedback = null;
}

async function submitCheckpointAnswer(answer) {
  const checkpoint = state.checkpoint;
  if (!checkpoint || checkpoint.feedback || state.busy) return;
  state.busy = true;
  const submit = document.querySelector("#submitAnswer");
  if (submit) submit.disabled = true;
  try {
    const { competency, skillId, exercise } = checkpoint.current;
    const grade = gradeExercise(exercise, answer);
    const metadata = exercise.metadata ?? {};
    const responseMode = ["constructed", "discrimination", "application"].includes(metadata.responseMode) ? metadata.responseMode : "recognition";
    checkpoint.results.push({
      competencyId: competency.id, skillId, promptSignature: exercise.promptSignature, exampleSignature: exercise.exampleSignature,
      correct: grade.correct, firstSubmission: true, independent: true, responseMode, guidanceUsed: false, solutionSeen: false,
    });
    const session = await state.repo.createSession(state.userId, new Date().toISOString());
    await state.tutor.submitAttempt({
      userId: state.userId, sessionId: session.id, skillId, promptSignature: exercise.promptSignature, occurredAt: new Date().toISOString(),
      outcome: grade.correct ? "correct" : "incorrect", independent: true, directEvidence: true, context: "diagnostic", coldProbe: false,
      evidenceSource: "objective", eventKind: "response", submissionIndex: 1, firstSubmission: true, stage: "initial", responseMode,
      guidance: "none", solutionSeen: false, exampleSignature: exercise.exampleSignature, exampleAttributes: { ...metadata, assessmentKind: checkpoint.kind },
    });
    await state.repo.completeSession(state.userId, session.id, new Date().toISOString(), `${checkpoint.kind}-item`);
    checkpoint.feedback = grade;
    checkpoint.index += 1;
    render();
  } catch (error) {
    console.error("Assessment answer failed", error);
  } finally {
    state.busy = false;
  }
}

async function advanceCheckpoint() {
  const checkpoint = state.checkpoint;
  if (!checkpoint || state.transitionBusy) return;
  state.transitionBusy = true;
  try {
    const evaluation = evaluateCheckpoint(checkpoint.definition, checkpoint.results);
    if (evaluation.complete) return await finishCheckpoint(evaluation);
    prepareCheckpointItem();
    render();
  } finally {
    state.transitionBusy = false;
  }
}

async function finishCheckpoint(evaluation) {
  const checkpoint = state.checkpoint;
  const targetPhase = checkpoint.targetPhase;
  const rows = await state.repo.phaseProgress(state.userId);
  const existing = rows.find((row) => row.phase === targetPhase) ?? { userId: state.userId, phase: targetPhase, updatedAt: new Date().toISOString() };
  if (evaluation.passed) {
    const now = new Date().toISOString();
    if (checkpoint.kind === "placement") {
      await state.repo.upsertPhaseProgress({
        ...existing,
        userId: state.userId,
        phase: targetPhase,
        validatedEntryAt: now,
        validatedEntrySource: "placement",
        placementSummary: { curriculumVersion: CURRICULUM_VERSION, strong: evaluation.strong, review: evaluation.review, itemCount: checkpoint.results.length },
        updatedAt: now,
      });
    } else {
      await state.repo.upsertPhaseProgress({
        ...existing,
        userId: state.userId,
        phase: targetPhase,
        checkpointPassedAt: now,
        checkpointSummary: { curriculumVersion: CURRICULUM_VERSION, strong: evaluation.strong, review: evaluation.review, itemCount: checkpoint.results.length },
        updatedAt: now,
      });
    }
  }

  const label = checkpoint.kind === "placement" ? `Placement Test for Phase ${targetPhase}` : `Phase ${targetPhase} checkpoint`;
  const passedCopy = checkpoint.kind === "placement"
    ? `Your prerequisite knowledge is strong enough to start Phase ${targetPhase}. This does not mark earlier skills retained or complete.`
    : "You demonstrated the representative competencies for this phase. Passing does not mean the material is permanently retained; spaced review continues.";
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">${esc(label)}</div><h1>${evaluation.passed ? "Passed" : "Review needed"}</h1></div></header>
    <section class="focus-card"><h2>${checkpoint.kind === "placement" ? `Phase ${targetPhase}` : esc(phaseDescriptor(targetPhase)?.title ?? `Phase ${targetPhase}`)}</h2><p>${evaluation.passed ? esc(passedCopy) : "The assessment found prerequisite areas that need more work before this entry point is validated."}</p>
      ${evaluation.review.length ? `<div class="review-list"><strong>Review:</strong>${evaluation.review.slice(0,8).map((item) => `<span>${esc(item)}</span>`).join("")}${evaluation.review.length > 8 ? `<span>+ ${evaluation.review.length - 8} more areas</span>` : ""}</div>` : ""}
      <button class="primary" id="assessmentDone" type="button">${checkpoint.kind === "placement" ? "Back to Learn" : "Back to Learn"}</button>
    </section>`, "learn", false);
  document.querySelector("#assessmentDone").onclick = () => navigate("learn");
}

function renderCheckpoint() {
  const checkpoint = state.checkpoint;
  if (!checkpoint) return navigate("learn", true);
  const { competency, exercise } = checkpoint.current;
  const feedback = checkpoint.feedback;
  const itemNumber = checkpoint.results.length + (feedback ? 0 : 1);
  const label = checkpoint.kind === "placement" ? `Placement Test · Target Phase ${checkpoint.targetPhase}` : `Phase ${checkpoint.targetPhase} checkpoint`;
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="exitCheckpoint" type="button">${uiIcon("back")}<span>${checkpoint.kind === "placement" ? "Placement" : "Learn"}</span></button><div><div class="eyebrow">${esc(label)}</div><h1>${esc(competency.label.replace(/^Phase \d+ prerequisite: /, ""))}</h1></div></header>
    <section class="practice-card">
      <div class="assessment-meta"><span>Item ${Math.max(1,itemNumber)}</span><span>Up to ${checkpoint.definition.maxItems}</span></div>
      <h2>${esc(exercise.prompt)}</h2>${practicePiano(exercise, Boolean(feedback))}
      ${feedback ? `<div class="feedback ${feedback.correct ? "correct" : "incorrect"}" role="status"><strong>${feedback.correct ? "Correct" : "Not quite"}</strong><p>${esc(feedback.detail ?? "")}</p></div><button class="primary" id="nextCheckpoint" type="button">Continue</button>` : answerInput(exercise)}
    </section>`, "learn", false);
  document.querySelector("#exitCheckpoint").onclick = () => checkpoint.kind === "placement" ? navigate("placement") : navigate("learn");
  document.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => submitCheckpointAnswer(button.dataset.answer)));
  const form = document.querySelector("#answerForm");
  if (form) form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitCheckpointAnswer(parseSubmittedAnswer(exercise, document.querySelector("#answerInput").value));
  });
  document.querySelector("#nextCheckpoint")?.addEventListener("click", () => advanceCheckpoint());
}

async function renderPlacement() {
  const progress = await state.repo.phaseProgress(state.userId);
  const targets = [2,3,4,5,6].map((phase) => {
    const validated = Boolean(progress.find((row) => row.phase === phase)?.validatedEntryAt);
    const naturallyUnlocked = checkpointPassed(progress, phase - 1);
    return `<button class="settings-action-row" data-placement-target="${phase}" type="button"><span>${uiIcon("target")}<span><strong>Start at Phase ${phase}</strong><small>${esc(phaseDescriptor(phase)?.title ?? "")}</small></span></span><span>${validated ? "Validated" : naturallyUnlocked ? "Already available" : uiIcon("chevron")}</span></button>`;
  }).join("");
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="placementBack" type="button">${uiIcon("back")}<span>Learn</span></button><div><div class="eyebrow">Skip ahead</div><h1>Placement Test</h1></div></header>
    <section class="placement-intro"><h1>Choose where you want to start</h1><p>The test checks the prerequisite skills needed before that phase. It does not test the destination phase itself, and passing it does not mark earlier material retained.</p><div class="placement-targets">${targets}</div></section>`, "learn", false);
  document.querySelector("#placementBack").onclick = () => navigate("learn");
  document.querySelectorAll("[data-placement-target]").forEach((button) => button.addEventListener("click", () => startPlacement(Number(button.dataset.placementTarget))));
}

async function renderProfile() {
  const states = await state.repo.allSkillStates(state.userId);
  const due = (await state.repo.dueReviews(state.userId, new Date().toISOString())).filter((review) => SKILL_BY_ID.has(review.skillId));
  const progress = await state.repo.phaseProgress(state.userId);
  const summary = learningSummary(SKILLS, states, progress);
  const nextSkill = nextLearningSkill(summary, states, progress);
  const name = state.profile?.displayName || "Learner";
  const initial = name.trim().charAt(0).toUpperCase() || "L";
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Profile</div><h1>Your learning</h1></div></header>
    <section class="profile-hero-final"><div class="profile-avatar-final" aria-hidden="true">${esc(initial)}</div><div><h1>${esc(name)}</h1><p>Phase ${summary.currentPhase} · ${summary.overallPercent}% complete</p></div></section>
    <section class="profile-progress-card">
      <div class="progress-label"><strong>Overall progress</strong><span>${summary.overallPercent}%</span></div>
      <div class="progress-track"><div class="progress-bar" style="width:${summary.overallPercent}%"></div></div>
      <div class="profile-stat-grid"><div class="profile-stat"><strong>${summary.completed}</strong><span>Complete</span></div><div class="profile-stat"><strong>${summary.learning}</strong><span>Learning</span></div><div class="profile-stat"><strong>${due.length}</strong><span>Reviews</span></div></div>
    </section>
    <section class="current-learning-final"><span>Current learning</span><strong>${esc(nextSkill?.title ?? (summary.allCheckpointsPassed ? "Six-phase curriculum complete" : phaseDescriptor(summary.currentPhase)?.title ?? "Phase 1"))}</strong></section>
    <section class="settings-group" style="margin-top:16px"><div class="settings-group-title">Account</div>
      <button class="settings-action-row" id="editProfileButton" type="button"><span>${uiIcon("edit")} Edit Profile</span>${uiIcon("chevron")}</button>
      <button class="settings-action-row" id="settingsButton" type="button"><span>${uiIcon("settings")} Settings</span>${uiIcon("chevron")}</button>
      ${state.client ? `<button class="settings-action-row danger" id="signOutButton" type="button"><span>${uiIcon("logout")} Sign Out</span>${uiIcon("chevron")}</button>` : ""}
    </section>`, "profile");
  bindNav();
  document.querySelector("#editProfileButton").onclick = () => navigate("edit-profile");
  document.querySelector("#settingsButton").onclick = () => navigate("settings");
  const signOutButton = document.querySelector("#signOutButton");
  if (signOutButton) signOutButton.onclick = async () => {
    if (state.transitionBusy) return;
    state.transitionBusy = true;
    try {
      await signOut(state.client);
      state.session = null; state.repo = null; state.tutor = null; state.userId = null; state.profile = null; state.settings = null;
      applyTheme("dark");
      history.replaceState({}, "", location.pathname);
      renderAuth();
    } finally { state.transitionBusy = false; }
  };
}

async function saveSettings(patch) {
  if (state.busy) return;
  state.busy = true;
  try {
    const next = { ...state.settings, ...patch, curriculumVersion: CURRICULUM_VERSION, schedulerVersion: "fsrs-6" };
    await state.repo.upsertSettings(next);
    state.settings = next;
  } finally {
    state.busy = false;
  }
}

async function renderSettings() {
  const theme = normalizeTheme(state.settings?.theme);
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="settingsBack" type="button">${uiIcon("back")}<span>Profile</span></button><div><div class="eyebrow">Profile</div><h1>Settings</h1></div></header>
    <section class="settings-screen">
      <section class="settings-group"><div class="settings-group-title">Appearance</div>
        <div class="settings-row"><div class="setting-copy"><strong>Theme</strong><small>Choose the appearance that is easiest for you to read.</small></div></div>
        <div class="theme-segmented" role="group" aria-label="Theme">
          <button class="theme-option" data-theme-choice="light" aria-pressed="${theme === "light"}" type="button">${uiIcon("sun")} Light</button>
          <button class="theme-option" data-theme-choice="dark" aria-pressed="${theme === "dark"}" type="button">${uiIcon("moon")} Dark</button>
        </div>
      </section>
      <section class="settings-group"><div class="settings-group-title">Learning</div>
        <div class="settings-row"><div class="setting-copy"><strong>Require Previous Lessons</strong><small>${state.settings?.requirePreviousLessons !== false ? "On — complete lessons in order before later lessons unlock." : "Off — you can open any lesson. Your actual progress and mastery do not change."}</small></div><label class="switch-final" aria-label="Require Previous Lessons"><input id="guidedToggle" type="checkbox" ${state.settings?.requirePreviousLessons !== false ? "checked" : ""}><span></span></label></div>
      </section>
      <section class="settings-group" data-settings-account><div class="settings-group-title">Account</div>
        <button class="settings-action-row" id="settingsEditProfile" type="button"><span>${uiIcon("edit")} Edit Profile</span>${uiIcon("chevron")}</button>
        ${state.client ? `<button class="settings-action-row danger" id="settingsSignOut" type="button"><span>${uiIcon("logout")} Sign Out</span>${uiIcon("chevron")}</button>` : ""}
      </section>
    </section>`, "profile", false);
  document.querySelector("#settingsBack").onclick = () => navigate("profile");
  document.querySelector("#settingsEditProfile").onclick = () => navigate("edit-profile");
  document.querySelectorAll("[data-theme-choice]").forEach((button) => button.addEventListener("click", async () => {
    if (state.busy) return;
    const nextTheme = normalizeTheme(button.dataset.themeChoice);
    applyTheme(nextTheme);
    cacheTheme(state.userId, nextTheme);
    await saveSettings({ theme: nextTheme });
    renderSettings();
  }));
  document.querySelector("#guidedToggle").addEventListener("change", async (event) => {
    event.target.disabled = true;
    await saveSettings({ requirePreviousLessons: event.target.checked });
    renderSettings();
  });
  const signOutButton = document.querySelector("#settingsSignOut");
  if (signOutButton) signOutButton.onclick = async () => {
    if (state.transitionBusy) return;
    state.transitionBusy = true;
    try {
      await signOut(state.client);
      state.session = null; state.repo = null; state.tutor = null; state.userId = null; state.profile = null; state.settings = null;
      applyTheme("dark"); history.replaceState({}, "", location.pathname); renderAuth();
    } finally { state.transitionBusy = false; }
  };
}

async function renderEditProfile() {
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="editBack" type="button">${uiIcon("back")}<span>Profile</span></button><div><div class="eyebrow">Account</div><h1>Edit Profile</h1></div></header>
    <section class="focus-card"><form id="profileForm" class="answer-form"><label class="setting-copy"><strong>Display name</strong><small>This is the name shown inside the app.</small></label><input id="displayName" type="text" maxlength="80" autocomplete="name" value="${esc(state.profile?.displayName || "Learner")}"><button class="primary" id="saveProfile" type="submit">Save</button></form></section>`, "profile", false);
  document.querySelector("#editBack").onclick = () => navigate("profile");
  document.querySelector("#profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.busy) return;
    state.busy = true;
    const button = document.querySelector("#saveProfile");
    button.disabled = true; button.textContent = "Saving…";
    try {
      const displayName = document.querySelector("#displayName").value.trim() || "Learner";
      await state.repo.upsertProfile(state.userId, displayName, state.profile?.createdAt);
      state.profile = await state.repo.getProfile(state.userId);
      navigate("profile");
    } catch (error) {
      console.error("Profile save failed", error);
      button.disabled = false; button.textContent = "Try Again";
    } finally { state.busy = false; }
  });
}

async function render() {
  if (!state.repo) return;
  try {
    if (state.screen === "learn") return await renderLearn();
    if (state.screen === "lesson") return await renderLesson();
    if (state.screen === "practice") return renderPractice();
    if (state.screen === "checkpoint") return renderCheckpoint();
    if (state.screen === "placement") return await renderPlacement();
    if (state.screen === "profile") return await renderProfile();
    if (state.screen === "settings") return await renderSettings();
    if (state.screen === "edit-profile") return await renderEditProfile();
    return await renderHome();
  } catch (error) {
    console.error("App render failed", error);
    root.innerHTML = `<section class="error-panel"><h1>Something went wrong loading this screen.</h1><p>Your saved learning progress has not been changed.</p><button class="primary" id="retry" type="button">Try Again</button></section>`;
    document.querySelector("#retry").onclick = () => render();
  }
}

window.addEventListener("popstate", () => {
  const located = locationState();
  state.screen = located.screen; state.lessonSkillId = located.skillId; state.practice = null; state.checkpoint = null; render();
});
window.addEventListener("hashchange", () => {
  if (state.screen === "practice" || state.screen === "checkpoint") return;
  const located = locationState(); state.screen = located.screen; state.lessonSkillId = located.skillId; render();
});

async function initialize() {
  root.innerHTML = `<div class="loading-state" aria-live="polite"><div class="loading-skeleton"><div class="skeleton-line"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div><span>Loading your study plan…</span></div>`;
  try {
    if (hasSupabaseConfig(config)) {
      state.client = await createSupabaseBrowserClient(config);
      state.session = await getSession(state.client);
      if (!state.session) return renderAuth();
    }
    await bootstrapSignedIn();
  } catch (error) {
    console.error("App initialization failed", error);
    if (state.client && !state.session) return renderAuth(safeMessage(error));
    root.innerHTML = `<section class="error-panel"><h1>Could not start the app.</h1><p>Check your connection and try again.</p><button class="primary" id="retryStart" type="button">Try Again</button></section>`;
    document.querySelector("#retryStart").onclick = () => initialize();
  }
}

initialize();
