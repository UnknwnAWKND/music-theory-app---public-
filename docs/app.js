// CURRICULUM_V09_ROUNDS
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
  decideAdaptivePractice,
  inferredConfusionPartner,
  selectAdaptiveExercise,
  checkpointDefinition,
  placementDefinition,
  nextCheckpointCompetency,
  evaluateCheckpoint,
  recommendStartingPhase,
  phaseCoreReady,
  practiceRoundPlan,
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
let userSettings = null;
let userProfile = null;

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
  guidanceForNext: "none",
  hintShown: false,
  submitted: false,
  actionPending: false,
  selectedChoice: "",
  startedPromptAt: 0,
  stoppedSkillIds: new Set(),
  fastPathPasses: 0,
  manualStudy: null,
  assessment: null,
  round: null,
};

const MAX_FAST_PATH_PASSES = 4;

function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
}

const DISPLAY_SKILL_TITLES = Object.freeze({
  "interval.generic-number": "Interval Numbers",
  "interval.quality-system": "Interval Quality",
  "interval.P1": "Perfect Unison",
  "interval.m2": "Minor 2nd",
  "interval.M2": "Major 2nd",
  "interval.m3": "Minor 3rd",
  "interval.M3": "Major 3rd",
  "interval.P4": "Perfect 4th",
  "interval.A4-d5": "Tritones",
  "interval.P5": "Perfect 5th",
  "interval.m6": "Minor 6th",
  "interval.M6": "Major 6th",
  "interval.m7": "Minor 7th",
  "interval.M7": "Major 7th",
  "interval.P8": "Octaves",
  "interval.mixed-core": "Mixed Intervals",
  "interval.spelling": "Interval Spelling",
  "interval.inversion": "Interval Inversions",
  "triad.members": "Triad Notes",
  "triad.major": "Major Triads",
  "triad.minor": "Minor Triads",
  "triad.diminished": "Diminished Triads",
  "triad.augmented": "Augmented Triads",
  "triad.symbols": "Chord Symbols",
  "triad.mixed": "Mixed Triads",
  "triad.root-vs-bass": "Root vs Bass",
  "major.formula": "Major Scale Pattern",
  "scale.degree-numbers": "Scale Degrees",
  "major.degree-intervals": "Scale Degree Intervals",
  "major.spelling": "Major Scale Spelling",
  "major.construct": "Major Scales",
  "major.degree-to-note": "Find Scale Notes",
  "major.note-to-degree": "Find Scale Degrees",
  "major.membership": "Notes in a Key",
  "major.degree-names": "Scale Degree Names",
  "major.piano-application": "Major Scales on Piano",
  "diatonic.definition": "Diatonic vs Chromatic",
  "diatonic.stack-thirds": "Stacking Thirds",
  "diatonic.major-pattern": "Diatonic Chord Pattern",
  "roman.major-basic": "Roman Numerals",
  "diatonic.degree-to-chord": "Degree to Chord",
  "diatonic.chord-to-degree": "Chord to Numeral",
  "diatonic.harmonize-key": "Harmonize a Key",
  "diatonic.check-chord": "Diatonic or Not?",
  "diatonic.piano-application": "Diatonic Chords on Piano",
  "progression.absolute-relative": "Symbols vs Numerals",
  "progression.scale-degree-vs-chord": "Note vs Chord Degrees",
  "progression.I-IV-V": "I–IV–V",
  "progression.transpose": "Transpose Progressions",
  "progression.extract": "Progression Analysis",
  "progression.ii-V-I": "ii–V–I",
  "progression.I-V-vi-IV": "I–V–vi–IV",
  "progression.vi-IV-I-V": "vi–IV–I–V",
  "progression.I-vi-IV-V": "I–vi–IV–V",
  "progression.nashville": "Nashville Numbers",
  "melody.chord-tones": "Chord Tones",
  "function.tonic": "Tonic Function",
  "function.dominant": "Dominant Function",
  "function.V-I": "V–I Resolution",
  "function.predominant": "Predominant Function",
  "function.basic-flow": "Functional Flow",
  "cadence.basic": "Cadences",
  "function.context": "Function in Context",
  "minor.parallel-alterations": "Natural Minor Pattern",
  "minor.natural-construct": "Natural Minor",
  "minor.relative": "Relative Keys",
  "minor.parallel": "Parallel Keys",
  "minor.raised7": "Leading Tone in Minor",
  "minor.harmonic": "Harmonic Minor",
  "minor.V-v": "V vs v in Minor",
  "minor.variable6-7": "Variable 6 & 7",
  "minor.melodic": "Melodic Minor",
  "minor.melodic-jazz": "Jazz Melodic Minor",
  "minor.harmony": "Minor-Key Chords",
  "seventh.members": "Seventh Chord Notes",
  "seventh.major7": "Major 7 Chords",
  "seventh.minor7": "Minor 7 Chords",
  "seventh.dominant7": "Dominant 7 Chords",
  "seventh.halfdim7": "Half-Diminished 7",
  "seventh.dim7": "Diminished 7 Chords",
  "seventh.mixed": "Mixed Seventh Chords",
  "seventh.major-diatonic": "Diatonic Sevenths",
  "seventh.minor-context": "Sevenths in Minor",
  "inversion.triad": "Triad Inversions",
  "inversion.slash": "Slash Chords",
  "voicing.distinction": "Inversion vs Voicing",
  "inversion.seventh": "Seventh Inversions",
  "voice.common-tones": "Common Tones",
  "voice.economical": "Smooth Voice Leading",
  "voice.guide-tones": "Guide Tones",
  "keys.signatures": "Key Signatures",
  "keys.accidental-order": "Sharp & Flat Order",
  "circle.major": "Circle of Fifths",
  "keys.minor-signatures": "Minor Key Signatures",
  "circle.relative-minor": "Relative Minors",
  "keys.closely-related": "Related Keys",
  "keys.enharmonic": "Enharmonic Keys",
  "extension.compound-intervals": "Compound Intervals",
  "color.sus": "Suspended Chords",
  "color.add": "Add Chords",
  "color.six": "6 & 6/9 Chords",
  "extension.9": "Ninth Chords",
  "extension.11-13": "11th & 13th Chords",
  "melody.nonchord": "Non-Chord Tones",
  "secondary.V": "Secondary Dominants",
  "mixture.parallel": "Borrowed Chords",
  "mode.tonic-center": "Modal Center",
  "mode.major-family": "Major Modes",
  "mode.minor-family": "Minor Modes",
  "mode.locrian": "Locrian",
  "modulation.tonicization-vs-keychange": "Tonicization vs Modulation",
  "modulation.direct": "Direct Modulation",
  "modulation.pivot": "Pivot Chord Modulation",
  "analysis.integrated": "Harmonic Analysis",
  "guitar.open-strings": "Open Strings",
  "guitar.fret-notes": "Fretboard Notes",
  "guitar.intervals": "Fretboard Intervals",
  "guitar.triads": "Triads on Guitar",
  "guitar.inversions": "Guitar Triad Inversions",
  "guitar.scale-degrees": "Scale Degrees on Guitar",
  "guitar.scales": "Scales on Guitar",
  "guitar.diatonic-harmony": "Diatonic Chords on Guitar",
  "guitar.sevenths": "Seventh Chords on Guitar",
  "guitar.chord-tones": "Chord Tones on Guitar",
  "guitar.voice-leading": "Voice Leading on Guitar",
  "guitar.alternate-tunings": "Alternate Tunings",
  "guitar.idea-to-neck": "Ideas to Fretboard",
});

function skillTitle(id) { return DISPLAY_SKILL_TITLES[id] ?? SKILL_BY_ID.get(id)?.title ?? id; }
function displaySkillTitle(skill) { return skill ? skillTitle(skill.id) : ""; }
function skillPhase(id) { const x = SKILL_BY_ID.get(id); return x ? `Phase ${x.phase}` : ""; }

// UI_REDESIGN_2026
function icon(name, size = 20) {
  const paths = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
    learn: '<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2H10V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/>',
    xCircle: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
    review: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    spark: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8Z"/>',
  };
  return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.spark}</svg>`;
}

function topbarHtml(title = "", options = {}) {
  const { backTarget = "", eyebrow = "", subtitle = "", action = "", hideLeading = false } = options;
  return `<header class="page-header ${hideLeading ? "no-leading" : ""}">
    ${hideLeading ? "" : `<div class="page-header-leading">${backTarget ? `<button class="icon-button" data-back="${esc(backTarget)}" type="button" aria-label="Back">${icon("back", 22)}</button>` : '<div class="brand-mark">T</div>'}</div>`}
    <div class="page-header-copy">${eyebrow ? `<div class="page-kicker">${esc(eyebrow)}</div>` : ""}<div class="page-title">${esc(title || "Theory")}</div>${subtitle ? `<div class="page-subtitle">${esc(subtitle)}</div>` : ""}</div>
    <div class="page-header-action">${action}</div>
  </header>`;
}

function bottomNavHtml(active = "home") {
  const items = [
    ["home", "Home", "home"],
    ["learn", "Learn", "learn"],
    ["profile", "Profile", "profile"],
  ];
  return `<nav class="bottom-nav" aria-label="Main navigation">${items.map(([id, label, iconName]) => `<button class="nav-item ${active === id ? "active" : ""}" data-nav="${id}" type="button" ${active === id ? 'aria-current="page"' : ""}>${icon(iconName, 21)}<span>${label}</span></button>`).join("")}</nav>`;
}

function shellHtml(content, options = {}) {
  const { activeNav = "", className = "" } = options;
  return `<div class="screen ${className}">${content}</div>${activeNav ? bottomNavHtml(activeNav) : ""}`;
}

function progressBarHtml(value, label = "") {
  const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return `<div class="progress-block">${label ? `<div class="progress-label"><span>${esc(label)}</span><strong>${pct}%</strong></div>` : ""}<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div class="progress-bar" style="width:${pct}%"></div></div></div>`;
}

let replayingHistory = false;

function routeForBackTarget(target) {
  if (target === "home") return "home";
  if (target === "learn") return "learn";
  if (target === "profile") return "profile";
  if (target?.startsWith("phase:")) return target;
  if (target === "session") return state.manualStudy ? `phase:${state.manualStudy.phase}` : "home";
  return "home";
}

function syncRoute(route, parent = "") {
  if (replayingHistory) return;
  if (history.state?.theoryRoute === route) return;
  history.pushState({ theoryRoute: route, theoryParent: parent }, "", `#${encodeURIComponent(route)}`);
}

async function renderRoute(route) {
  if (!route || route === "home") return renderToday();
  if (route === "learn") return renderCurriculum();
  if (route === "profile") return renderProfile();
  if (route === "settings") return renderSettings();
  if (route === "edit-profile") return renderEditProfile();
  if (route.startsWith("phase:")) return renderPhase(Number(route.split(":")[1]));
  if (route.startsWith("locked-phase:")) return renderLockedPhase(Number(route.split(":")[1]));
  if (route.startsWith("study:")) {
    const skillId = route.slice("study:".length);
    const item = state.queue[state.itemIndex];
    if (item?.skillId === skillId && state.currentExercise) return renderPractice();
    return state.manualStudy ? renderPhase(state.manualStudy.phase) : renderToday();
  }
  if (route.startsWith("assessment:")) {
    const [, kind, phaseText] = route.split(":");
    const phase = Number(phaseText);
    if (state.assessment?.kind === kind && state.assessment?.phase === phase && state.assessment.current) return renderAssessmentQuestion();
    return kind === "placement" ? renderLockedPhase(phase) : renderPhase(phase);
  }
  return renderToday();
}

async function goBack(target) {
  const expected = routeForBackTarget(target);
  if (history.state?.theoryParent === expected && history.length > 1) {
    history.back();
    return;
  }
  return renderRoute(expected);
}

window.addEventListener("popstate", (ev) => {
  replayingHistory = true;
  Promise.resolve(renderRoute(ev.state?.theoryRoute ?? "home"))
    .catch(showFatal)
    .finally(() => { replayingHistory = false; });
});

function footerHtml() { return ""; }

function defaultLearningSettings(userId) {
  return {
    userId,
    desiredRetention: 0.90,
    maximumIntervalDays: 36500,
    requirePreviousLessons: true,
    curriculumVersion: "v0.8",
    schedulerVersion: "fsrs-6",
  };
}

function defaultDisplayName(email) {
  const local = String(email ?? "").split("@")[0].trim();
  return local || "Student";
}

async function ensureUserProfile(createdAt) {
  let profile = await repo.getProfile(USER_ID);
  if (!profile) {
    await repo.upsertProfile(USER_ID, defaultDisplayName(authEmail), createdAt);
    profile = await repo.getProfile(USER_ID);
  }
  userProfile = profile ?? {
    userId: USER_ID,
    displayName: defaultDisplayName(authEmail),
    createdAt: createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function initializeLocalRuntime() {
  persistenceMode = "local";
  USER_ID = "local-preview-user";
  authEmail = "";
  repo = new BrowserStorageTutorRepository(localStorage, "music-theory-tutor:v0.7-preview");
  let settings = await repo.getSettings(USER_ID);
  if (!settings) {
    settings = defaultLearningSettings(USER_ID);
    await repo.upsertSettings(settings);
  }
  userSettings = settings;
  await ensureUserProfile(new Date().toISOString());
  const scheduler = new Fsrs6LongTermSchedulerAdapter({
    desiredRetention: settings.desiredRetention,
    maximumIntervalDays: settings.maximumIntervalDays,
  });
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
    settings = defaultLearningSettings(USER_ID);
    await repo.upsertSettings(settings);
  }
  userSettings = settings;
  await ensureUserProfile(session.user.created_at ?? new Date().toISOString());
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
  state.manualStudy = null;
  state.assessment = null;
}


function renderAuth(message = "", isError = false) {
  resetSessionUiState();
  root.innerHTML = shellHtml(`
    <div class="auth-wrap">
      <div class="auth-brand"><div class="auth-logo">${icon("learn", 26)}</div><div><strong>Theory</strong><span>Music theory that sticks.</span></div></div>
      <section class="auth-panel">
        <div class="page-kicker">Welcome</div>
        <h1>Pick up where you left off.</h1>
        <p class="muted">Your lessons, reviews, and progress stay synced to your account.</p>
        ${message ? `<div class="inline-message ${isError ? "error" : ""}" role="status">${esc(message)}</div>` : ""}
        <form id="authForm" class="form-stack">
          <label class="field-group"><span>Email</span><input class="answer-input" id="authEmail" type="email" autocomplete="email" required value="${esc(authEmail)}"></label>
          <label class="field-group"><span>Password</span><input class="answer-input" id="authPassword" type="password" autocomplete="current-password" minlength="6" required></label>
          <button class="primary" id="signInBtn" type="submit">Sign in</button>
          <button class="secondary" id="signUpBtn" type="button">Create account</button>
        </form>
      </section>
    </div>`, { className: "auth-screen" });
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
  const nav = ev.target.closest?.("[data-nav]");
  if (nav) {
    const target = nav.dataset.nav;
    if (target === "home") return renderToday().catch(showFatal);
    if (target === "learn") return renderCurriculum().catch(showFatal);
    if (target === "profile") return renderProfile().catch(showFatal);
  }

  const back = ev.target.closest?.("[data-back]");
  if (back) {
    const target = back.dataset.back;
    return goBack(target).catch(showFatal);
  }

  const profileButton = ev.target.closest?.("[data-profile]");
  if (profileButton) return renderProfile().catch(showFatal);
  const settingsButton = ev.target.closest?.("[data-settings]");
  if (settingsButton) return renderSettings().catch(showFatal);
  const editButton = ev.target.closest?.("[data-edit-profile]");
  if (editButton) return renderEditProfile().catch(showFatal);

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
    userSettings = null;
    userProfile = null;
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
  (plan.interleaveSkillIds ?? []).forEach((id) => add(id, "interleave"));
  return out;
}

function planCountLabel(plan) {
  const parts = [];
  if (plan.repairSkillIds.length) parts.push(`${plan.repairSkillIds.length} repair${plan.repairSkillIds.length === 1 ? "" : "s"}`);
  if (plan.reviewSkillIds.length) parts.push(`${plan.reviewSkillIds.length} review${plan.reviewSkillIds.length === 1 ? "" : "s"}`);
  if (plan.acquiringSkillId) parts.push("continue 1 skill");
  if (plan.newSkillId) parts.push("1 new skill");
  if (plan.interleaveSkillIds?.length) parts.push(`${plan.interleaveSkillIds.length} mixed practice`);
  return parts.length ? parts.join(" · ") : "Nothing meaningful is due";
}

async function loadToday() {
  state.manualStudy = null;
  state.session = await service.startSession(USER_ID, new Date());
  state.queue = buildQueue(state.session.plan);
  state.itemIndex = 0;
  state.fastPathPasses = 0;
  state.round = null;
  await renderToday();
}

const PHASE_TITLES = Object.freeze({
  1: "Interval Foundations",
  2: "Triads & Chord Tones",
  3: "Major Scales & Scale Degrees",
  4: "Diatonic Harmony & Number System",
  5: "Progressions, Transposition & Chord Tones",
  6: "Harmonic Function",
  7: "Minor Tonality",
  8: "Seventh Chords",
  9: "Inversions & Voice Leading",
  10: "Keys & Circle of Fifths",
  11: "Advanced Practical Harmony",
  12: "Transfer to Guitar",
});

const PHASE_INTROS = Object.freeze({
  1: ["This phase builds your interval foundation.", "You will learn interval numbers in small sets, mix old and new sets, then add the most useful interval qualities. Intervals keep returning in later phases."],
  2: ["This phase builds chords from intervals.", "Major and minor triads come first. Then you add diminished and augmented triads and start thinking in chord tones instead of memorized chord lists."],
  3: ["This phase is about major scales and scale degrees.", "You will build keys from relationships, retrieve scale degrees directly, and keep using interval knowledge inside the scale."],
  4: ["This phase connects keys to their chords and numbers.", "You will derive diatonic chords, Roman numerals, and the number system as one connected skill set."],
  5: ["This phase makes harmony portable.", "You will build and analyze progressions, transpose them to new keys, and target the chord tones that matter while music is moving."],
  6: ["This phase is about what chords do.", "Tonic, predominant, and dominant functions explain stability, movement, tension, and resolution."],
  7: ["This phase is about minor keys.", "You will connect natural minor, variable scale degrees, harmonic minor, and practical minor-key harmony."],
  8: ["This phase adds seventh chords.", "You will build them from triads plus interval sevenths, then use them in major and minor harmony."],
  9: ["This phase is about inversions and voice leading.", "You will rearrange chords without losing their identity and move between them more smoothly."],
  10: ["This phase organizes relationships between keys.", "Key signatures and the Circle of Fifths become a map for nearby keys, relatives, and transposition."],
  11: ["This phase adds advanced practical harmony.", "Extensions, secondary dominants, borrowed harmony, modes, and modulation come after the foundations are already useful."],
  12: ["This phase transfers the same theory to guitar.", "Intervals, chord tones, scale degrees, triads, and voice leading are mapped across the fretboard."],
});

const NEW_WORD_CARDS = Object.freeze({
  "interval.number-3-8": [["Interval", "The distance between two notes, counted by note letters first.", "C to E is a 3rd because C–D–E uses three letter names."]],
  "interval.generic-number": [["Interval", "The distance between two notes.", "C to E is an interval."], ["Accidental", "A sharp or flat attached to a note name.", "F♯ means F sharp. B♭ means B flat."], ["Enharmonic", "Two note names that use the same piano key and make the same sound.", "C♯ and D♭ are enharmonic names for the same black key."]],
  "interval.quality-system": [["Half step", "The distance from one piano key to the very next key.", "E to F is one half step."], ["Whole step", "Two half steps.", "F to G is one whole step."], ["Quality", "The word that tells you the exact size of an interval.", "A 3rd can be major or minor. Major and minor are qualities."]],
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
  "modulation.tonicization-vs-keychange": [["Tonicization", "Briefly making another chord feel like home without fully changing key.", "D7→G inside C major can briefly make G feel like home."], ["Modulation", "A stronger change where a new key becomes the musical home.", "The music leaves C major and establishes G major."]],
  "melody.chord-tones": [["Chord tone", "A note that belongs to the chord playing right now.", "Over C major, C, E, and G are chord tones."]],
  "melody.nonchord": [["Non-chord tone", "A note that is not part of the chord playing right now.", "Over C major, D can be a non-chord tone even though D belongs to the key of C major."]],
});

function evidenceReady(evidence) {
  return Boolean(evidence?.ready || evidence?.retained || evidence?.state === "ready" || evidence?.state === "retained");
}

function skillStatus(skill, evidence, readyIds, accessAllowed = true) {
  if (evidence?.fragile) return { label: "Repair", cls: "repair" };
  if (evidence?.retained || evidence?.state === "retained") return { label: "Retained", cls: "retained" };
  if (evidenceReady(evidence)) return { label: "Ready", cls: "ready" };
  if (evidence?.state === "acquiring") return { label: "In progress", cls: "current" };
  return accessAllowed ? { label: "Available", cls: "available" } : { label: "Locked", cls: "locked" };
}

function phaseProgressMap(rows) { return new Map((rows ?? []).map((row) => [Number(row.phase), row])); }

function checkpointAccessValid(phase, row, readyIds) {
  if (!row?.checkpointPassedAt) return false;
  if (row?.checkpointSummary?.curriculumVersion === "v0.9") return true;
  return phaseCoreReady(phase, readyIds);
}

function placementAccessValid(phase, row, readyIds) {
  if (!row?.validatedEntryAt) return false;
  if (row?.placementSummary?.curriculumVersion === "v0.9") return true;
  const phaseSkills = SKILLS.filter((skill) => skill.phase === phase && !skill.optional);
  return phaseSkills.every((skill) => skill.prerequisites.every((id) => {
    const dependency = SKILL_BY_ID.get(id);
    return !dependency || dependency.phase >= phase || readyIds.has(id);
  }));
}

function guidedPhaseAllowed(phase, phaseProgress, readyIds = new Set()) {
  if (userSettings?.requirePreviousLessons === false) return true;
  if (phase === 1) return true;
  if (placementAccessValid(phase, phaseProgress.get(phase), readyIds)) return true;
  return checkpointAccessValid(phase - 1, phaseProgress.get(phase - 1), readyIds);
}

function curriculumAccessAllowed(skill, readyIds, phaseProgress = new Map()) {
  if (userSettings?.requirePreviousLessons === false) return true;
  if (!guidedPhaseAllowed(skill.phase, phaseProgress, readyIds)) return false;
  const validatedEntry = placementAccessValid(skill.phase, phaseProgress.get(skill.phase), readyIds);
  return skill.prerequisites.every((id) => {
    if (readyIds.has(id)) return true;
    const dependency = SKILL_BY_ID.get(id);
    return Boolean(validatedEntry && dependency && dependency.phase < skill.phase);
  });
}

function progressSummary(records) {
  const byId = new Map(records.map((record) => [record.skillId, record.evidence]));
  const readyIds = new Set(records.filter((record) => evidenceReady(record.evidence)).map((record) => record.skillId));
  const required = SKILLS.filter((skill) => !skill.optional);
  const requiredReady = required.filter((skill) => readyIds.has(skill.id)).length;
  return {
    byId,
    readyIds,
    overall: required.length ? Math.round((requiredReady / required.length) * 100) : 0,
    mastered: records.filter((record) => evidenceReady(record.evidence)).length,
    learning: records.filter((record) => record.evidence?.state === "acquiring" || record.evidence?.fragile).length,
  };
}

function phaseSummary(phase, byId, readyIds, phaseProgress = new Map()) {
  const skills = SKILLS.filter((skill) => skill.phase === phase);
  const required = skills.filter((skill) => !skill.optional);
  const readyCount = required.filter((skill) => evidenceReady(byId.get(skill.id))).length;
  const complete = required.length > 0 && readyCount === required.length;
  const percent = required.length ? Math.round((readyCount / required.length) * 100) : 0;
  const canOpen = guidedPhaseAllowed(phase, phaseProgress, readyIds) && (complete || skills.some((skill) => curriculumAccessAllowed(skill, readyIds, phaseProgress)));
  return { phase, skills, required, readyCount, complete, percent, canOpen };
}

async function renderCurriculum() {
  syncRoute("learn");
  const [records, phaseProgressRows] = await Promise.all([repo.allSkillStates(USER_ID), repo.phaseProgress(USER_ID)]);
  const { byId, readyIds } = progressSummary(records);
  const phaseProgress = phaseProgressMap(phaseProgressRows);
  const locking = userSettings?.requirePreviousLessons !== false;
  const summaries = Array.from({ length: 12 }, (_, index) => phaseSummary(index + 1, byId, readyIds, phaseProgress));
  const firstIncomplete = summaries.find((x) => !x.complete)?.phase ?? 12;
  const cards = summaries.map((summary) => {
    const open = !locking || summary.canOpen;
    const stateName = summary.complete ? "Complete" : summary.phase === firstIncomplete ? "Current" : open ? "Available" : "Locked";
    const stateClass = stateName.toLowerCase();
    const statusIcon = summary.complete ? icon("check", 17) : stateName === "Locked" ? icon("lock", 16) : icon("chevron", 17);
    return `<button class="phase-card ${stateClass}" type="button" ${open ? `data-open-phase="${summary.phase}"` : `data-locked-phase="${summary.phase}"`}>
      <div class="phase-card-top"><div><span class="phase-label">Phase ${summary.phase}</span><h2>${esc(PHASE_TITLES[summary.phase] ?? `Phase ${summary.phase}`)}</h2></div><span class="phase-state ${stateClass}">${statusIcon}<span>${stateName}</span></span></div>
      ${progressBarHtml(summary.percent)}
      <div class="phase-card-meta"><span>${summary.readyCount} of ${summary.required.length} core lessons ready</span><strong>${summary.percent}%</strong></div>
    </button>`;
  }).join("");

  root.innerHTML = shellHtml(`
    ${topbarHtml("Learn", { eyebrow: "Curriculum", subtitle: "See the whole path." })}
    ${!locking ? '<div class="soft-note">Jump-ahead mode is on. You can open any lesson without changing its real progress.</div>' : ""}
    <section class="phase-list">${cards}</section>`, { activeNav: "learn", className: "curriculum-screen" });
  document.querySelectorAll("[data-open-phase]").forEach((button) => {
    button.addEventListener("click", () => renderPhase(Number(button.dataset.openPhase)).catch(showFatal));
  });
  document.querySelectorAll("[data-locked-phase]").forEach((button) => {
    button.addEventListener("click", () => renderLockedPhase(Number(button.dataset.lockedPhase)).catch(showFatal));
  });
}

async function renderPhase(phase) {
  syncRoute(`phase:${phase}`, "learn");
  const [records, phaseProgressRows] = await Promise.all([repo.allSkillStates(USER_ID), repo.phaseProgress(USER_ID)]);
  const { byId, readyIds } = progressSummary(records);
  const phaseProgress = phaseProgressMap(phaseProgressRows);
  const summary = phaseSummary(phase, byId, readyIds, phaseProgress);
  const locking = userSettings?.requirePreviousLessons !== false;
  if (locking && !summary.canOpen) return renderLockedPhase(phase);
  const intro = PHASE_INTROS[phase]?.[1] ?? "Work through these lessons at your own pace.";
  const rows = summary.skills.map((skill) => {
    const evidence = byId.get(skill.id);
    const accessAllowed = curriculumAccessAllowed(skill, readyIds, phaseProgress);
    const status = skillStatus(skill, evidence, readyIds, accessAllowed);
    return `<button class="lesson-row ${status.cls}" type="button" ${accessAllowed ? `data-open-skill="${esc(skill.id)}"` : "disabled"}>
      <span class="lesson-row-copy"><strong>${esc(displaySkillTitle(skill))}</strong>${!accessAllowed ? '<small>Complete previous material to unlock.</small>' : skill.optional ? '<small>Optional</small>' : ""}</span>
      <span class="lesson-row-end"><span class="status-chip ${status.cls}">${esc(status.label)}</span>${accessAllowed ? icon("chevron", 17) : icon("lock", 16)}</span>
    </button>`;
  }).join("");
  root.innerHTML = shellHtml(`
    ${topbarHtml(PHASE_TITLES[phase] ?? `Phase ${phase}`, { backTarget: "learn", eyebrow: `Phase ${phase}`, subtitle: intro })}
    <section class="phase-overview">${progressBarHtml(summary.percent, "Phase progress")}</section>
    <section class="lesson-list">${rows}</section>
    ${phase < 12 && summary.complete ? checkpointCardHtml(phase, phaseProgress.get(phase)) : ""}`, { activeNav: "learn", className: "phase-screen" });
  document.querySelectorAll("[data-open-skill]").forEach((button) => {
    button.addEventListener("click", () => openCurriculumSkill(button.dataset.openSkill).catch(showFatal));
  });
  document.querySelector("[data-checkpoint]")?.addEventListener("click", () => startPhaseAssessment("checkpoint", phase).catch(showFatal));
}

function checkpointCardHtml(phase, progress) {
  if (progress?.checkpointPassedAt) return `<section class="assessment-card passed"><div><span>Phase ${phase} checkpoint</span><strong>${icon("checkCircle", 19)} Passed</strong></div><p>Your phase knowledge is validated for progression. Reviews still continue normally.</p></section>`;
  return `<section class="assessment-card"><div><span>Phase ${phase} complete</span><strong>Ready for your checkpoint.</strong></div><p>A short adaptive check across the important skills in this phase.</p><button class="primary" data-checkpoint type="button">Take Checkpoint</button></section>`;
}

async function renderLockedPhase(phase) {
  syncRoute(`locked-phase:${phase}`, "learn");
  root.innerHTML = shellHtml(`
    ${topbarHtml(PHASE_TITLES[phase] ?? `Phase ${phase}`, { backTarget: "learn", eyebrow: `Phase ${phase}` })}
    <section class="locked-phase-panel">${icon("lock", 28)}<h1>Phase ${phase} is locked.</h1><p>Continue the earlier phases, or show that you already know the prerequisites.</p><button class="primary" data-placement type="button">Test Into Phase ${phase}</button><button class="secondary" data-back-learn type="button">Continue Earlier Phases</button></section>`, { activeNav: "learn", className: "locked-phase-screen" });
  document.querySelector("[data-placement]")?.addEventListener("click", () => startPhaseAssessment("placement", phase).catch(showFatal));
  document.querySelector("[data-back-learn]")?.addEventListener("click", () => renderCurriculum().catch(showFatal));
}

function responseModeForDiagnostic(spec, exercise) {
  return responseModeForEvidence(spec, exercise);
}

async function startPhaseAssessment(kind, phase) {
  const def = kind === "checkpoint" ? checkpointDefinition(phase) : placementDefinition(phase);
  if (!def || !def.competencies.length) return renderPhase(phase);
  const session = await repo.createSession(USER_ID, new Date().toISOString());
  state.assessment = { kind, phase, def, results: [], sessionId: session.id, current: null, submitted: false, feedback: null, questionNumber: 0 };
  await loadAssessmentQuestion();
}

async function loadAssessmentQuestion() {
  const a = state.assessment;
  if (!a) return renderCurriculum();
  const evaluation = evaluateCheckpoint(a.def, a.results);
  if (evaluation.complete) return finishPhaseAssessment(evaluation);
  const competency = nextCheckpointCompetency(a.def, a.results);
  if (!competency) return finishPhaseAssessment(evaluation);
  const counts = new Map();
  a.results.filter((r) => r.competencyId === competency.id).forEach((r) => counts.set(r.skillId, (counts.get(r.skillId) ?? 0) + 1));
  const skillId = [...competency.skillIds].sort((x, y) => (counts.get(x) ?? 0) - (counts.get(y) ?? 0))[0];
  const history = await repo.attemptsForSkill(USER_ID, skillId);
  const selected = selectAdaptiveExercise(skillId, history, a.questionNumber, 16);
  a.current = { competency, skillId, exercise: selected.exercise, spec: answerSpecForExercise(selected.exercise) };
  a.submitted = false;
  a.feedback = null;
  a.questionNumber += 1;
  renderAssessmentQuestion();
}

function renderAssessmentQuestion() {
  const routeAssessment = state.assessment;
  if (routeAssessment) syncRoute(`assessment:${routeAssessment.kind}:${routeAssessment.phase}`, routeAssessment.kind === "placement" ? `locked-phase:${routeAssessment.phase}` : `phase:${routeAssessment.phase}`);
  const a = state.assessment;
  const current = a?.current;
  if (!a || !current) return;
  const placement = a.kind === "placement";
  const title = placement ? `Test Into Phase ${a.phase}` : `Phase ${a.phase} Checkpoint`;
  const spec = current.spec;
  root.innerHTML = shellHtml(`
    ${topbarHtml(title, { backTarget: placement ? "learn" : `phase:${a.phase}`, eyebrow: `${Math.min(a.questionNumber, a.def.maxItems)} of up to ${a.def.maxItems}` })}
    <section class="assessment-question">
      <div class="assessment-competency">${esc(current.competency.label)}</div>
      <div class="prompt">${esc(current.exercise.prompt)}</div>
      ${answerControls(spec)}
      ${a.feedback ? feedbackHtml(a.feedback) : ""}
      ${a.submitted ? '<button class="primary" id="assessmentContinue" type="button">Continue</button>' : '<button class="primary" id="assessmentSubmit" type="button">Check answer</button>'}
    </section>`, { className: "assessment-screen" });
  bindChoiceButtons();
  document.querySelector("#assessmentSubmit")?.addEventListener("click", () => runExclusiveAction(() => submitAssessmentAnswer()));
  document.querySelector("#assessmentContinue")?.addEventListener("click", () => runExclusiveAction(() => loadAssessmentQuestion()));
}

async function submitAssessmentAnswer() {
  const a = state.assessment;
  const current = a?.current;
  if (!a || !current || a.submitted) return;
  const values = collectValues(current.spec);
  if (current.spec.kind === "choice" && !values.main) return;
  const answer = parseAnswerFromValues(current.spec, values);
  const assessment = gradeExercise(current.exercise, answer);
  const responseMode = responseModeForDiagnostic(current.spec, current.exercise);
  const occurredAt = new Date().toISOString();
  await service.submitAttempt({
    userId: USER_ID, skillId: current.skillId, sessionId: a.sessionId,
    promptSignature: current.exercise.id, occurredAt,
    outcome: assessment.correct ? "correct" : "incorrect", independent: true, directEvidence: true,
    context: "diagnostic", coldProbe: false, evidenceSource: "objective", eventKind: "response",
    responseMode, guidance: "none", solutionSeen: false,
    exampleSignature: exampleSignatureForExercise(current.exercise),
    exampleAttributes: evidenceAttributesForExercise(current.exercise), evidenceVersion: "v2",
    assessmentCode: `${a.kind}:phase-${a.phase}:${current.competency.id}`,
    metadata: { assessmentKind: a.kind, assessmentPhase: a.phase, competencyId: current.competency.id },
  });
  const expected = readableExpected(current.exercise, assessment);
  if (!assessment.correct && expected) {
    await service.submitAttempt({
      userId: USER_ID, skillId: current.skillId, sessionId: a.sessionId,
      promptSignature: current.exercise.id, occurredAt: new Date().toISOString(), outcome: "revealed",
      independent: false, directEvidence: false, context: "diagnostic", coldProbe: false,
      evidenceSource: "objective", eventKind: "answer-reveal", responseMode, guidance: "answer-reveal",
      solutionSeen: true, exampleSignature: exampleSignatureForExercise(current.exercise),
      exampleAttributes: evidenceAttributesForExercise(current.exercise), evidenceVersion: "v2",
      assessmentCode: `${a.kind}:phase-${a.phase}:${current.competency.id}`,
      metadata: { assessmentKind: a.kind, assessmentPhase: a.phase, competencyId: current.competency.id },
    });
  }
  a.results.push({
    competencyId: current.competency.id, skillId: current.skillId,
    promptSignature: current.exercise.id, exampleSignature: exampleSignatureForExercise(current.exercise),
    correct: assessment.correct, firstSubmission: true, independent: true, responseMode,
    guidanceUsed: false, solutionSeen: false,
  });
  a.submitted = true;
  a.feedback = { correct: assessment.correct, expected: assessment.correct ? "" : expected, detail: assessment.correct ? "Good — that competency is demonstrated on this example." : diagnosticDetail(assessment, expected) };
  renderAssessmentQuestion();
}

async function finishPhaseAssessment(evaluation) {
  const a = state.assessment;
  if (!a) return;
  await repo.completeSession(USER_ID, a.sessionId, new Date().toISOString(), `${a.kind}-${evaluation.passed ? "passed" : "needs-repair"}`);
  if (evaluation.passed) {
    const rows = await repo.phaseProgress(USER_ID);
    const map = phaseProgressMap(rows);
    const existing = map.get(a.phase) ?? { userId: USER_ID, phase: a.phase, updatedAt: new Date().toISOString() };
    if (a.kind === "checkpoint") {
      await repo.upsertPhaseProgress({ ...existing, checkpointPassedAt: new Date().toISOString(), checkpointSummary: { ...evaluation, curriculumVersion: "v0.9" }, updatedAt: new Date().toISOString() });
    } else {
      await repo.upsertPhaseProgress({ ...existing, validatedEntryAt: new Date().toISOString(), validatedEntrySource: "placement", placementSummary: { ...evaluation, curriculumVersion: "v0.9" }, updatedAt: new Date().toISOString() });
    }
  }
  const recommended = a.kind === "placement" && !evaluation.passed ? recommendStartingPhase(a.phase, evaluation) : undefined;
  const strong = evaluation.strong.length ? evaluation.strong.map((x) => `<li>${esc(x)}</li>`).join("") : "<li>Keep building these foundations.</li>";
  const review = evaluation.review.length ? evaluation.review.map((x) => `<li>${esc(x)}</li>`).join("") : "<li>Nothing critical right now.</li>";
  const targetPhase = a.phase;
  const kind = a.kind;
  state.assessment = null;
  root.innerHTML = shellHtml(`
    ${topbarHtml(evaluation.passed ? (kind === "checkpoint" ? "Checkpoint Passed" : `Phase ${targetPhase} Unlocked`) : "Not quite yet", { eyebrow: kind === "checkpoint" ? `Phase ${targetPhase}` : "Placement Test" })}
    <section class="assessment-results">
      <div class="completion-icon">${icon(evaluation.passed ? "check" : "review", 28)}</div>
      <h1>${evaluation.passed ? "You showed the important skills." : "You’re close."}</h1>
      <div class="result-columns"><div><strong>Strong</strong><ul>${strong}</ul></div><div><strong>Review</strong><ul>${review}</ul></div></div>
      ${recommended ? `<div class="soft-note">Recommended starting point: Phase ${recommended} — ${esc(PHASE_TITLES[recommended] ?? "")}</div>` : ""}
      <button class="primary" data-result-next type="button">${evaluation.passed ? (kind === "checkpoint" ? `Continue to Phase ${Math.min(12, targetPhase + 1)}` : `Open Phase ${targetPhase}`) : `Review Phase ${recommended ?? targetPhase}`}</button>
    </section>`, { className: "assessment-results-screen" });
  document.querySelector("[data-result-next]")?.addEventListener("click", () => renderPhase(evaluation.passed ? (kind === "checkpoint" ? Math.min(12, targetPhase + 1) : targetPhase) : (recommended ?? targetPhase)).catch(showFatal));
}

function manualStudyKind(evidence) {
  if (evidence?.fragile) return "repair";
  if (evidence?.retained || evidenceReady(evidence)) return "review";
  if (evidence?.state === "acquiring") return "acquisition";
  return "new";
}

async function openCurriculumSkill(skillId) {
  const skill = SKILL_BY_ID.get(skillId);
  if (!skill) return;
  const [records, phaseProgressRows] = await Promise.all([repo.allSkillStates(USER_ID), repo.phaseProgress(USER_ID)]);
  const readyIds = new Set(records.filter((record) => evidenceReady(record.evidence)).map((record) => record.skillId));
  const phaseProgress = phaseProgressMap(phaseProgressRows);
  if (!curriculumAccessAllowed(skill, readyIds, phaseProgress)) return renderPhase(skill.phase);
  const evidence = records.find((record) => record.skillId === skillId)?.evidence;
  const kind = manualStudyKind(evidence);
  const dueReviews = await repo.dueReviews(USER_ID, new Date().toISOString());
  const isActuallyDue = dueReviews.some((review) => review.skillId === skillId);
  state.manualStudy = {
    queue: state.queue,
    itemIndex: state.itemIndex,
    fastPathPasses: state.fastPathPasses,
    phase: skill.phase,
  };
  state.queue = [{ skillId, kind, firstProbe: isActuallyDue && (kind === "review" || kind === "repair") }];
  state.itemIndex = 0;
  state.fastPathPasses = 0;
  await beginItem();
}

async function leaveStudyToPrevious() {
  if (state.manualStudy) {
    const previous = state.manualStudy;
    state.manualStudy = null;
    state.queue = previous.queue;
    state.itemIndex = previous.itemIndex;
    state.fastPathPasses = previous.fastPathPasses;
    return renderPhase(previous.phase);
  }
  return renderToday();
}

function formatProfileDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function profileMonogram() {
  const name = userProfile?.displayName ?? defaultDisplayName(authEmail);
  return (String(name).trim()[0] || "T").toUpperCase();
}

async function renderProfile(message = "") {
  syncRoute("profile");
  const [records, due] = await Promise.all([
    repo.allSkillStates(USER_ID),
    repo.dueReviews(USER_ID, new Date().toISOString()),
  ]);
  const summary = progressSummary(records);
  const plan = await service.previewPlan(USER_ID, new Date());
  const currentSkillId = plan.acquiringSkillId ?? plan.newSkillId ?? null;
  const currentSkill = currentSkillId ? SKILL_BY_ID.get(currentSkillId) : null;
  const name = userProfile?.displayName ?? defaultDisplayName(authEmail);
  root.innerHTML = shellHtml(`
    ${topbarHtml("Profile", { eyebrow: "Your learning", hideLeading: true })}
    ${message ? `<div class="inline-message" role="status">${esc(message)}</div>` : ""}
    <section class="profile-hero">
      <div class="profile-avatar" aria-hidden="true">${esc(profileMonogram())}</div>
      <div class="profile-identity-copy"><h1>${esc(name)}</h1><p>${currentSkill ? `Phase ${currentSkill.phase}` : "All caught up"} <span>•</span> ${summary.overall}% complete</p></div>
      <button class="ghost-button" data-edit-profile type="button">${icon("edit", 16)} Edit Profile</button>
    </section>
    <section class="profile-progress">${progressBarHtml(summary.overall, "Overall progress")}</section>
    <section class="stat-strip" aria-label="Learning stats">
      <div><strong>${summary.mastered}</strong><span>Mastered</span></div>
      <div><strong>${summary.learning}</strong><span>Learning</span></div>
      <div><strong>${due.length}</strong><span>Reviews</span></div>
    </section>
    ${currentSkill ? `<section class="compact-section"><div class="section-heading"><span>Current learning</span></div><div class="current-learning-row"><div><span>Phase ${currentSkill.phase}</span><strong>${esc(displaySkillTitle(currentSkill))}</strong></div><button class="icon-button" data-nav="home" type="button" aria-label="Continue from Home">${icon("chevron", 20)}</button></div></section>` : ""}
    <section class="menu-list">
      <button class="menu-row" data-settings type="button"><span class="menu-row-icon">${icon("settings", 19)}</span><span>Settings</span>${icon("chevron", 18)}</button>
      ${persistenceMode === "supabase" ? `<button class="menu-row danger" data-signout type="button"><span class="menu-row-icon">${icon("logout", 19)}</span><span>Sign out</span></button>` : ""}
    </section>`, { activeNav: "profile", className: "profile-screen" });
}

async function renderEditProfile(message = "") {
  syncRoute("edit-profile", "profile");
  const name = userProfile?.displayName ?? defaultDisplayName(authEmail);
  root.innerHTML = shellHtml(`
    ${topbarHtml("Edit profile", { backTarget: "profile", subtitle: "Keep it simple." })}
    <section class="form-panel">
      ${message ? `<div class="inline-message" role="status">${esc(message)}</div>` : ""}
      <form id="profileForm" class="form-stack">
        <label class="field-group"><span>Display name</span><input class="answer-input" id="displayName" maxlength="80" autocomplete="name" required value="${esc(name)}"></label>
        <button class="primary" type="submit">Save changes</button>
      </form>
    </section>`, { className: "edit-profile-screen" });
  document.querySelector("#profileForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const displayName = document.querySelector("#displayName").value.trim();
    if (!displayName) return;
    await repo.upsertProfile(USER_ID, displayName);
    userProfile = await repo.getProfile(USER_ID);
    await renderProfile("Profile updated.");
  });
}

async function renderSettings() {
  syncRoute("settings", "profile");
  const locking = userSettings?.requirePreviousLessons !== false;
  const description = locking
    ? "Complete lessons in order before later lessons unlock."
    : "You can open any lesson. Your actual completion and mastery progress will not change.";
  // This changes access only; learning state remains untouched.
  root.innerHTML = shellHtml(`
    ${topbarHtml("Settings", { backTarget: "profile" })}
    <section class="settings-group">
      <div class="settings-title">Learning</div>
      <div class="settings-surface">
        <div class="setting-row">
          <div class="setting-copy"><strong>Require Previous Lessons</strong><span id="lockingDescription">${esc(description)}</span><small id="settingSaveState" class="save-state" aria-live="polite"></small></div>
          <label class="switch" aria-label="Require Previous Lessons"><input id="requirePreviousLessons" type="checkbox" ${locking ? "checked" : ""}><span class="switch-track"></span></label>
        </div>
      </div>
    </section>
    <section class="settings-group">
      <div class="settings-title">Account</div>
      <div class="settings-surface">
        <button class="settings-link" data-edit-profile type="button"><span>${icon("edit", 18)} Edit Profile</span>${icon("chevron", 18)}</button>
        ${persistenceMode === "supabase" ? `<button class="settings-link danger" data-signout type="button"><span>${icon("logout", 18)} Sign Out</span></button>` : ""}
      </div>
    </section>`, { className: "settings-screen" });

  const toggle = document.querySelector("#requirePreviousLessons");
  const descriptionEl = document.querySelector("#lockingDescription");
  const saveState = document.querySelector("#settingSaveState");
  toggle.addEventListener("change", async () => {
    if (toggle.disabled) return;
    toggle.disabled = true;
    const checked = Boolean(toggle.checked);
    const previous = userSettings;
    const next = { ...userSettings, requirePreviousLessons: checked };
    descriptionEl.textContent = checked
      ? "Complete lessons in order before later lessons unlock."
      : "You can open any lesson. Your actual completion and mastery progress will not change.";
    saveState.textContent = "Saving…";
    try {
      await repo.upsertSettings(next);
      userSettings = next;
      saveState.textContent = "Saved";
      setTimeout(() => { if (saveState) saveState.textContent = ""; }, 1400);
    } catch (err) {
      userSettings = previous;
      toggle.checked = previous?.requirePreviousLessons !== false;
      descriptionEl.textContent = toggle.checked
        ? "Complete lessons in order before later lessons unlock."
        : "You can open any lesson. Your actual completion and mastery progress will not change.";
      saveState.textContent = "Couldn’t save";
    } finally {
      toggle.disabled = false;
    }
  });
}

async function renderToday() {
  syncRoute("home");
  const p = state.session.plan;
  const [records, due] = await Promise.all([
    repo.allSkillStates(USER_ID),
    repo.dueReviews(USER_ID, new Date().toISOString()),
  ]);
  const summary = progressSummary(records);
  const item = state.queue[state.itemIndex] ?? null;
  const skill = item ? SKILL_BY_ID.get(item.skillId) : null;
  const kindLabel = item?.kind === "review" ? "Review due" : item?.kind === "repair" || item?.kind === "review-repair" ? "Quick repair" : "Continue learning";
  const mainTitle = skill ? displaySkillTitle(skill) : "You’re caught up.";
  const mainCopy = skill ? `${skillPhase(skill.id)} • ${planCountLabel(p)}` : "Nothing meaningful is due right now.";

  root.innerHTML = shellHtml(`
    ${topbarHtml("Today", { eyebrow: "Theory Tutor", subtitle: persistenceMode === "supabase" ? "Synced to your account" : "Saved on this device" })}
    <section class="focus-card">
      <div class="focus-kicker">${esc(kindLabel)}</div>
      <div class="focus-phase">${skill ? esc(skillPhase(skill.id)) : "Today"}</div>
      <h1>${esc(mainTitle)}</h1>
      <p>${esc(mainCopy)}</p>
      <button class="primary" id="startBtn" type="button">${state.queue.length ? (item?.kind === "review" || item?.kind === "repair" ? "Start review" : "Continue") : "Finish for today"}</button>
    </section>
    <section class="home-summary">
      <div class="summary-card"><div class="summary-icon">${icon("review", 19)}</div><div><strong>${due.length}</strong><span>Reviews due</span></div></div>
      <div class="summary-card"><div class="summary-icon">${icon("spark", 19)}</div><div><strong>${summary.overall}%</strong><span>Overall progress</span></div></div>
    </section>
    <button class="row-link" id="curriculumBtn" type="button"><span><strong>Curriculum</strong><small>Browse phases and lessons</small></span>${icon("chevron", 20)}</button>`, { activeNav: "home", className: "home-screen" });
  document.querySelector("#startBtn").onclick = state.queue.length ? () => beginItem().catch(showFatal) : () => finishSession().catch(showFatal);
  document.querySelector("#curriculumBtn").onclick = () => renderCurriculum().catch(showFatal);
}

function startPracticeRound(item, followUp = false) {
  const previousNumber = state.round?.skillId === item.skillId ? state.round.number : 0;
  const plan = practiceRoundPlan(item.skillId, item.kind, followUp);
  state.round = {
    skillId: item.skillId,
    number: previousNumber + 1,
    size: plan.size,
    answered: 0,
    hadIncorrect: false,
    followUp,
  };
}

function ensurePracticeRound(item) {
  if (!state.round || state.round.skillId !== item.skillId) startPracticeRound(item, false);
}

async function beginItem() {
  if (state.itemIndex >= state.queue.length) return finishSession();
  state.feedback = null;
  state.submitted = false;
  state.supportedNext = false;
  state.guidanceForNext = "none";
  state.selectedChoice = "";
  state.hintShown = false;
  const item = state.queue[state.itemIndex];
  ensurePracticeRound(item);
  if (item.kind === "new" || item.kind === "acquisition" || item.kind === "review-repair") {
    return renderLessonStep(item, item.kind === "review-repair" ? "Repair" : "Learn");
  }
  state.lessonVisible = false;
  await loadExercise(item);
}

function notePitchClass(note) {
  const match = String(note ?? "").trim().match(/^([A-Ga-g])([#♯b♭]?)/);
  if (!match) return null;
  const natural = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1].toUpperCase()];
  const accidental = match[2] === "#" || match[2] === "♯" ? 1 : match[2] === "b" || match[2] === "♭" ? -1 : 0;
  return (natural + accidental + 12) % 12;
}

function pianoKeyboardHtml(notes = [], caption = "Piano") {
  const labels = new Map();
  for (const note of notes) {
    const pc = notePitchClass(note);
    if (pc == null) continue;
    const list = labels.get(pc) ?? [];
    if (!list.includes(note)) list.push(note);
    labels.set(pc, list);
  }
  const whitePcs = [0, 2, 4, 5, 7, 9, 11];
  const blackAfter = new Map([[0,1],[2,3],[5,6],[7,8],[9,10]]);
  return `<figure class="theory-visual"><figcaption>${esc(caption)}</figcaption><div class="teaching-keyboard" aria-label="${esc(caption)}">${whitePcs.map((pc, i) => {
    const blackPc = blackAfter.get(pc);
    const whiteLabel = labels.get(pc)?.join(" / ") ?? "";
    const blackLabel = blackPc == null ? "" : labels.get(blackPc)?.join(" / ") ?? "";
    return `<div class="teaching-white-key ${labels.has(pc) ? "highlight" : ""}">${whiteLabel ? `<span>${esc(whiteLabel)}</span>` : ""}${blackPc == null ? "" : `<div class="teaching-black-key ${labels.has(blackPc) ? "highlight" : ""}">${blackLabel ? `<span>${esc(blackLabel)}</span>` : ""}</div>`}</div>`;
  }).join("")}</div></figure>`;
}

function intervalTeachingNotes(skillId) {
  const map = {
    "interval.P1": ["C"], "interval.m2": ["C", "D♭"], "interval.M2": ["C", "D"],
    "interval.m3": ["C", "E♭"], "interval.M3": ["C", "E"], "interval.P4": ["C", "F"],
    "interval.A4-d5": ["C", "F♯"], "interval.P5": ["C", "G"], "interval.m6": ["C", "A♭"],
    "interval.M6": ["C", "A"], "interval.m7": ["C", "B♭"], "interval.M7": ["C", "B"],
  };
  return map[skillId] ?? [];
}

function circleOfFifthsHtml() {
  const keys = ["C", "G", "D", "A", "E", "B", "F♯ / G♭", "C♯ / D♭", "G♯ / A♭", "E♭", "B♭", "F"];
  return `<figure class="theory-visual"><figcaption>Circle of Fifths</figcaption><div class="circle-visual" aria-label="Circle of Fifths">${keys.map((key, i) => `<span style="--i:${i}">${esc(key)}</span>`).join("")}</div></figure>`;
}

function inversionDiagramHtml() {
  return `<figure class="theory-visual"><figcaption>Same chord, different bass note</figcaption><div class="inversion-visual"><div><small>Root</small><strong>C · E · G</strong></div><div><small>1st</small><strong>E · G · C</strong></div><div><small>2nd</small><strong>G · C · E</strong></div></div></figure>`;
}

function fretboardDiagramHtml() {
  const strings = ["E", "A", "D", "G", "B", "E"];
  return `<figure class="theory-visual"><figcaption>Standard tuning</figcaption><div class="fretboard-visual" aria-label="Guitar fretboard">${strings.map((s) => `<div class="fret-string"><strong>${s}</strong>${[0,1,2,3,4].map((f) => `<span>${f === 0 ? "open" : f}</span>`).join("")}</div>`).join("")}</div></figure>`;
}

function lessonVisualHtml(skill, page) {
  if (!skill) return "";
  if (skill.id === "interval.generic-number" && /enharmonic/i.test(`${page.title} ${page.body} ${page.example ?? ""}`)) return pianoKeyboardHtml(["C♯", "D♭"], "Same key, two names");
  const intervalNotes = intervalTeachingNotes(skill.id);
  if (intervalNotes.length) return pianoKeyboardHtml(intervalNotes, displaySkillTitle(skill));
  if (skill.phase === 2) {
    const notes = skill.id === "triad.minor" ? ["C", "E♭", "G"] : skill.id === "triad.diminished" ? ["C", "E♭", "G♭"] : skill.id === "triad.augmented" ? ["C", "E", "G♯"] : ["C", "E", "G"];
    return pianoKeyboardHtml(notes, displaySkillTitle(skill));
  }
  if (skill.phase === 3) return pianoKeyboardHtml(["C", "D", "E", "F", "G", "A", "B"], "C major example");
  if (skill.phase === 4) return pianoKeyboardHtml(["C", "E", "G"], "C major chord example");
  if (skill.phase === 9) return inversionDiagramHtml();
  if (skill.phase === 10) return circleOfFifthsHtml();
  if (skill.phase === 12) return fretboardDiagramHtml();
  return "";
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
  const lessonRouteSkill = SKILL_BY_ID.get(item.skillId);
  syncRoute(`study:${item.skillId}`, state.manualStudy ? `phase:${state.manualStudy.phase}` : "home");
  const pages = lessonPagesFor(item);
  const page = pages[Math.min(pageIndex, pages.length - 1)];
  const skill = SKILL_BY_ID.get(item.skillId);
  const pct = pages.length ? Math.round(((pageIndex + 1) / pages.length) * 100) : 100;
  state.lessonVisible = true;
  root.innerHTML = shellHtml(`
    ${topbarHtml("Lesson", { backTarget: "session", eyebrow: skill ? `Phase ${skill.phase}` : label, subtitle: displaySkillTitle(skill) })}
    <div class="study-progress">${progressBarHtml(pct)}</div>
    <section class="lesson-content">
      <div class="lesson-type">${esc(page.eyebrow)}</div>
      <h1>${esc(page.title)}</h1>
      <div class="lesson-copy">${esc(page.body)}</div>
      ${lessonVisualHtml(skill, page)}
      ${page.example ? `<div class="lesson-example"><span>Example</span><strong>${esc(page.example)}</strong></div>` : ""}
      <div class="lesson-footer"><span>${pageIndex + 1} of ${pages.length}</span><button class="primary" id="lessonTry" type="button">${pageIndex < pages.length - 1 ? "Continue" : (item.kind === "review-repair" ? "Try again" : "Try it")}</button></div>
    </section>`, { className: "lesson-screen" });
  document.querySelector("#lessonTry").onclick = async () => {
    if (pageIndex < pages.length - 1) return renderLessonStep(item, label, pageIndex + 1);
    state.lessonVisible = false;
    state.guidanceForNext = "explanation";
    if (item.kind === "review-repair") state.supportedNext = true;
    await service.submitAttempt({
      userId: USER_ID,
      skillId: item.skillId,
      sessionId: state.session.sessionId,
      promptSignature: `lesson:${item.skillId}:${pageIndex}`,
      occurredAt: new Date().toISOString(),
      outcome: "exposed",
      independent: false,
      directEvidence: false,
      context: item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : item.kind === "interleave" ? "transfer" : "acquisition",
      eventKind: "explanation",
      guidance: "explanation",
      solutionSeen: false,
      evidenceSource: "objective",
      evidenceVersion: "v2",
      metadata: { lessonExposure: true },
    });
    await loadExercise(item);
  };
}

async function loadExercise(item) {
  const current = state.exerciseIndex.get(item.skillId) ?? 0;
  const attempts = await repo.attemptsForSkill(USER_ID, item.skillId);
  const selected = selectAdaptiveExercise(item.skillId, attempts, current, 12);
  state.currentExercise = selected.exercise;
  state.exerciseIndex.set(item.skillId, selected.index);
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
    return `<div class="practice-note">Do this on your instrument, then choose how it went.</div>`;
  }
  if (spec.kind === "choice") {
    return `<div class="answer-stack choices">${spec.choices.map((c) => `<button class="choice" data-choice="${esc(c)}" type="button">${esc(c)}</button>`).join("")}</div>`;
  }
  if (spec.kind === "two-sequences") {
    return `<div class="form-stack">
      <label class="field-group"><span>Ascending</span><input class="answer-input" id="ascending" autocomplete="off" placeholder="A B C D…"></label>
      <label class="field-group"><span>Descending</span><input class="answer-input" id="descending" autocomplete="off" placeholder="A G F E…"></label>
      <div class="hint">You can type #, ♯, sharp, b, ♭, or flat. Spaces and hyphens are fine.</div>
    </div>`;
  }
  if (spec.kind === "key-signature") {
    return `<div class="form-stack"><input class="answer-input" id="count" type="number" min="0" max="7" placeholder="Number of accidentals"><select id="accType"><option value="none">None</option><option value="sharp">Sharps</option><option value="flat">Flats</option></select></div>`;
  }
  const placeholder = spec.kind === "sequence" ? "C E G" : spec.kind === "progression" ? "C G Am F" : spec.kind === "number" ? "6" : "Your answer";
  const hint = spec.kind === "sequence" ? "Separate notes with spaces or commas. You can type #, ♯, sharp, b, ♭, or flat." : spec.kind === "progression" ? "Enter chord symbols separated by spaces or commas, e.g. C G Am F." : "";
  return `<div class="form-stack"><input class="answer-input" id="mainAnswer" ${spec.kind === "number" ? 'type="number"' : 'type="text"'} autocomplete="off" placeholder="${esc(placeholder)}">${hint ? `<div class="hint">${esc(hint)}</div>` : ""}</div>`;
}

function feedbackHtml() {
  if (!state.feedback) return "";
  const f = state.feedback;
  const expected = f.expected ? `<div class="expected"><span>Correct answer</span><strong>${esc(f.expected)}</strong></div>` : "";
  return `<div class="feedback ${f.correct ? "correct" : "wrong"}" role="status">
    <div class="feedback-head">${icon(f.correct ? "checkCircle" : "xCircle", 22)}<strong>${f.correct ? "Correct" : "Not quite"}</strong></div>
    ${expected}
    <div class="feedback-detail">${esc(f.detail ?? (f.correct ? "Nice retrieval." : "Use the correction, then try the next one."))}</div>
  </div>`;
}

function renderPractice() {
  const practiceRouteItem = state.queue[state.itemIndex];
  if (practiceRouteItem) syncRoute(`study:${practiceRouteItem.skillId}`, state.manualStudy ? `phase:${state.manualStudy.phase}` : "home");
  const item = state.queue[state.itemIndex];
  const e = state.currentExercise;
  const skill = SKILL_BY_ID.get(item.skillId);
  ensurePracticeRound(item);
  const round = state.round;
  const questionNumber = Math.min(round.size, round.answered + 1);
  const pct = Math.round((round.answered / Math.max(1, round.size)) * 100);
  const contextLabel = item.kind === "review" ? "Review" : item.kind === "repair" || item.kind === "review-repair" ? "Repair" : item.kind === "new" ? "New" : item.kind === "interleave" ? "Mixed review" : "Practice";
  root.innerHTML = shellHtml(`
    ${topbarHtml(contextLabel, { backTarget: "session", eyebrow: skill ? `Phase ${skill.phase}` : "Practice", subtitle: displaySkillTitle(skill) })}
    <div class="study-progress">${progressBarHtml(pct)}</div>
    <section class="question-shell">
      <div class="question-meta"><span>Question ${questionNumber} of ${round.size}</span><span>Round ${round.number} · ${esc(contextLabel)}</span></div>
      ${state.supportedNext ? `<div class="practice-note"><strong>Quick retry</strong><span>Use the example if you need it. This one is practice, not a mastery check.</span></div>` : ""}
      ${state.hintShown ? `<div class="practice-note"><strong>Hint</strong><span>${esc(lessonForSkill(item.skillId).rule || lessonForSkill(item.skillId).summary)}</span></div>` : ""}
      <div class="prompt">${esc(e.prompt)}</div>
      ${exerciseVisualHtml(e)}
      ${answerHtml(state.currentSpec)}
      ${feedbackHtml()}
      <div class="actions" id="actionArea">${actionButtons(item)}</div>
    </section>`, { className: "practice-screen" });
  bindPracticeHandlers(item);
}

function actionButtons(item) {
  if (state.submitted) return `<button class="primary" id="continueBtn">Continue</button>`;
  if (state.currentSpec.kind === "self-check") {
    return `<div class="self-check-actions"><button class="primary" id="selfYes">I did it correctly</button><button class="secondary" id="selfNo">Not yet</button></div>`;
  }
  return `<div class="answer-actions"><button class="secondary" id="hintBtn" type="button" ${state.hintShown ? "disabled" : ""}>${state.hintShown ? "Hint used" : "Need a hint?"}</button><button class="primary" id="submitBtn">Check answer</button></div>`;
}

function runExclusiveAction(action) {
  if (state.actionPending) return;
  state.actionPending = true;
  document.querySelectorAll("#submitBtn,#selfYes,#selfNo,#continueBtn,#hintBtn,#assessmentSubmit,#assessmentContinue").forEach((button) => { button.disabled = true; });
  Promise.resolve().then(action).catch(showFatal).finally(() => { state.actionPending = false; });
}

function bindPracticeHandlers(item) {
  document.querySelectorAll("[data-choice]").forEach((btn) => btn.addEventListener("click", () => {
    state.selectedChoice = btn.dataset.choice;
    document.querySelectorAll("[data-choice]").forEach((x) => x.classList.toggle("selected", x === btn));
  }));
  const input = document.querySelector("#mainAnswer");
  if (input) input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); runExclusiveAction(() => submitObjective(item)); } });
  document.querySelector("#hintBtn")?.addEventListener("click", () => runExclusiveAction(() => useHint(item)));
  document.querySelector("#submitBtn")?.addEventListener("click", () => runExclusiveAction(() => submitObjective(item)));
  document.querySelector("#selfYes")?.addEventListener("click", () => runExclusiveAction(() => submitSelfCheck(item, true)));
  document.querySelector("#selfNo")?.addEventListener("click", () => runExclusiveAction(() => submitSelfCheck(item, false)));
  document.querySelector("#continueBtn")?.addEventListener("click", () => runExclusiveAction(() => afterFeedback(item)));
}

function collectValues(spec) {
  if (spec.kind === "choice") return { main: state.selectedChoice };
  if (spec.kind === "two-sequences") return { ascending: document.querySelector("#ascending")?.value ?? "", descending: document.querySelector("#descending")?.value ?? "" };
  if (spec.kind === "key-signature") return { count: document.querySelector("#count")?.value ?? "", type: document.querySelector("#accType")?.value ?? "none" };
  return { main: document.querySelector("#mainAnswer")?.value ?? "" };
}

function responseModeForEvidence(spec, exercise) {
  if (spec.kind === "self-check") return "application";
  if (spec.kind === "choice") {
    const skill = SKILL_BY_ID.get(exercise.skillId);
    return skill?.evidence?.includes("diagnose") ? "discrimination" : "recognition";
  }
  return "constructed";
}

function evidenceAttributesForExercise(exercise) {
  const payload = exercise?.payload ?? {};
  const keys = ["root", "tonic", "note", "interval", "quality", "degree", "mode", "romans", "expectedRoot", "expectedQuality", "naturalKeyIndex"];
  const attributes = {};
  for (const key of keys) {
    const value = payload[key];
    if (["string", "number", "boolean"].includes(typeof value) || (Array.isArray(value) && value.every((x) => ["string", "number"].includes(typeof x)))) {
      attributes[key] = value;
    }
  }
  return attributes;
}

function exampleSignatureForExercise(exercise) {
  const attributes = evidenceAttributesForExercise(exercise);
  const keys = Object.keys(attributes).sort();
  const prompt = String(exercise.prompt).trim().toLowerCase();
  if (!keys.length) return `${exercise.type}:${prompt}`;
  const stable = Object.fromEntries(keys.map((key) => [key, attributes[key]]));
  return `${exercise.type}:${prompt}:${JSON.stringify(stable)}`;
}

function activeGuidance() {
  if (state.hintShown) return "hint";
  if (state.supportedNext) return "explanation";
  return state.guidanceForNext || "none";
}

async function useHint(item) {
  if (state.hintShown || state.submitted) return;
  state.hintShown = true;
  const lesson = lessonForSkill(item.skillId);
  const context = item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : item.kind === "interleave" ? "transfer" : "acquisition";
  await service.submitAttempt({
    userId: USER_ID,
    skillId: item.skillId,
    sessionId: state.session.sessionId,
    promptSignature: state.currentExercise.id,
    occurredAt: new Date().toISOString(),
    outcome: "hinted",
    independent: false,
    directEvidence: false,
    context,
    coldProbe: false,
    evidenceSource: "objective",
    eventKind: "hint",
    guidance: "hint",
    solutionSeen: false,
    exampleSignature: exampleSignatureForExercise(state.currentExercise),
    exampleAttributes: evidenceAttributesForExercise(state.currentExercise),
    evidenceVersion: "v2",
    metadata: { hint: lesson.rule || lesson.summary },
  });
  renderPractice();
}

async function submitObjective(item) {
  const values = collectValues(state.currentSpec);
  if (state.currentSpec.kind === "choice" && !values.main) return;
  const answer = parseAnswerFromValues(state.currentSpec, values);
  let assessment;
  try { assessment = gradeExercise(state.currentExercise, answer); }
  catch (err) { return showFatal(err); }
  const support = activeGuidance();
  const independent = support === "none";
  const occurredAt = new Date().toISOString();
  const context = item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : "acquisition";
  const responseMode = responseModeForEvidence(state.currentSpec, state.currentExercise);
  const exampleSignature = exampleSignatureForExercise(state.currentExercise);
  const exampleAttributes = evidenceAttributesForExercise(state.currentExercise);
  let evidence = await service.submitAttempt({
    userId: USER_ID,
    skillId: item.skillId,
    sessionId: state.session.sessionId,
    promptSignature: state.currentExercise.id,
    occurredAt,
    outcome: assessment.correct ? "correct" : "incorrect",
    independent,
    directEvidence: true,
    context,
    coldProbe: Boolean(item.firstProbe && independent),
    evidenceSource: "objective",
    eventKind: "response",
    responseMode,
    guidance: support,
    solutionSeen: support === "answer-reveal",
    exampleSignature,
    exampleAttributes,
    evidenceVersion: "v2",
    responseMs: Math.round(performance.now() - state.startedPromptAt),
    assessmentCode: assessment.code,
    metadata: { exerciseType: state.currentExercise.type },
  });
  item.firstProbe = false;
  state.submitted = true;
  const expected = readableExpected(state.currentExercise, assessment);
  if (!assessment.correct && expected) {
    evidence = await service.submitAttempt({
      userId: USER_ID,
      skillId: item.skillId,
      sessionId: state.session.sessionId,
      promptSignature: state.currentExercise.id,
      occurredAt: new Date().toISOString(),
      outcome: "revealed",
      independent: false,
      directEvidence: false,
      context,
      coldProbe: false,
      evidenceSource: "objective",
      eventKind: "answer-reveal",
      responseMode,
      guidance: "answer-reveal",
      solutionSeen: true,
      exampleSignature,
      exampleAttributes,
      evidenceVersion: "v2",
      assessmentCode: "answer-revealed-after-error",
      metadata: { exerciseType: state.currentExercise.type },
    });
    state.guidanceForNext = "answer-reveal";
  } else {
    state.guidanceForNext = "none";
  }
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
  const support = activeGuidance();
  const independent = support === "none";
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
    eventKind: "response",
    responseMode: "application",
    guidance: support,
    solutionSeen: false,
    exampleSignature: exampleSignatureForExercise(state.currentExercise),
    exampleAttributes: evidenceAttributesForExercise(state.currentExercise),
    evidenceVersion: "v2",
    responseMs: Math.round(performance.now() - state.startedPromptAt),
    assessmentCode: correct ? "self-check-correct" : "self-check-not-yet",
    metadata: { exerciseType: state.currentExercise.type },
  });
  item.firstProbe = false;
  state.submitted = true;
  state.guidanceForNext = "none";
  state.feedback = {
    correct,
    expected: "",
    detail: correct ? (evidence.ready ? "Recorded as application evidence." : "Recorded. A later varied application can strengthen readiness evidence.") : "No problem. Review the relationship and try a different version rather than grinding the identical task.",
    evidence,
  };
  renderPractice();
}

function renderRoundComplete(item, followUp = false) {
  const skill = SKILL_BY_ID.get(item.skillId);
  const round = state.round;
  const title = followUp ? "One more round" : "Round complete";
  const copy = followUp
    ? "The evidence shows this relationship needs more work. The next round stays focused and varied."
    : "You're done with this for now. Finishing the round did not create mastery by itself; your evidence and future reviews decide what happens next.";
  root.innerHTML = shellHtml(`
    ${topbarHtml(title, { eyebrow: skill ? `Phase ${skill.phase}` : "Practice", subtitle: displaySkillTitle(skill) })}
    <section class="completion-panel">
      <div class="completion-icon">${icon(followUp ? "review" : "check", 28)}</div>
      <h1>${esc(title)}.</h1>
      <p>${esc(copy)}</p>
      <div class="soft-note">Completed ${round?.size ?? 0} questions in Round ${round?.number ?? 1}.</div>
      <button class="primary" id="roundNext" type="button">${followUp ? "Start next round" : "Continue"}</button>
    </section>`, { className: "completion-screen" });
  document.querySelector("#roundNext").onclick = () => runExclusiveAction(async () => {
    if (followUp) {
      startPracticeRound(item, true);
      state.feedback = null;
      state.submitted = false;
      state.hintShown = false;
      state.supportedNext = false;
      state.guidanceForNext = "none";
      state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);
      return loadExercise(item);
    }
    return advanceItem();
  });
}

async function afterFeedback(item) {
  const evidence = state.feedback?.evidence;
  ensurePracticeRound(item);
  state.round.answered += 1;
  if (!state.feedback?.correct) state.round.hadIncorrect = true;

  // Stay inside the fixed-size round even if READY is reached early. The round is
  // the honest UX question count; READY/RETAINED remain evidence states.
  if (state.round.answered < state.round.size) {
    state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);
    state.hintShown = false;
    state.supportedNext = false;

    if (!state.feedback?.correct && !["review", "interleave"].includes(item.kind)) {
      const attempts = await repo.attemptsForSkill(USER_ID, item.skillId);
      const decision = decideAdaptivePractice(attempts, evidence);
      if (decision.action === "reteach") {
        state.supportedNext = true;
        return renderLessonStep(item, "Quick repair");
      }
    }
    return loadExercise(item);
  }

  // Evaluate only after the current round is complete.
  if (item.kind === "interleave") return renderRoundComplete(item, false);
  if (item.kind === "review" || item.kind === "repair" || item.kind === "review-repair") {
    if (state.round.hadIncorrect && state.round.number < 2) return renderRoundComplete(item, true);
    return renderRoundComplete(item, false);
  }

  if (evidence?.ready) return renderRoundComplete(item, false);
  const attempts = await repo.attemptsForSkill(USER_ID, item.skillId);
  const decision = decideAdaptivePractice(attempts, evidence);
  if (decision.action === "stop-for-now" || state.round.number >= 3) {
    state.stoppedSkillIds.add(item.skillId);
    return renderRoundComplete(item, false);
  }
  return renderRoundComplete(item, true);
}

async function maybeAppendFastPath() { return false; }

async function advanceItem() {
  const item = state.queue[state.itemIndex];
  state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);
  state.itemIndex += 1;
  state.round = null;
  if (state.itemIndex >= state.queue.length && state.manualStudy) {
    const previous = state.manualStudy;
    state.manualStudy = null;
    state.queue = previous.queue;
    state.itemIndex = previous.itemIndex;
    state.fastPathPasses = previous.fastPathPasses;
    return renderPhase(previous.phase);
  }
  if (state.itemIndex >= state.queue.length) {
    const extended = await maybeAppendFastPath(item);
    if (!extended) return finishSession();
  }
  await beginItem();
}

async function finishSession() {
  if (state.session?.sessionId) await service.finishSession(USER_ID, state.session.sessionId, "planned-work-complete", new Date());
  root.innerHTML = shellHtml(`
    ${topbarHtml("Done", { eyebrow: "Session complete" })}
    <section class="completion-panel">
      <div class="completion-icon">${icon("check", 28)}</div>
      <h1>Nice work.</h1>
      <p>Your results are saved. Reviews will come back when they are useful again.</p>
      ${state.stoppedSkillIds.size ? `<div class="soft-note">One skill needs another short pass later. The app stopped instead of drilling it.</div>` : ""}
      <button class="primary" id="backToday" type="button">Back to Home</button>
    </section>`, { className: "completion-screen" });
  document.querySelector("#backToday").onclick = () => loadToday().catch(showFatal);
}

function showFatal(err) {
  console.error(err);
  const raw = String(err?.message ?? err ?? "");
  const message = /session expired|access token|jwt/i.test(raw)
    ? "Your session expired. Reload and sign in again."
    : /failed to fetch|network|offline/i.test(raw)
      ? "We couldn’t reach the server. Check your connection and try again."
      : "Something went wrong. Your saved progress is safe. Try again.";
  root.innerHTML = shellHtml(`
    ${topbarHtml("Something went wrong")}
    <section class="error-panel"><div class="error-icon">${icon("xCircle", 24)}</div><p>${esc(message)}</p><button class="primary" id="retry" type="button">Reload</button></section>`, { className: "error-screen" });
  document.querySelector("#retry").onclick = () => location.reload();
}

boot().catch(showFatal);
