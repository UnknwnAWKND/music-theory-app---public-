import {
  BrowserStorageTutorRepository,
  Fsrs6LongTermSchedulerAdapter,
  SupabaseRestTutorRepository,
  TutorService,
  SKILL_BY_ID,
  exerciseForSkill,
  gradeExercise,
  lessonForSkill,
  nextAcquisitionAction,
} from "./core/index.js";
import {
  answerSpecForExercise,
  parseAnswerFromValues,
  readableExpected,
} from "./answer-utils.js";
import {
  createSupabaseBrowserClient,
  getAccessToken,
  getSession,
  hasSupabaseConfig,
  runtimeConfig,
  signInWithPassword,
  signOut as supabaseSignOut,
  signUpWithPassword,
} from "./runtime.js";

const root = document.querySelector("#app");
const config = runtimeConfig();
let USER_ID = "local-preview-user";
let repo;
let service;
let authClient = null;
let persistenceMode = "local";
let authEmail = "";

const state = {
  session: null,
  queue: [],
  itemIndex: 0,
  exerciseIndex: new Map(),
  currentExercise: null,
  currentSpec: null,
  feedback: null,
  lessonVisible: false,
  supportedNext: false,
  submitted: false,
  selectedChoice: "",
  startedPromptAt: 0,
  stoppedSkillIds: new Set(),
  fastPathPasses: 0,
};

const MAX_FAST_PATH_PASSES = 4;

function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
}

function skillTitle(id) { return SKILL_BY_ID.get(id)?.title ?? id; }
function skillPhase(id) { const x = SKILL_BY_ID.get(id); return x ? `Phase ${x.phase}` : ""; }

function topbarHtml(label = "") {
  const sync = persistenceMode === "supabase" ? "Synced" : "Local preview";
  return `<div class="topbar"><div class="brand">Theory Tutor</div><div class="topbar-right"><span class="phase-pill">${esc(label || sync)}</span>${persistenceMode === "supabase" ? `<button class="text-button" data-signout type="button">Sign out</button>` : ""}</div></div>`;
}

function footerHtml() {
  return `<div class="footer">${persistenceMode === "supabase" ? "Progress is saved securely to your account." : "Preview progress is saved on this device."}</div>`;
}

async function initializeLocalRuntime() {
  persistenceMode = "local";
  USER_ID = "local-preview-user";
  authEmail = "";
  repo = new BrowserStorageTutorRepository(localStorage, "music-theory-tutor:v0.7-preview");
  const scheduler = new Fsrs6LongTermSchedulerAdapter();
  service = new TutorService({ repository: repo, scheduler });
}

async function initializeSupabaseRuntime(session) {
  persistenceMode = "supabase";
  USER_ID = session.user.id;
  authEmail = session.user.email ?? "";
  repo = new SupabaseRestTutorRepository({
    url: config.supabaseUrl,
    publishableKey: config.supabasePublishableKey,
    getAccessToken: () => getAccessToken(authClient),
  });
  let settings = await repo.getSettings(USER_ID);
  if (!settings) {
    settings = {
      userId: USER_ID,
      desiredRetention: 0.90,
      maximumIntervalDays: 36500,
      curriculumVersion: "v0.7",
      schedulerVersion: "fsrs-6",
    };
    await repo.upsertSettings(settings);
  }
  const scheduler = new Fsrs6LongTermSchedulerAdapter({
    desiredRetention: settings.desiredRetention,
    maximumIntervalDays: settings.maximumIntervalDays,
  });
  service = new TutorService({ repository: repo, scheduler });
}

function resetSessionUiState() {
  state.session = null;
  state.queue = [];
  state.itemIndex = 0;
  state.exerciseIndex.clear();
  state.feedback = null;
  state.stoppedSkillIds.clear();
  state.fastPathPasses = 0;
}

function renderAuth(message = "", isError = false) {
  resetSessionUiState();
  root.innerHTML = `
    <div class="topbar"><div class="brand">Theory Tutor</div><div class="phase-pill">Sign in</div></div>
    <section class="card auth-card">
      <div class="eyebrow">Your private tutor</div>
      <h1>Sign in to your progress.</h1>
      <p class="muted">Your learning history and review schedule sync between your phone and computer.</p>
      ${message ? `<div class="auth-message ${isError ? "error" : ""}">${esc(message)}</div>` : ""}
      <form id="authForm" class="answer-stack">
        <div class="field-label">Email</div>
        <input class="answer-input" id="authEmail" type="email" autocomplete="email" required value="${esc(authEmail)}">
        <div class="field-label">Password</div>
        <input class="answer-input" id="authPassword" type="password" autocomplete="current-password" minlength="6" required>
        <button class="primary" id="signInBtn" type="submit">Sign in</button>
        <button class="secondary" id="signUpBtn" type="button">Create my account</button>
      </form>
      <div class="hint auth-hint">This is a personal app. After your account is created, public sign-ups can be disabled in Supabase.</div>
    </section>`;
  const emailEl = document.querySelector("#authEmail");
  const passwordEl = document.querySelector("#authPassword");
  const readCredentials = () => ({ email: emailEl.value.trim(), password: passwordEl.value });
  const busy = (on) => {
    document.querySelector("#signInBtn").disabled = on;
    document.querySelector("#signUpBtn").disabled = on;
  };
  document.querySelector("#authForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const { email, password } = readCredentials();
    authEmail = email;
    busy(true);
    try {
      const session = await signInWithPassword(authClient, email, password);
      if (!session) return renderAuth("Sign-in did not create a session. Check whether your email has been confirmed.", true);
      await initializeSupabaseRuntime(session);
      await loadToday();
    } catch (err) { renderAuth(err?.message ?? "Could not sign in.", true); }
  });
  document.querySelector("#signUpBtn").addEventListener("click", async () => {
    const { email, password } = readCredentials();
    authEmail = email;
    if (!email || password.length < 6) return renderAuth("Enter an email and a password of at least 6 characters.", true);
    busy(true);
    try {
      const result = await signUpWithPassword(authClient, email, password);
      if (result.session) {
        await initializeSupabaseRuntime(result.session);
        await loadToday();
      } else {
        renderAuth("Account created. Check your email for the confirmation link, then sign in.");
      }
    } catch (err) { renderAuth(err?.message ?? "Could not create the account.", true); }
  });
}

async function boot() {
  if (!hasSupabaseConfig(config)) {
    await initializeLocalRuntime();
    return loadToday();
  }
  authClient = await createSupabaseBrowserClient(config);
  const session = await getSession(authClient);
  if (!session) return renderAuth();
  await initializeSupabaseRuntime(session);
  await loadToday();
}

root.addEventListener("click", async (ev) => {
  const button = ev.target.closest?.("[data-signout]");
  if (!button || !authClient) return;
  button.disabled = true;
  try {
    if (state.session?.sessionId && service && USER_ID) {
      await service.finishSession(USER_ID, state.session.sessionId, "signed-out", new Date());
    }
    await supabaseSignOut(authClient);
    persistenceMode = "supabase";
    USER_ID = "";
    repo = undefined;
    service = undefined;
    renderAuth();
  } catch (err) { showFatal(err); }
});

function buildQueue(plan) {
  const seen = new Set();
  const out = [];
  const add = (skillId, kind) => {
    if (!skillId || seen.has(skillId)) return;
    seen.add(skillId);
    out.push({ skillId, kind, firstProbe: kind === "review" || kind === "repair" });
  };
  plan.repairSkillIds.forEach((id) => add(id, "repair"));
  plan.reviewSkillIds.forEach((id) => add(id, "review"));
  add(plan.acquiringSkillId, "acquisition");
  add(plan.newSkillId, "new");
  return out;
}

function planCountLabel(plan) {
  const parts = [];
  if (plan.repairSkillIds.length) parts.push(`${plan.repairSkillIds.length} repair${plan.repairSkillIds.length === 1 ? "" : "s"}`);
  if (plan.reviewSkillIds.length) parts.push(`${plan.reviewSkillIds.length} review${plan.reviewSkillIds.length === 1 ? "" : "s"}`);
  if (plan.acquiringSkillId) parts.push("continue 1 skill");
  if (plan.newSkillId) parts.push("1 new skill");
  return parts.length ? parts.join(" · ") : "Nothing meaningful is due";
}

async function loadToday() {
  state.session = await service.startSession(USER_ID, new Date());
  state.queue = buildQueue(state.session.plan);
  state.itemIndex = 0;
  state.fastPathPasses = 0;
  renderToday();
}

function renderToday() {
  const p = state.session.plan;
  const rows = [];
  if (p.repairSkillIds.length) rows.push(["Repair", p.repairSkillIds.map(skillTitle).join(", ")]);
  if (p.reviewSkillIds.length) rows.push(["Review", p.reviewSkillIds.map(skillTitle).join(", ")]);
  if (p.acquiringSkillId) rows.push(["Continue", skillTitle(p.acquiringSkillId)]);
  if (p.newSkillId) rows.push(["Learn", skillTitle(p.newSkillId)]);
  root.innerHTML = `
    ${topbarHtml()}
    <section class="card hero">
      <div class="eyebrow">Today</div>
      <h1>${state.queue.length ? "Your practice is ready." : "You're caught up."}</h1>
      <p>${esc(planCountLabel(p))}</p>
      ${rows.length ? `<div class="plan">${rows.map(([a,b]) => `<div class="plan-row"><strong>${esc(a)}</strong><span>${esc(b)}</span></div>`).join("")}</div>` : `<div class="plan"><div class="plan-row"><strong>Done</strong><span>No review or new material is needed right now.</span></div></div>`}
      <button class="primary" id="startBtn">${state.queue.length ? "Start" : "Finish"}</button>
    </section>
    ${footerHtml()}`;
  document.querySelector("#startBtn").onclick = state.queue.length ? beginItem : finishSession;
}

async function beginItem() {
  if (state.itemIndex >= state.queue.length) return finishSession();
  state.feedback = null;
  state.submitted = false;
  state.supportedNext = false;
  state.selectedChoice = "";
  const item = state.queue[state.itemIndex];
  if (item.kind === "new" || item.kind === "acquisition" || item.kind === "review-repair") {
    return renderLessonStep(item, item.kind === "review-repair" ? "Repair" : "Learn");
  }
  state.lessonVisible = false;
  await loadExercise(item);
}

function renderLessonStep(item, label = "Learn") {
  const lesson = lessonForSkill(item.skillId);
  state.lessonVisible = true;
  root.innerHTML = `
    ${topbarHtml(skillPhase(item.skillId))}
    <section class="card">
      <div class="eyebrow">${esc(label)} · ${esc(skillTitle(item.skillId))}</div>
      <h1>${esc(lesson.title)}</h1>
      <div class="lesson">
        <strong>${esc(lesson.summary)}</strong>
        ${lesson.rule ? `<div class="rule">Rule: ${esc(lesson.rule)}</div>` : ""}
        ${lesson.workedExample ? `<div class="example">Example: ${esc(lesson.workedExample)}</div>` : ""}
      </div>
      <button class="primary" id="lessonTry">${item.kind === "review-repair" ? "Try a repair question" : "Try it"}</button>
    </section>`;
  document.querySelector("#lessonTry").onclick = async () => {
    state.lessonVisible = false;
    if (item.kind === "review-repair") state.supportedNext = true;
    await loadExercise(item);
  };
}

async function loadExercise(item) {
  const current = state.exerciseIndex.get(item.skillId) ?? 0;
  state.currentExercise = exerciseForSkill(item.skillId, current);
  state.currentSpec = answerSpecForExercise(state.currentExercise);
  state.startedPromptAt = performance.now();
  state.submitted = false;
  state.feedback = null;
  state.selectedChoice = "";
  renderPractice();
}

function lessonHtml(item) {
  if (!state.lessonVisible) return "";
  const lesson = lessonForSkill(item.skillId);
  return `<div class="lesson">
    <strong>${esc(lesson.summary)}</strong>
    ${lesson.rule ? `<div class="rule">Rule: ${esc(lesson.rule)}</div>` : ""}
    ${lesson.workedExample ? `<div class="example">Example: ${esc(lesson.workedExample)}</div>` : ""}
  </div>`;
}

function exerciseVisualHtml(exercise) {
  if (exercise.type !== "note-identify" || !Number.isInteger(exercise.payload?.naturalKeyIndex)) return "";
  const active = Number(exercise.payload.naturalKeyIndex) % 7;
  const blackAfter = new Set([0, 1, 3, 4, 5]);
  return `<div class="mini-keyboard" aria-label="Piano keyboard question">${[0,1,2,3,4,5,6].map((i) => `<div class="white-key ${i === active ? "active" : ""}">${blackAfter.has(i) ? `<span class="black-key"></span>` : ""}</div>`).join("")}</div>`;
}

function answerHtml(spec) {
  if (spec.kind === "self-check") {
    return `<div class="hint">Do the task on your instrument, then self-check it. This is stored as self-reported evidence, not objective browser measurement.</div>`;
  }
  if (spec.kind === "choice") {
    return `<div class="answer-stack">${spec.choices.map((c) => `<button class="choice" data-choice="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
  }
  if (spec.kind === "two-sequences") {
    return `<div class="answer-stack">
      <div class="field-label">Ascending</div><input class="answer-input" id="ascending" autocomplete="off" placeholder="A B C D…">
      <div class="field-label">Descending</div><input class="answer-input" id="descending" autocomplete="off" placeholder="A G F E…">
      <div class="hint">Separate notes with spaces or commas. # and b are accepted and normalized.</div>
    </div>`;
  }
  if (spec.kind === "key-signature") {
    return `<div class="answer-stack"><input class="answer-input" id="count" type="number" min="0" max="7" placeholder="Number of accidentals"><select id="accType"><option value="none">None</option><option value="sharp">Sharps</option><option value="flat">Flats</option></select></div>`;
  }
  const placeholder = spec.kind === "sequence" ? "C E G" : spec.kind === "progression" ? "C G Am F" : spec.kind === "number" ? "6" : "Your answer";
  const hint = spec.kind === "sequence" ? "Separate notes with spaces or commas. # and b are accepted." : spec.kind === "progression" ? "Enter chord symbols separated by spaces or commas, e.g. C G Am F." : "";
  return `<div class="answer-stack"><input class="answer-input" id="mainAnswer" ${spec.kind === "number" ? 'type="number"' : 'type="text"'} autocomplete="off" placeholder="${esc(placeholder)}">${hint ? `<div class="hint">${esc(hint)}</div>` : ""}</div>`;
}

function feedbackHtml() {
  if (!state.feedback) return "";
  const f = state.feedback;
  const expected = f.expected ? `<div class="expected"><strong>Answer:</strong> ${esc(f.expected)}</div>` : "";
  return `<div class="feedback ${f.correct ? "correct" : "wrong"}"><div class="feedback-title">${f.correct ? "Correct" : "Not quite"}</div><div>${esc(f.detail)}</div>${expected}</div>`;
}

function renderPractice() {
  const item = state.queue[state.itemIndex];
  const e = state.currentExercise;
  const pct = Math.round((state.itemIndex / Math.max(1, state.queue.length)) * 100);
  const contextLabel = item.kind === "review" ? "Review" : item.kind === "repair" || item.kind === "review-repair" ? "Repair" : item.kind === "new" ? "New" : "Practice";
  root.innerHTML = `
    ${topbarHtml(skillPhase(item.skillId))}
    <div class="progress-track"><div class="progress-bar" style="width:${pct}%"></div></div>
    <section class="card">
      <div class="session-meta"><span>${contextLabel}</span><span>${state.itemIndex + 1} of ${state.queue.length}</span></div>
      <div class="eyebrow">${esc(skillTitle(item.skillId))}</div>
      ${state.supportedNext ? `<div class="lesson"><strong>Supported retry</strong><div>Use the rule/example above if needed. This attempt will not count as independent mastery evidence.</div></div>` : ""}
      <div class="prompt">${esc(e.prompt)}</div>
      ${exerciseVisualHtml(e)}
      ${answerHtml(state.currentSpec)}
      ${feedbackHtml()}
      <div class="actions" id="actionArea">${actionButtons(item)}</div>
    </section>`;
  bindPracticeHandlers(item);
}

function actionButtons(item) {
  if (state.submitted) return `<button class="primary" id="continueBtn">Continue</button>`;
  if (state.currentSpec.kind === "self-check") {
    return `<div class="self-check-actions"><button class="primary" id="selfYes">I did it correctly</button><button class="secondary" id="selfNo">Not yet</button></div>`;
  }
  return `<button class="primary" id="submitBtn">Check answer</button>`;
}

function bindPracticeHandlers(item) {
  document.querySelectorAll("[data-choice]").forEach((btn) => btn.addEventListener("click", () => {
    state.selectedChoice = btn.dataset.choice;
    document.querySelectorAll("[data-choice]").forEach((x) => x.classList.toggle("selected", x === btn));
  }));
  const input = document.querySelector("#mainAnswer");
  if (input) input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") submitObjective(item); });
  document.querySelector("#submitBtn")?.addEventListener("click", () => submitObjective(item));
  document.querySelector("#selfYes")?.addEventListener("click", () => submitSelfCheck(item, true));
  document.querySelector("#selfNo")?.addEventListener("click", () => submitSelfCheck(item, false));
  document.querySelector("#continueBtn")?.addEventListener("click", () => afterFeedback(item));
}

function collectValues(spec) {
  if (spec.kind === "choice") return { main: state.selectedChoice };
  if (spec.kind === "two-sequences") return { ascending: document.querySelector("#ascending")?.value ?? "", descending: document.querySelector("#descending")?.value ?? "" };
  if (spec.kind === "key-signature") return { count: document.querySelector("#count")?.value ?? "", type: document.querySelector("#accType")?.value ?? "none" };
  return { main: document.querySelector("#mainAnswer")?.value ?? "" };
}

async function submitObjective(item) {
  const values = collectValues(state.currentSpec);
  if (state.currentSpec.kind === "choice" && !values.main) return;
  const answer = parseAnswerFromValues(state.currentSpec, values);
  let assessment;
  try { assessment = gradeExercise(state.currentExercise, answer); }
  catch (err) { return showFatal(err); }
  const independent = !state.supportedNext;
  const occurredAt = new Date().toISOString();
  const evidence = await service.submitAttempt({
    userId: USER_ID,
    skillId: item.skillId,
    sessionId: state.session.sessionId,
    promptSignature: state.currentExercise.id,
    occurredAt,
    outcome: assessment.correct ? "correct" : "incorrect",
    independent,
    directEvidence: true,
    context: item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : "acquisition",
    coldProbe: Boolean(item.firstProbe && independent),
    evidenceSource: "objective",
    responseMs: Math.round(performance.now() - state.startedPromptAt),
    assessmentCode: assessment.code,
    metadata: { exerciseType: state.currentExercise.type },
  });
  item.firstProbe = false;
  state.submitted = true;
  const expected = readableExpected(state.currentExercise, assessment);
  state.feedback = {
    correct: assessment.correct,
    expected: assessment.correct ? "" : expected,
    detail: assessment.correct ? evidence.ready && item.kind !== "review" && item.kind !== "repair" ? "This skill is ready to build on." : "Retrieved successfully." : diagnosticDetail(assessment, expected),
    evidence,
  };
  renderPractice();
}

function diagnosticDetail(assessment, expected) {
  const code = String(assessment.code ?? "");
  if (code.includes("spelling")) return `The note location may be enharmonically equivalent, but the theoretical spelling is wrong. ${expected ? `Use ${expected}.` : ""}`;
  if (code === "wrong-degree") return `The scale-degree relationship is incorrect. Reconstruct the scale from the tonic, then identify the requested degree.`;
  if (code === "invalid-answer") return "I couldn't read that answer. Use the requested note/chord format.";
  return "Compare your answer with the correct relationship, then retrieve it again on a different example.";
}

async function submitSelfCheck(item, correct) {
  const independent = !state.supportedNext;
  const evidence = await service.submitAttempt({
    userId: USER_ID,
    skillId: item.skillId,
    sessionId: state.session.sessionId,
    promptSignature: state.currentExercise.id,
    occurredAt: new Date().toISOString(),
    outcome: correct ? "correct" : "incorrect",
    independent,
    directEvidence: true,
    context: item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : "acquisition",
    coldProbe: Boolean(item.firstProbe && independent),
    evidenceSource: "self-report",
    responseMs: Math.round(performance.now() - state.startedPromptAt),
    assessmentCode: correct ? "self-check-correct" : "self-check-not-yet",
    metadata: { exerciseType: state.currentExercise.type },
  });
  item.firstProbe = false;
  state.submitted = true;
  state.feedback = {
    correct,
    expected: "",
    detail: correct ? (evidence.ready ? "Recorded as self-reported readiness evidence." : "Recorded. You'll get another varied application before this becomes ready.") : "No problem. Review the relationship and try a different version rather than grinding the identical task.",
    evidence,
  };
  renderPractice();
}

async function afterFeedback(item) {
  const evidence = state.feedback?.evidence;
  if (item.kind === "review" || item.kind === "repair") {
    if (!state.feedback?.correct) {
      const alreadyQueued = state.queue.slice(state.itemIndex + 1).some((x) => x.skillId === item.skillId && x.kind === "review-repair");
      if (!alreadyQueued) state.queue.push({ skillId: item.skillId, kind: "review-repair", firstProbe: false });
    }
    return advanceItem();
  }
  if (item.kind === "review-repair") return advanceItem();
  if (evidence?.ready) return advanceItem();
  if (state.supportedNext) {
    state.stoppedSkillIds.add(item.skillId);
    state.supportedNext = false;
    return advanceItem();
  }

  const attempts = await repo.attemptsForSkill(USER_ID, item.skillId);
  const action = nextAcquisitionAction(attempts);
  if (action === "stop-unit-for-now") {
    state.stoppedSkillIds.add(item.skillId);
    return advanceItem();
  }
  state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);
  if (action === "scaffold-and-retry") {
    state.supportedNext = true;
    return renderLessonStep(item, "Quick repair");
  }
  state.supportedNext = false;
  state.lessonVisible = false;
  await loadExercise(item);
}

async function cleanAcquisitionPass(item) {
  if (item.kind !== "new" && item.kind !== "acquisition") return false;
  const attempts = (await repo.attemptsForSkill(USER_ID, item.skillId)).filter((x) => x.sessionId === state.session.sessionId && x.context === "acquisition");
  const direct = attempts.filter((x) => x.directEvidence && x.independent);
  return direct.length >= 3 && direct.every((x) => x.outcome === "correct") && new Set(direct.map((x) => x.promptSignature)).size >= 3;
}

async function maybeAppendFastPath(completedItem) {
  if (state.fastPathPasses >= MAX_FAST_PATH_PASSES) return false;
  if (!(await cleanAcquisitionPass(completedItem))) return false;
  const refreshed = await service.previewPlan(USER_ID, new Date());
  if (refreshed.repairSkillIds.length || refreshed.reviewSkillIds.length || refreshed.acquiringSkillId || !refreshed.newSkillId) return false;
  if (state.queue.some((x) => x.skillId === refreshed.newSkillId)) return false;
  state.queue.push({ skillId: refreshed.newSkillId, kind: "new", firstProbe: false });
  state.fastPathPasses += 1;
  return true;
}

async function advanceItem() {
  const item = state.queue[state.itemIndex];
  state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);
  state.itemIndex += 1;
  if (state.itemIndex >= state.queue.length) {
    const extended = await maybeAppendFastPath(item);
    if (!extended) return finishSession();
  }
  await beginItem();
}

async function finishSession() {
  if (state.session?.sessionId) await service.finishSession(USER_ID, state.session.sessionId, "planned-work-complete", new Date());
  root.innerHTML = `
    ${topbarHtml("Done")}
    <section class="card">
      <div class="done-mark">✓</div><div class="eyebrow">Session complete</div>
      <h1>Done for today.</h1>
      <p class="muted">The app saved your results and will bring material back when it is useful to retrieve again.</p>
      ${state.stoppedSkillIds.size ? `<div class="lesson"><strong>One skill needs more acquisition later.</strong><div>It was stopped instead of being drilled after repeated difficulty.</div></div>` : ""}
      <button class="secondary" id="backToday">Back to Today</button>
    </section>
    ${footerHtml()}`;
  document.querySelector("#backToday").onclick = loadToday;
}

function showFatal(err) {
  console.error(err);
  root.innerHTML = `${topbarHtml()}<div class="error-box"><strong>Something went wrong.</strong><br>${esc(err?.message ?? err)}<br><br><button class="secondary" id="retry">Reload</button></div>`;
  document.querySelector("#retry").onclick = () => location.reload();
}

boot().catch(showFatal);
