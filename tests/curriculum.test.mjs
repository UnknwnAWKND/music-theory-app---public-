import assert from "node:assert/strict";
import test from "node:test";
import {
  SKILLS,
  descendantsOf,
  topologicalSkillOrder,
  unlockableSkills,
  validateSkillGraph,
} from "../dist/curriculum/index.js";

test("curriculum graph has unique IDs, no missing prerequisites, and no cycles", () => {
  const result = validateSkillGraph();
  assert.deepEqual(result, { ok: true, missingPrerequisites: [], duplicateIds: [], cycles: [] });
});

test("topological order places every prerequisite before its dependent skill", () => {
  const ordered = topologicalSkillOrder();
  assert.equal(ordered.length, SKILLS.length);
  const index = new Map(ordered.map((skill, i) => [skill.id, i]));
  for (const skill of ordered) {
    for (const prerequisite of skill.prerequisites) {
      assert.ok(index.get(prerequisite) < index.get(skill.id), `${prerequisite} should precede ${skill.id}`);
    }
  }
});

test("entry skills unlock with no prerequisites", () => {
  const unlocked = unlockableSkills(new Set());
  assert.deepEqual(unlocked.map((x) => x.id).sort(), ["interval.generic-number", "pitch.accidentals", "pitch.half-whole"]);
});

test("a fragile foundational skill can be used to identify all downstream dependents", () => {
  const descendants = descendantsOf("major.construct");
  assert.ok(descendants.has("diatonic.stack-thirds"));
  assert.ok(descendants.has("progression.transpose"));
  assert.ok(descendants.has("minor.parallel-alterations"));
  assert.ok(descendants.has("guitar.scales"));
});

test("all 12 roadmap phases have curriculum nodes", () => {
  for (let phase = 1; phase <= 12; phase++) {
    assert.ok(SKILLS.some((skill) => skill.phase === phase), `missing phase ${phase}`);
  }
});

test("curriculum contains no ear-training or audio-recognition nodes", () => {
  const prohibited = /\b(ear|hear|hearing|aural|audio|listen|listening)\b/i;
  for (const skill of SKILLS) {
    assert.equal(prohibited.test(`${skill.id} ${skill.title} ${(skill.tags ?? []).join(" ")}`), false, skill.id);
  }
});

test("curriculum includes the audited missing/clarified concepts", () => {
  const ids = new Set(SKILLS.map((x) => x.id));
  for (const id of [
    "interval.P1",
    "minor.melodic-jazz",
    "keys.minor-signatures",
    "extension.compound-intervals",
    "guitar.idea-to-neck",
  ]) assert.ok(ids.has(id), `missing ${id}`);
});

test("arbitrary transposition is not gated behind memorizing every named example progression", () => {
  const transpose = SKILLS.find((x) => x.id === "progression.transpose");
  assert.ok(transpose);
  assert.ok(transpose.prerequisites.includes("progression.I-IV-V"));
  assert.equal(transpose.prerequisites.includes("progression.I-V-vi-IV"), false);
  assert.equal(transpose.prerequisites.includes("progression.vi-IV-I-V"), false);
});

test("chord-tone thinking begins before advanced harmony", () => {
  const skill = SKILLS.find((x) => x.id === "melody.chord-tones");
  assert.ok(skill);
  assert.ok(skill.phase <= 5);
});

test("modal study explicitly teaches tonic/center rather than the misleading start-on-another-note shortcut", () => {
  const center = SKILLS.find((x) => x.id === "mode.tonic-center");
  const majorFamily = SKILLS.find((x) => x.id === "mode.major-family");
  const minorFamily = SKILLS.find((x) => x.id === "mode.minor-family");
  assert.ok(center);
  assert.ok(majorFamily?.prerequisites.includes("mode.tonic-center"));
  assert.ok(minorFamily?.prerequisites.includes("mode.tonic-center"));
});

test("suspended and added-note chord prerequisites preserve their theoretical distinctions", () => {
  const sus = SKILLS.find((x) => x.id === "color.sus");
  const add = SKILLS.find((x) => x.id === "color.add");
  assert.ok(sus);
  assert.ok(add);
  assert.equal(sus.prerequisites.includes("triad.major"), false, "sus chords are not major triads with a note simply added");
  assert.ok(sus.prerequisites.includes("triad.members"));
  assert.ok(add.prerequisites.includes("triad.major"));
  assert.ok(add.prerequisites.includes("triad.minor"));
});
