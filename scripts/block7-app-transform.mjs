function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Block 7 app transform could not find ${label}`);
  return source.replace(from, to);
}

export function transformBlock7App(input) {
  let source = String(input);

  source = replaceRequired(
    source,
    "  analyzeStructuredProgression,",
    "  analyzeStructuredProgression,\n  resolveFarSideProgression,\n  selectFarSideMajorTarget,\n  transposeMajorRomanProgression,",
    "circle core imports",
  );
  source = replaceRequired(
    source,
    'import { bindPhase4ProgressionLab, phase4ProgressionLabHtml } from "./phase4-ui.js";',
    'import { bindPhase4ProgressionLab, phase4ProgressionLabHtml } from "./phase4-ui.js";\nimport { bindPhase6Ui, phase6TranspositionLabHtml } from "./phase6-ui.js";',
    "phase6 UI import",
  );

  source = replaceRequired(
    source,
    '<p>Phases 1–5 — Intervals, Major Scales, Minor Scales, Diatonic Chords / Roman Numerals, and Relatives are ready.</p>',
    '<p>Phases 1–6 — Intervals, Major Scales, Minor Scales, Diatonic Chords / Roman Numerals, Relatives, and Circle of Fifths are ready.</p>',
    "auth phase copy",
  );

  source = replaceRequired(
    source,
    '  const phase5Passed = checkpointPassed(progress, 5);\n  const focusPhase = !phase1Passed ? 1 : !phase2Passed ? 2 : !phase3Passed ? 3 : !phase4Passed ? 4 : 5;',
    '  const phase5Passed = checkpointPassed(progress, 5);\n  const phase6Passed = checkpointPassed(progress, 6);\n  const focusPhase = !phase1Passed ? 1 : !phase2Passed ? 2 : !phase3Passed ? 3 : !phase4Passed ? 4 : !phase5Passed ? 5 : 6;',
    "home focus phase",
  );

  source = replaceRequired(
    source,
    '        : focusPhase === 4\n          ? "Turn scales into chords: stack thirds, derive Roman numerals, understand function, and transpose progressions."\n          : phase5Passed\n            ? "Phase 5 is complete, but relative keys, harmony, scales, and intervals continue returning in spaced review while Phase 6 remains unbuilt."\n            : "Connect relative major and natural minor: same collection, different tonic, different Roman numerals, and fast two-way key recall.";',
    '        : focusPhase === 4\n          ? "Turn scales into chords: stack thirds, derive Roman numerals, understand function, and transpose progressions."\n          : focusPhase === 5\n            ? "Connect relative major and natural minor: same collection, different tonic, different Roman numerals, and fast two-way key recall."\n            : phase6Passed\n              ? "All six curriculum phases are complete. Spaced review continues so READY can become durable RETAINED knowledge."\n              : "Use the Circle of Fifths as a practical key map: fifth relationships, nearby versus distant keys, deliberate unfamiliar-key choice, and far-side progression transposition.";',
    "home focus copy",
  );
  source = replaceRequired(source, '${phase5Passed ? "Review learning" : `Continue Phase ${focusPhase}`}', '${phase6Passed ? "Review learning" : `Continue Phase ${focusPhase}`}', "home continue button");

  source = replaceRequired(
    source,
    '  if (phase === 4) return "Diatonic harmony turns the scales you already know into chords. Derive the system first, then make the most useful Roman-numeral relationships fast and practical.";\n  return "Relative keys connect the material you already know. Major and relative natural minor share a key signature and seven-note collection, but a different tonic changes scale degrees, Roman numerals, and musical function.";',
    '  if (phase === 4) return "Diatonic harmony turns the scales you already know into chords. Derive the system first, then make the most useful Roman-numeral relationships fast and practical.";\n  if (phase === 5) return "Relative keys connect the material you already know. Major and relative natural minor share a key signature and seven-note collection, but a different tonic changes scale degrees, Roman numerals, and musical function.";\n  return "The Circle of Fifths is the final relationship map: connect P5/P4 movement, shared scale material, relative keys, key distance, and Roman-numeral transposition into practical key choice.";',
    "phase intro",
  );

  source = replaceRequired(
    source,
    '  if (indexInPhase === 0) return "Same seven pitch classes · different tonic";\n  if (indexInPhase === 1) return "Same natural-minor chords · new Roman numerals";\n  if (indexInPhase === 2) return "Down m3 from major · up m3 from minor";\n  return "Fast two-way recall across written key signatures";',
    '  if (skill.phase === 5) {\n    if (indexInPhase === 0) return "Same seven pitch classes · different tonic";\n    if (indexInPhase === 1) return "Same natural-minor chords · new Roman numerals";\n    if (indexInPhase === 2) return "Down m3 from major · up m3 from minor";\n    return "Fast two-way recall across written key signatures";\n  }\n  if (indexInPhase === 0) return "P5/P4 movement · adjacent keys share 6 of 7";\n  if (indexInPhase === 1) return "Closely related family vs farther key distance";\n  if (indexInPhase === 2) return "Use circle distance to escape habitual keys";\n  return "Preserve Roman numerals in a far-side target key";',
    "lesson subcopy",
  );

  source = replaceRequired(
    source,
    '  if (phase === 4) return "Stacked thirds, major/minor triads, seventh chords, Roman numerals, chord function, exact spelling, and progression application.";\n  return "Relative-key identification in both directions, shared major/natural-minor collections, Roman-numeral renumbering, exact spelling, and varied keys.";',
    '  if (phase === 4) return "Stacked thirds, major/minor triads, seventh chords, Roman numerals, chord function, exact spelling, and progression application.";\n  if (phase === 5) return "Relative-key identification in both directions, shared major/natural-minor collections, Roman-numeral renumbering, exact spelling, and varied keys.";\n  return "Circle movement by fifths, adjacent-key overlap, nearby versus distant relationships, relative-key placement, practical unfamiliar-key choice, and Roman-numeral transposition.";',
    "checkpoint copy",
  );

  source = replaceRequired(source, "const activeSections = [1, 2, 3, 4, 5].map((phase) => {", "const activeSections = [1, 2, 3, 4, 5, 6].map((phase) => {", "active phase list");
  source = replaceRequired(
    source,
    'phase === 1 ? "Representative interval check" : phase === 2 ? "Representative major-scale check" : phase === 3 ? "Representative minor-scale check" : phase === 4 ? "Representative harmony check" : "Representative relative-key check"',
    'phase === 1 ? "Representative interval check" : phase === 2 ? "Representative major-scale check" : phase === 3 ? "Representative minor-scale check" : phase === 4 ? "Representative harmony check" : phase === 5 ? "Representative relative-key check" : "Representative Circle-of-Fifths check"',
    "checkpoint title",
  );
  source = replaceRequired(source, "CURRICULUM_PHASES.filter((phase) => phase.phase >= 6)", "CURRICULUM_PHASES.filter((phase) => phase.phase >= 7)", "future phase boundary");

  source = replaceRequired(
    source,
    '  if (skillId === "diatonic-chords.lesson-10-own-progressions" && atLastTeachingStep) html += phase4ProgressionLabHtml();',
    '  if (skillId === "diatonic-chords.lesson-10-own-progressions" && atLastTeachingStep) html += phase4ProgressionLabHtml();\n  if (skillId === "circle-of-fifths.lesson-4-far-side-transposition" && atLastTeachingStep) html += phase6TranspositionLabHtml();',
    "phase6 practical lab render",
  );
  source = replaceRequired(
    source,
    "  bindPhase4ProgressionLab(analyzeStructuredProgression);",
    "  bindPhase4ProgressionLab(analyzeStructuredProgression);\n  bindPhase6Ui({ selectFarSideMajorTarget, transposeMajorRomanProgression, resolveFarSideProgression });",
    "phase6 UI binding",
  );

  source = replaceRequired(
    source,
    '${exercise.metadata?.crossPhaseReview ? `<div class="learning-expectation conceptual">${exercise.metadata?.reviewPhase === 4 ? "PHASE 4 HARMONY REVIEW" : exercise.metadata?.reviewPhase === 3 ? "PHASE 3 MINOR-SCALE REVIEW" : exercise.metadata?.reviewPhase === 2 ? "PHASE 2 MAJOR-SCALE REVIEW" : "PHASE 1 INTERVAL REVIEW"}</div>` : ""}',
    '${exercise.metadata?.crossPhaseReview ? `<div class="learning-expectation conceptual">${exercise.metadata?.reviewPhase === 5 ? "PHASE 5 RELATIVE-KEY REVIEW" : exercise.metadata?.reviewPhase === 4 ? "PHASE 4 HARMONY REVIEW" : exercise.metadata?.reviewPhase === 3 ? "PHASE 3 MINOR-SCALE REVIEW" : exercise.metadata?.reviewPhase === 2 ? "PHASE 2 MAJOR-SCALE REVIEW" : "PHASE 1 INTERVAL REVIEW"}</div>` : ""}',
    "cross-phase review label",
  );

  source = replaceRequired(
    source,
    '        : phase === 4\n          ? "You demonstrated representative diatonic-harmony competencies across keys, scale forms, chord sizes, functions, and progression applications. Passing the checkpoint does not mean RETAINED; harmony and prior foundations continue in review."\n          : "You demonstrated relative-key identification in both directions, natural-minor collection understanding, Roman-numeral reinterpretation, and varied-key spelling. Passing the checkpoint does not mean RETAINED; relative pairs and prior foundations continue in review.";',
    '        : phase === 4\n          ? "You demonstrated representative diatonic-harmony competencies across keys, scale forms, chord sizes, functions, and progression applications. Passing the checkpoint does not mean RETAINED; harmony and prior foundations continue in review."\n          : phase === 5\n            ? "You demonstrated relative-key identification in both directions, natural-minor collection understanding, Roman-numeral reinterpretation, and varied-key spelling. Passing the checkpoint does not mean RETAINED; relative pairs and prior foundations continue in review."\n            : "You demonstrated Circle-of-Fifths competency through fifth movement, adjacent/distant relationships, relative-key placement, unfamiliar-key selection, and practical Roman-numeral transposition. Passing the final checkpoint still does not mean RETAINED; spaced review continues.";',
    "checkpoint success copy",
  );

  source = replaceRequired(source, "Phases 1–5 active", "Phases 1–6 active", "settings active phases");
  source = source.replace("// Keep the existing key so Block 6 preserves valid local progress from Phases 1–5.", "// Keep the existing key so Block 7 preserves valid local progress across the complete six-phase curriculum.");

  return source;
}

export function transformBlock7Index(input) {
  let source = replaceRequired(String(input), './app-block6.js', './app-block7.js', "Block 7 index script");
  source = replaceRequired(source, '<link rel="stylesheet" href="./phase4.css">', '<link rel="stylesheet" href="./phase4.css">\n  <link rel="stylesheet" href="./phase6.css">', "Phase 6 stylesheet");
  return source;
}
