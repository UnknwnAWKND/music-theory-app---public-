function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Block 6 app transform could not find ${label}`);
  return source.replace(from, to);
}

export function transformBlock6App(input) {
  let source = String(input);

  source = replaceRequired(
    source,
    '<p>Phases 1–4 — Intervals, Major Scales, Minor Scales, and Diatonic Chords / Roman Numerals are ready.</p>',
    '<p>Phases 1–5 — Intervals, Major Scales, Minor Scales, Diatonic Chords / Roman Numerals, and Relatives are ready.</p>',
    "auth phase copy",
  );

  source = replaceRequired(
    source,
    '  const phase4Passed = checkpointPassed(progress, 4);\n  const focusPhase = !phase1Passed ? 1 : !phase2Passed ? 2 : !phase3Passed ? 3 : 4;',
    '  const phase4Passed = checkpointPassed(progress, 4);\n  const phase5Passed = checkpointPassed(progress, 5);\n  const focusPhase = !phase1Passed ? 1 : !phase2Passed ? 2 : !phase3Passed ? 3 : !phase4Passed ? 4 : 5;',
    "home focus phase",
  );

  source = replaceRequired(
    source,
    '        : phase4Passed\n          ? "Phase 4 is complete, but harmony, scales, and intervals continue returning in spaced review while Phase 5 remains unbuilt."\n          : "Turn scales into chords: stack thirds, derive Roman numerals, understand function, and transpose progressions.";',
    '        : focusPhase === 4\n          ? "Turn scales into chords: stack thirds, derive Roman numerals, understand function, and transpose progressions."\n          : phase5Passed\n            ? "Phase 5 is complete, but relative keys, harmony, scales, and intervals continue returning in spaced review while Phase 6 remains unbuilt."\n            : "Connect relative major and natural minor: same collection, different tonic, different Roman numerals, and fast two-way key recall.";',
    "home focus copy",
  );
  source = replaceRequired(source, '${phase4Passed ? "Review learning" : `Continue Phase ${focusPhase}`}', '${phase5Passed ? "Review learning" : `Continue Phase ${focusPhase}`}', "home continue button");

  source = replaceRequired(
    source,
    '  if (phase === 3) return "Minor scales build directly on intervals and major-scale construction. Learn the natural form first, then understand exactly why harmonic and classical melodic minor alter specific degrees.";\n  return "Diatonic harmony turns the scales you already know into chords. Derive the system first, then make the most useful Roman-numeral relationships fast and practical.";',
    '  if (phase === 3) return "Minor scales build directly on intervals and major-scale construction. Learn the natural form first, then understand exactly why harmonic and classical melodic minor alter specific degrees.";\n  if (phase === 4) return "Diatonic harmony turns the scales you already know into chords. Derive the system first, then make the most useful Roman-numeral relationships fast and practical.";\n  return "Relative keys connect the material you already know. Major and relative natural minor share a key signature and seven-note collection, but a different tonic changes scale degrees, Roman numerals, and musical function.";',
    "phase intro",
  );

  source = replaceRequired(
    source,
    '  if (indexInPhase === 0) return "Stack scale-tone 3rds into triads";\n  if (indexInPhase === 1) return "I ii iii IV V vi vii° — derive, then recall";\n  if (indexInPhase === 2) return "Natural-minor triads + Roman numerals";\n  if (indexInPhase === 3) return "Raised 7 changes V, III and vii°";\n  if (indexInPhase === 4) return "Ascending melodic-minor harmony — moderate priority";\n  if (indexInPhase === 5) return "Stack one more 3rd for seventh chords";\n  if (indexInPhase === 6) return "REFERENCE · lookup only · no mastery quiz";\n  if (indexInPhase === 7) return "Tonic, predominant/subdominant, dominant";\n  if (indexInPhase === 8) return "Portable progression vocabulary + transposition";\n  return "Structured analysis of your own progressions";',
    '  if (skill.phase === 4) {\n    if (indexInPhase === 0) return "Stack scale-tone 3rds into triads";\n    if (indexInPhase === 1) return "I ii iii IV V vi vii° — derive, then recall";\n    if (indexInPhase === 2) return "Natural-minor triads + Roman numerals";\n    if (indexInPhase === 3) return "Raised 7 changes V, III and vii°";\n    if (indexInPhase === 4) return "Ascending melodic-minor harmony — moderate priority";\n    if (indexInPhase === 5) return "Stack one more 3rd for seventh chords";\n    if (indexInPhase === 6) return "REFERENCE · lookup only · no mastery quiz";\n    if (indexInPhase === 7) return "Tonic, predominant/subdominant, dominant";\n    if (indexInPhase === 8) return "Portable progression vocabulary + transposition";\n    return "Structured analysis of your own progressions";\n  }\n  if (indexInPhase === 0) return "Same seven pitch classes · different tonic";\n  if (indexInPhase === 1) return "Same natural-minor chords · new Roman numerals";\n  if (indexInPhase === 2) return "Down m3 from major · up m3 from minor";\n  return "Fast two-way recall across written key signatures";',
    "lesson subcopy",
  );

  source = replaceRequired(
    source,
    '  if (phase === 3) return "Natural-minor construction, harmonic and melodic alterations, exact spelling, form discrimination, leading tone, augmented 2nd, and varied keys.";\n  return "Stacked thirds, major/minor triads, seventh chords, Roman numerals, chord function, exact spelling, and progression application.";',
    '  if (phase === 3) return "Natural-minor construction, harmonic and melodic alterations, exact spelling, form discrimination, leading tone, augmented 2nd, and varied keys.";\n  if (phase === 4) return "Stacked thirds, major/minor triads, seventh chords, Roman numerals, chord function, exact spelling, and progression application.";\n  return "Relative-key identification in both directions, shared major/natural-minor collections, Roman-numeral renumbering, exact spelling, and varied keys.";',
    "checkpoint copy",
  );

  source = replaceRequired(source, "const activeSections = [1, 2, 3, 4].map((phase) => {", "const activeSections = [1, 2, 3, 4, 5].map((phase) => {", "active phase list");
  source = replaceRequired(
    source,
    'phase === 1 ? "Representative interval check" : phase === 2 ? "Representative major-scale check" : phase === 3 ? "Representative minor-scale check" : "Representative harmony check"',
    'phase === 1 ? "Representative interval check" : phase === 2 ? "Representative major-scale check" : phase === 3 ? "Representative minor-scale check" : phase === 4 ? "Representative harmony check" : "Representative relative-key check"',
    "checkpoint title",
  );
  source = replaceRequired(source, "CURRICULUM_PHASES.filter((phase) => phase.phase >= 5)", "CURRICULUM_PHASES.filter((phase) => phase.phase >= 6)", "future phase boundary");

  source = replaceRequired(
    source,
    '${exercise.metadata?.crossPhaseReview ? `<div class="learning-expectation conceptual">${exercise.metadata?.reviewPhase === 3 ? "PHASE 3 MINOR-SCALE REVIEW" : exercise.metadata?.reviewPhase === 2 ? "PHASE 2 MAJOR-SCALE REVIEW" : "PHASE 1 INTERVAL REVIEW"}</div>` : ""}',
    '${exercise.metadata?.crossPhaseReview ? `<div class="learning-expectation conceptual">${exercise.metadata?.reviewPhase === 4 ? "PHASE 4 HARMONY REVIEW" : exercise.metadata?.reviewPhase === 3 ? "PHASE 3 MINOR-SCALE REVIEW" : exercise.metadata?.reviewPhase === 2 ? "PHASE 2 MAJOR-SCALE REVIEW" : "PHASE 1 INTERVAL REVIEW"}</div>` : ""}',
    "cross-phase review label",
  );

  source = replaceRequired(
    source,
    '        : "You demonstrated representative diatonic-harmony competencies across keys, scale forms, chord sizes, functions, and progression applications. Passing the checkpoint does not mean RETAINED; harmony and prior foundations continue in review.";',
    '        : phase === 4\n          ? "You demonstrated representative diatonic-harmony competencies across keys, scale forms, chord sizes, functions, and progression applications. Passing the checkpoint does not mean RETAINED; harmony and prior foundations continue in review."\n          : "You demonstrated relative-key identification in both directions, natural-minor collection understanding, Roman-numeral reinterpretation, and varied-key spelling. Passing the checkpoint does not mean RETAINED; relative pairs and prior foundations continue in review.";',
    "checkpoint success copy",
  );

  source = replaceRequired(source, "Phases 1–4 active", "Phases 1–5 active", "settings active phases");
  source = source.replace("// Keep the existing key so Block 5 preserves valid local progress from Phases 1–4.", "// Keep the existing key so Block 6 preserves valid local progress from Phases 1–5.");

  return source;
}

export function transformBlock6Index(input) {
  return replaceRequired(String(input), './app-block5.js', './app-block6.js', "Block 6 index script");
}
