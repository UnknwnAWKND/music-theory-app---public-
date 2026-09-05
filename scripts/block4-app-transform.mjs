function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Block 4 app transform could not find ${label}`);
  return source.replace(from, to);
}

export function transformBlock4App(input) {
  let source = String(input);

  source = replaceRequired(
    source,
    '<p>Phase 1 — Intervals and Phase 2 — Major Scales are ready.</p>',
    '<p>Phases 1–3 — Intervals, Major Scales, and Minor Scales are ready.</p>',
    'auth phase copy',
  );

  source = replaceRequired(
    source,
    '  const phase2Passed = checkpointPassed(progress, 2);\n  const focusPhase = phase1Passed ? 2 : 1;',
    '  const phase2Passed = checkpointPassed(progress, 2);\n  const phase3Passed = checkpointPassed(progress, 3);\n  const focusPhase = !phase1Passed ? 1 : !phase2Passed ? 2 : 3;',
    'home focus phase',
  );

  source = replaceRequired(
    source,
    '  const focusCopy = focusPhase === 1\n    ? "Build interval recall until the relationships are fast, accurate, and correctly spelled."\n    : phase2Passed\n      ? "Phase 2 is complete, but major scales continue returning in spaced review while later phases remain unbuilt."\n      : "Build and recall all 12 major-scale pitch classes with correct theoretical spelling.";',
    '  const focusCopy = focusPhase === 1\n    ? "Build interval recall until the relationships are fast, accurate, and correctly spelled."\n    : focusPhase === 2\n      ? "Build and recall all 12 major-scale pitch classes with correct theoretical spelling."\n      : phase3Passed\n        ? "Phase 3 is complete, but minor scales, major scales, and intervals continue returning in spaced review while Phase 4 remains unbuilt."\n        : "Build natural, harmonic, and classical melodic minor across all 12 pitch classes with exact spelling.";',
    'home focus copy',
  );

  source = replaceRequired(
    source,
    '${phase2Passed ? "Review learning" : `Continue Phase ${focusPhase}`}',
    '${phase3Passed ? "Review learning" : `Continue Phase ${focusPhase}`}',
    'home continue button',
  );

  source = replaceRequired(
    source,
    'function phaseIntro(phase) {\n  if (phase === 1) return "Intervals are foundational. READY lets you move forward; interval practice continues afterward until recall becomes durable.";\n  return "Major scales are a major foundation. Learn the construction system, then move toward fast recall across all 12 pitch classes without letting interval fluency disappear.";\n}',
    'function phaseIntro(phase) {\n  if (phase === 1) return "Intervals are foundational. READY lets you move forward; interval practice continues afterward until recall becomes durable.";\n  if (phase === 2) return "Major scales are a major foundation. Learn the construction system, then move toward fast recall across all 12 pitch classes without letting interval fluency disappear.";\n  return "Minor scales build directly on intervals and major-scale construction. Learn the natural form first, then understand exactly why harmonic and classical melodic minor alter specific degrees.";\n}',
    'phase intro',
  );

  source = replaceRequired(
    source,
    'function lessonSubcopy(skill, indexInPhase) {\n  if (skill.phase === 1) return indexInPhase === 9 ? "Broad mixed interval practice" : "Teaching + cumulative retrieval";\n  if (indexInPhase === 0) return "Formula + Phase 1 interval connection";\n  if (indexInPhase === 1) return "Scale-degree numbers and names";\n  if (indexInPhase === 2) return "All 12 pitch classes + exact spelling";\n  return "Distributed major-scale recall";\n}',
    'function lessonSubcopy(skill, indexInPhase) {\n  if (skill.phase === 1) return indexInPhase === 9 ? "Broad mixed interval practice" : "Teaching + cumulative retrieval";\n  if (skill.phase === 2) {\n    if (indexInPhase === 0) return "Formula + Phase 1 interval connection";\n    if (indexInPhase === 1) return "Scale-degree numbers and names";\n    if (indexInPhase === 2) return "All 12 pitch classes + exact spelling";\n    return "Distributed major-scale recall";\n  }\n  if (indexInPhase === 0) return "Natural-minor formula + interval connection";\n  if (indexInPhase === 1) return "All 12 roots + exact spelling";\n  if (indexInPhase === 2) return "Raised 7, leading tone + augmented 2nd";\n  if (indexInPhase === 3) return "Classical melodic minor up and down";\n  return "Distributed recall across all minor forms";\n}',
    'lesson subcopy',
  );

  source = replaceRequired(
    source,
    'function checkpointCopy(phase) {\n  if (phase === 1) return "Construction, identification, inversion, quality discrimination, varied roots, and tritone spelling.";\n  return "Formula understanding, scale construction, exact spelling, scale degrees, varied keys, and instant recall.";\n}',
    'function checkpointCopy(phase) {\n  if (phase === 1) return "Construction, identification, inversion, quality discrimination, varied roots, and tritone spelling.";\n  if (phase === 2) return "Formula understanding, scale construction, exact spelling, scale degrees, varied keys, and instant recall.";\n  return "Natural-minor construction, harmonic and melodic alterations, exact spelling, form discrimination, leading tone, augmented 2nd, and varied keys.";\n}',
    'checkpoint copy',
  );

  source = replaceRequired(source, 'const activeSections = [1, 2].map((phase) => {', 'const activeSections = [1, 2, 3].map((phase) => {', 'active phase list');
  source = replaceRequired(
    source,
    'phase === 1 ? "Representative interval check" : "Representative major-scale check"',
    'phase === 1 ? "Representative interval check" : phase === 2 ? "Representative major-scale check" : "Representative minor-scale check"',
    'checkpoint title',
  );
  source = replaceRequired(source, 'CURRICULUM_PHASES.filter((phase) => phase.phase >= 3)', 'CURRICULUM_PHASES.filter((phase) => phase.phase >= 4)', 'future phase boundary');

  source = replaceRequired(
    source,
    '${exercise.metadata?.crossPhaseReview ? `<div class="learning-expectation conceptual">PHASE 1 INTERVAL REVIEW</div>` : ""}',
    '${exercise.metadata?.crossPhaseReview ? `<div class="learning-expectation conceptual">${exercise.metadata?.reviewPhase === 2 ? "PHASE 2 MAJOR-SCALE REVIEW" : "PHASE 1 INTERVAL REVIEW"}</div>` : ""}',
    'cross-phase review label',
  );

  source = replaceRequired(source, 'if (definition.phase === 2) {', 'if (definition.phase >= 2) {', 'checkpoint metadata selection');

  source = replaceRequired(
    source,
    '  const successCopy = phase === 1\n    ? "You demonstrated representative Phase 1 competencies. Passing the checkpoint does not mean RETAINED; interval review continues."\n    : "You demonstrated representative major-scale competencies across multiple keys. Passing the checkpoint does not mean RETAINED; major-scale and interval review continue.";',
    '  const successCopy = phase === 1\n    ? "You demonstrated representative Phase 1 competencies. Passing the checkpoint does not mean RETAINED; interval review continues."\n    : phase === 2\n      ? "You demonstrated representative major-scale competencies across multiple keys. Passing the checkpoint does not mean RETAINED; major-scale and interval review continue."\n      : "You demonstrated representative minor-scale competencies across multiple keys and forms. Passing the checkpoint does not mean RETAINED; minor-scale, major-scale, and interval review continue.";',
    'checkpoint success copy',
  );

  source = replaceRequired(source, 'Phases 1–2 active', 'Phases 1–3 active', 'settings active phases');
  source = source.replace('// Keep the existing key so Block 3 does not erase valid local Phase 1 progress.', '// Keep the existing key so Block 4 preserves valid local progress from Phases 1–2.');

  return source;
}

export function transformBlock4Index(input) {
  return replaceRequired(String(input), './app-block3.js', './app-block4.js', 'Block 4 index script');
}
