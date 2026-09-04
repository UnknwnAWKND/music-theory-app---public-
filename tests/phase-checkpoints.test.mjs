import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  allCheckpointDefinitions,
  checkpointDefinition,
  evaluateCheckpoint,
  InMemoryTutorRepository,
  placementDefinition,
  placementPrerequisitePhases,
  recommendStartingPhase,
  planSession,
  SKILLS,
} from "../dist/index.js";

function strong(competencyId, skillId, n = 0) {
  return {
    competencyId,
    skillId,
    promptSignature: `${skillId}:p${n}`,
    exampleSignature: `${skillId}:example:${n}`,
    correct: true,
    firstSubmission: true,
    independent: true,
    responseMode: "constructed",
  };
}

function miss(competencyId, skillId, n = 0) {
  return { ...strong(competencyId, skillId, n), correct: false };
}

function passingResults(def) {
  const rows = def.competencies.map((c, i) => strong(c.id, c.skillIds[0], i));
  while (rows.length < def.minItems) {
    const c = def.competencies[rows.length % def.competencies.length];
    rows.push(strong(c.id, c.skillIds[Math.min(1, c.skillIds.length - 1)], rows.length));
  }
  return rows;
}

test("every intended phase transition 1 through 11 has a checkpoint and Phase 12 does not", () => {
  const defs = allCheckpointDefinitions();
  assert.deepEqual(defs.map((x) => x.phase), [1,2,3,4,5,6,7,8,9,10,11]);
  assert.equal(checkpointDefinition(12), undefined);
});

test("checkpoints contain multiple representative competency groups", () => {
  for (const def of allCheckpointDefinitions()) {
    assert.ok(def.competencies.length >= 2, `Phase ${def.phase}`);
    assert.ok(def.competencies.every((c) => c.skillIds.length >= 1));
  }
});

test("one strong category cannot hide a failed critical category", () => {
  const def = checkpointDefinition(1);
  const rows = passingResults(def);
  const weak = def.competencies[1];
  const withoutWeak = rows.filter((r) => r.competencyId !== weak.id);
  withoutWeak.push(miss(weak.id, weak.skillIds[0], 99));
  const result = evaluateCheckpoint(def, withoutWeak);
  assert.equal(result.passed, false);
  assert.ok(result.review.includes(weak.label));
});

test("checkpoint length adapts but stays inside deterministic bounds", () => {
  const def = checkpointDefinition(2);
  assert.ok(def.minItems > def.competencies.length);
  assert.ok(def.maxItems >= def.minItems);
  const early = evaluateCheckpoint(def, def.competencies.map((c, i) => strong(c.id, c.skillIds[0], i)));
  assert.equal(early.passed, false, "minimum evidence floor still applies");
  const passed = evaluateCheckpoint(def, passingResults(def));
  assert.equal(passed.passed, true);
  assert.ok(passingResults(def).length <= def.maxItems);
});

test("recognition-only evidence cannot trivially pass a competency with one obvious answer", () => {
  const def = checkpointDefinition(3);
  const c = def.competencies[0];
  const rows = [{ ...strong(c.id, c.skillIds[0]), responseMode: "recognition" }];
  const result = evaluateCheckpoint(def, rows);
  assert.equal(result.competencies[0].demonstrated, false);
});

test("placement derives prerequisite phases from the graph and not destination-phase skills", () => {
  const target = 5;
  const phases = placementPrerequisitePhases(target);
  assert.ok(phases.length > 0);
  assert.ok(phases.every((p) => p < target));
  const def = placementDefinition(target);
  for (const c of def.competencies) {
    for (const skillId of c.skillIds) {
      const skill = SKILLS.find((x) => x.id === skillId);
      assert.ok(skill.phase < target, `${skillId} should be a prerequisite skill`);
    }
  }
});

test("placement is representative rather than every competency from every earlier phase", () => {
  const target = 8;
  const phases = placementPrerequisitePhases(target);
  const def = placementDefinition(target);
  assert.ok(def.competencies.length <= phases.length);
  assert.ok(def.maxItems <= Math.max(def.minItems, phases.length * 3));
});

test("failed placement recommends the earliest demonstrated weak prerequisite phase", () => {
  const target = 5;
  const def = placementDefinition(target);
  const rows = passingResults(def);
  const weak = def.competencies[0];
  const broken = rows.filter((r) => r.competencyId !== weak.id);
  broken.push(miss(weak.id, weak.skillIds[0], 50));
  const evaluation = evaluateCheckpoint(def, broken);
  assert.equal(evaluation.passed, false);
  const recommended = recommendStartingPhase(target, evaluation);
  assert.ok(recommended < target);
});

test("phase progress is isolated by user and does not fabricate skill history", async () => {
  const repo = new InMemoryTutorRepository();
  const now = "2026-09-04T02:00:00Z";
  await repo.upsertPhaseProgress({ userId: "a", phase: 5, validatedEntryAt: now, validatedEntrySource: "placement", placementSummary: { passed: true }, updatedAt: now });
  assert.equal((await repo.phaseProgress("a")).length, 1);
  assert.equal((await repo.phaseProgress("b")).length, 0);
  assert.equal(repo.attempts.length, 0);
  assert.equal(repo.sessions.length, 0);
});

test("checkpoint pass state is separate from retained micro-skill evidence", async () => {
  const repo = new InMemoryTutorRepository();
  const now = "2026-09-04T02:00:00Z";
  await repo.upsertPhaseProgress({ userId: "a", phase: 1, checkpointPassedAt: now, checkpointSummary: { passed: true }, updatedAt: now });
  const rows = await repo.phaseProgress("a");
  assert.equal(rows[0].checkpointPassedAt, now);
  assert.equal((await repo.allSkillStates("a")).length, 0);
});

test("planner can gate normal new material to checkpoint-unlocked phases", () => {
  const evidenceBySkill = new Map();
  const phase1 = SKILLS.filter((x) => x.phase === 1 && !x.optional);
  for (const skill of phase1) evidenceBySkill.set(skill.id, { ready: true, retained: false, fragile: false, state: "ready", confusions: {} });
  const locked = planSession({ evidenceBySkill, dueReviews: [], guidedPhaseAccess: [1], nowIso: "2026-09-04T02:00:00Z" });
  assert.equal(locked.newSkillId, undefined);
  const unlocked = planSession({ evidenceBySkill, dueReviews: [], guidedPhaseAccess: [1,2], nowIso: "2026-09-04T02:00:00Z" });
  assert.equal(SKILLS.find((x) => x.id === unlocked.newSkillId)?.phase, 2);
});

test("placement-validated entry can bypass older-phase edges without marking those dependencies READY", () => {
  const plan = planSession({ evidenceBySkill: new Map(), dueReviews: [], guidedPhaseAccess: [1,5], validatedEntryPhases: [5], nowIso: "2026-09-04T02:00:00Z" });
  assert.equal(SKILLS.find((x) => x.id === plan.newSkillId)?.phase, 5);
});

test("source integrates checkpoint and placement UX without recreating Phase 0", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  assert.match(app, /Take Checkpoint/);
  assert.match(app, /Test Into Phase/);
  assert.match(app, /context:\s*"diagnostic"/);
  assert.match(app, /validatedEntryAt/);
  assert.match(app, /checkpointPassedAt/);
  assert.doesNotMatch(app, /Phase 0|phase0|phase_0/);
});

test("checkpoint failures preserve earlier learning and do not contain reset/delete progress paths", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  assert.match(app, /You’re close/);
  assert.match(app, /Recommended starting point/);
  assert.doesNotMatch(app, /resetPhase|delete.*skill_state|wipe.*progress/i);
});

test("diagnostic pass does not fabricate retained state or lesson completion", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  assert.doesNotMatch(app, /retained:\s*true[^\n]*placement/i);
  assert.doesNotMatch(app, /lesson.*completed.*placement/i);
  assert.match(app, /service\.submitAttempt/);
});

test("schema persists per-user phase progression with RLS", () => {
  const schema = fs.readFileSync("supabase/schema.sql", "utf8");
  assert.match(schema, /create table if not exists public\.phase_progress/);
  assert.match(schema, /primary key \(user_id, phase_number\)/);
  assert.match(schema, /alter table public\.phase_progress enable row level security/);
  assert.match(schema, /phase_progress_select_own/);
  assert.match(schema, /\(select auth\.uid\(\)\) = user_id/);
});
