from pathlib import Path


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise RuntimeError(f"Could not locate {label}")
    return text.replace(old, new, 1)

p = Path("web/app.js")
t = p.read_text()

# Display titles are deliberately separate from stable curriculum IDs/titles.
anchor = 'function skillTitle(id) { return SKILL_BY_ID.get(id)?.title ?? id; }\n'
display_titles = r'''const DISPLAY_SKILL_TITLES = Object.freeze({
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
'''
t = replace_once(t, anchor, display_titles, "display title helper")

# Topbar can omit the decorative brand mark on Profile without leaving a dead square.
old = '''function topbarHtml(title = "", options = {}) {\n  const { backTarget = "", eyebrow = "", subtitle = "", action = "" } = options;\n  return `<header class="page-header">\n    <div class="page-header-leading">${backTarget ? `<button class="icon-button" data-back="${esc(backTarget)}" type="button" aria-label="Back">${icon("back", 22)}</button>` : '<div class="brand-mark">T</div>'}</div>'''
new = '''function topbarHtml(title = "", options = {}) {\n  const { backTarget = "", eyebrow = "", subtitle = "", action = "", hideLeading = false } = options;\n  return `<header class="page-header ${hideLeading ? "no-leading" : ""}">\n    ${hideLeading ? "" : `<div class="page-header-leading">${backTarget ? `<button class="icon-button" data-back="${esc(backTarget)}" type="button" aria-label="Back">${icon("back", 22)}</button>` : '<div class="brand-mark">T</div>'}</div>`}'''
t = replace_once(t, old, new, "topbar leading option")

# Lightweight history routing for sensible browser/device Back behavior.
route_anchor = 'function footerHtml() { return ""; }\n'
routes = r'''let replayingHistory = false;

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

'''
t = replace_once(t, route_anchor, routes + route_anchor, "history routing")

# Back buttons now use route-aware history instead of adding a duplicate route behind the user.
old = '''    if (target === "home") return renderToday().catch(showFatal);\n    if (target === "learn") return renderCurriculum().catch(showFatal);\n    if (target === "profile") return renderProfile().catch(showFatal);\n    if (target?.startsWith("phase:")) return renderPhase(Number(target.split(":")[1])).catch(showFatal);\n    if (target === "session") return leaveStudyToPrevious().catch(showFatal);'''
new = '''    return goBack(target).catch(showFatal);'''
t = replace_once(t, old, new, "delegated back routing")

# Register routes at screen boundaries. Repeated lesson pages/questions keep one history entry.
route_replacements = [
    ('async function renderCurriculum() {\n', 'async function renderCurriculum() {\n  syncRoute("learn");\n'),
    ('async function renderPhase(phase) {\n', 'async function renderPhase(phase) {\n  syncRoute(`phase:${phase}`, "learn");\n'),
    ('async function renderLockedPhase(phase) {\n', 'async function renderLockedPhase(phase) {\n  syncRoute(`locked-phase:${phase}`, "learn");\n'),
    ('function renderAssessmentQuestion() {\n', 'function renderAssessmentQuestion() {\n  const routeAssessment = state.assessment;\n  if (routeAssessment) syncRoute(`assessment:${routeAssessment.kind}:${routeAssessment.phase}`, routeAssessment.kind === "placement" ? `locked-phase:${routeAssessment.phase}` : `phase:${routeAssessment.phase}`);\n'),
    ('async function renderProfile(message = "") {\n', 'async function renderProfile(message = "") {\n  syncRoute("profile");\n'),
    ('async function renderEditProfile(message = "") {\n', 'async function renderEditProfile(message = "") {\n  syncRoute("edit-profile", "profile");\n'),
    ('async function renderSettings() {\n', 'async function renderSettings() {\n  syncRoute("settings", "profile");\n'),
    ('async function renderToday() {\n', 'async function renderToday() {\n  syncRoute("home");\n'),
    ('function renderLessonStep(item, label = "Learn", pageIndex = 0) {\n', 'function renderLessonStep(item, label = "Learn", pageIndex = 0) {\n  const lessonRouteSkill = SKILL_BY_ID.get(item.skillId);\n  syncRoute(`study:${item.skillId}`, state.manualStudy ? `phase:${state.manualStudy.phase}` : "home");\n'),
    ('function renderPractice() {\n', 'function renderPractice() {\n  const practiceRouteItem = state.queue[state.itemIndex];\n  if (practiceRouteItem) syncRoute(`study:${practiceRouteItem.skillId}`, state.manualStudy ? `phase:${state.manualStudy.phase}` : "home");\n'),
]
for old_text, new_text in route_replacements:
    t = replace_once(t, old_text, new_text, old_text.strip())

# Reusable educational diagrams. They appear only while teaching, never as answer-revealing additions to retrieval questions.
visual_anchor = 'function lessonPagesFor(item) {\n'
visuals = r'''function notePitchClass(note) {
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
  const keys = ["C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F"];
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

'''
t = replace_once(t, visual_anchor, visuals + visual_anchor, "lesson visual helpers")

# Lesson teaching screen: short display title + visual between explanation and example.
t = t.replace('subtitle: skill?.title ?? ""', 'subtitle: displaySkillTitle(skill)')
t = t.replace('<strong>${esc(skill.title)}</strong>', '<strong>${esc(displaySkillTitle(skill))}</strong>')
t = t.replace('<strong>${esc(currentSkill.title)}</strong>', '<strong>${esc(displaySkillTitle(currentSkill))}</strong>')
t = t.replace('const mainTitle = skill?.title ?? "You’re caught up.";', 'const mainTitle = skill ? displaySkillTitle(skill) : "You’re caught up.";')
t = t.replace('      <div class="lesson-copy">${esc(page.body)}</div>\n      ${page.example ?', '      <div class="lesson-copy">${esc(page.body)}</div>\n      ${lessonVisualHtml(skill, page)}\n      ${page.example ?')

# Profile: no top-left T, no Recent Activity query/feed/member metadata.
t = t.replace('    repo.dueReviews(USER_ID, new Date().toISOString()),\n    repo.recentSessions(USER_ID, 4),\n  ]);', '    repo.dueReviews(USER_ID, new Date().toISOString()),\n  ]);')
t = t.replace('const [records, due, sessions] = await Promise.all([', 'const [records, due] = await Promise.all([')
start = '  const history = sessions.length ? sessions.map((session) => `<div class="activity-row"><span>${esc(formatProfileDate(session.startedAt))}</span><strong>${session.completedAt ? "Studied" : "Started"}</strong></div>`).join("") : \'<div class="empty-row">No study sessions yet.</div>\';\n\n'
t = t.replace(start, '')
t = t.replace('${topbarHtml("Profile", { eyebrow: "Your learning" })}', '${topbarHtml("Profile", { eyebrow: "Your learning", hideLeading: true })}')
recent = '    <section class="compact-section"><div class="section-heading"><span>Recent activity</span></div><div class="activity-list">${history}</div><div class="member-since">Member since ${esc(formatProfileDate(userProfile?.createdAt))}</div></section>\n'
t = t.replace(recent, '')

# Settings Account contains only the actual actions requested.
t = t.replace('        ${authEmail ? `<div class="settings-info"><span>Email</span><strong>${esc(authEmail)}</strong></div>` : ""}\n', '')

p.write_text(t)

# CSS overrides for overflow, title wrapping, route-safe full screens, diagrams, and compact Profile.
p = Path("web/styles.css")
css = p.read_text()
extra = r'''

/* PROMPT4_UI_LESSON_CLEANUP */
.page-header.no-leading { grid-template-columns: minmax(0,1fr) 44px; }
.page-header.no-leading .page-header-copy { text-align: left; }
.page-header-copy,
.focus-card,
.phase-card,
.phase-card-top,
.lesson-row,
.lesson-row-copy,
.current-learning-row,
.current-learning-row > div,
.question-shell,
.assessment-question,
.assessment-results,
.setting-copy { min-width: 0; }
.page-title,
.page-subtitle,
.focus-card h1,
.phase-card h2,
.lesson-row-copy strong,
.current-learning-row strong,
.lesson-content h1,
.prompt,
.assessment-results h1,
.setting-copy strong,
.setting-copy span { overflow-wrap: anywhere; word-break: normal; }
.page-subtitle { white-space: normal; overflow: visible; text-overflow: clip; }
.focus-card h1 { font-size: clamp(1.55rem, 6.5vw, 2.2rem); }
.lesson-row-copy strong { line-height: 1.32; }
.profile-screen .page-header { margin-bottom: 8px; }
.profile-hero { padding-top: 0; }

.theory-visual { margin: 2px 0 4px; padding: 14px; border-radius: var(--radius); background: var(--surface-2); border: 1px solid var(--border); overflow: hidden; }
.theory-visual figcaption { margin-bottom: 11px; color: var(--muted); font-size: .72rem; font-weight: 720; }
.teaching-keyboard { height: 126px; display: flex; position: relative; padding: 0 2px; }
.teaching-white-key { position: relative; flex: 1 1 0; min-width: 0; height: 100%; background: #f0f1f4; border: 1px solid #aeb3bd; border-radius: 0 0 7px 7px; color: #171921; display: flex; align-items: flex-end; justify-content: center; padding: 0 2px 8px; font-size: .64rem; font-weight: 800; }
.teaching-white-key + .teaching-white-key { margin-left: -1px; }
.teaching-white-key.highlight { background: #d9d4ff; box-shadow: inset 0 -4px 0 var(--accent); }
.teaching-black-key { position: absolute; z-index: 2; top: 0; right: -19%; width: 38%; height: 64%; border-radius: 0 0 5px 5px; background: #20232b; color: #fff; display: flex; align-items: flex-end; justify-content: center; padding: 0 2px 7px; font-size: .52rem; font-weight: 800; }
.teaching-black-key.highlight { background: var(--accent); box-shadow: 0 4px 12px rgba(0,0,0,.25); }
.inversion-visual { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; }
.inversion-visual > div { padding: 10px 8px; border-radius: 12px; background: var(--surface-3); text-align: center; min-width: 0; }
.inversion-visual small { display: block; color: var(--muted); margin-bottom: 5px; }
.inversion-visual strong { font-size: .72rem; overflow-wrap: anywhere; }
.circle-visual { width: min(260px, 76vw); aspect-ratio: 1; margin: 4px auto; position: relative; border: 1px solid var(--border-strong); border-radius: 50%; }
.circle-visual::after { content: "5ths"; position: absolute; inset: 31%; display: grid; place-items: center; border-radius: 50%; background: var(--surface-3); color: var(--muted); font-size: .72rem; }
.circle-visual span { --angle: calc(var(--i) * 30deg - 90deg); position: absolute; left: 50%; top: 50%; width: 30px; height: 30px; margin: -15px; display: grid; place-items: center; border-radius: 50%; background: var(--surface-3); color: var(--text); font-size: .68rem; font-weight: 800; transform: rotate(var(--angle)) translate(calc(min(110px, 31vw))) rotate(calc(-1 * var(--angle))); }
.fretboard-visual { display: grid; gap: 5px; overflow-x: auto; padding-bottom: 2px; }
.fret-string { min-width: 300px; display: grid; grid-template-columns: 34px repeat(5,1fr); align-items: center; gap: 0; position: relative; }
.fret-string::after { content: ""; position: absolute; left: 32px; right: 0; height: 1px; background: #808694; z-index: 0; }
.fret-string strong, .fret-string span { position: relative; z-index: 1; }
.fret-string strong { color: var(--accent); font-size: .72rem; }
.fret-string span { min-height: 27px; display: grid; place-items: center; border-left: 1px solid var(--border-strong); color: var(--muted); font-size: .58rem; }

@media (max-width: 390px) {
  .app-shell { padding-left: 13px; padding-right: 13px; }
  .lesson-content, .question-shell, .assessment-question { padding-left: 16px; padding-right: 16px; }
  .teaching-keyboard { height: 112px; }
  .lesson-row-end { flex: 0 0 auto; }
  .status-chip { max-width: 78px; overflow: hidden; text-overflow: ellipsis; }
}
'''
if "/* PROMPT4_UI_LESSON_CLEANUP */" not in css:
    css += extra
p.write_text(css)

# Focused Prompt 4 regression tests.
Path("tests/prompt4-ui.test.mjs").write_text(r'''import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("web/app.js", "utf8");
const css = fs.readFileSync("web/styles.css", "utf8");
const skills = fs.readFileSync("src/curriculum/skills.ts", "utf8");

test("display titles are short UI aliases while stable internal skill ids remain unchanged", () => {
  assert.match(app, /"interval\.quality-system": "Interval Quality"/);
  assert.match(app, /"guitar\.triads": "Triads on Guitar"/);
  assert.match(skills, /s\("interval\.quality-system", 1, "Perfect\/major\/minor\/augmented\/diminished quality system"/);
});

test("long user-facing text wraps instead of overflowing cards", () => {
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /\.page-subtitle \{ white-space: normal/);
  assert.match(css, /min-width: 0/);
});

test("Profile removes the standalone T brand and Recent Activity feed without deleting history infrastructure", () => {
  assert.match(app, /topbarHtml\("Profile", \{ eyebrow: "Your learning", hideLeading: true \}\)/);
  assert.doesNotMatch(app, /<span>Recent activity<\/span>/i);
  assert.doesNotMatch(app, /repo\.recentSessions\(USER_ID, 4\)/);
  assert.match(app, /service\.submitAttempt/);
});

test("Settings stays grouped and autosaves the access-only prerequisite toggle", () => {
  assert.match(app, /settings-title">Learning/);
  assert.match(app, /settings-title">Account/);
  assert.match(app, /await repo\.upsertSettings\(next\)/);
  assert.match(app, /Your actual completion and mastery progress will not change/);
});

test("browser history routing and logical Back targets are wired for deep screens", () => {
  assert.match(app, /window\.addEventListener\("popstate"/);
  assert.match(app, /syncRoute\(`study:\$\{item\.skillId\}`/);
  assert.match(app, /syncRoute\(`assessment:\$\{routeAssessment\.kind\}:\$\{routeAssessment\.phase\}`/);
  assert.match(app, /return goBack\(target\)\.catch\(showFatal\)/);
});

test("lesson teaching has reusable piano, inversion, circle, and fretboard visuals", () => {
  assert.match(app, /function pianoKeyboardHtml/);
  assert.match(app, /function inversionDiagramHtml/);
  assert.match(app, /function circleOfFifthsHtml/);
  assert.match(app, /function fretboardDiagramHtml/);
  assert.match(app, /lessonVisualHtml\(skill, page\)/);
  const practiceStart = app.indexOf("function renderPractice()");
  const practiceEnd = app.indexOf("function actionButtons", practiceStart);
  assert.ok(practiceStart >= 0 && practiceEnd > practiceStart);
  const practiceSource = app.slice(practiceStart, practiceEnd);
  assert.doesNotMatch(practiceSource, /lessonVisualHtml\(/);
});

test("Phase 0 remains absent from the active curriculum", () => {
  assert.doesNotMatch(skills, /phase\s*0|Phase 0|,\s*0,\s*"/);
});
''')

print("Prompt 4 UI and lesson cleanup applied")
