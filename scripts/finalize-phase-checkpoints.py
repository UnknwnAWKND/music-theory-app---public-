from pathlib import Path


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise RuntimeError(f"Could not locate {label}")
    return text.replace(old, new, 1)

# Prefer the validated target phase after successful placement.
p = Path("src/session/planner.ts")
t = p.read_text()
t = replace_once(t,
'''  validatedEntryPhases?: readonly number[];\n}''',
'''  validatedEntryPhases?: readonly number[];\n  /** When placement has validated a later phase, prefer beginning there instead of earlier untouched material. */\n  preferredNewPhase?: number;\n}''',
"planner preferred phase input")
t = replace_once(t,
'''  let newSkillId: string | undefined;\n  let reasonNoNewSkill: string | undefined;''',
'''  let newSkillId: string | undefined;\n  let reasonNoNewSkill: string | undefined;''',
"planner new-skill anchor")
old = '''    newSkillId = nextUnlockable(input.evidenceBySkill, SKILLS, input.allowOptionalNew ?? false, input.guidedPhaseAccess, input.validatedEntryPhases)?.id;\n    if (!newSkillId) reasonNoNewSkill = "nothing-unlocked";'''
new = '''    const preferredSkills = input.preferredNewPhase\n      ? SKILLS.filter((skill) => skill.phase === input.preferredNewPhase)\n      : SKILLS;\n    newSkillId = nextUnlockable(input.evidenceBySkill, preferredSkills, input.allowOptionalNew ?? false, input.guidedPhaseAccess, input.validatedEntryPhases)?.id;\n    if (!newSkillId && input.preferredNewPhase) {\n      newSkillId = nextUnlockable(input.evidenceBySkill, SKILLS, input.allowOptionalNew ?? false, input.guidedPhaseAccess, input.validatedEntryPhases)?.id;\n    }\n    if (!newSkillId) reasonNoNewSkill = "nothing-unlocked";'''
t = replace_once(t, old, new, "planner preferred phase selection")
p.write_text(t)

# Tutor service sends the latest placement target as the preferred new phase.
p = Path("src/service/tutor.ts")
t = p.read_text()
old = '''    const validatedEntryPhases = guided ? phaseProgress.filter((x) => Boolean(x.validatedEntryAt)).map((x) => x.phase) : undefined;\n    return planSession({ evidenceBySkill, dueReviews, acquiringSkillIds, nowIso: now.toISOString(), guidedPhaseAccess, validatedEntryPhases });'''
new = '''    const validatedEntryPhases = guided ? phaseProgress.filter((x) => Boolean(x.validatedEntryAt)).map((x) => x.phase) : undefined;\n    const preferredNewPhase = validatedEntryPhases?.length ? Math.max(...validatedEntryPhases) : undefined;\n    return planSession({ evidenceBySkill, dueReviews, acquiringSkillIds, nowIso: now.toISOString(), guidedPhaseAccess, validatedEntryPhases, preferredNewPhase });'''
t = replace_once(t, old, new, "service placement preference")
p.write_text(t)

# Ensure assessment state clears when the normal UI/session is reset.
p = Path("web/app.js")
t = p.read_text()
t = replace_once(t,
'''  state.manualStudy = null;\n}''',
'''  state.manualStudy = null;\n  state.assessment = null;\n}''',
"assessment reset")
p.write_text(t)

# Add compact UI styling for checkpoint/placement screens.
p = Path("web/styles.css")
t = p.read_text()
css = r'''

/* PHASE_CHECKPOINTS_2026 */
.assessment-card,
.locked-phase-panel,
.assessment-question,
.assessment-results {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.assessment-card { margin-top: 14px; padding: 18px; display: grid; gap: 12px; }
.assessment-card > div { display: grid; gap: 4px; }
.assessment-card > div > span,
.assessment-competency { color: var(--accent); font-size: .74rem; font-weight: 760; }
.assessment-card strong { display: inline-flex; align-items: center; gap: 7px; font-size: 1rem; }
.assessment-card p { margin: 0; color: var(--muted); line-height: 1.5; font-size: .82rem; }
.assessment-card.passed { border-color: rgba(114,214,161,.22); background: var(--success-soft); }
.assessment-card.passed > div > span,
.assessment-card.passed strong { color: var(--success); }
.locked-phase-panel { padding: 26px 20px; text-align: center; display: grid; justify-items: center; gap: 12px; }
.locked-phase-panel > .ui-icon { color: var(--accent); margin-bottom: 3px; }
.locked-phase-panel h1 { margin: 0; font-size: 1.45rem; letter-spacing: -.03em; }
.locked-phase-panel p { margin: 0 0 6px; max-width: 36ch; color: var(--muted); line-height: 1.55; }
.locked-phase-panel .primary,
.locked-phase-panel .secondary { max-width: 360px; }
.assessment-question { padding: 20px; display: grid; gap: 16px; }
.assessment-question .prompt { margin: 0; font-size: clamp(1.25rem, 5.5vw, 1.65rem); line-height: 1.3; letter-spacing: -.02em; }
.assessment-results { padding: 22px; display: grid; gap: 16px; }
.assessment-results h1 { margin: 0; font-size: 1.45rem; letter-spacing: -.03em; }
.result-columns { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
.result-columns > div { padding: 14px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-2); }
.result-columns strong { font-size: .8rem; }
.result-columns ul { margin: 9px 0 0; padding-left: 18px; color: var(--muted); font-size: .78rem; line-height: 1.55; }
@media (max-width: 480px) {
  .result-columns { grid-template-columns: 1fr; }
  .assessment-question, .assessment-results { padding: 17px; }
}
'''
if "/* PHASE_CHECKPOINTS_2026 */" not in t:
    t += css
p.write_text(t)
print("Phase checkpoint integration finalized")
