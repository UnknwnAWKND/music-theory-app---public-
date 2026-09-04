from pathlib import Path

APP = Path("web/app.js")
text = APP.read_text()


def replace_section(source: str, start_marker: str, end_marker: str, replacement: str) -> str:
    start = source.index(start_marker)
    end = source.index(end_marker, start)
    return source[:start] + replacement + source[end:]


# Core helpers used by the v0.9 curriculum UI.
if "practiceRoundPlan," not in text:
    text = text.replace(
        "  recommendStartingPhase,\n} from \"./core/index.js\";",
        "  recommendStartingPhase,\n  phaseCoreReady,\n  practiceRoundPlan,\n} from \"./core/index.js\";",
        1,
    )

if "round: null," not in text:
    text = text.replace("  assessment: null,\n};", "  assessment: null,\n  round: null,\n};", 1)

# The visible phase map must match the redesigned competency graph.
phase_titles = '''const PHASE_TITLES = Object.freeze({
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

'''
text = replace_section(text, "const PHASE_TITLES = Object.freeze({", "const PHASE_INTROS = Object.freeze({", phase_titles)

phase_intros = '''const PHASE_INTROS = Object.freeze({
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

'''
text = replace_section(text, "const PHASE_INTROS = Object.freeze({", "const NEW_WORD_CARDS = Object.freeze({", phase_intros)

# The first visible interval lesson is now the 3rd/8ve subset, so introduce the word there.
if '"interval.number-3-8"' not in text[text.index("const NEW_WORD_CARDS"):text.index("function evidenceReady")]:
    text = text.replace(
        "const NEW_WORD_CARDS = Object.freeze({\n",
        'const NEW_WORD_CARDS = Object.freeze({\n  "interval.number-3-8": [["Interval", "The distance between two notes, counted by note letters first.", "C to E is a 3rd because C–D–E uses three letter names."]],\n',
        1,
    )

# Safely migrate old checkpoint/placement progress. Old rows stay stored, but they only
# unlock redesigned material when current underlying skill evidence genuinely supports it.
guided_block = '''function checkpointAccessValid(phase, row, readyIds) {
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

'''
text = replace_section(text, "function guidedPhaseAllowed(", "function curriculumAccessAllowed(", guided_block)
text = text.replace("  if (!guidedPhaseAllowed(skill.phase, phaseProgress)) return false;", "  if (!guidedPhaseAllowed(skill.phase, phaseProgress, readyIds)) return false;")
text = text.replace("  const validatedEntry = Boolean(phaseProgress.get(skill.phase)?.validatedEntryAt);", "  const validatedEntry = placementAccessValid(skill.phase, phaseProgress.get(skill.phase), readyIds);")
text = text.replace("  const canOpen = guidedPhaseAllowed(phase, phaseProgress) &&", "  const canOpen = guidedPhaseAllowed(phase, phaseProgress, readyIds) &&")

# New checkpoint/placement summaries are versioned. Legacy evidence is not deleted.
text = text.replace("checkpointSummary: evaluation,", 'checkpointSummary: { ...evaluation, curriculumVersion: "v0.9" },')
text = text.replace("placementSummary: evaluation,", 'placementSummary: { ...evaluation, curriculumVersion: "v0.9" },')

# Round state is per skill. A round has a fixed learner-visible count, while mastery remains adaptive.
round_helpers = '''function startPracticeRound(item, followUp = false) {
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

'''
if "function startPracticeRound(" not in text:
    text = text.replace("async function beginItem() {", round_helpers + "async function beginItem() {", 1)

begin_item = '''async function beginItem() {
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

'''
text = replace_section(text, "async function beginItem() {", "function notePitchClass(", begin_item)

render_practice = '''function renderPractice() {
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

'''
text = replace_section(text, "function renderPractice() {", "function actionButtons(item) {", render_practice)

round_complete = '''function renderRoundComplete(item, followUp = false) {
  const skill = SKILL_BY_ID.get(item.skillId);
  const round = state.round;
  const title = followUp ? "One more short round" : "Round complete";
  const copy = followUp
    ? "The evidence shows this relationship needs a little more work. The next round is short and targeted."
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

'''
if "function renderRoundComplete(" not in text:
    text = text.replace("async function afterFeedback(item) {", round_complete + "async function afterFeedback(item) {", 1)

after_feedback = '''async function afterFeedback(item) {
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

'''
text = replace_section(text, "async function afterFeedback(item) {", "async function maybeAppendFastPath()", after_feedback)

# Reset round state when moving to a different skill/session.
text = text.replace("  state.itemIndex = 0;\n  state.fastPathPasses = 0;\n  await renderToday();", "  state.itemIndex = 0;\n  state.fastPathPasses = 0;\n  state.round = null;\n  await renderToday();")
text = text.replace("  const item = state.queue[state.itemIndex];\n  state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);\n  state.itemIndex += 1;", "  const item = state.queue[state.itemIndex];\n  state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);\n  state.itemIndex += 1;\n  state.round = null;")

# Mark the transformed file for QA/audit tests.
if "// CURRICULUM_V09_ROUNDS" not in text:
    text = "// CURRICULUM_V09_ROUNDS\n" + text

APP.write_text(text)
