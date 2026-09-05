function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Block 5 app transform could not find ${label}`);
  return source.replace(from, to);
}

export function transformBlock5App(input) {
  let source = String(input);

  source = replaceRequired(source, "  BrowserStorageTutorRepository,", "  BrowserStorageTutorRepository,\n  analyzeStructuredProgression,", "harmony analyzer import");
  source = replaceRequired(
    source,
    'import { pianoVisual } from "./theory-visuals.js";',
    'import { pianoVisual } from "./theory-visuals.js";\nimport { bindPhase4ProgressionLab, phase4ProgressionLabHtml } from "./phase4-ui.js";',
    "phase4 UI import",
  );

  source = replaceRequired(
    source,
    '<p>Phases 1–3 — Intervals, Major Scales, and Minor Scales are ready.</p>',
    '<p>Phases 1–4 — Intervals, Major Scales, Minor Scales, and Diatonic Chords / Roman Numerals are ready.</p>',
    "auth phase copy",
  );

  source = replaceRequired(
    source,
    "  const phase3Passed = checkpointPassed(progress, 3);\n  const focusPhase = !phase1Passed ? 1 : !phase2Passed ? 2 : 3;",
    "  const phase3Passed = checkpointPassed(progress, 3);\n  const phase4Passed = checkpointPassed(progress, 4);\n  const focusPhase = !phase1Passed ? 1 : !phase2Passed ? 2 : !phase3Passed ? 3 : 4;",
    "home focus phase",
  );

  source = replaceRequired(
    source,
    '  const focusCopy = focusPhase === 1\n    ? "Build interval recall until the relationships are fast, accurate, and correctly spelled."\n    : focusPhase === 2\n      ? "Build and recall all 12 major-scale pitch classes with correct theoretical spelling."\n      : phase3Passed\n        ? "Phase 3 is complete, but minor scales, major scales, and intervals continue returning in spaced review while Phase 4 remains unbuilt."\n        : "Build natural, harmonic, and classical melodic minor across all 12 pitch classes with exact spelling.";',
    '  const focusCopy = focusPhase === 1\n    ? "Build interval recall until the relationships are fast, accurate, and correctly spelled."\n    : focusPhase === 2\n      ? "Build and recall all 12 major-scale pitch classes with correct theoretical spelling."\n      : focusPhase === 3\n        ? "Build natural, harmonic, and classical melodic minor across all 12 pitch classes with exact spelling."\n        : phase4Passed\n          ? "Phase 4 is complete, but harmony, scales, and intervals continue returning in spaced review while Phase 5 remains unbuilt."\n          : "Turn scales into chords: stack thirds, derive Roman numerals, understand function, and transpose progressions.";',
    "home focus copy",
  );
  source = replaceRequired(source, '${phase3Passed ? "Review learning" : `Continue Phase ${focusPhase}`}', '${phase4Passed ? "Review learning" : `Continue Phase ${focusPhase}`}', "home continue button");

  source = replaceRequired(
    source,
    'function phaseIntro(phase) {\n  if (phase === 1) return "Intervals are foundational. READY lets you move forward; interval practice continues afterward until recall becomes durable.";\n  if (phase === 2) return "Major scales are a major foundation. Learn the construction system, then move toward fast recall across all 12 pitch classes without letting interval fluency disappear.";\n  return "Minor scales build directly on intervals and major-scale construction. Learn the natural form first, then understand exactly why harmonic and classical melodic minor alter specific degrees.";\n}',
    'function phaseIntro(phase) {\n  if (phase === 1) return "Intervals are foundational. READY lets you move forward; interval practice continues afterward until recall becomes durable.";\n  if (phase === 2) return "Major scales are a major foundation. Learn the construction system, then move toward fast recall across all 12 pitch classes without letting interval fluency disappear.";\n  if (phase === 3) return "Minor scales build directly on intervals and major-scale construction. Learn the natural form first, then understand exactly why harmonic and classical melodic minor alter specific degrees.";\n  return "Diatonic harmony turns the scales you already know into chords. Derive the system first, then make the most useful Roman-numeral relationships fast and practical.";\n}',
    "phase intro",
  );

  source = replaceRequired(
    source,
    '  if (indexInPhase === 0) return "Natural-minor formula + interval connection";\n  if (indexInPhase === 1) return "All 12 roots + exact spelling";\n  if (indexInPhase === 2) return "Raised 7, leading tone + augmented 2nd";\n  if (indexInPhase === 3) return "Classical melodic minor up and down";\n  return "Distributed recall across all minor forms";',
    '  if (skill.phase === 3) {\n    if (indexInPhase === 0) return "Natural-minor formula + interval connection";\n    if (indexInPhase === 1) return "All 12 roots + exact spelling";\n    if (indexInPhase === 2) return "Raised 7, leading tone + augmented 2nd";\n    if (indexInPhase === 3) return "Classical melodic minor up and down";\n    return "Distributed recall across all minor forms";\n  }\n  if (indexInPhase === 0) return "Stack scale-tone 3rds into triads";\n  if (indexInPhase === 1) return "I ii iii IV V vi vii° — derive, then recall";\n  if (indexInPhase === 2) return "Natural-minor triads + Roman numerals";\n  if (indexInPhase === 3) return "Raised 7 changes V, III and vii°";\n  if (indexInPhase === 4) return "Ascending melodic-minor harmony — moderate priority";\n  if (indexInPhase === 5) return "Stack one more 3rd for seventh chords";\n  if (indexInPhase === 6) return "REFERENCE · lookup only · no mastery quiz";\n  if (indexInPhase === 7) return "Tonic, predominant/subdominant, dominant";\n  if (indexInPhase === 8) return "Portable progression vocabulary + transposition";\n  return "Structured analysis of your own progressions";',
    "lesson subcopy",
  );

  source = replaceRequired(
    source,
    '  if (phase === 2) return "Formula understanding, scale construction, exact spelling, scale degrees, varied keys, and instant recall.";\n  return "Natural-minor construction, harmonic and melodic alterations, exact spelling, form discrimination, leading tone, augmented 2nd, and varied keys.";',
    '  if (phase === 2) return "Formula understanding, scale construction, exact spelling, scale degrees, varied keys, and instant recall.";\n  if (phase === 3) return "Natural-minor construction, harmonic and melodic alterations, exact spelling, form discrimination, leading tone, augmented 2nd, and varied keys.";\n  return "Stacked thirds, major/minor triads, seventh chords, Roman numerals, chord function, exact spelling, and progression application.";',
    "checkpoint copy",
  );

  source = replaceRequired(source, "const activeSections = [1, 2, 3].map((phase) => {", "const activeSections = [1, 2, 3, 4].map((phase) => {", "active phase list");
  source = replaceRequired(source, "    const skills = phaseSkills(phase);", "    const skills = phaseSkills(phase);\n    const requiredSkillCount = skills.filter((skill) => !skill.optional && skill.assessed && skill.blocksPhaseCompletion).length;", "required skill count");
  source = replaceRequired(source, "      const status = statusFor(bySkill.get(skill.id));", '      const status = skill.contentKind === "reference" ? { label: "REFERENCE", cls: "learning" } : statusFor(bySkill.get(skill.id));', "reference status");
  source = replaceRequired(source, '`Become READY on all ${skills.length} lessons first`', '`Become READY on all ${requiredSkillCount} assessed lessons first`', "checkpoint ready count");
  source = replaceRequired(
    source,
    'phase === 1 ? "Representative interval check" : phase === 2 ? "Representative major-scale check" : "Representative minor-scale check"',
    'phase === 1 ? "Representative interval check" : phase === 2 ? "Representative major-scale check" : phase === 3 ? "Representative minor-scale check" : "Representative harmony check"',
    "checkpoint title",
  );
  source = replaceRequired(source, "CURRICULUM_PHASES.filter((phase) => phase.phase >= 4)", "CURRICULUM_PHASES.filter((phase) => phase.phase >= 5)", "future phase boundary");

  source = replaceRequired(
    source,
    "  const siblings = phaseSkills(skill.phase);\n  const previous = siblings[indexInPhase - 1];",
    "  const siblings = phaseSkills(skill.phase);\n  const previous = [...siblings.slice(0, indexInPhase)].reverse().find((item) => item.blocksPhaseCompletion !== false && item.assessed !== false);",
    "reference non-blocking unlock",
  );

  source = replaceRequired(
    source,
    "  const html = renderTeachingStep({ lesson, openingState, stepIndex: state.teachingStep });",
    '  let html = renderTeachingStep({ lesson, openingState, stepIndex: state.teachingStep });\n  const atLastTeachingStep = state.teachingStep >= lesson.teachingSteps.length - 1;\n  if (skillId === "diatonic-chords.lesson-10-own-progressions" && atLastTeachingStep) html += phase4ProgressionLabHtml();',
    "progression lab render",
  );
  source = replaceRequired(
    source,
    '  document.querySelector("#backToLearn").onclick = () => navigate("learn");',
    '  document.querySelector("#backToLearn").onclick = () => navigate("learn");\n  const startAction = document.querySelector(\'[data-action="start-practice"]\');\n  if (skill.contentKind === "reference" && startAction) {\n    startAction.textContent = "Back to Phase 4";\n    startAction.dataset.action = "close-reference";\n    startAction.addEventListener("click", () => navigate("learn"));\n  }\n  bindPhase4ProgressionLab(analyzeStructuredProgression);',
    "reference action and progression binding",
  );

  source = replaceRequired(
    source,
    '${exercise.metadata?.crossPhaseReview ? `<div class="learning-expectation conceptual">${exercise.metadata?.reviewPhase === 2 ? "PHASE 2 MAJOR-SCALE REVIEW" : "PHASE 1 INTERVAL REVIEW"}</div>` : ""}',
    '${exercise.metadata?.crossPhaseReview ? `<div class="learning-expectation conceptual">${exercise.metadata?.reviewPhase === 3 ? "PHASE 3 MINOR-SCALE REVIEW" : exercise.metadata?.reviewPhase === 2 ? "PHASE 2 MAJOR-SCALE REVIEW" : "PHASE 1 INTERVAL REVIEW"}</div>` : ""}',
    "cross-phase review label",
  );

  source = replaceRequired(
    source,
    '      : "You demonstrated representative minor-scale competencies across multiple keys and forms. Passing the checkpoint does not mean RETAINED; minor-scale, major-scale, and interval review continue.";',
    '      : phase === 3\n        ? "You demonstrated representative minor-scale competencies across multiple keys and forms. Passing the checkpoint does not mean RETAINED; minor-scale, major-scale, and interval review continue."\n        : "You demonstrated representative diatonic-harmony competencies across keys, scale forms, chord sizes, functions, and progression applications. Passing the checkpoint does not mean RETAINED; harmony and prior foundations continue in review.";',
    "checkpoint success copy",
  );

  source = replaceRequired(source, "Phases 1–3 active", "Phases 1–4 active", "settings active phases");
  source = source.replace("// Keep the existing key so Block 4 preserves valid local progress from Phases 1–2.", "// Keep the existing key so Block 5 preserves valid local progress from Phases 1–4.");

  return source;
}

export function transformBlock5Index(input) {
  let source = replaceRequired(String(input), './app-block4.js', './app-block5.js', "Block 5 index script");
  source = replaceRequired(source, '<link rel="stylesheet" href="./phase1.css">', '<link rel="stylesheet" href="./phase1.css">\n  <link rel="stylesheet" href="./phase4.css">', "Phase 4 stylesheet");
  return source;
}
