from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"QA anchor missing in {path}: {old[:100]!r}")
    p.write_text(text.replace(old, new, 1))

# Checkpoint mappings must never silently lose curriculum skills.
p = Path("src/progression/checkpoints.ts")
t = p.read_text()
replacements = {
    '["seventh.maj7", "seventh.min7", "seventh.dom7"]': '["seventh.major7", "seventh.minor7", "seventh.dominant7"]',
    '["seventh.diatonic-major", "seventh.mixed"]': '["seventh.major-diatonic", "seventh.mixed"]',
    '["inversion.triad", "inversion.figured-bass"]': '["inversion.triad", "inversion.slash"]',
    '["voicing.distinction", "voicing.close-open"]': '["voicing.distinction", "inversion.slash"]',
    '["voice.common-tones", "voice.smooth"]': '["voice.common-tones", "voice.economical"]',
    '["circle.relatives", "circle.closely-related"]': '["circle.relative-minor", "keys.closely-related"]',
    '["circle.transpose", "circle.analysis"]': '["keys.accidental-order", "keys.minor-signatures", "keys.enharmonic"]',
    '["color.sus", "color.add", "color.sixth"]': '["color.sus", "color.add", "color.six"]',
    '["extension.compound-intervals", "extension.9", "extension.11", "extension.13"]': '["extension.compound-intervals", "extension.9", "extension.11-13"]',
}
for old, new in replacements.items():
    t = t.replace(old, new)
old_existing = '''function existing(skillIds: readonly string[]): string[] {\n  return skillIds.filter((id) => SKILL_BY_ID.has(id));\n}'''
new_existing = '''function existing(skillIds: readonly string[]): string[] {\n  const missing = skillIds.filter((id) => !SKILL_BY_ID.has(id));\n  if (missing.length) throw new Error(`Checkpoint references unknown curriculum skills: ${missing.join(", ")}`);\n  return [...skillIds];\n}'''
if new_existing not in t:
    if old_existing not in t:
        raise SystemExit("checkpoint validation anchor missing")
    t = t.replace(old_existing, new_existing)
p.write_text(t)

# Atomic readiness must reflect distinct semantic examples, not merely unique generated IDs.
replace_once(
    "src/learning/evidence.ts",
    '''    if (mode === "atomic") {\n      // Atomic facts do not always have meaningful root/key variation, but one immediately repeated answer is not enough.\n      return promptForms.size > 1 && subset.length > 1 ? "atomic-retrieval" : "none";\n    }''',
    '''    if (mode === "atomic") {\n      // Generated prompt IDs are not evidence of variety: the visible/semantic example must actually change.\n      return semanticExamples.size > 1 && subset.length > 1 ? "atomic-retrieval" : "none";\n    }'''
)

# Exercise QA: vary atomic pools and guarantee negative membership examples are truly chromatic.
p = Path("src/exercises/catalog.ts")
t = p.read_text()
old = '  if (skillId === "interval.generic-number") return text(skillId, index, "C to E is what interval number?", "3rd", ["2nd", "3rd", "4th"]);'
new = '''  if (skillId === "interval.generic-number") {\n    const examples = [\n      ["C", "E", "3rd", ["2nd", "3rd", "4th"]],\n      ["F", "B", "4th", ["3rd", "4th", "5th"]],\n      ["D", "A", "5th", ["4th", "5th", "6th"]],\n      ["A", "D", "4th", ["3rd", "4th", "5th"]],\n    ] as const;\n    const [from, to, expected, choices] = pick(examples, index);\n    return text(skillId, index, `${from} to ${to} is what interval number?`, expected, choices);\n  }'''
if new not in t:
    if old not in t: raise SystemExit("interval generic anchor missing")
    t = t.replace(old, new, 1)
old = '  if (skillId === "triad.members") return text(skillId, index, "A basic triad has which three note roles?", ["root", "third", "fifth"]);'
new = '''  if (skillId === "triad.members") {\n    const prompts = [\n      "A basic triad has which three note roles?",\n      "Name the three stacked chord-member roles in a basic triad.",\n      "From the root upward, which chord members define a basic triad?",\n    ];\n    return text(skillId, index, pick(prompts, index), ["root", "third", "fifth"]);\n  }'''
if new not in t:
    if old not in t: raise SystemExit("triad members anchor missing")
    t = t.replace(old, new, 1)
old = '  if(skillId==="seventh.members") return text(skillId,index,"What chord members make a tertian seventh chord?",["root","third","fifth","seventh"]);'
new = '''  if(skillId==="seventh.members") {\n    const prompts=[\n      "What chord members make a tertian seventh chord?",\n      "Name the four stacked chord-member roles in a basic seventh chord.",\n      "From the root upward, which chord members define a tertian seventh chord?",\n    ];\n    return text(skillId,index,pick(prompts,index),["root","third","fifth","seventh"]);\n  }'''
if new not in t:
    if old not in t: raise SystemExit("seventh members anchor missing")
    t = t.replace(old, new, 1)
old = '''  if (skillId === "major.membership") {\n    const tonic = tonicAt(index); const scale = majorScale(parseNote(tonic)); const inScale = index % 2 === 0; const note = inScale ? scale[(index + 2) % 7] : intervalAbove(scale[(index + 2) % 7], INTERVALS.m2);\n    return { id: `${skillId}:${index}`, skillId, type: "scale-membership", prompt: `Is ${formatNote(note)} diatonic to ${tonic} major?`, assessmentMode: "objective", payload: { expected: inScale ? "yes" : "no" } };\n  }'''
new = '''  if (skillId === "major.membership") {\n    const tonic = tonicAt(index); const tonicNote = parseNote(tonic); const scale = majorScale(tonicNote); const inScale = index % 2 === 0;\n    const chromaticIntervals = [INTERVALS.m2, INTERVALS.A4, INTERVALS.m7] as const;\n    const note = inScale ? scale[(index + 2) % 7] : intervalAbove(tonicNote, pick(chromaticIntervals, index));\n    return { id: `${skillId}:${index}`, skillId, type: "scale-membership", prompt: `Is ${formatNote(note)} diatonic to ${tonic} major?`, assessmentMode: "objective", payload: { expected: inScale ? "yes" : "no", tonic, note: formatNote(note) } };\n  }'''
if new not in t:
    if old not in t: raise SystemExit("major membership anchor missing")
    t = t.replace(old, new, 1)
p.write_text(t)

# Browser QA: restore deep forward routes, prevent double submits, refresh Profile state,
# serialize setting changes, remove a duplicate teaching-data key, and keep fatal errors friendly.
p = Path("web/app.js")
t = p.read_text()
if 'actionPending: false,' not in t:
    t = t.replace('  submitted: false,\n', '  submitted: false,\n  actionPending: false,\n', 1)

duplicate_word = '  "modulation.tonicization-vs-keychange": [["Modulation", "A real change of musical home to a new key.", "The music leaves C major and establishes G major as the new home."]],\n'
t = t.replace(duplicate_word, '', 1)

t = t.replace('''  if (route.startsWith("locked-phase:")) return renderLockedPhase(Number(route.split(":")[1]));\n  return renderToday();''', '''  if (route.startsWith("locked-phase:")) return renderLockedPhase(Number(route.split(":")[1]));\n  if (route.startsWith("study:")) {\n    const skillId = route.slice("study:".length);\n    const item = state.queue[state.itemIndex];\n    if (item?.skillId === skillId && state.currentExercise) return renderPractice();\n    return state.manualStudy ? renderPhase(state.manualStudy.phase) : renderToday();\n  }\n  if (route.startsWith("assessment:")) {\n    const [, kind, phaseText] = route.split(":");\n    const phase = Number(phaseText);\n    if (state.assessment?.kind === kind && state.assessment?.phase === phase && state.assessment.current) return renderAssessmentQuestion();\n    return kind === "placement" ? renderLockedPhase(phase) : renderPhase(phase);\n  }\n  return renderToday();''', 1)

t = t.replace('''  const plan = state.session?.plan ?? await service.previewPlan(USER_ID, new Date());''', '''  const plan = await service.previewPlan(USER_ID, new Date());''', 1)

t = t.replace('''  toggle.addEventListener("change", async () => {\n    const checked = Boolean(toggle.checked);''', '''  toggle.addEventListener("change", async () => {\n    if (toggle.disabled) return;\n    toggle.disabled = true;\n    const checked = Boolean(toggle.checked);''', 1)
t = t.replace('''      saveState.textContent = "Saved";\n      setTimeout(() => { if (saveState) saveState.textContent = ""; }, 1400);''', '''      saveState.textContent = "Saved";\n      setTimeout(() => { if (saveState) saveState.textContent = ""; }, 1400);''', 1)
t = t.replace('''      saveState.textContent = "Couldn’t save";\n    }\n  });''', '''      saveState.textContent = "Couldn’t save";\n    } finally {\n      toggle.disabled = false;\n    }\n  });''', 1)

# Shared synchronous lock closes the double-tap window before any async persistence begins.
handler_old = '''function bindPracticeHandlers(item) {\n  document.querySelectorAll("[data-choice]").forEach((btn) => btn.addEventListener("click", () => {'''
handler_new = '''function runExclusiveAction(action) {\n  if (state.actionPending) return;\n  state.actionPending = true;\n  document.querySelectorAll("#submitBtn,#selfYes,#selfNo,#continueBtn,#hintBtn,#assessmentSubmit,#assessmentContinue").forEach((button) => { button.disabled = true; });\n  Promise.resolve().then(action).catch(showFatal).finally(() => { state.actionPending = false; });\n}\n\nfunction bindPracticeHandlers(item) {\n  document.querySelectorAll("[data-choice]").forEach((btn) => btn.addEventListener("click", () => {'''
if handler_new not in t:
    if handler_old not in t: raise SystemExit("practice handler anchor missing")
    t = t.replace(handler_old, handler_new, 1)

t = t.replace('''  if (input) input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") submitObjective(item); });\n  document.querySelector("#hintBtn")?.addEventListener("click", () => useHint(item));\n  document.querySelector("#submitBtn")?.addEventListener("click", () => submitObjective(item));\n  document.querySelector("#selfYes")?.addEventListener("click", () => submitSelfCheck(item, true));\n  document.querySelector("#selfNo")?.addEventListener("click", () => submitSelfCheck(item, false));\n  document.querySelector("#continueBtn")?.addEventListener("click", () => afterFeedback(item));''', '''  if (input) input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); runExclusiveAction(() => submitObjective(item)); } });\n  document.querySelector("#hintBtn")?.addEventListener("click", () => runExclusiveAction(() => useHint(item)));\n  document.querySelector("#submitBtn")?.addEventListener("click", () => runExclusiveAction(() => submitObjective(item)));\n  document.querySelector("#selfYes")?.addEventListener("click", () => runExclusiveAction(() => submitSelfCheck(item, true)));\n  document.querySelector("#selfNo")?.addEventListener("click", () => runExclusiveAction(() => submitSelfCheck(item, false)));\n  document.querySelector("#continueBtn")?.addEventListener("click", () => runExclusiveAction(() => afterFeedback(item)));''', 1)

t = t.replace('''  document.querySelector("#assessmentSubmit")?.addEventListener("click", () => submitAssessmentAnswer().catch(showFatal));\n  document.querySelector("#assessmentContinue")?.addEventListener("click", () => loadAssessmentQuestion().catch(showFatal));''', '''  document.querySelector("#assessmentSubmit")?.addEventListener("click", () => runExclusiveAction(() => submitAssessmentAnswer()));\n  document.querySelector("#assessmentContinue")?.addEventListener("click", () => runExclusiveAction(() => loadAssessmentQuestion()));''', 1)

# Circle labels make the enharmonic boundary explicit instead of implying Db is literally a fifth above F#.
t = t.replace('''  const keys = ["C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F"];''', '''  const keys = ["C", "G", "D", "A", "E", "B", "F♯ / G♭", "C♯ / D♭", "G♯ / A♭", "E♭", "B♭", "F"];''', 1)

# Never expose raw REST/database error bodies on the user-facing error screen.
old_fatal = '''function showFatal(err) {\n  console.error(err);\n  root.innerHTML = shellHtml(`\n    ${topbarHtml("Something went wrong")}\n    <section class="error-panel"><div class="error-icon">${icon("xCircle", 24)}</div><p>${esc(err?.message ?? err)}</p><button class="primary" id="retry" type="button">Reload</button></section>`, { className: "error-screen" });\n  document.querySelector("#retry").onclick = () => location.reload();\n}'''
new_fatal = '''function showFatal(err) {\n  console.error(err);\n  const raw = String(err?.message ?? err ?? "");\n  const message = /session expired|access token|jwt/i.test(raw)\n    ? "Your session expired. Reload and sign in again."\n    : /failed to fetch|network|offline/i.test(raw)\n      ? "We couldn’t reach the server. Check your connection and try again."\n      : "Something went wrong. Your saved progress is safe. Try again.";\n  root.innerHTML = shellHtml(`\n    ${topbarHtml("Something went wrong")}\n    <section class="error-panel"><div class="error-icon">${icon("xCircle", 24)}</div><p>${esc(message)}</p><button class="primary" id="retry" type="button">Reload</button></section>`, { className: "error-screen" });\n  document.querySelector("#retry").onclick = () => location.reload();\n}'''
if new_fatal not in t:
    if old_fatal not in t: raise SystemExit("fatal error anchor missing")
    t = t.replace(old_fatal, new_fatal, 1)
p.write_text(t)

print("Full QA bug sweep fixes applied")
