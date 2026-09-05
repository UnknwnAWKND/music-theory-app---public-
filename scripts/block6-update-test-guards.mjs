import { readFile, writeFile } from "node:fs/promises";

async function patch(path, replacements) {
  let source = await readFile(path, "utf8");
  for (const [from, to] of replacements) {
    if (!source.includes(from)) throw new Error(`${path}: missing expected guard: ${from}`);
    source = source.replace(from, to);
  }
  await writeFile(path, source);
}

await patch("tests/block1-reset.test.mjs", [
  ["old pre-rebuild curriculum files remain absent and only Phases 1-4 are active", "old pre-rebuild curriculum files remain absent and only Phases 1-5 are active"],
  ['assert.equal(SKILLS.some((skill) => skill.phase > 4), false, "Block 5 must not add Phase 5+ skills");', 'assert.equal(SKILLS.some((skill) => skill.phase > 5), false, "Block 6 must not add Phase 6 skills");'],
  ['  assert.equal(SKILLS.filter((skill) => skill.phase === 4).length, 10);\n  assert.equal(activeLessonSkillIds().length, 29);\n  assert.equal(activeExerciseSkillIds().length, 28, "Reference Lesson 7 must not have an exercise generator");\n  assert.equal(allCheckpointDefinitions().length, 4);', '  assert.equal(SKILLS.filter((skill) => skill.phase === 4).length, 10);\n  assert.equal(SKILLS.filter((skill) => skill.phase === 5).length, 4);\n  assert.equal(activeLessonSkillIds().length, 33);\n  assert.equal(activeExerciseSkillIds().length, 32, "Reference Lesson 7 must remain the only lesson without an exercise generator");\n  assert.equal(allCheckpointDefinitions().length, 5);'],
  ["no Phase 5+ placement competency content is invented", "no Phase 6 placement competency content is invented"],
  ['CURRICULUM_PHASES.filter((x) => x.phase >= 5)', 'CURRICULUM_PHASES.filter((x) => x.phase >= 6)'],
  ['buildVersion:\\s*"rebuild-block5-phase4-diatonic-chords"', 'buildVersion:\\s*"rebuild-block6-phase5-relatives"'],
]);

await patch("tests/phase1-intervals.test.mjs", [
  ['assert.equal(SKILLS.some(x=>x.phase>=5), false);', 'assert.equal(SKILLS.some(x=>x.phase>=6), false);'],
  ['  assert.ok(checkpointDefinition(4));\n  assert.equal(checkpointDefinition(5),undefined);', '  assert.ok(checkpointDefinition(4));\n  assert.ok(checkpointDefinition(5));\n  assert.equal(checkpointDefinition(6),undefined);'],
]);

await patch("tests/phase2-major-scales.test.mjs", [
  ['  assert.equal(SKILLS.filter((skill)=>skill.phase===4).length,10);\n  assert.equal(SKILLS.some((skill)=>skill.phase>=5),false);', '  assert.equal(SKILLS.filter((skill)=>skill.phase===4).length,10);\n  assert.equal(SKILLS.filter((skill)=>skill.phase===5).length,4);\n  assert.equal(SKILLS.some((skill)=>skill.phase>=6),false);'],
]);

await patch("tests/phase3-minor-scales.test.mjs", [
  ['  assert.ok(checkpointDefinition(4));\n  assert.equal(checkpointDefinition(5),undefined);', '  assert.ok(checkpointDefinition(4));\n  assert.ok(checkpointDefinition(5));\n  assert.equal(checkpointDefinition(6),undefined);'],
]);

await patch("tests/block5-phase4-diatonic-chords.test.mjs", [
  ['Phase 4 contains exactly the requested ten curriculum positions and Phase 5 is absent', 'Phase 4 remains exact while Phase 5 is added afterward and Phase 6 is absent'],
  ['  assert.deepEqual(activeExerciseSkillIds().slice(19), PHASE4_DIATONIC_CHORD_SKILL_IDS);\n  assert.equal(SKILLS.some((skill) => skill.phase >= 5), false);\n  assert.equal(checkpointDefinition(5), undefined);', '  assert.deepEqual(activeExerciseSkillIds().slice(19, 28), PHASE4_DIATONIC_CHORD_SKILL_IDS);\n  assert.equal(SKILLS.filter((skill) => skill.phase === 5).length, 4);\n  assert.equal(SKILLS.some((skill) => skill.phase >= 6), false);\n  assert.ok(checkpointDefinition(5));\n  assert.equal(checkpointDefinition(6), undefined);'],
]);

console.log("Updated prior-phase regression guards for Block 6 without changing their curriculum assertions.");
