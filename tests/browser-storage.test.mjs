import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserStorageTutorRepository } from '../dist/persistence/index.js';
import { deriveSkillEvidence } from '../dist/learning/index.js';

class FakeStorage {
  map = new Map();
  getItem(k){ return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k,v){ this.map.set(k,String(v)); }
}

test('browser storage repository persists attempts and derived state across instances', async () => {
  const storage = new FakeStorage();
  const r1 = new BrowserStorageTutorRepository(storage);
  const session = await r1.createSession('u1', '2026-09-03T12:00:00Z', {repairSkillIds:[],reviewSkillIds:[],newSkillId:'interval.M3'});
  const attempt = {userId:'u1',sessionId:session.id,skillId:'interval.M3',promptSignature:'interval.M3:0',occurredAt:'2026-09-03T12:01:00Z',outcome:'correct',independent:true,directEvidence:true,context:'acquisition',coldProbe:false};
  await r1.appendAttempt(attempt);
  const evidence = deriveSkillEvidence([attempt]);
  await r1.upsertSkillState('u1','interval.M3',evidence,attempt.occurredAt);

  const r2 = new BrowserStorageTutorRepository(storage);
  assert.equal((await r2.attemptsForSkill('u1','interval.M3')).length, 1);
  const states = await r2.allSkillStates('u1');
  assert.equal(states[0].evidence.acquisitionIndependentSuccesses, 1);
});
