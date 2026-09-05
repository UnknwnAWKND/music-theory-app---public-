import {
  BrowserStorageTutorRepository,
  analyzeStructuredProgression,
  CURRICULUM_PHASES,
  CURRICULUM_VERSION,
  SKILLS,
  SKILL_BY_ID,
  SupabaseRestTutorRepository,
  TutorService,
  Fsrs6LongTermSchedulerAdapter,
  checkpointDefinition,
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

const config = runtimeConfig();
const root = document.querySelector("#app");
const LOCAL_USER_ID = "local-preview";
// Keep the existing key so Block 6 preserves valid local progress from Phases 1–5.
const LOCAL_STORAGE_KEY = "music-theory-tutor:block2-phase1";
const LEGACY_APP_STORAGE_KEYS = ["music-theory-tutor:v0.7-preview", "music-theory-tutor:v1", "music-theory-tutor:block1-empty"];
const DEFAULT_SETTINGS = (userId) => ({
  userId,
  desiredRetention: 0.9,
  maximumIntervalDays: 36500,
  requirePreviousLessons: true,
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
  const text = String(error?.message ?? error ?? "Something went wrong.");
  if (/supabase|postgres|rest\/v1|permission|jwt|sql/i.test(text)) return "The app could not load your account data. Please try again.";
  return text;
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
  setLocation(`lesson/${encodeURIComponent(skillId)}`, replace);
  render();
}

function locationState() {
  const value = location.hash.replace(/^#\/?/, "");
  if (value.startsWith("lesson/")) return { screen: "lesson", skillId: decodeURIComponent(value.slice(7)) };
  if (["home", "learn", "profile", "settings"].includes(value)) return { screen: value, skillId: null };
  return { screen: "home", skillId: null };
}

function shell(content, active = state.screen, showNav = true) {
  return `<div class="screen block2-shell">
    <main class="screen-content">${content}</main>
    ${showNav ? `<nav class="bottom-nav" aria-label="Primary">
      <button class="nav-item ${active === "home" ? "active" : ""}" data-nav="home" type="button"><span>Home</span></button>
      <button class="nav-item ${active === "learn" || active === "lesson" || active === "practice" || active === "checkpoint" ? "active" : ""}" data-nav="learn" type="button"><span>Learn</span></button>
      <button class="nav-item ${active === "profile" || active === "settings" ? "active" : ""}" data-nav="profile" type="button"><span>Profile</span></button>
    </nav>` : ""}
  </div>`;
}

function bindNav() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });
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
  if (!settings || settings.curriculumVersion !== CURRICULUM_VERSION) {
    settings = { ...(settings ?? DEFAULT_SETTINGS(userId)), curriculumVersion: CURRICULUM_VERSION, schedulerVersion: "fsrs-6" };
    await state.repo.upsertSettings(settings);
  }
  state.profile = profile;
  state.settings = settings;
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
      <div class="eyebrow">Music Theory</div>
      <h1>Sign in</h1>
      <p>Phases 1–5 — Intervals, Major Scales, Minor Scales, Diatonic Chords / Roman Numerals, and Relatives are ready.</p>
      ${message ? `<div class="auth-message">${esc(message)}</div>` : ""}
      <form id="authForm">
        <label>Email<input id="email" type="email" autocomplete="email" required></label>
        <label>Password<input id="password" type="password" autocomplete="current-password" required></label>
        <button class="primary" type="submit">Sign in</button>
        <button class="secondary" id="createAccount" type="button">Create account</button>
      </form>
    </section>
  </div>`;
  document.querySelector("#authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.busy) return;
    state.busy = true;
    try {
      const email = document.querySelector("#email").value.trim();
      const password = document.querySelector("#password").value;
      state.session = await signInWithPassword(state.client, email, password);
      await bootstrapSignedIn();
    } catch (error) { renderAuth(safeMessage(error)); }
    finally { state.busy = false; }
  });
  document.querySelector("#createAccount").addEventListener("click", async () => {
    if (state.busy) return;
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    if (!email || !password) return renderAuth("Enter an email and password first.");
    state.busy = true;
    try {
      const result = await signUpWithPassword(state.client, email, password);
      if (result.session) { state.session = result.session; await bootstrapSignedIn(); }
      else renderAuth("Account created. Check your email if confirmation is required, then sign in.");
    } catch (error) { renderAuth(safeMessage(error)); }
    finally { state.busy = false; }
  });
}

function evidenceMap(states) {
  return new Map(states.map((row) => [row.skillId, row.evidence]));
}

function statusFor(evidence) {
  if (evidence?.retained) return { label: "RETAINED", cls: "retained" };
  if (evidence?.ready && !evidence?.fragile) return { label: "READY", cls: "ready" };
  if (evidence?.fragile) return { label: "REPAIR", cls: "fragile" };
  if (evidence && evidence.state !== "new") return { label: "LEARNING", cls: "learning" };
  return { label: "NEW", cls: "new" };
}

function checkpointPassed(progressRows, phase) {
  return Boolean(progressRows.find((row) => row.phase === phase)?.checkpointPassedAt);
}

function lessonUnlocked(skill, indexInPhase, bySkill, progressRows) {
  if (state.settings?.requirePreviousLessons === false) return true;
  if (skill.phase === 1 && indexInPhase === 0) return true;
  if (skill.phase > 1 && indexInPhase === 0) return checkpointPassed(progressRows, skill.phase - 1);
  const siblings = phaseSkills(skill.phase);
  const previous = [...siblings.slice(0, indexInPhase)].reverse().find((item) => item.blocksPhaseCompletion !== false && item.assessed !== false);
  const evidence = previous ? bySkill.get(previous.id) : undefined;
  return Boolean(evidence?.ready && !evidence.fragile);
}

async function renderHome() {
  const states = await state.repo.allSkillStates(state.userId);
  const due = await state.repo.dueReviews(state.userId, new Date().toISOString());
  const progress = await state.repo.phaseProgress(state.userId);
  const ready = states.filter((row) => row.evidence.ready).length;
  const retained = states.filter((row) => row.evidence.retained).length;
  const firstDue = due.find((review) => SKILL_BY_ID.has(review.skillId));
  const phase1Passed = checkpointPassed(progress, 1);
  const phase2Passed = checkpointPassed(progress, 2);
  const phase3Passed = checkpointPassed(progress, 3);
  const phase4Passed = checkpointPassed(progress, 4);
  const phase5Passed = checkpointPassed(progress, 5);
  const focusPhase = !phase1Passed ? 1 : !phase2Passed ? 2 : !phase3Passed ? 3 : !phase4Passed ? 4 : 5;
  const focusTitle = phaseDescriptor(focusPhase)?.title ?? "Learn";
  const focusCopy = focusPhase === 1
    ? "Build interval recall until the relationships are fast, accurate, and correctly spelled."
    : focusPhase === 2
      ? "Build and recall all 12 major-scale pitch classes with correct theoretical spelling."
      : focusPhase === 3
        ? "Build natural, harmonic, and classical melodic minor across all 12 pitch classes with exact spelling."
        : focusPhase === 4
          ? "Turn scales into chords: stack thirds, derive Roman numerals, understand function, and transpose progressions."
          : phase5Passed
            ? "Phase 5 is complete, but relative keys, harmony, scales, and intervals continue returning in spaced review while Phase 6 remains unbuilt."
            : "Connect relative major and natural minor: same collection, different tonic, different Roman numerals, and fast two-way key recall.";
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Music Theory</div><h1>Home</h1></div></header>
    <section class="focus-card">
      <div class="eyebrow">Phase ${focusPhase}</div>
      <h1>${esc(focusTitle)}</h1>
      <p>${esc(focusCopy)}</p>
      <button class="primary" id="continueLearning" type="button">${phase5Passed ? "Review learning" : `Continue Phase ${focusPhase}`}</button>
    </section>
    ${firstDue ? `<section class="focus-card review-card"><div class="eyebrow">Spaced review</div><h2>Review due</h2><p>${esc(SKILL_BY_ID.get(firstDue.skillId)?.title ?? "Practice")}</p><button class="secondary" id="startDueReview" type="button">Review now</button></section>` : ""}
    <section class="stats-grid">
      <div class="stat-card"><strong>${ready}</strong><span>Ready</span></div>
      <div class="stat-card"><strong>${retained}</strong><span>Retained</span></div>
      <div class="stat-card"><strong>${due.length}</strong><span>Reviews due</span></div>
    </section>`);
  bindNav();
  document.querySelector("#continueLearning").onclick = () => navigate("learn");
  const reviewButton = document.querySelector("#startDueReview");
  if (reviewButton && firstDue) reviewButton.onclick = () => startPractice(firstDue.skillId, "review", { dueReview: true });
}

function phaseIntro(phase) {
  if (phase === 1) return "Intervals are foundational. READY lets you move forward; interval practice continues afterward until recall becomes durable.";
  if (phase === 2) return "Major scales are a major foundation. Learn the construction system, then move toward fast recall across all 12 pitch classes without letting interval fluency disappear.";
  if (phase === 3) return "Minor scales build directly on intervals and major-scale construction. Learn the natural form first, then understand exactly why harmonic and classical melodic minor alter specific degrees.";
  if (phase === 4) return "Diatonic harmony turns the scales you already know into chords. Derive the system first, then make the most useful Roman-numeral relationships fast and practical.";
  return "Relative keys connect the material you already know. Major and relative natural minor share a key signature and seven-note collection, but a different tonic changes scale degrees, Roman numerals, and musical function.";
}

function lessonSubcopy(skill, indexInPhase) {
  if (skill.phase === 1) return indexInPhase === 9 ? "Broad mixed interval practice" : "Teaching + cumulative retrieval";
  if (skill.phase === 2) {
    if (indexInPhase === 0) return "Formula + Phase 1 interval connection";
    if (indexInPhase === 1) return "Scale-degree numbers and names";
    if (indexInPhase === 2) return "All 12 pitch classes + exact spelling";
    return "Distributed major-scale recall";
  }
  if (skill.phase === 3) {
    if (indexInPhase === 0) return "Natural-minor formula + interval connection";
    if (indexInPhase === 1) return "All 12 roots + exact spelling";
    if (indexInPhase === 2) return "Raised 7, leading tone + augmented 2nd";
    if (indexInPhase === 3) return "Classical melodic minor up and down";
    return "Distributed recall across all minor forms";
  }
  if (skill.phase === 4) {
    if (indexInPhase === 0) return "Stack scale-tone 3rds into triads";
    if (indexInPhase === 1) return "I ii iii IV V vi vii° — derive, then recall";
    if (indexInPhase === 2) return "Natural-minor triads + Roman numerals";
    if (indexInPhase === 3) return "Raised 7 changes V, III and vii°";
    if (indexInPhase === 4) return "Ascending melodic-minor harmony — moderate priority";
    if (indexInPhase === 5) return "Stack one more 3rd for seventh chords";
    if (indexInPhase === 6) return "REFERENCE · lookup only · no mastery quiz";
    if (indexInPhase === 7) return "Tonic, predominant/subdominant, dominant";
    if (indexInPhase === 8) return "Portable progression vocabulary + transposition";
    return "Structured analysis of your own progressions";
  }
  if (indexInPhase === 0) return "Same seven pitch classes · different tonic";
  if (indexInPhase === 1) return "Same natural-minor chords · new Roman numerals";
  if (indexInPhase === 2) return "Down m3 from major · up m3 from minor";
  return "Fast two-way recall across written key signatures";
}

function checkpointCopy(phase) {
  if (phase === 1) return "Construction, identification, inversion, quality discrimination, varied roots, and tritone spelling.";
  if (phase === 2) return "Formula understanding, scale construction, exact spelling, scale degrees, varied keys, and instant recall.";
  if (phase === 3) return "Natural-minor construction, harmonic and melodic alterations, exact spelling, form discrimination, leading tone, augmented 2nd, and varied keys.";
  if (phase === 4) return "Stacked thirds, major/minor triads, seventh chords, Roman numerals, chord function, exact spelling, and progression application.";
  return "Relative-key identification in both directions, shared major/natural-minor collections, Roman-numeral renumbering, exact spelling, and varied keys.";
}

async function renderLearn() {
  const states = await state.repo.allSkillStates(state.userId);
  const bySkill = evidenceMap(states);
  const readyIds = new Set(states.filter((row) => row.evidence.ready && !row.evidence.fragile).map((row) => row.skillId));
  const progress = await state.repo.phaseProgress(state.userId);

  const activeSections = [1, 2, 3, 4, 5].map((phase) => {
    const skills = phaseSkills(phase);
    const requiredSkillCount = skills.filter((skill) => !skill.optional && skill.assessed && skill.blocksPhaseCompletion).length;
    const previousPassed = phase === 1 || checkpointPassed(progress, phase - 1) || state.settings?.requirePreviousLessons === false;
    const checkpointReady = phaseCoreReady(phase, readyIds) && previousPassed;
    const phaseProgress = progress.find((row) => row.phase === phase);
    const rows = skills.map((skill, index) => {
      const unlocked = lessonUnlocked(skill, index, bySkill, progress);
      const status = skill.contentKind === "reference" ? { label: "REFERENCE", cls: "learning" } : statusFor(bySkill.get(skill.id));
      const lockedCopy = phase > 1 && index === 0 ? `Pass the Phase ${phase - 1} checkpoint first` : "Finish the previous lesson first";
      return `<button class="lesson-row ${unlocked ? "" : "locked"}" data-skill="${esc(skill.id)}" ${unlocked ? "" : "disabled"} type="button">
        <span class="lesson-number">${index + 1}</span>
        <span class="lesson-copy"><strong>${esc(skill.title)}</strong><small>${unlocked ? esc(lessonSubcopy(skill, index)) : esc(lockedCopy)}</small></span>
        <span class="lesson-status ${status.cls}">${unlocked ? status.label : "LOCKED"}</span>
      </button>`;
    }).join("");
    const title = phaseDescriptor(phase)?.title ?? `Phase ${phase}`;
    return `<section class="active-phase-section" data-phase="${phase}">
      <header class="page-header"><div><div class="eyebrow">Phase ${phase}</div><h1>${esc(title)}</h1></div></header>
      <section class="phase-intro"><p>${esc(phaseIntro(phase))}</p>
        <div class="expectation-key"><span class="learning-expectation automatic">KNOW THIS INSTANTLY</span><span>facts to retrieve automatically</span><span class="learning-expectation conceptual">UNDERSTAND THIS</span><span>ideas to explain and apply</span></div>
      </section>
      <section class="lesson-list">${rows}</section>
      <section class="checkpoint-card ${checkpointReady ? "" : "locked"}">
        <div class="eyebrow">Phase ${phase} checkpoint</div>
        <h2>${phaseProgress?.checkpointPassedAt ? "Checkpoint passed" : phase === 1 ? "Representative interval check" : phase === 2 ? "Representative major-scale check" : phase === 3 ? "Representative minor-scale check" : phase === 4 ? "Representative harmony check" : "Representative relative-key check"}</h2>
        <p>${esc(checkpointCopy(phase))}</p>
        <button class="${checkpointReady ? "primary" : "secondary"}" data-checkpoint-phase="${phase}" type="button" ${checkpointReady ? "" : "disabled"}>${phaseProgress?.checkpointPassedAt ? "Retake checkpoint" : checkpointReady ? "Start checkpoint" : previousPassed ? `Become READY on all ${requiredSkillCount} assessed lessons first` : `Pass Phase ${phase - 1} checkpoint first`}</button>
      </section>
    </section>`;
  }).join("");

  root.innerHTML = shell(`${activeSections}
    <section class="future-phases"><div class="eyebrow">Later blocks</div>${CURRICULUM_PHASES.filter((phase) => phase.phase >= 6).map((phase) => `<div class="future-phase"><span>Phase ${phase.phase}</span><strong>${esc(phase.title)}</strong><small>Not built yet</small></div>`).join("")}</section>`, "learn");
  bindNav();
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
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="backToLearn" type="button">‹ Learn</button><div><div class="eyebrow">Phase ${skill.phase} · Lesson ${lessonNumberInPhase(skillId)}</div><h1>${esc(lesson.title)}</h1></div></header>${html}`, "learn", false);
  document.querySelector("#backToLearn").onclick = () => navigate("learn");
  const startAction = document.querySelector('[data-action="start-practice"]');
  if (skill.contentKind === "reference" && startAction) {
    startAction.textContent = "Back to Phase 4";
    startAction.dataset.action = "close-reference";
    startAction.addEventListener("click", () => navigate("learn"));
  }
  bindPhase4ProgressionLab(analyzeStructuredProgression);
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
  return `<form id="answerForm" class="answer-form"><input id="answerInput" inputmode="${inputMode}" autocomplete="off" placeholder="${esc(placeholder)}" required><button class="primary" type="submit">Check answer</button></form>`;
}

function normalizeSequenceAccidentals(value) {
  return String(value ?? "")
    .replaceAll("♯", "#")
    .replaceAll("♭", "b")
    .replace(/([A-Ga-g])\s+double\s+sharp/gi, "$1##")
    .replace(/([A-Ga-g])\s+double\s+flat/gi, "$1bb")
    .replace(/([A-Ga-g])\s+sharp/gi, "$1#")
    .replace(/([A-Ga-g])\s+flat/gi, "$1b");
}

function parseSubmittedAnswer(exercise, raw) {
  const spec = exercise.answerSpec;
  if (spec.kind === "note-sequence") {
    return normalizeSequenceAccidentals(raw).trim().split(/[\s,;|]+/).filter(Boolean);
  }
  if (spec.kind === "number-sequence") {
    return String(raw ?? "").trim().split(/[\s,;|]+/).filter(Boolean).map(Number);
  }
  return raw;
}

function practicePiano(exercise, reveal = false) {
  const metadata = exercise.metadata ?? {};
  const highlighted = [...(metadata.pianoHighlighted ?? [])];
  if (reveal && metadata.revealPianoTarget && !highlighted.includes(metadata.revealPianoTarget)) highlighted.push(metadata.revealPianoTarget);
  if (reveal && Array.isArray(metadata.revealPianoNotes)) {
    for (const note of metadata.revealPianoNotes) if (!highlighted.includes(note)) highlighted.push(note);
  }
  return highlighted.length ? pianoVisual({ highlighted }) : "";
}

function nextExerciseForPractice(practice) {
  const candidates = Array.from({ length: 30 }, (_, offset) => exerciseForSkill(practice.skillId, practice.generatorIndex + offset)).filter(Boolean);
  const selected = selectAdaptiveExercise(candidates, practice.recentSignatures, practice.answered);
  if (!selected) throw new Error(`No exercise generator for ${practice.skillId}`);
  practice.generatorIndex += 1;
  practice.recentSignatures = [...practice.recentSignatures, selected.exampleSignature].slice(-12);
  return selected;
}

async function startPractice(skillId, kind = "new", options = {}) {
  if (!SKILL_BY_ID.has(skillId)) return;
  const round = practiceRoundPlan(skillId, kind);
  const session = await state.repo.createSession(state.userId, new Date().toISOString(), {
    repairSkillIds: [], reviewSkillIds: kind === "review" ? [skillId] : [], acquiringSkillId: kind === "new" ? skillId : undefined,
    newSkillId: kind === "new" ? skillId : undefined, interleaveSkillIds: [],
  });
  state.screen = "practice";
  state.lessonSkillId = skillId;
  state.practice = {
    skillId,
    kind,
    roundSize: round.size,
    roundNumber: 1,
    answered: 0,
    generatorIndex: Math.floor(Date.now() / 1000) % 997,
    recentSignatures: [],
    current: null,
    feedback: null,
    evidence: null,
    sessionId: session.id,
    startedAt: Date.now(),
    dueReview: Boolean(options.dueReview),
    lessonProgress: options.lessonProgress ?? await state.repo.getLessonProgress(state.userId, skillId) ?? freshLessonProgress(skillId),
    replay: Boolean(options.replay),
  };
  state.practice.current = nextExerciseForPractice(state.practice);
  setLocation(`lesson/${encodeURIComponent(skillId)}`);
  render();
}

async function submitPracticeAnswer(answer) {
  const practice = state.practice;
  if (!practice || practice.feedback || state.busy) return;
  state.busy = true;
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
        interval: metadata.interval ?? "",
        root: metadata.root ?? "",
        target: metadata.target ?? "",
        direction: metadata.direction ?? "",
        scale: metadata.scale ?? [],
        degree: metadata.degree ?? null,
        pitchClassRoot: metadata.pitchClassRoot ?? null,
        crossPhaseReview,
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
  if (!practice) return;
  if (practice.answered >= practice.roundSize) return finishPracticeRound();
  practice.feedback = null;
  practice.startedAt = Date.now();
  practice.current = nextExerciseForPractice(practice);
  render();
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
      <div class="lesson-status ${ready ? "ready" : "learning"}">${ready ? "READY" : "MORE EVIDENCE NEEDED"}</div>
      <h2>${ready ? "Enough for now." : "Do another focused round."}</h2>
      <p>${ready ? "READY means you can proceed. This material will still return in spaced and cumulative review." : "Finishing a round does not equal mastery. The evidence engine has not established READY yet."}</p>
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
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="exitPractice" type="button">‹ Learn</button><div><div class="eyebrow">Phase ${phase} practice</div><h1>${esc(SKILL_BY_ID.get(practice.skillId)?.title ?? "Practice")}</h1></div></header>
    <section class="practice-card">
      ${renderPracticeRoundCounter(counterAnswered, practice.roundSize, practice.roundNumber)}
      ${exercise.metadata?.crossPhaseReview ? `<div class="learning-expectation conceptual">${exercise.metadata?.reviewPhase === 4 ? "PHASE 4 HARMONY REVIEW" : exercise.metadata?.reviewPhase === 3 ? "PHASE 3 MINOR-SCALE REVIEW" : exercise.metadata?.reviewPhase === 2 ? "PHASE 2 MAJOR-SCALE REVIEW" : "PHASE 1 INTERVAL REVIEW"}</div>` : ""}
      <h2>${esc(exercise.prompt)}</h2>
      ${practicePiano(exercise, Boolean(feedback))}
      ${feedback ? `<div class="feedback ${feedback.correct ? "correct" : "incorrect"}"><strong>${feedback.correct ? "Correct" : "Not quite"}</strong><p>${esc(feedback.detail ?? "")}</p></div>
        <button class="primary" id="nextQuestion" type="button">${practice.answered >= practice.roundSize ? "Finish round" : "Next question"}</button>` : answerInput(exercise)}
    </section>`, "learn", false);
  document.querySelector("#exitPractice").onclick = async () => { await state.repo.completeSession(state.userId, practice.sessionId, new Date().toISOString(), "learner-stopped"); navigate("learn"); };
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

function checkpointExerciseFor(definition, competency, index) {
  const desired = competency.id;
  for (let offset = 0; offset < 240; offset += 1) {
    const skillId = competency.skillIds[(index + offset) % competency.skillIds.length];
    const candidate = exerciseForSkill(skillId, index * 17 + offset);
    if (!candidate) continue;
    const metadata = candidate.metadata ?? {};
    if (definition.phase >= 2) {
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

async function startCheckpoint(phase) {
  const definition = checkpointDefinition(phase);
  if (!definition) return;
  state.screen = "checkpoint";
  state.checkpoint = { definition, results: [], index: 0, current: null, feedback: null };
  prepareCheckpointItem();
  render();
}

function prepareCheckpointItem() {
  const checkpoint = state.checkpoint;
  const evaluation = evaluateCheckpoint(checkpoint.definition, checkpoint.results);
  const counts = new Map();
  for (const result of checkpoint.results) counts.set(result.competencyId, (counts.get(result.competencyId) ?? 0) + 1);
  const unresolved = checkpoint.definition.competencies.filter((competency) => !evaluation.competencies.find((row) => row.competencyId === competency.id)?.demonstrated);
  const pool = unresolved.length ? unresolved : checkpoint.definition.competencies;
  const competency = [...pool].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
  const selected = checkpointExerciseFor(checkpoint.definition, competency, checkpoint.index);
  checkpoint.current = { competency, ...selected };
  checkpoint.feedback = null;
}

async function submitCheckpointAnswer(answer) {
  const checkpoint = state.checkpoint;
  if (!checkpoint || checkpoint.feedback || state.busy) return;
  state.busy = true;
  try {
    const { competency, skillId, exercise } = checkpoint.current;
    const grade = gradeExercise(exercise, answer);
    const metadata = exercise.metadata ?? {};
    const responseMode = ["constructed", "discrimination", "application"].includes(metadata.responseMode) ? metadata.responseMode : "recognition";
    checkpoint.results.push({
      competencyId: competency.id,
      skillId,
      promptSignature: exercise.promptSignature,
      exampleSignature: exercise.exampleSignature,
      correct: grade.correct,
      firstSubmission: true,
      independent: true,
      responseMode,
      guidanceUsed: false,
      solutionSeen: false,
    });
    const session = await state.repo.createSession(state.userId, new Date().toISOString());
    await state.tutor.submitAttempt({
      userId: state.userId, sessionId: session.id, skillId, promptSignature: exercise.promptSignature, occurredAt: new Date().toISOString(),
      outcome: grade.correct ? "correct" : "incorrect", independent: true, directEvidence: true, context: "diagnostic", coldProbe: false,
      evidenceSource: "objective", eventKind: "response", submissionIndex: 1, firstSubmission: true, stage: "initial", responseMode,
      guidance: "none", solutionSeen: false, exampleSignature: exercise.exampleSignature, exampleAttributes: metadata,
    });
    await state.repo.completeSession(state.userId, session.id, new Date().toISOString(), "checkpoint-item");
    checkpoint.feedback = grade;
    checkpoint.index += 1;
    render();
  } finally { state.busy = false; }
}

async function advanceCheckpoint() {
  const checkpoint = state.checkpoint;
  const evaluation = evaluateCheckpoint(checkpoint.definition, checkpoint.results);
  if (evaluation.complete) return finishCheckpoint(evaluation);
  prepareCheckpointItem();
  render();
}

async function finishCheckpoint(evaluation) {
  const checkpoint = state.checkpoint;
  const phase = checkpoint.definition.phase;
  if (evaluation.passed) {
    await state.repo.upsertPhaseProgress({
      userId: state.userId,
      phase,
      checkpointPassedAt: new Date().toISOString(),
      checkpointSummary: { curriculumVersion: CURRICULUM_VERSION, strong: evaluation.strong, review: evaluation.review, itemCount: checkpoint.results.length },
      updatedAt: new Date().toISOString(),
    });
  }
  const title = phaseDescriptor(phase)?.title ?? `Phase ${phase}`;
  const successCopy = phase === 1
    ? "You demonstrated representative Phase 1 competencies. Passing the checkpoint does not mean RETAINED; interval review continues."
    : phase === 2
      ? "You demonstrated representative major-scale competencies across multiple keys. Passing the checkpoint does not mean RETAINED; major-scale and interval review continue."
      : phase === 3
        ? "You demonstrated representative minor-scale competencies across multiple keys and forms. Passing the checkpoint does not mean RETAINED; minor-scale, major-scale, and interval review continue."
        : phase === 4
          ? "You demonstrated representative diatonic-harmony competencies across keys, scale forms, chord sizes, functions, and progression applications. Passing the checkpoint does not mean RETAINED; harmony and prior foundations continue in review."
          : "You demonstrated relative-key identification in both directions, natural-minor collection understanding, Roman-numeral reinterpretation, and varied-key spelling. Passing the checkpoint does not mean RETAINED; relative pairs and prior foundations continue in review.";
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Phase ${phase} checkpoint</div><h1>${evaluation.passed ? "Passed" : "Review needed"}</h1></div></header>
    <section class="focus-card"><h2>${esc(title)}</h2><p>${evaluation.passed ? esc(successCopy) : "The checkpoint found areas that need more work before the phase is considered passed."}</p>
      ${evaluation.review.length ? `<div class="review-list"><strong>Review:</strong>${evaluation.review.map((item) => `<span>${esc(item)}</span>`).join("")}</div>` : ""}
      <button class="primary" id="checkpointDone" type="button">Back to Learn</button>
    </section>`, "learn", false);
  document.querySelector("#checkpointDone").onclick = () => navigate("learn");
}

function renderCheckpoint() {
  const checkpoint = state.checkpoint;
  if (!checkpoint) return navigate("learn", true);
  const { competency, exercise } = checkpoint.current;
  const feedback = checkpoint.feedback;
  const phase = checkpoint.definition.phase;
  const currentNumber = checkpoint.results.length + (feedback ? 0 : 1);
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="exitCheckpoint" type="button">‹ Learn</button><div><div class="eyebrow">Phase ${phase} checkpoint · Item ${Math.max(1, currentNumber)}</div><h1>${esc(competency.label)}</h1></div></header>
    <section class="practice-card"><h2>${esc(exercise.prompt)}</h2>${practicePiano(exercise, Boolean(feedback))}
      ${feedback ? `<div class="feedback ${feedback.correct ? "correct" : "incorrect"}"><strong>${feedback.correct ? "Correct" : "Not quite"}</strong><p>${esc(feedback.detail ?? "")}</p></div><button class="primary" id="nextCheckpoint" type="button">Continue</button>` : answerInput(exercise)}
    </section>`, "learn", false);
  document.querySelector("#exitCheckpoint").onclick = () => navigate("learn");
  document.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => submitCheckpointAnswer(button.dataset.answer)));
  const form = document.querySelector("#answerForm");
  if (form) form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitCheckpointAnswer(parseSubmittedAnswer(exercise, document.querySelector("#answerInput").value));
  });
  document.querySelector("#nextCheckpoint")?.addEventListener("click", () => advanceCheckpoint());
}

async function renderProfile() {
  const name = state.profile?.displayName || "Learner";
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Account</div><h1>${esc(name)}</h1></div></header>
    <section class="menu-card">
      <button class="menu-row" id="settingsButton" type="button"><span>Settings</span><span>›</span></button>
      ${state.client ? `<button class="menu-row danger" id="signOutButton" type="button"><span>Sign out</span><span>›</span></button>` : ""}
    </section>`, "profile");
  bindNav();
  document.querySelector("#settingsButton").onclick = () => navigate("settings");
  const signOutButton = document.querySelector("#signOutButton");
  if (signOutButton) signOutButton.onclick = async () => {
    await signOut(state.client);
    state.session = null; state.repo = null; state.tutor = null; state.userId = null; state.profile = null; state.settings = null;
    history.replaceState({}, "", location.pathname);
    renderAuth();
  };
}

async function renderSettings() {
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Profile</div><h1>Settings</h1></div></header>
    <section class="settings-screen">
      <div class="settings-group"><div class="settings-group-title">Learning</div>
        <label class="settings-row"><span><strong>Require Previous Lessons</strong><small>Keep active lessons and phase checkpoints in order unless you intentionally turn locking off.</small></span><input id="guidedToggle" type="checkbox" ${state.settings?.requirePreviousLessons !== false ? "checked" : ""}></label>
      </div>
      <div class="settings-group"><div class="settings-group-title">Account</div>
        <label class="settings-row settings-field"><span><strong>Display name</strong></span><input id="displayName" type="text" maxlength="80" value="${esc(state.profile?.displayName || "Learner")}"></label>
      </div>
      <div class="soft-note">Curriculum version: ${esc(CURRICULUM_VERSION)} · Phases 1–5 active · ${SKILLS.length} lessons</div>
    </section>`, "profile");
  bindNav();
  document.querySelector("#guidedToggle").addEventListener("change", async (event) => {
    state.settings = { ...state.settings, requirePreviousLessons: event.target.checked, curriculumVersion: CURRICULUM_VERSION, schedulerVersion: "fsrs-6" };
    await state.repo.upsertSettings(state.settings);
  });
  document.querySelector("#displayName").addEventListener("change", async (event) => {
    const displayName = event.target.value.trim() || "Learner";
    await state.repo.upsertProfile(state.userId, displayName, state.profile?.createdAt);
    state.profile = await state.repo.getProfile(state.userId);
  });
}

async function render() {
  if (!state.repo) return;
  try {
    if (state.screen === "learn") return await renderLearn();
    if (state.screen === "lesson") return await renderLesson();
    if (state.screen === "practice") return renderPractice();
    if (state.screen === "checkpoint") return renderCheckpoint();
    if (state.screen === "profile") return await renderProfile();
    if (state.screen === "settings") return await renderSettings();
    return await renderHome();
  } catch (error) {
    root.innerHTML = `<div class="auth-shell"><section class="auth-card"><h1>Could not load the app.</h1><p>${esc(safeMessage(error))}</p><button class="primary" id="retry" type="button">Try again</button></section></div>`;
    document.querySelector("#retry").onclick = () => render();
  }
}

window.addEventListener("popstate", () => { const located = locationState(); state.screen = located.screen; state.lessonSkillId = located.skillId; state.practice = null; state.checkpoint = null; render(); });
window.addEventListener("hashchange", () => { if (state.screen === "practice" || state.screen === "checkpoint") return; const located = locationState(); state.screen = located.screen; state.lessonSkillId = located.skillId; render(); });

async function initialize() {
  root.innerHTML = `<div class="loading-state"><span>Loading…</span></div>`;
  try {
    if (hasSupabaseConfig(config)) {
      state.client = await createSupabaseBrowserClient(config);
      state.session = await getSession(state.client);
      if (!state.session) return renderAuth();
    }
    await bootstrapSignedIn();
  } catch (error) {
    if (state.client && !state.session) return renderAuth(safeMessage(error));
    root.innerHTML = `<div class="auth-shell"><section class="auth-card"><h1>Could not start the app.</h1><p>${esc(safeMessage(error))}</p></section></div>`;
  }
}

initialize();
