from pathlib import Path


def patch(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old in text:
        text = text.replace(old, new)
        file.write_text(text)


# Curriculum entry point changed from the legacy broad-number skill to the first
# deliberately small interval-number subset.
patch(
    "tests/curriculum.test.mjs",
    '  assert.deepEqual(unlocked.map((x) => x.id), ["interval.generic-number"]);\n  assert.equal(SKILLS[0].phase, 1);\n  assert.equal(SKILLS[0].id, "interval.generic-number");',
    '  assert.deepEqual(unlocked.map((x) => x.id), ["interval.number-3-8"]);\n  assert.equal(SKILLS[0].phase, 1);\n  assert.equal(SKILLS[0].id, "interval.number-3-8");',
)

patch(
    "tests/service.test.mjs",
    'skillId: "interval.generic-number"',
    'skillId: "interval.number-3-8"',
)
patch(
    "tests/service.test.mjs",
    '"interval.generic-number"',
    '"interval.number-3-8"',
)

patch(
    "tests/session.test.mjs",
    'assert.equal(plan.newSkillId, "interval.generic-number");',
    'assert.equal(plan.newSkillId, "interval.number-3-8");',
)

# The round-counter assertion is now maintained directly in tests/ui-redesign.test.mjs.
# Do not rewrite it here: the v0.9 UI counts questions inside the current practice round,
# not skills inside the session queue.

# The internal skill ID is the stability contract. The long-form curriculum title is
# allowed to improve as teaching copy evolves.
patch(
    "tests/prompt4-ui.test.mjs",
    'assert.match(skills, /s\\("interval\\.quality-system", 1, "Perfect\\/major\\/minor\\/augmented\\/diminished quality system"/);',
    'assert.match(skills, /s\\("interval\\.quality-system", 1,/);',
)

# Foundation spiral practice is independent of confusion-pair interleaving. If one
# member of a confusion pair is not READY, the READY foundation may still spiral on
# its own; the unready partner must not be interleaved as if the pair were established.
patch(
    "tests/adaptive-engine.test.mjs",
    '  map.set("interval.M3", { ...ready(), ready: false, state: "acquiring" });\n  assert.deepEqual(interleavingTargets(map), []);',
    '  map.set("interval.M3", { ...ready(), ready: false, state: "acquiring" });\n  assert.deepEqual(interleavingTargets(map), ["interval.m3"]);\n  map.set("interval.m3", { ...ready({ "interval.M3": 2 }), state: "retained", retained: true });\n  assert.deepEqual(interleavingTargets(map), []);',
)

# Runtime SKILLS includes v0.9 wrapper skills (including the new all-number milestone),
# so caught-up tests must mark the actual runtime curriculum ready instead of regexing
# only the base source file.
patch(
    "tests/adaptive-engine.test.mjs",
    '  semanticExerciseSignature,\n} from "../dist/index.js";',
    '  semanticExerciseSignature,\n  SKILLS,\n} from "../dist/index.js";',
)
patch(
    "tests/adaptive-engine.test.mjs",
    '  const skillsText = fs.readFileSync("src/curriculum/skills.ts", "utf8");\n  for (const match of skillsText.matchAll(/s\\("([^\"]+)",\\s*(\\d+)/g)) {\n    allReady.set(match[1], { ready: true, retained: true, fragile: false, state: "retained", confusions: {} });\n  }',
    '  for (const skill of SKILLS) {\n    allReady.set(skill.id, { ready: true, retained: true, fragile: false, state: "retained", confusions: {} });\n  }',
)

# A 30-question follow-up is a full round, not a "short" round.
patch(
    "tests/curriculum-v09.test.mjs",
    'assert.match(app, /One more short round/);',
    'assert.match(app, /One more round/);',
)

print("Curriculum v0.9 compatibility expectations updated")
