from pathlib import Path


def replace_required(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing anchor for {label}")
    return text.replace(old, new, 1)


def remove_if_present(text: str, value: str) -> str:
    return text.replace(value, "")


# ---------- Remove the actual Phase 0 curriculum nodes and their prerequisite edges ----------
skills_path = Path("src/curriculum/skills.ts")
skills = skills_path.read_text()
skills = remove_if_present(skills, '  // Entry / foundations\n')
skills = remove_if_present(skills, '  s("pitch.accidentals", 0, "Sharps, flats, and enharmonic spellings", [], ["identify", "diagnose"], ["pitch", "spelling"]),\n')
skills = remove_if_present(skills, '  s("pitch.half-whole", 0, "Half steps and whole steps", [], ["construct", "identify"], ["pitch"]),\n\n')
for token in ('"pitch.accidentals", ', ', "pitch.accidentals"', '"pitch.half-whole", ', ', "pitch.half-whole"'):
    skills = skills.replace(token, "")
if '"pitch.accidentals"' in skills or '"pitch.half-whole"' in skills or ', 0,' in skills:
    raise RuntimeError("Phase 0 skill or prerequisite survived curriculum transform")
skills_path.write_text(skills)

# ---------- Remove retired Phase 0 exercise and lesson mappings ----------
catalog_path = Path("src/exercises/catalog.ts")
catalog = catalog_path.read_text()
if "function pitchExercise(" in catalog:
    start = catalog.index("function pitchExercise(")
    end = catalog.index("function intervalExercise(", start)
    catalog = catalog[:start] + catalog[end:]
catalog = catalog.replace('  if (skillId.startsWith("pitch.")) return pitchExercise(skillId,index);\n', "")
if "pitchExercise(" in catalog or 'skillId.startsWith("pitch.")' in catalog:
    raise RuntimeError("Retired Phase 0 exercise routing survived")
catalog_path.write_text(catalog)

lessons_path = Path("src/practice/lessons.ts")
lessons = lessons_path.read_text()
lessons = remove_if_present(lessons, '    "pitch.accidentals": { summary: "Sometimes the same piano key has two different note names.", rule: "The name can change even when the piano key does not.", workedExample: "C♯ and D♭ are the same black key on the piano." },\n')
lessons = remove_if_present(lessons, '    "pitch.half-whole": { summary: "Half steps and whole steps measure distance between notes.", rule: "Half step = one piano key to the next. Whole step = two half steps.", workedExample: "E→F is a half step. F→G is a whole step." },\n')
if '"pitch.accidentals"' in lessons or '"pitch.half-whole"' in lessons:
    raise RuntimeError("Retired Phase 0 lesson mapping survived")
lessons_path.write_text(lessons)

# ---------- Browser evidence capture + Phase 0 UI removal ----------
app_path = Path("web/app.js")
app = app_path.read_text()
app = remove_if_present(app, '  0: "Foundations",\n')
app = remove_if_present(app, '  0: ["This phase is about note names that share the same piano key.", "You will learn when one sound can have more than one correct name."],\n')
app = remove_if_present(app, '  "pitch.accidentals": [["Enharmonic", "Two note names that use the same piano key and make the same sound.", "C♯ and D♭ are enharmonic. They are two names for the same black key."]],\n')
app = app.replace(
    '  "interval.generic-number": [["Interval", "The distance between two notes.", "C to E is an interval."]],',
    '  "interval.generic-number": [["Interval", "The distance between two notes.", "C to E is an interval."], ["Accidental", "A sharp or flat attached to a note name.", "F♯ means F sharp. B♭ means B flat."], ["Enharmonic", "Two note names that use the same piano key and make the same sound.", "C♯ and D♭ are enharmonic names for the same black key."]],',
)
app = app.replace(
    '  "interval.quality-system": [["Quality", "The word that tells you the exact size of an interval.", "A 3rd can be major or minor. Major and minor are qualities."]],',
    '  "interval.quality-system": [["Half step", "The distance from one piano key to the very next key.", "E to F is one half step."], ["Whole step", "Two half steps.", "F to G is one whole step."], ["Quality", "The word that tells you the exact size of an interval.", "A 3rd can be major or minor. Major and minor are qualities."]],',
)
app = app.replace(
    '  const summaries = Array.from({ length: 13 }, (_, phase) => phaseSummary(phase, byId, readyIds));',
    '  const summaries = Array.from({ length: 12 }, (_, index) => phaseSummary(index + 1, byId, readyIds));',
)
app = app.replace('    curriculumVersion: "v0.7",', '    curriculumVersion: "v0.8",')

if 'guidanceForNext:' not in app:
    app = app.replace('  supportedNext: false,\n', '  supportedNext: false,\n  guidanceForNext: "none",\n', 1)

# Every instructional lesson is explicitly recorded as a learning event. The next response is supported,
# not treated as cold/independent mastery evidence.
old_lesson_click = '''    state.lessonVisible = false;
    if (item.kind === "review-repair") state.supportedNext = true;
    await loadExercise(item);'''
new_lesson_click = '''    state.lessonVisible = false;
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
      context: item.kind === "review" || item.kind === "repair" || item.kind === "review-repair" ? "review" : "acquisition",
      eventKind: "explanation",
      guidance: "explanation",
      solutionSeen: false,
      evidenceSource: "objective",
      evidenceVersion: "v2",
      metadata: { lessonExposure: true },
    });
    await loadExercise(item);'''
if old_lesson_click in app:
    app = app.replace(old_lesson_click, new_lesson_click, 1)

helper_anchor = 'async function submitObjective(item) {'
if 'function responseModeForEvidence(' not in app:
    helpers = r'''function responseModeForEvidence(spec, exercise) {
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
  if (!keys.length) return `${exercise.type}:${String(exercise.prompt).trim().toLowerCase()}`;
  const stable = Object.fromEntries(keys.map((key) => [key, attributes[key]]));
  return `${exercise.type}:${JSON.stringify(stable)}`;
}

function activeGuidance() {
  if (state.supportedNext) return "explanation";
  return state.guidanceForNext || "none";
}

'''
    if helper_anchor not in app:
        raise RuntimeError("Missing submitObjective anchor")
    app = app.replace(helper_anchor, helpers + helper_anchor, 1)

# Replace objective submission so the append-only log preserves first response + solution exposure separately.
start = app.index('async function submitObjective(item) {')
end = app.index('\nfunction diagnosticDetail(', start)
objective = r'''async function submitObjective(item) {
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
'''
app = app[:start] + objective + app[end:]

# Replace self-check submission with the same evidence vocabulary.
start = app.index('async function submitSelfCheck(item, correct) {')
end = app.index('\nasync function afterFeedback(', start)
selfcheck = r'''async function submitSelfCheck(item, correct) {
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
'''
app = app[:start] + selfcheck + app[end:]

# The old same-session '3 clean answers => append another new skill' fast path is intentionally disabled.
if 'async function cleanAcquisitionPass(item)' in app:
    start = app.index('async function cleanAcquisitionPass(item)')
    end = app.index('async function advanceItem()', start)
    app = app[:start] + 'async function maybeAppendFastPath() { return false; }\n\n' + app[end:]

# Prevent stale guidance carrying across new queue items.
app = app.replace('  state.supportedNext = false;\n  state.selectedChoice = "";', '  state.supportedNext = false;\n  state.guidanceForNext = "none";\n  state.selectedChoice = "";', 1)

for forbidden in ('Phase 0', '0: "Foundations"', '"pitch.accidentals"', '"pitch.half-whole"', 'length: 13'):
    if forbidden in app:
        raise RuntimeError(f"Genuine Phase 0 UI reference survived: {forbidden}")
app_path.write_text(app)

# ---------- Small source fixes that make this transform safe to re-run on intermediate commits ----------
evidence_path = Path("src/learning/evidence.ts")
evidence = evidence_path.read_text()
evidence = evidence.replace(
    'solutionSeen: input.solutionSeen ?? support === "answer-reveal" || kind === "answer-reveal" || input.outcome === "revealed",',
    'solutionSeen: input.solutionSeen ?? (support === "answer-reveal" || kind === "answer-reveal" || input.outcome === "revealed"),',
)
evidence = evidence.replace(
    'if (latest.outcome === "correct" && guidance(latest) === "none") return "continue-independent";\n  if (guidance(latest) !== "none" || latest.outcome === "hinted" || latest.outcome === "revealed") return "scaffold-and-retry";',
    'if (latest.outcome === "correct") return "continue-independent";\n  if (guidance(latest) !== "none" || latest.outcome === "hinted" || latest.outcome === "revealed") return "scaffold-and-retry";',
)
evidence_path.write_text(evidence)

print("Learning engine foundation transform applied")
