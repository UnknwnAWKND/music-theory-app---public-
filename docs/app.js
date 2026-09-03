import {
  BrowserStorageTutorRepository,
  Fsrs6LongTermSchedulerAdapter,
  SupabaseRestTutorRepository,
  TutorService,
  SKILLS,
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

const PHASE_TITLES = Object.freeze({
  0: "Foundations",
  1: "Intervals",
  2: "Triads",
  3: "Major scales",
  4: "Diatonic major harmony",
  5: "Progressions & transposition",
  6: "Harmonic function",
  7: "Minor tonality",
  8: "Seventh chords",
  9: "Inversions, voicings & voice leading",
  10: "Circle of Fifths & key relationships",
  11: "Advanced practical harmony",
  12: "Transfer to guitar",
});

const PHASE_INTROS = Object.freeze({
  0: ["This phase is about note names that share the same piano key.", "You will learn when one sound can have more than one correct name."],
  1: ["This phase is about intervals.", "Intervals tell you the distance between two notes. They are the building blocks for scales and chords."],
  2: ["This phase is about triads.", "Triads are simple three-note chords. You will learn how their notes are built from the root."],
  3: ["This phase is about major scales.", "You will learn the pattern behind every major key instead of memorizing unrelated note lists."],
  4: ["This phase is about the chords inside a major key.", "You will learn which chords naturally belong to a key and why."],
  5: ["This phase is about chord numbers and progressions.", "The goal is to recognize a progression by its relationships and move it to any key."],
  6: ["This phase is about what chords do.", "Some chords feel like home, some create movement, and some create tension that wants to resolve."],
  7: ["This phase is about minor keys.", "You will connect minor scales, chords, and the way minor harmony actually behaves."],
  8: ["This phase is about seventh chords.", "These are triads with one more note added. They give you more harmonic color and stronger function."],
  9: ["This phase is about inversions and voice leading.", "You will learn how the same chord can be arranged differently and how to move smoothly between chords."],
  10: ["This phase is about relationships between keys.", "The Circle of Fifths is a map that helps organize keys, accidentals, and nearby key changes."],
  11: ["This phase is about advanced practical harmony.", "You will add more chord colors and ways to move outside the basic key without losing the musical center."],
  12: ["This phase moves the theory onto guitar.", "You will map the same note, interval, chord, and scale relationships across the fretboard."],
});

const NEW_WORD_CARDS = Object.freeze({
  "pitch.accidentals": [["Enharmonic", "Two note names that use the same piano key and make the same sound.", "C♯ and D♭ are enharmonic. They are two names for the same black key."]],
  "interval.generic-number": [["Interval", "The distance between two notes.", "C to E is an interval."]],
  "interval.quality-system": [["Quality", "The word that tells you the exact size of an interval.", "A 3rd can be major or minor. Major and minor are qualities."]],
  "triad.members": [["Triad", "A three-note chord built from a root, a 3rd, and a 5th.", "C–E–G is a C major triad."]],
  "scale.degree-numbers": [["Scale degree", "A number that tells you where a note sits inside a scale.", "In C major, C is 1 and G is 5."]],
  "diatonic.definition": [["Diatonic", "A note or chord that belongs to the current key.", "In C major, C, D, E, F, G, A, and B are diatonic."], ["Chromatic", "A note that is outside the current key.", "In C major, F♯ is chromatic."]],
  "roman.major-basic": [["Roman numeral", "A number used to show which scale degree a chord is built on.", "In C major, C major is I and G major is V."]],
  "function.tonic": [["Tonic", "The musical home or center of a key.", "In C major, C is the tonic."]],
  "function.dominant": [["Dominant", "A chord or note that strongly pulls back toward tonic.", "In C major, G major strongly pulls toward C."]],
  "function.predominant": [["Predominant", "A chord that commonly moves toward the dominant.", "In C major, D minor or F major often moves toward G."]],
  "cadence.basic": [["Cadence", "A chord movement that feels like a pause, ending, or resolution.", "V→I is a strong cadence."]],
  "minor.relative": [["Relative major/minor", "A major key and minor key that use the same notes but have different home notes.", "C major and A minor use the same notes."]],
  "progression.transpose": [["Transpose", "Move the same musical relationships into a different key.", "I–V–vi–IV in C major can be moved to G major while keeping the same chord-number pattern."]],
  "function.basic-flow": [["Function", "The job a chord tends to do in a key.", "Some chords feel like home. Others create movement or tension."]],
  "minor.parallel": [["Parallel major/minor", "Major and minor keys that share the same home note.", "C major and C minor are parallel keys."]],
  "minor.raised7": [["Leading tone", "A note one half step below the home note that strongly pulls upward to it.", "In C, B is the leading tone because B wants to move to C."]],
  "seventh.members": [["Seventh chord", "A four-note chord made by adding a 7th above the root to a triad.", "C–E–G–B is C major 7."]],
  "inversion.triad": [["Inversion", "A chord with a note other than the root in the bass.", "C/E is a C chord with E as the lowest note."]],
  "voicing.distinction": [["Voicing", "The way a chord's notes are spread out or arranged.", "C–E–G and C–G–E are different voicings of the same chord."]],
  "voice.common-tones": [["Voice leading", "How individual notes move from one chord to the next.", "Keeping a shared note while the other notes move can make chord changes smoother."]],
  "keys.signatures": [["Key signature", "The sharps or flats that normally belong to a key.", "G major has one sharp: F♯."]],
  "circle.major": [["Circle of Fifths", "A map that organizes keys by fifths.", "Moving clockwise from C takes you to G, then D, then A."]],
  "extension.compound-intervals": [["Compound interval", "An interval larger than an octave.", "A 9th is an octave plus a 2nd."]],
  "color.sus": [["Suspended chord", "A chord where the 3rd is replaced by the 2nd or 4th.", "Csus4 uses C–F–G instead of C–E–G."]],
  "secondary.V": [["Secondary dominant", "A dominant chord that temporarily points toward a chord other than the main tonic.", "In C major, D7 can point strongly to G."]],
  "mixture.parallel": [["Modal mixture", "Borrowing a chord from the parallel major or minor key.", "In C major, F minor can be borrowed from C minor."]],
  "mode.tonic-center": [["Mode", "A scale pattern heard around its own home note.", "D Dorian uses D as home; it is not just C major starting on D."]],
  "modulation.tonicization-vs-keychange": [["Modulation", "A real change of musical home to a new key.", "The music leaves C major and establishes G major as the new home."]],
  "modulation.tonicization-vs-keychange": [["Tonicization", "Briefly making another chord feel like home without fully changing key.", "D7→G inside C major can briefly make G feel like home."], ["Modulation", "A stronger change where a new key becomes the musical home.", "The music leaves C major and establishes G major."]],
  "melody.chord-tones": [["Chord tone", "A note that belongs to the chord playing right now.", "Over C major, C, E, and G are chord tones."]],
  "melody.nonchord": [["Non-chord tone", "A note that is not part of the chord playing right now.", "Over C major, D can be a non-chord tone even though D belongs to the key of C major."]],
});

function evidenceReady(evidence) {
  return Boolean(evidence?.ready || evidence?.retained || evidence?.state === "ready" || evidence?.state === "retained");
}

function skillStatus(skill, evidence, readyIds) {
  if (evidence?.fragile) return { label: "Repair", cls: "repair" };
  if (evidence?.retained || evidence?.state === "retained") return { label: "Retained", cls: "retained" };
  if (evidenceReady(evidence)) return { label: "Ready", cls: "ready" };
  if (evidence?.state === "acquiring") return { label: "In progress", cls: "current" };
  const prereqsMet = skill.prerequisites.every((id) => readyIds.has(id));
  return prereqsMet ? { label: "Available", cls: "available" } : { label: "Locked", cls: "locked" };
}

async function renderCurriculum() {
  const records = await repo.allSkillStates(USER_ID);
  const byId = new Map(records.map((record) => [record.skillId, record.evidence]));
  const readyIds = new Set(records.filter((record) => evidenceReady(record.evidence)).map((record) => record.skillId));
  const phaseHtml = [];

  for (let phase = 0; phase <= 12; phase += 1) {
    const skills = SKILLS.filter((skill) => skill.phase === phase);
    const required = skills.filter((skill) => !skill.optional);
    const complete = required.length > 0 && required.every((skill) => readyIds.has(skill.id));
    const anyStarted = skills.some((skill) => byId.has(skill.id));
    const anyAvailable = skills.some((skill) => skill.prerequisites.every((id) => readyIds.has(id)));
    const phaseState = complete ? "Complete" : (anyStarted || anyAvailable) ? "Current" : "Locked";
    const rows = skills.map((skill) => {
      const status = skillStatus(skill, byId.get(skill.id), readyIds);
      return `<div class="curriculum-skill ${status.cls}"><div class="curriculum-skill-copy"><strong>${esc(skill.title)}</strong>${skill.optional ? '<span class="optional-tag">Optional</span>' : ''}</div><span class="status-chip ${status.cls}">${esc(status.label)}</span></div>`;
    }).join("");
    phaseHtml.push(`<section class="curriculum-phase ${phaseState.toLowerCase()}"><div class="curriculum-phase-head"><div><div class="phase-number">Phase ${phase}</div><h2>${esc(PHASE_TITLES[phase] ?? `Phase ${phase}`)}</h2></div><span class="phase-status ${phaseState.toLowerCase()}">${phaseState === "Locked" ? "🔒 Locked" : esc(phaseState)}</span></div><div class="curriculum-skills">${rows}</div></section>`);
  }

  root.innerHTML = `
    ${topbarHtml("Curriculum")}
    <section class="card curriculum-intro">
      <div class="eyebrow">Full curriculum</div>
      <h1>See the whole path.</h1>
      <p class="muted">Every phase is visible here. This is a roadmap, not a skip menu: locked material stays locked until the learning engine says its prerequisites are ready.</p>
      <button class="secondary curriculum-back" id="curriculumBack" type="button">Back to today</button>
    </section>
    <div class="curriculum-map">${phaseHtml.join("")}</div>
    ${footerHtml()}`;
  document.querySelector("#curriculumBack").onclick = renderToday;
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
      <div class="home-actions"><button class="primary" id="startBtn">${state.queue.length ? "Start" : "Finish"}</button><button class="secondary" id="curriculumBtn" type="button">View full curriculum</button></div>
    </section>
    ${footerHtml()}`;
  document.querySelector("#startBtn").onclick = state.queue.length ? beginItem : finishSession;
  document.querySelector("#curriculumBtn").onclick = () => renderCurriculum().catch(showFatal);
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

function lessonPagesFor(item) {
  const lesson = lessonForSkill(item.skillId);
  const skill = SKILL_BY_ID.get(item.skillId);
  const pages = [];
  const firstInPhase = skill && SKILLS.find((x) => x.phase === skill.phase)?.id === skill.id;
  if (item.kind === "new" && firstInPhase) {
    const intro = PHASE_INTROS[skill.phase];
    if (intro) pages.push({ eyebrow: `Phase ${skill.phase}`, title: intro[0], body: intro[1] });
  }
  for (const [word, meaning, example] of NEW_WORD_CARDS[item.skillId] ?? []) {
    pages.push({ eyebrow: "New word", title: word, body: meaning, example });
  }
  const summaryParts = String(lesson.summary ?? "").split(/(?<=[.!?])\s+/).filter(Boolean);
  summaryParts.forEach((body, i) => pages.push({ eyebrow: "One idea", title: i === 0 ? lesson.title : "One more piece", body }));
  if (lesson.rule) pages.push({ eyebrow: "Rule", title: "Keep this simple", body: lesson.rule });
  if (lesson.workedExample) pages.push({ eyebrow: "Example", title: "Here is one", body: lesson.workedExample });
  return pages;
}

function renderLessonStep(item, label = "Learn", pageIndex = 0) {
  const pages = lessonPagesFor(item);
  const page = pages[Math.min(pageIndex, pages.length - 1)];
  state.lessonVisible = true;
  root.innerHTML = `
    ${topbarHtml(skillPhase(item.skillId))}
    <section class="card lesson-card-simple">
      <div class="eyebrow">${esc(page.eyebrow)}</div>
      <h1>${esc(page.title)}</h1>
      <div class="lesson-simple-copy">${esc(page.body)}</div>
      ${page.example ? `<div class="example-simple"><strong>Example</strong><div>${esc(page.example)}</div></div>` : ""}
      <div class="lesson-page-count">${pageIndex + 1} of ${pages.length}</div>
      <button class="primary" id="lessonTry">${pageIndex < pages.length - 1 ? "Continue" : (item.kind === "review-repair" ? "Try a repair question" : "Try it")}</button>
    </section>`;
  document.querySelector("#lessonTry").onclick = async () => {
    if (pageIndex < pages.length - 1) return renderLessonStep(item, label, pageIndex + 1);
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
      <div class="hint">You can type #, ♯, sharp, b, ♭, or flat. Spaces and hyphens are fine.</div>
    </div>`;
  }
  if (spec.kind === "key-signature") {
    return `<div class="answer-stack"><input class="answer-input" id="count" type="number" min="0" max="7" placeholder="Number of accidentals"><select id="accType"><option value="none">None</option><option value="sharp">Sharps</option><option value="flat">Flats</option></select></div>`;
  }
  const placeholder = spec.kind === "sequence" ? "C E G" : spec.kind === "progression" ? "C G Am F" : spec.kind === "number" ? "6" : "Your answer";
  const hint = spec.kind === "sequence" ? "Separate notes with spaces or commas. You can type #, ♯, sharp, b, ♭, or flat." : spec.kind === "progression" ? "Enter chord symbols separated by spaces or commas, e.g. C G Am F." : "";
  return `<div class="answer-stack"><input class="answer-input" id="mainAnswer" ${spec.kind === "number" ? 'type="number"' : 'type="text"'} autocomplete="off" placeholder="${esc(placeholder)}">${hint ? `<div class="hint">${esc(hint)}</div>` : ""}</div>`;
}

function feedbackHtml() {
  if (!state.feedback) return "";
  const f = state.feedback;
  const answer = f.expected ? `<div class="expected">${f.correct ? "Answer" : "Correct answer"}: ${esc(f.expected)}</div>` : "";
  const message = f.correct ? "You got it." : "Use the correction, then try the next one.";
  return `<div class="feedback ${f.correct ? "correct" : "wrong"}"><div class="feedback-title">${f.correct ? "Correct" : "Not quite"}</div><div>${message}</div>${answer}</div>`;
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
