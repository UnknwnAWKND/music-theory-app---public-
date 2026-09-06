import {
  CURRICULUM_VERSION,
  SKILL_BY_ID,
  SupabaseRestTutorRepository,
  TutorService,
  Fsrs6LongTermSchedulerAdapter,
  checkpointDefinition,
  evaluateCheckpoint,
  exerciseForSkill,
  gradeExercise,
} from "./core/index.js";
import { createSupabaseBrowserClient, getAccessToken, getSession, hasSupabaseConfig, runtimeConfig } from "./runtime.js";

const app = document.querySelector("#app");
const config = runtimeConfig();
let clientPromise = null;
let practiceStats = null;
let observerQueued = false;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function route() { return location.hash.replace(/^#\/?/, "").split("?")[0] || "home"; }
async function client() {
  if (!hasSupabaseConfig(config)) return null;
  if (!clientPromise) clientPromise = createSupabaseBrowserClient(config);
  return clientPromise;
}
async function accountContext() {
  const supabase = await client();
  const session = supabase ? await getSession(supabase) : null;
  if (!supabase || !session?.user) return { supabase, session, user: null, repo: null, tutor: null };
  const repo = new SupabaseRestTutorRepository({
    url: config.supabaseUrl,
    publishableKey: config.supabasePublishableKey,
    getAccessToken: () => getAccessToken(supabase),
  });
  const tutor = new TutorService({ repository: repo, scheduler: new Fsrs6LongTermSchedulerAdapter({ desiredRetention: .9, maximumIntervalDays: 36500 }) });
  return { supabase, session, user: session.user, repo, tutor };
}

function normalizeNormalPracticeUi() {
  const card = app?.querySelector(".practice-card");
  const eyebrow = app?.querySelector(".page-header .eyebrow")?.textContent ?? "";
  const normalPractice = card && /practice/i.test(eyebrow) && !/checkpoint|placement/i.test(eyebrow);
  const complete = app?.querySelector(".round-complete");

  if (complete) {
    const title = complete.querySelector("h2");
    if (title?.textContent?.trim() === "More evidence needed.") {
      title.textContent = "Skill not mastered yet";
      const copy = complete.querySelector("p");
      if (copy) copy.textContent = "Continue practicing this skill before moving on.";
      const more = complete.querySelector("#anotherRound");
      const stop = complete.querySelector("#backToLessons");
      if (more) more.textContent = "Continue Practicing";
      if (stop) stop.textContent = "Stop for Now";
    }
    if (practiceStats) practiceStats.ended = true;
  }

  if (!normalPractice) return;
  const meta = card.querySelector(".question-meta");
  if (!meta) return;
  const spans = meta.querySelectorAll("span");
  const match = spans[0]?.textContent?.match(/Question\s+(\d+)\s+of\s+(\d+)/i);
  if (!match) return;
  const question = Number(match[1]);
  const size = Number(match[2]);
  const key = `${route()}::${size}`;
  if (!practiceStats || practiceStats.key !== key || (practiceStats.ended && question === 1 && !card.querySelector(".feedback"))) {
    practiceStats = { key, correct: 0, answered: 0, scoredQuestions: new Set(), ended: false };
  }
  const feedback = card.querySelector(".feedback");
  if (feedback && !practiceStats.scoredQuestions.has(question)) {
    practiceStats.scoredQuestions.add(question);
    practiceStats.answered += 1;
    if (feedback.classList.contains("correct")) practiceStats.correct += 1;
  }
  let live = meta.querySelector("[data-live-correct]") ?? spans[1];
  if (!live) {
    live = document.createElement("span");
    meta.append(live);
  }
  live.setAttribute("data-live-correct", "");
  live.textContent = `${practiceStats.correct}/${practiceStats.answered} correct`;
}

function normalizeCheckpointProgressUi() {
  const card = app?.querySelector(".practice-card");
  const eyebrow = app?.querySelector(".page-header .eyebrow")?.textContent ?? "";
  if (!card || !/checkpoint/i.test(eyebrow) || /placement/i.test(eyebrow)) return;
  const meta = card.querySelector(".assessment-meta");
  if (!meta) return;
  const spans = meta.querySelectorAll("span");
  const item = spans[0]?.textContent?.match(/(?:Item|Question)\s+(\d+)/i)?.[1] ?? "1";
  if (spans[0]) spans[0].textContent = `Question ${item} of 200`;
  if (spans[1]) spans[1].remove();
}

function removePlacementUiAndEnableContextLocks() {
  if (route() === "placement") {
    location.replace("#/learn");
    return;
  }
  if (route() !== "learn") return;
  app?.querySelector("#placementButton")?.remove();
  app?.querySelectorAll(".lesson-row.locked[disabled]").forEach((button) => {
    const copy = button.querySelector(".lesson-copy small");
    if (!/Pass the previous checkpoint or Placement Test/i.test(copy?.textContent ?? "")) return;
    button.disabled = false;
    button.dataset.contextLocked = "true";
    if (copy) copy.textContent = "Pass the required prior phase checkpoint";
  });
}

function phase1CandidateMatches(desired, candidate) {
  const metadata = candidate.metadata ?? {};
  if (desired.includes("construction") && metadata.direction !== "construct") return false;
  if (desired === "interval-identification" && metadata.direction !== "identify") return false;
  if (desired === "interval-inversion" && metadata.family !== "interval-inversion") return false;
  if (desired === "tritone-spelling" && metadata.family !== "tritone-spelling" && !(["A4", "d5"].includes(metadata.interval) && metadata.direction === "construct")) return false;
  if (desired === "varied-root-spelling" && metadata.direction === "construct" && !/[♯♭#b]/.test(String(metadata.root))) return false;
  if (desired === "quality-discrimination" && !["discrimination", "recognition"].includes(metadata.responseMode)) return false;
  return true;
}

function checkpointExercise(definition, competency, index, recent) {
  for (let offset = 0; offset < 640; offset += 1) {
    const skillId = competency.skillIds[(index + offset) % competency.skillIds.length];
    const candidate = exerciseForSkill(skillId, index * 29 + offset);
    if (!candidate || recent.includes(candidate.exampleSignature)) continue;
    const metadata = candidate.metadata ?? {};
    if (definition.phase >= 2) {
      if (candidate.skillId !== skillId) continue;
      const groups = Array.isArray(metadata.checkpointCompetencies) ? metadata.checkpointCompetencies : [];
      if (!groups.includes(competency.id)) continue;
      if (competency.id === "key-variety" && metadata.unfamiliarKey !== true) continue;
      if (competency.id === "instant-recall" && metadata.automaticRecall !== true) continue;
      return { skillId, exercise: candidate };
    }
    if (!phase1CandidateMatches(competency.id, candidate)) continue;
    return { skillId, exercise: candidate };
  }
  const skillId = competency.skillIds[index % competency.skillIds.length];
  return { skillId, exercise: exerciseForSkill(skillId, index * 31) };
}

function answerControl(exercise) {
  const spec = exercise.answerSpec;
  if (spec.kind === "choice") return `<div class="choice-grid">${spec.choices.map((choice) => `<button class="answer-choice" data-context-answer="${esc(choice)}" type="button">${esc(choice)}</button>`).join("")}</div>`;
  const inputMode = spec.kind === "number" || spec.kind === "number-sequence" ? "numeric" : "text";
  return `<form id="contextCheckpointAnswerForm" class="answer-form"><input id="contextCheckpointAnswer" type="text" inputmode="${inputMode}" autocomplete="off" spellcheck="false" aria-label="Answer"><button class="primary" type="submit">Submit</button></form>`;
}
function parseAnswer(exercise, raw) {
  const value = String(raw ?? "").trim();
  if (exercise.answerSpec.kind === "number") return Number(value);
  if (exercise.answerSpec.kind === "number-sequence") return value.split(/[\s,]+/).filter(Boolean).map(Number);
  if (exercise.answerSpec.kind === "note-sequence") return value.split(/[\s,]+/).filter(Boolean);
  return value;
}

async function unmetPrerequisites(targetPhase) {
  const ctx = await accountContext();
  if (!ctx.repo || !ctx.user) return { ctx, unmet: [] };
  const rows = await ctx.repo.phaseProgress(ctx.user.id);
  const passed = new Set(rows.filter((row) => row.checkpointPassedAt).map((row) => Number(row.phase)));
  return { ctx, unmet: Array.from({ length: Math.max(0, targetPhase - 1) }, (_, index) => index + 1).filter((phase) => !passed.has(phase)) };
}

async function showLockedLessonDialog(skillId) {
  const targetPhase = Number(SKILL_BY_ID.get(skillId)?.phase ?? 1);
  if (targetPhase <= 1) return;
  const { unmet } = await unmetPrerequisites(targetPhase);
  if (!unmet.length) {
    document.querySelector('[data-nav="learn"]')?.click();
    return;
  }
  const required = unmet[0];
  const old = document.querySelector("#contextLockDialog");
  old?.remove();
  const dialog = document.createElement("dialog");
  dialog.id = "contextLockDialog";
  dialog.className = "context-lock-dialog";
  dialog.innerHTML = `<div class="context-dialog-body"><div class="eyebrow">Phase ${targetPhase} locked</div><h2>Pass the Phase ${required} checkpoint</h2><p>Validate the prerequisite phase before opening this lesson. If more earlier checkpoints are still required, you'll take them in order.</p><div class="context-dialog-actions"><button class="primary" id="takeRequiredCheckpoint" type="button">Take Phase ${required} Checkpoint</button><button class="secondary" id="closeContextLock" type="button">Not Now</button></div></div>`;
  document.body.append(dialog);
  dialog.querySelector("#closeContextLock").addEventListener("click", () => dialog.close());
  dialog.querySelector("#takeRequiredCheckpoint").addEventListener("click", () => { dialog.close(); runContextCheckpoint(required, targetPhase, skillId); });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.showModal();
}

async function runContextCheckpoint(phase, targetPhase, skillId) {
  const definition = checkpointDefinition(phase);
  if (!definition) return;
  const ctx = await accountContext();
  if (!ctx.repo || !ctx.tutor || !ctx.user) return;
  const dialog = document.createElement("dialog");
  dialog.className = "context-checkpoint-dialog";
  document.body.append(dialog);
  const state = { results: [], index: 0, current: null, recent: [], feedback: null, busy: false };

  const choose = () => {
    const counts = new Map();
    for (const result of state.results) counts.set(result.competencyId, (counts.get(result.competencyId) ?? 0) + 1);
    const competency = [...definition.competencies].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
    const selected = checkpointExercise(definition, competency, state.index, state.recent);
    state.current = { competency, ...selected };
    state.recent = [...state.recent, selected.exercise.exampleSignature].slice(-24);
    state.feedback = null;
  };

  const finish = async () => {
    const evaluation = evaluateCheckpoint(definition, state.results);
    if (evaluation.passed) {
      const rows = await ctx.repo.phaseProgress(ctx.user.id);
      const existing = rows.find((row) => Number(row.phase) === phase) ?? { userId: ctx.user.id, phase, updatedAt: new Date().toISOString() };
      const now = new Date().toISOString();
      await ctx.repo.upsertPhaseProgress({ ...existing, userId: ctx.user.id, phase, checkpointPassedAt: now, checkpointSummary: { curriculumVersion: CURRICULUM_VERSION, strong: evaluation.strong, review: evaluation.review, itemCount: state.results.length }, updatedAt: now });
    }
    dialog.innerHTML = `<div class="context-dialog-body"><div class="eyebrow">Phase ${phase} checkpoint</div><h2>${evaluation.passed ? "Passed" : "Review needed"}</h2><p>${evaluation.passed ? `Phase ${phase} is validated. Continue to the next prerequisite checkpoint if one is still required.` : "This phase is not validated yet. Review the missed skills and try again when you're ready."}</p><div class="context-dialog-actions"><button class="primary" id="contextCheckpointDone" type="button">${evaluation.passed ? "Continue" : "Back to Learn"}</button></div></div>`;
    dialog.querySelector("#contextCheckpointDone").addEventListener("click", async () => {
      dialog.close();
      if (evaluation.passed) await showLockedLessonDialog(skillId);
      document.querySelector('[data-nav="learn"]')?.click();
    });
  };

  const submit = async (answer) => {
    if (state.busy || state.feedback) return;
    state.busy = true;
    try {
      const { competency, skillId: itemSkillId, exercise } = state.current;
      const grade = gradeExercise(exercise, answer);
      const metadata = exercise.metadata ?? {};
      const responseMode = ["constructed", "discrimination", "application"].includes(metadata.responseMode) ? metadata.responseMode : "recognition";
      state.results.push({ competencyId: competency.id, skillId: itemSkillId, promptSignature: exercise.promptSignature, exampleSignature: exercise.exampleSignature, correct: grade.correct, firstSubmission: true, independent: true, responseMode, guidanceUsed: false, solutionSeen: false });
      const session = await ctx.repo.createSession(ctx.user.id, new Date().toISOString());
      await ctx.tutor.submitAttempt({ userId: ctx.user.id, sessionId: session.id, skillId: itemSkillId, promptSignature: exercise.promptSignature, occurredAt: new Date().toISOString(), outcome: grade.correct ? "correct" : "incorrect", independent: true, directEvidence: true, context: "diagnostic", coldProbe: false, evidenceSource: "objective", eventKind: "response", submissionIndex: 1, firstSubmission: true, stage: "initial", responseMode, guidance: "none", solutionSeen: false, exampleSignature: exercise.exampleSignature, exampleAttributes: { ...metadata, assessmentKind: "checkpoint" } });
      await ctx.repo.completeSession(ctx.user.id, session.id, new Date().toISOString(), "checkpoint-item");
      state.feedback = grade;
      state.index += 1;
      render();
    } catch (error) { console.error("Context checkpoint answer failed", error); }
    finally { state.busy = false; }
  };

  const render = () => {
    const { competency, exercise } = state.current;
    const question = Math.min(200, state.results.length + (state.feedback ? 0 : 1));
    dialog.innerHTML = `<div class="context-dialog-body"><div class="context-checkpoint-meta"><span>Question ${Math.max(1, question)} of 200</span><span>Phase ${phase} checkpoint</span></div><h2>${esc(competency.label)}</h2><p>${esc(exercise.prompt)}</p>${state.feedback ? `<div class="context-checkpoint-feedback ${state.feedback.correct ? "correct" : "incorrect"}"><strong>${state.feedback.correct ? "Correct" : "Not quite"}</strong><p>${esc(state.feedback.detail ?? "")}</p></div><button class="primary" id="contextNextCheckpoint" type="button">${state.results.length >= 200 ? "Finish Checkpoint" : "Continue"}</button>` : answerControl(exercise)}<button class="text-button" id="exitContextCheckpoint" type="button">Exit Checkpoint</button></div>`;
    dialog.querySelector("#exitContextCheckpoint")?.addEventListener("click", () => dialog.close());
    dialog.querySelectorAll("[data-context-answer]").forEach((button) => button.addEventListener("click", () => submit(button.dataset.contextAnswer)));
    dialog.querySelector("#contextCheckpointAnswerForm")?.addEventListener("submit", (event) => { event.preventDefault(); submit(parseAnswer(exercise, dialog.querySelector("#contextCheckpointAnswer").value)); });
    dialog.querySelector("#contextNextCheckpoint")?.addEventListener("click", async () => {
      if (state.results.length >= 200) return finish();
      choose(); render();
    });
  };

  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  choose();
  render();
  dialog.showModal();
}

function normalize() {
  removePlacementUiAndEnableContextLocks();
  normalizeNormalPracticeUi();
  normalizeCheckpointProgressUi();
}

app?.addEventListener("click", (event) => {
  const locked = event.target.closest?.('.lesson-row[data-context-locked="true"]');
  if (!locked) return;
  event.preventDefault();
  event.stopPropagation();
  showLockedLessonDialog(locked.dataset.skill);
}, true);

function scheduleNormalize() {
  if (observerQueued) return;
  observerQueued = true;
  queueMicrotask(() => { observerQueued = false; normalize(); });
}
if (app) new MutationObserver(scheduleNormalize).observe(app, { childList: true, subtree: true });
window.addEventListener("hashchange", scheduleNormalize);
scheduleNormalize();
