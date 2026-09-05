import { readFile, writeFile } from "node:fs/promises";

async function edit(path, mutate) {
  const before = await readFile(path, "utf8");
  const after = mutate(before);
  if (after === before) throw new Error(`${path}: expected Block 7 fix made no change`);
  await writeFile(path, after);
}

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Missing ${label}`);
  return source.replace(from, to);
}

await edit("src/exercises/phase6-circle-of-fifths.ts", (source) => {
  const pattern = /function priorReview\(index: number\): Exercise \{[\s\S]*?\n\}\n\nfunction withReview/;
  if (!pattern.test(source)) throw new Error("Missing Phase 6 priorReview block");
  const replacement = `function nativeReview(\n  generator: (skillId: string, index?: number) => Exercise | undefined,\n  skillId: string,\n  expectedPrefix: string,\n  seed: number,\n): Exercise {\n  for (let offset = 0; offset < 80; offset += 1) {\n    const candidate = generator(skillId, seed + offset);\n    if (candidate && candidate.skillId.startsWith(expectedPrefix) && !candidate.metadata?.crossPhaseReview) return candidate;\n  }\n  throw new Error(\`Could not produce native review item for \${skillId}\`);\n}\n\nfunction priorReview(index: number): Exercise {\n  const slot = mod(Math.floor(index / 19), 5);\n  let item: Exercise;\n  let reviewPhase: 1 | 2 | 3 | 4 | 5;\n  if (slot === 0) {\n    item = nativeReview(phase1ExerciseForSkill, \"intervals.lesson-2-perfect-fifth\", \"intervals.\", 3 + mod(index, 12));\n    reviewPhase = 1;\n  } else if (slot === 1) {\n    item = nativeReview(phase2ExerciseForSkill, \"major-scales.lesson-4-instant-recall\", \"major-scales.\", 17 + mod(index, 12) * 7);\n    reviewPhase = 2;\n  } else if (slot === 2) {\n    item = nativeReview(phase3ExerciseForSkill, \"minor-scales.lesson-5-instant-recall\", \"minor-scales.\", 11 + mod(index, 12) * 5);\n    reviewPhase = 3;\n  } else if (slot === 3) {\n    item = nativeReview(phase4ExerciseForSkill, \"diatonic-chords.lesson-9-progressions\", \"diatonic-chords.\", 7 + mod(index, 12) * 3);\n    reviewPhase = 4;\n  } else {\n    item = nativeReview(phase5ExerciseForSkill, \"relatives.lesson-4-instant-recall\", \"relatives.\", 13 + mod(index, 15) * 4);\n    reviewPhase = 5;\n  }\n  return {\n    ...item,\n    metadata: {\n      ...(item.metadata ?? {}),\n      crossPhaseReview: true,\n      reviewPhase,\n      reviewReason: reviewPhase === 1 ? \"circle-perfect-fifth\" : \"circle-applied-foundation\",\n    },\n  };\n}\n\nfunction withReview`;
  return source.replace(pattern, replacement);
});

await edit("src/practice/phase6-circle-of-fifths.ts", (source) =>
  replaceRequired(source, "C major to F♯/G♭ is the opposite side and shares only one pitch class.", "C major to F♯/G♭ is the opposite side and shares only two pitch classes.", "far-side shared-note teaching"),
);

await edit("tests/block7-phase6-circle-of-fifths.test.mjs", (source) =>
  replaceRequired(source, 'assert.equal(sharedMajorScaleNoteCount("C", "F#"), 1);', 'assert.equal(sharedMajorScaleNoteCount("C", "F#"), 2);', "opposite-side shared-note assertion"),
);

await edit("tests/block1-reset.test.mjs", (source) => {
  source = replaceRequired(source, "old pre-rebuild curriculum files remain absent and only Phases 1-5 are active", "old pre-rebuild curriculum files remain absent and only Phases 1-6 are active", "Block1 phase title");
  source = replaceRequired(source, 'assert.equal(SKILLS.some((skill) => skill.phase > 5), false, "Block 6 must not add Phase 6 skills");', 'assert.equal(SKILLS.some((skill) => skill.phase > 6), false, "No Phase 7 skills may exist");', "Block1 future guard");
  source = replaceRequired(source, '  assert.equal(SKILLS.filter((skill) => skill.phase === 5).length, 4);\n  assert.equal(activeLessonSkillIds().length, 33);\n  assert.equal(activeExerciseSkillIds().length, 32, "Reference Lesson 7 must remain the only lesson without an exercise generator");\n  assert.equal(allCheckpointDefinitions().length, 5);', '  assert.equal(SKILLS.filter((skill) => skill.phase === 5).length, 4);\n  assert.equal(SKILLS.filter((skill) => skill.phase === 6).length, 4);\n  assert.equal(activeLessonSkillIds().length, 37);\n  assert.equal(activeExerciseSkillIds().length, 36, "Reference Lesson 7 must remain the only lesson without an exercise generator");\n  assert.equal(allCheckpointDefinitions().length, 6);', "Block1 active counts");
  source = replaceRequired(source, 'buildVersion:\\s*"rebuild-block6-phase5-relatives"', 'buildVersion:\\s*"rebuild-block7-phase6-circle-of-fifths"', "Block1 build version");
  return source;
});

await edit("tests/block5-phase4-diatonic-chords.test.mjs", (source) => {
  source = replaceRequired(source, "Phase 4 remains exact while Phase 5 is added afterward and Phase 6 is absent", "Phase 4 remains exact while Phases 5-6 are added afterward", "Block5 title");
  source = replaceRequired(source, '  assert.equal(SKILLS.filter((skill) => skill.phase === 5).length, 4);\n  assert.equal(SKILLS.some((skill) => skill.phase >= 6), false);\n  assert.ok(checkpointDefinition(5));\n  assert.equal(checkpointDefinition(6), undefined);', '  assert.equal(SKILLS.filter((skill) => skill.phase === 5).length, 4);\n  assert.equal(SKILLS.filter((skill) => skill.phase === 6).length, 4);\n  assert.equal(SKILLS.some((skill) => skill.phase > 6), false);\n  assert.ok(checkpointDefinition(5));\n  assert.ok(checkpointDefinition(6));', "Block5 later phase guards");
  return source;
});

await edit("tests/block6-phase5-relatives.test.mjs", (source) => {
  source = replaceRequired(source, "Phase 5 is exactly four lessons and Phase 6 remains unbuilt", "Phase 5 remains exactly four lessons while Phase 6 is added afterward", "Block6 title");
  source = replaceRequired(source, '  assert.deepEqual(activeLessonSkillIds().slice(-4), IDS);\n  assert.deepEqual(activeExerciseSkillIds().slice(-4), IDS);\n  assert.equal(SKILLS.some((skill) => skill.phase === 6), false);\n  assert.equal(checkpointDefinition(6), undefined);', '  assert.deepEqual(activeLessonSkillIds().slice(29, 33), IDS);\n  assert.deepEqual(activeExerciseSkillIds().slice(28, 32), IDS);\n  assert.equal(SKILLS.filter((skill) => skill.phase === 6).length, 4);\n  assert.equal(SKILLS.some((skill) => skill.phase > 6), false);\n  assert.ok(checkpointDefinition(6));', "Block6 global guards");
  source = replaceRequired(source, '  assert.ok(checkpoint.competencies.every((item) => item.critical));\n  assert.equal(checkpointDefinition(6), undefined);', '  assert.ok(checkpoint.competencies.every((item) => item.critical));\n  assert.ok(checkpointDefinition(6));', "Block6 checkpoint guard");
  return source;
});

await edit("tests/phase1-intervals.test.mjs", (source) => {
  source = replaceRequired(source, 'assert.equal(SKILLS.some(x=>x.phase>=6), false);', 'assert.equal(SKILLS.some(x=>x.phase>6), false);', "Phase1 future guard");
  source = replaceRequired(source, '  assert.ok(checkpointDefinition(5));\n  assert.equal(checkpointDefinition(6),undefined);', '  assert.ok(checkpointDefinition(5));\n  assert.ok(checkpointDefinition(6));', "Phase1 checkpoint guard");
  return source;
});

await edit("tests/phase2-major-scales.test.mjs", (source) =>
  replaceRequired(source, '  assert.equal(SKILLS.filter((skill)=>skill.phase===5).length,4);\n  assert.equal(SKILLS.some((skill)=>skill.phase>=6),false);', '  assert.equal(SKILLS.filter((skill)=>skill.phase===5).length,4);\n  assert.equal(SKILLS.filter((skill)=>skill.phase===6).length,4);\n  assert.equal(SKILLS.some((skill)=>skill.phase>6),false);', "Phase2 future guard"),
);

await edit("tests/phase3-minor-scales.test.mjs", (source) =>
  replaceRequired(source, '  assert.ok(checkpointDefinition(5));\n  assert.equal(checkpointDefinition(6),undefined);', '  assert.ok(checkpointDefinition(5));\n  assert.ok(checkpointDefinition(6));', "Phase3 checkpoint guard"),
);

console.log("Applied Block 7 CI fixes and updated prior-phase regression guards without changing prior curriculum content.");
