import {
  BrowserStorageTutorRepository,
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
      <p>Phase 1 — Intervals is ready.</p>
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

function lessonUnlocked(index, bySkill) {
  if (state.settings?.requirePreviousLessons === false || index === 0) return true;
  const previous = SKILLS[index - 1];
  const evidence = bySkill.get(previous.id);
  return Boolean(evidence?.ready && !evidence.fragile);
}

async function renderHome() {
  const states = await state.repo.allSkillStates(state.userId);
  const due = await state.repo.dueReviews(state.userId, new Date().toISOString());
  const ready = states.filter((row) => row.evidence.ready).length;
  const retained = states.filter((row) => row.evidence.retained).length;
  const firstDue = due.find((review) => SKILL_BY_ID.has(review.skillId));
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Music Theory</div><h1>Home</h1></div></header>
    <section class="focus-card">
      <div class="eyebrow">Phase 1</div>
      <h1>Intervals</h1>
      <p>Build interval recall until the relationships are fast, accurate, and correctly spelled.</p>
      <button class="primary" id="continueLearning" type="button">Continue Phase 1</button>
    </section>
    ${firstDue ? `<section class="focus-card review-card"><div class="eyebrow">Spaced review</div><h2>Interval review due</h2><p>${esc(SKILL_BY_ID.get(firstDue.skillId)?.title ?? "Interval practice")}</p><button class="secondary" id="startDueReview" type="button">Review now</button></section>` : ""}
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

async function renderLearn() {
  const states = await state.repo.allSkillStates(state.userId);
  const bySkill = evidenceMap(states);
  const readyIds = new Set(states.filter((row) => row.evidence.ready && !row.evidence.fragile).map((row) => row.skillId));
  const checkpointReady = phaseCoreReady(1, readyIds);
  const progress = await state.repo.phaseProgress(state.userId);
  const phaseOne = progress.find((row) => row.phase === 1);

  const lessons = SKILLS.map((skill, index) => {
    const unlocked = lessonUnlocked(index, bySkill);
    const status = statusFor(bySkill.get(skill.id));
    return `<button class="lesson-row ${unlocked ? "" : "locked"}" data-skill="${esc(skill.id)}" ${unlocked ? "" : "disabled"} type="button">
      <span class="lesson-number">${index + 1}</span>
      <span class="lesson-copy"><strong>${esc(skill.title)}</strong><small>${unlocked ? (index === 9 ? "Broad mixed interval practice" : "Teaching + cumulative retrieval") : "Finish the previous interval lesson first"}</small></span>
      <span class="lesson-status ${status.cls}">${unlocked ? status.label : "LOCKED"}</span>
    </button>`;
  }).join("");

  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Phase 1</div><h1>Intervals</h1></div></header>
    <section class="phase-intro"><p>Intervals are foundational. READY lets you move forward; interval practice continues afterward until recall becomes durable.</p>
      <div class="expectation-key"><span class="learning-expectation automatic">KNOW THIS INSTANTLY</span><span>facts to retrieve automatically</span><span class="learning-expectation conceptual">UNDERSTAND THIS</span><span>ideas to explain and apply</span></div>
    </section>
    <section class="lesson-list">${lessons}</section>
    <section class="checkpoint-card ${checkpointReady ? "" : "locked"}">
      <div class="eyebrow">Phase 1 checkpoint</div>
      <h2>${phaseOne?.checkpointPassedAt ? "Checkpoint passed" : "Representative interval check"}</h2>
      <p>Construction, identification, inversion, quality discrimination, varied roots, and tritone spelling.</p>
      <button class="${checkpointReady ? "primary" : "secondary"}" id="checkpointButton" type="button" ${checkpointReady ? "" : "disabled"}>${phaseOne?.checkpointPassedAt ? "Retake checkpoint" : checkpointReady ? "Start checkpoint" : "Become READY on all 10 lessons first"}</button>
    </section>
    <section class="future-phases"><div class="eyebrow">Later blocks</div>${CURRICULUM_PHASES.slice(1).map((phase) => `<div class="future-phase"><span>Phase ${phase.phase}</span><strong>${esc(phase.title)}</strong><small>Not built yet</small></div>`).join("")}</section>`, "learn");
  bindNav();
  document.querySelectorAll("[data-skill]").forEach((button) => button.addEventListener("click", () => openLesson(button.dataset.skill)));
  const checkpointButton = document.querySelector("#checkpointButton");
  if (checkpointButton && checkpointReady) checkpointButton.onclick = () => startCheckpoint();
}

async function renderLesson() {
  const skillId = state.lessonSkillId;
  const lesson = lessonForSkill(skillId);
  if (!lesson || !SKILL_BY_ID.has(skillId)) return navigate("learn", true);
  const progress = await state.repo.getLessonProgress(state.userId, skillId) ?? freshLessonProgress(skillId);
  const openingState = lessonOpeningState(progress);
  const html = renderTeachingStep({ lesson, openingState, stepIndex: state.teachingStep });
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="backToLearn" type="button">‹ Learn</button><div><div class="eyebrow">Phase 1 · Lesson ${SKILLS.findIndex((skill) => skill.id === skillId) + 1}</div><h1>${esc(lesson.title)}</h1></div></header>${html}`, "learn", false);
  document.querySelector("#backToLearn").onclick = () => navigate("learn");
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
  const inputMode = spec.kind === "number" ? "numeric" : "text";
  const placeholder = spec.kind === "note" ? "Example: F# or G flat" : spec.kind === "number" ? "Enter a number" : "Type your answer";
  return `<form id="answerForm" class="answer-form"><input id="answerInput" inputmode="${inputMode}" autocomplete="off" placeholder="${esc(placeholder)}" required><button class="primary" type="submit">Check answer</button></form>`;
}

function practicePiano(exercise, reveal = false) {
  const metadata = exercise.metadata ?? {};
  const highlighted = [...(metadata.pianoHighlighted ?? [])];
  if (reveal && metadata.revealPianoTarget && !highlighted.includes(metadata.revealPianoTarget)) highlighted.push(metadata.revealPianoTarget);
  return highlighted.length ? pianoVisual({ highlighted }) : "";
}

function nextExerciseForPractice(practice) {
  const candidates = Array.from({ length: 24 }, (_, offset) => exerciseForSkill(practice.skillId, practice.generatorIndex + offset)).filter(Boolean);
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
    const evidence = await state.tutor.submitAttempt({
      userId: state.userId,
      sessionId: practice.sessionId,
      skillId: practice.skillId,
      promptSignature: exercise.promptSignature,
      occurredAt,
      outcome: grade.correct ? "correct" : "incorrect",
      independent: true,
      directEvidence: exercise.directEvidence,
      context: practice.kind === "review" ? "review" : "acquisition",
      coldProbe: Boolean(practice.dueReview && practice.answered === 0),
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
      },
      responseMs: Math.max(0, Date.now() - practice.startedAt),
      assessmentCode: grade.code,
      metadata,
    });
    practice.evidence = evidence;
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
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Round ${practice.roundNumber} complete</div><h1>${esc(SKILL_BY_ID.get(practice.skillId)?.title ?? "Interval practice")}</h1></div></header>
    <section class="focus-card round-complete">
      <div class="lesson-status ${ready ? "ready" : "learning"}">${ready ? "READY" : "MORE EVIDENCE NEEDED"}</div>
      <h2>${ready ? "Enough for now." : "Do another focused round."}</h2>
      <p>${ready ? "READY means you can proceed. This interval material will still return in spaced and cumulative review." : "Finishing a round does not equal mastery. The evidence engine has not established READY yet."}</p>
      <div class="lesson-actions">
        ${ready ? `<button class="primary" id="backToLessons" type="button">Back to Phase 1</button>` : `<button class="primary" id="anotherRound" type="button">Start another ${practiceRoundPlan(practice.skillId, "acquisition", true).size}-question round</button><button class="secondary" id="backToLessons" type="button">Stop for now</button>`}
      </div>
    </section>`, "learn", false);
  document.querySelector("#backToLessons").onclick = () => navigate("learn");
  const another = document.querySelector("#anotherRound");
  if (another) another.onclick = () => startPractice(practice.skillId, practice.kind, { lessonProgress: practice.lessonProgress, replay: practice.replay });
}

function renderPractice() {
  const practice = state.practice;
  if (!practice) return navigate("learn", true);
  if (practice.answered >= practice.roundSize && practice.feedback) {
    // Keep final feedback visible until the learner explicitly continues.
  }
  const exercise = practice.current;
  const feedback = practice.feedback;
  const counterAnswered = feedback ? Math.max(0, practice.answered - 1) : practice.answered;
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="exitPractice" type="button">‹ Phase 1</button><div><div class="eyebrow">Interval practice</div><h1>${esc(SKILL_BY_ID.get(practice.skillId)?.title ?? "Intervals")}</h1></div></header>
    <section class="practice-card">
      ${renderPracticeRoundCounter(counterAnswered, practice.roundSize, practice.roundNumber)}
      <h2>${esc(exercise.prompt)}</h2>
      ${practicePiano(exercise, Boolean(feedback))}
      ${feedback ? `<div class="feedback ${feedback.correct ? "correct" : "incorrect"}"><strong>${feedback.correct ? "Correct" : "Not quite"}</strong><p>${esc(feedback.detail ?? "")}</p></div>
        <button class="primary" id="nextQuestion" type="button">${practice.answered >= practice.roundSize ? "Finish round" : "Next question"}</button>` : answerInput(exercise)}
    </section>`, "learn", false);
  document.querySelector("#exitPractice").onclick = async () => { await state.repo.completeSession(state.userId, practice.sessionId, new Date().toISOString(), "learner-stopped"); navigate("learn"); };
  document.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => submitPracticeAnswer(button.dataset.answer)));
  const form = document.querySelector("#answerForm");
  if (form) form.addEventListener("submit", (event) => { event.preventDefault(); submitPracticeAnswer(document.querySelector("#answerInput").value); });
  const next = document.querySelector("#nextQuestion");
  if (next) next.onclick = () => advancePractice();
}

function checkpointExerciseFor(competency, index) {
  const desired = competency.id;
  for (let offset = 0; offset < 160; offset += 1) {
    const skillId = competency.skillIds[(index + offset) % competency.skillIds.length];
    const candidate = exerciseForSkill(skillId, index * 13 + offset);
    if (!candidate) continue;
    const metadata = candidate.metadata ?? {};
    if (desired.includes("construction") && metadata.direction !== "construct") continue;
    if (desired === "interval-identification" && metadata.direction !== "identify") continue;
    if (desired === "interval-inversion" && metadata.family !== "interval-inversion") continue;
    if (desired === "tritone-spelling" && metadata.family !== "tritone-spelling" && !(["A4", "d5"].includes(metadata.interval) && metadata.direction === "construct")) continue;
    if (desired === "varied-root-spelling" && metadata.direction === "construct" && !/[♯♭#b]/.test(String(metadata.root))) continue;
    if (desired === "quality-discrimination" && !["discrimination", "recognition"].includes(metadata.responseMode)) continue;
    return { skillId, exercise: candidate };
  }
  const skillId = competency.skillIds[index % competency.skillIds.length];
  return { skillId, exercise: exerciseForSkill(skillId, index) };
}

async function startCheckpoint() {
  const definition = checkpointDefinition(1);
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
  const selected = checkpointExerciseFor(competency, checkpoint.index);
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
  if (evaluation.passed) {
    await state.repo.upsertPhaseProgress({
      userId: state.userId,
      phase: 1,
      checkpointPassedAt: new Date().toISOString(),
      checkpointSummary: { curriculumVersion: CURRICULUM_VERSION, strong: evaluation.strong, review: evaluation.review, itemCount: state.checkpoint.results.length },
      updatedAt: new Date().toISOString(),
    });
  }
  root.innerHTML = shell(`<header class="page-header"><div><div class="eyebrow">Phase 1 checkpoint</div><h1>${evaluation.passed ? "Passed" : "Review needed"}</h1></div></header>
    <section class="focus-card"><p>${evaluation.passed ? "You demonstrated representative Phase 1 competencies. Passing the checkpoint does not mean RETAINED; interval review continues." : "The checkpoint found areas that need more work before the phase is considered passed."}</p>
      ${evaluation.review.length ? `<div class="review-list"><strong>Review:</strong>${evaluation.review.map((item) => `<span>${esc(item)}</span>`).join("")}</div>` : ""}
      <button class="primary" id="checkpointDone" type="button">Back to Phase 1</button>
    </section>`, "learn", false);
  document.querySelector("#checkpointDone").onclick = () => navigate("learn");
}

function renderCheckpoint() {
  const checkpoint = state.checkpoint;
  if (!checkpoint) return navigate("learn", true);
  const { competency, exercise } = checkpoint.current;
  const feedback = checkpoint.feedback;
  const currentNumber = checkpoint.results.length + (feedback ? 0 : 1);
  root.innerHTML = shell(`<header class="page-header lesson-header"><button class="back-button" id="exitCheckpoint" type="button">‹ Phase 1</button><div><div class="eyebrow">Checkpoint · Item ${Math.max(1, currentNumber)}</div><h1>${esc(competency.label)}</h1></div></header>
    <section class="practice-card"><h2>${esc(exercise.prompt)}</h2>${practicePiano(exercise, Boolean(feedback))}
      ${feedback ? `<div class="feedback ${feedback.correct ? "correct" : "incorrect"}"><strong>${feedback.correct ? "Correct" : "Not quite"}</strong><p>${esc(feedback.detail ?? "")}</p></div><button class="primary" id="nextCheckpoint" type="button">Continue</button>` : answerInput(exercise)}
    </section>`, "learn", false);
  document.querySelector("#exitCheckpoint").onclick = () => navigate("learn");
  document.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => submitCheckpointAnswer(button.dataset.answer)));
  const form = document.querySelector("#answerForm");
  if (form) form.addEventListener("submit", (event) => { event.preventDefault(); submitCheckpointAnswer(document.querySelector("#answerInput").value); });
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
        <label class="settings-row"><span><strong>Require Previous Lessons</strong><small>Keep Phase 1 in order unless you intentionally turn locking off.</small></span><input id="guidedToggle" type="checkbox" ${state.settings?.requirePreviousLessons !== false ? "checked" : ""}></label>
      </div>
      <div class="settings-group"><div class="settings-group-title">Account</div>
        <label class="settings-row settings-field"><span><strong>Display name</strong></span><input id="displayName" type="text" maxlength="80" value="${esc(state.profile?.displayName || "Learner")}"></label>
      </div>
      <div class="soft-note">Curriculum version: ${esc(CURRICULUM_VERSION)} · Phase 1 active · ${SKILLS.length} lessons</div>
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
