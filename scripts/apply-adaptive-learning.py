from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise RuntimeError(f"Could not locate {label}")
    return text.replace(old, new, 1)

# --- learning evidence: READY is current evidence, not an early sticky subset ---
path = Path("src/learning/evidence.ts")
text = path.read_text()
old = '''  const cleanCorrect = attempts.filter((x) => !isLegacy(x)\n    && x.context !== "review"\n    && isCleanFirstResponse(x)\n    && x.outcome === "correct");\n\n  const qualifies = (subset: readonly LearningAttempt[]): ReadinessBasis => {'''
new = '''  const cleanCorrect = attempts.filter((x) => !isLegacy(x)\n    && x.context !== "review"\n    && isCleanFirstResponse(x)\n    && x.outcome === "correct");\n\n  // READY is a current teaching decision, not a permanent reward for an early streak.\n  // A later independent acquisition miss leaves the skill acquiring until the learner\n  // repairs it with a later clean retrieval. Historical successes remain in the log.\n  const lastCurrentAcquisition = [...attempts].reverse().find((x) => !isLegacy(x)\n    && x.context === "acquisition"\n    && isCleanFirstResponse(x));\n  if (lastCurrentAcquisition?.outcome === "incorrect") {\n    return { ready: false, basis: "none" };\n  }\n\n  const qualifies = (subset: readonly LearningAttempt[]): ReadinessBasis => {'''
text = replace_once(text, old, new, "current readiness guard")
path.write_text(text)

# --- session planning: overdue recovery + confusion-driven interleaving + caught-up state ---
path = Path("src/session/planner.ts")
text = path.read_text()
text = replace_once(
    text,
    'import type { DerivedSkillEvidence } from "../learning/index.js";\n',
    'import type { DerivedSkillEvidence } from "../learning/index.js";\nimport { interleavingTargets } from "../practice/adaptive.js";\n',
    "planner adaptive import",
)
text = replace_once(
    text,
    '''  /** Optional/enrichment skills are only auto-introduced when explicitly enabled. */\n  allowOptionalNew?: boolean;\n}''',
    '''  /** Optional/enrichment skills are only auto-introduced when explicitly enabled. */\n  allowOptionalNew?: boolean;\n  /** Used to detect a genuinely overdue recovery period without resetting progress. */\n  nowIso?: string;\n  longBreakDays?: number;\n}''',
    "planner input fields",
)
text = replace_once(
    text,
    '''  acquiringSkillId?: string;\n  newSkillId?: string;\n  reasonNoNewSkill?: string;\n}''',
    '''  acquiringSkillId?: string;\n  newSkillId?: string;\n  interleaveSkillIds: string[];\n  reasonNoNewSkill?: string;\n}''',
    "planner output fields",
)
text = replace_once(
    text,
    '''  const budget = sortedDue.length > normalBudget * 2 ? backlogBudget : normalBudget;\n  const reviewSkillIds = sortedDue.slice(0, budget).map((x) => x.skillId);\n\n  const acquiringSkillId''',
    '''  const budget = sortedDue.length > normalBudget * 2 ? backlogBudget : normalBudget;\n  const reviewSkillIds = sortedDue.slice(0, budget).map((x) => x.skillId);\n  const nowMs = Date.parse(input.nowIso ?? new Date().toISOString());\n  const longBreakMs = (input.longBreakDays ?? 14) * 86_400_000;\n  const recoveringFromLongBreak = sortedDue.some((review) => nowMs - Date.parse(review.dueAt) >= longBreakMs);\n\n  const acquiringSkillId''',
    "long break detection",
)
text = replace_once(
    text,
    '''  if (repairSkillIds.length > 0) {\n    reasonNoNewSkill = "repair-prerequisite";\n  } else if (sortedDue.length > backlogBudget) {\n    reasonNoNewSkill = "review-backlog";\n  } else if (acquiringSkillId) {''',
    '''  if (repairSkillIds.length > 0) {\n    reasonNoNewSkill = "repair-prerequisite";\n  } else if (recoveringFromLongBreak) {\n    reasonNoNewSkill = "long-break-recovery";\n  } else if (sortedDue.length > backlogBudget) {\n    reasonNoNewSkill = "review-backlog";\n  } else if (acquiringSkillId) {''',
    "planner long break priority",
)
text = replace_once(
    text,
    '''  return { repairSkillIds, reviewSkillIds, acquiringSkillId, newSkillId, reasonNoNewSkill };''',
    '''  const alreadyPlanned = new Set([\n    ...repairSkillIds,\n    ...reviewSkillIds,\n    acquiringSkillId,\n    newSkillId,\n  ].filter((x): x is string => Boolean(x)));\n  const interleaveSkillIds = repairSkillIds.length || recoveringFromLongBreak || sortedDue.length > backlogBudget\n    ? []\n    : interleavingTargets(input.evidenceBySkill).filter((id) => !alreadyPlanned.has(id)).slice(0, 2);\n\n  return { repairSkillIds, reviewSkillIds, acquiringSkillId, newSkillId, interleaveSkillIds, reasonNoNewSkill };''',
    "planner interleaving output",
)
path.write_text(text)

# --- service passes the actual planning time into long-break logic ---
path = Path("src/service/tutor.ts")
text = path.read_text()
text = replace_once(
    text,
    '    return planSession({ evidenceBySkill, dueReviews, acquiringSkillIds });',
    '    return planSession({ evidenceBySkill, dueReviews, acquiringSkillIds, nowIso: now.toISOString() });',
    "service planner time",
)
path.write_text(text)

# --- browser teaching loop: adaptive question selection, hints, fading, repair, interleaving ---
path = Path("web/app.js")
text = path.read_text()
text = replace_once(
    text,
    '''  lessonForSkill,\n  nextAcquisitionAction,\n} from "./core/index.js";''',
    '''  lessonForSkill,\n  decideAdaptivePractice,\n  inferredConfusionPartner,\n  selectAdaptiveExercise,\n} from "./core/index.js";''',
    "browser adaptive imports",
)
text = replace_once(
    text,
    '''  guidanceForNext: "none",\n  submitted: false,''',
    '''  guidanceForNext: "none",\n  hintShown: false,\n  submitted: false,''',
    "browser hint state",
)
text = replace_once(
    text,
    '''  plan.reviewSkillIds.forEach((id) => add(id, "review"));\n  add(plan.acquiringSkillId, "acquisition");\n  add(plan.newSkillId, "new");''',
    '''  plan.reviewSkillIds.forEach((id) => add(id, "review"));\n  add(plan.acquiringSkillId, "acquisition");\n  add(plan.newSkillId, "new");\n  (plan.interleaveSkillIds ?? []).forEach((id) => add(id, "interleave"));''',
    "browser interleave queue",
)
text = replace_once(
    text,
    '''  if (plan.newSkillId) parts.push("1 new skill");\n  return parts.length ? parts.join(" · ") : "Nothing meaningful is due";''',
    '''  if (plan.newSkillId) parts.push("1 new skill");\n  if (plan.interleaveSkillIds?.length) parts.push(`${plan.interleaveSkillIds.length} mixed practice`);\n  return parts.length ? parts.join(" · ") : "Nothing meaningful is due";''',
    "browser plan count interleave",
)
text = replace_once(
    text,
    '''  state.selectedChoice = "";\n  const item = state.queue[state.itemIndex];''',
    '''  state.selectedChoice = "";\n  state.hintShown = false;\n  const item = state.queue[state.itemIndex];''',
    "reset hint per item",
)
text = replace_once(
    text,
    '''async function loadExercise(item) {\n  const current = state.exerciseIndex.get(item.skillId) ?? 0;\n  state.currentExercise = exerciseForSkill(item.skillId, current);\n  state.currentSpec = answerSpecForExercise(state.currentExercise);''',
    '''async function loadExercise(item) {\n  const current = state.exerciseIndex.get(item.skillId) ?? 0;\n  const attempts = await repo.attemptsForSkill(USER_ID, item.skillId);\n  const selected = selectAdaptiveExercise(item.skillId, attempts, current, 12);\n  state.currentExercise = selected.exercise;\n  state.exerciseIndex.set(item.skillId, selected.index);\n  state.currentSpec = answerSpecForExercise(state.currentExercise);''',
    "adaptive exercise loading",
)
text = replace_once(
    text,
    '''function actionButtons(item) {\n  if (state.submitted) return `<button class="primary" id="continueBtn">Continue</button>`;\n  if (state.currentSpec.kind === "self-check") {\n    return `<div class="self-check-actions"><button class="primary" id="selfYes">I did it correctly</button><button class="secondary" id="selfNo">Not yet</button></div>`;\n  }\n  return `<button class="primary" id="submitBtn">Check answer</button>`;\n}''',
    '''function actionButtons(item) {\n  if (state.submitted) return `<button class="primary" id="continueBtn">Continue</button>`;\n  if (state.currentSpec.kind === "self-check") {\n    return `<div class="self-check-actions"><button class="primary" id="selfYes">I did it correctly</button><button class="secondary" id="selfNo">Not yet</button></div>`;\n  }\n  return `<div class="answer-actions"><button class="secondary" id="hintBtn" type="button" ${state.hintShown ? "disabled" : ""}>${state.hintShown ? "Hint used" : "Need a hint?"}</button><button class="primary" id="submitBtn">Check answer</button></div>`;\n}''',
    "hint button",
)
text = replace_once(
    text,
    '''  document.querySelector("#submitBtn")?.addEventListener("click", () => submitObjective(item));''',
    '''  document.querySelector("#hintBtn")?.addEventListener("click", () => useHint(item));\n  document.querySelector("#submitBtn")?.addEventListener("click", () => submitObjective(item));''',
    "hint handler binding",
)
text = replace_once(
    text,
    '''function activeGuidance() {\n  if (state.supportedNext) return "explanation";\n  return state.guidanceForNext || "none";\n}\n\nasync function submitObjective(item) {''',
    '''function activeGuidance() {\n  if (state.hintShown) return "hint";\n  if (state.supportedNext) return "explanation";\n  return state.guidanceForNext || "none";\n}\n\nasync function useHint(item) {\n  if (state.hintShown || state.submitted) return;\n  state.hintShown = true;\n  const lesson = lessonForSkill(item.skillId);\n  const context = item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : item.kind === "interleave" ? "transfer" : "acquisition";\n  await service.submitAttempt({\n    userId: USER_ID,\n    skillId: item.skillId,\n    sessionId: state.session.sessionId,\n    promptSignature: state.currentExercise.id,\n    occurredAt: new Date().toISOString(),\n    outcome: "hinted",\n    independent: false,\n    directEvidence: false,\n    context,\n    coldProbe: false,\n    evidenceSource: "objective",\n    eventKind: "hint",\n    guidance: "hint",\n    solutionSeen: false,\n    exampleSignature: exampleSignatureForExercise(state.currentExercise),\n    exampleAttributes: evidenceAttributesForExercise(state.currentExercise),\n    evidenceVersion: "v2",\n    metadata: { hint: lesson.rule || lesson.summary },\n  });\n  renderPractice();\n}\n\nasync function submitObjective(item) {''',
    "hint learning event",
)
text = replace_once(
    text,
    '''  const context = item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : "acquisition";''',
    '''  const context = item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : item.kind === "interleave" ? "transfer" : "acquisition";''',
    "objective transfer context",
)
# There is a second equivalent context expression in self-check. Replace it too if still present.
text = text.replace(
    '    context: item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : "acquisition",',
    '    context: item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : item.kind === "interleave" ? "transfer" : "acquisition",',
)
text = replace_once(
    text,
    '''    exampleAttributes,\n    evidenceVersion: "v2",''',
    '''    exampleAttributes,\n    confusionWith: assessment.correct ? undefined : inferredConfusionPartner(item.skillId, answer),\n    evidenceVersion: "v2",''',
    "confusion evidence",
)
text = replace_once(
    text,
    '''      ${state.supportedNext ? `<div class="practice-note"><strong>Quick retry</strong><span>Use the example if you need it. This one is practice, not a mastery check.</span></div>` : ""}\n      <div class="prompt">${esc(e.prompt)}</div>''',
    '''      ${state.supportedNext ? `<div class="practice-note"><strong>Quick retry</strong><span>Use the example if you need it. This one is practice, not a mastery check.</span></div>` : ""}\n      ${state.hintShown ? `<div class="practice-note"><strong>Hint</strong><span>${esc(lessonForSkill(item.skillId).rule || lessonForSkill(item.skillId).summary)}</span></div>` : ""}\n      <div class="prompt">${esc(e.prompt)}</div>''',
    "hint display",
)
old_after = '''async function afterFeedback(item) {\n  const evidence = state.feedback?.evidence;\n  if (item.kind === "review" || item.kind === "repair") {\n    if (!state.feedback?.correct) {\n      const alreadyQueued = state.queue.slice(state.itemIndex + 1).some((x) => x.skillId === item.skillId && x.kind === "review-repair");\n      if (!alreadyQueued) state.queue.push({ skillId: item.skillId, kind: "review-repair", firstProbe: false });\n    }\n    return advanceItem();\n  }\n  if (item.kind === "review-repair") return advanceItem();\n  if (evidence?.ready) return advanceItem();\n  if (state.supportedNext) {\n    state.stoppedSkillIds.add(item.skillId);\n    state.supportedNext = false;\n    return advanceItem();\n  }\n\n  const attempts = await repo.attemptsForSkill(USER_ID, item.skillId);\n  const action = nextAcquisitionAction(attempts);\n  if (action === "stop-unit-for-now") {\n    state.stoppedSkillIds.add(item.skillId);\n    return advanceItem();\n  }\n  state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);\n  if (action === "scaffold-and-retry") {\n    state.supportedNext = true;\n    return renderLessonStep(item, "Quick repair");\n  }\n  state.supportedNext = false;\n  state.lessonVisible = false;\n  await loadExercise(item);\n}'''
new_after = '''async function afterFeedback(item) {\n  const evidence = state.feedback?.evidence;\n  if (item.kind === "review" || item.kind === "repair") {\n    if (!state.feedback?.correct) {\n      const alreadyQueued = state.queue.slice(state.itemIndex + 1).some((x) => x.skillId === item.skillId && x.kind === "review-repair");\n      if (!alreadyQueued) state.queue.push({ skillId: item.skillId, kind: "review-repair", firstProbe: false });\n    }\n    return advanceItem();\n  }\n  if (item.kind === "interleave") return advanceItem();\n  if (item.kind === "review-repair") {\n    if (state.supportedNext && state.feedback?.correct) {\n      state.supportedNext = false;\n      state.guidanceForNext = "none";\n      state.hintShown = false;\n      state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);\n      return loadExercise(item);\n    }\n    return advanceItem();\n  }\n  if (evidence?.ready) return advanceItem();\n\n  const attempts = await repo.attemptsForSkill(USER_ID, item.skillId);\n  const decision = decideAdaptivePractice(attempts, evidence);\n  if (decision.action === "stop-for-now") {\n    state.stoppedSkillIds.add(item.skillId);\n    return advanceItem();\n  }\n  state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);\n  state.hintShown = false;\n  if (decision.action === "reteach") {\n    state.supportedNext = true;\n    return renderLessonStep(item, "Quick repair");\n  }\n  state.supportedNext = false;\n  state.guidanceForNext = "none";\n  state.lessonVisible = false;\n  await loadExercise(item);\n}'''
text = replace_once(text, old_after, new_after, "adaptive after-feedback flow")
path.write_text(text)

# Clean the small internal ranking implementation in adaptive.ts if this is the first Prompt 2 run.
path = Path("src/practice/adaptive.ts")
text = path.read_text()
old = '''  const candidates: AdaptiveExerciseSelection[] = [];'''
new = '''  const candidates: Array<AdaptiveExerciseSelection & { score: number }> = [];'''
text = replace_once(text, old, new, "adaptive candidate score type")
text = text.replace('''    candidates.push({\n      exercise,\n      index,\n      semanticSignature,\n      reason: !seenSemantic.has(semanticSignature) ? "unseen-example" : !recentPromptIds.includes(exercise.id) ? "avoid-recent-duplicate" : "best-available",\n      ...( { score } as object ),\n    } as AdaptiveExerciseSelection & { score: number });''', '''    candidates.push({\n      exercise,\n      index,\n      semanticSignature,\n      reason: !seenSemantic.has(semanticSignature) ? "unseen-example" : !recentPromptIds.includes(exercise.id) ? "avoid-recent-duplicate" : "best-available",\n      score,\n    });''')
text = text.replace('''  return [...candidates]\n    .map((x) => x as AdaptiveExerciseSelection & { score: number })\n    .sort((a, b) => b.score - a.score || a.index - b.index)[0];''', '''  const selected = [...candidates].sort((a, b) => b.score - a.score || a.index - b.index)[0];\n  return {\n    exercise: selected.exercise,\n    index: selected.index,\n    semanticSignature: selected.semanticSignature,\n    reason: selected.reason,\n  };''')
path.write_text(text)

print("Adaptive learning engine transform applied")
