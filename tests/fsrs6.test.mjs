import test from 'node:test';
import assert from 'node:assert/strict';
import { Fsrs6LongTermSchedulerAdapter, FSRS6_DEFAULT_WEIGHTS } from '../dist/scheduler/index.js';

test('FSRS-6 adapter uses the published 21 default weights', () => {
  assert.equal(FSRS6_DEFAULT_WEIGHTS.length, 21);
  assert.equal(FSRS6_DEFAULT_WEIGHTS[0], 0.212);
  assert.equal(FSRS6_DEFAULT_WEIGHTS[20], 0.1542);
});

test('READY transition seeds a delayed Good review at 90% target retention', () => {
  const s = new Fsrs6LongTermSchedulerAdapter({ desiredRetention: 0.9 });
  const now = new Date('2026-09-03T12:00:00Z');
  const result = s.initializeAfterAcquisition('interval.M3', now);
  assert.equal(result.card.stability, 2.3065);
  assert.equal(result.card.reps, 1);
  assert.equal(result.card.state, 'review');
  assert.ok(result.card.scheduledDays >= 2 && result.card.scheduledDays <= 3);
});

test('successful delayed retrieval increases stability; lapse contracts it and increments lapses', () => {
  const s = new Fsrs6LongTermSchedulerAdapter({ desiredRetention: 0.9 });
  const t0 = new Date('2026-09-03T12:00:00Z');
  const seeded = s.initializeAfterAcquisition('interval.M3', t0).card;
  const t1 = new Date(seeded.dueAt);
  const good = s.schedule(seeded, 'good', t1).card;
  assert.ok(good.stability > seeded.stability);
  const late = new Date(new Date(good.dueAt).getTime() + 10 * 86_400_000);
  const lapse = s.schedule(good, 'again', late).card;
  assert.equal(lapse.lapses, good.lapses + 1);
  assert.ok(lapse.stability < good.stability);
});

test('retrievability is approximately desired 90% when elapsed time equals stability', () => {
  const s = new Fsrs6LongTermSchedulerAdapter();
  const t0 = new Date('2026-09-03T12:00:00Z');
  const card = { ...s.createCard('x', t0), stability: 10, difficulty: 5, reps: 1, state: 'review', lastReviewAt: t0.toISOString() };
  const r = s.retrievability(card, new Date(t0.getTime() + 10 * 86_400_000));
  assert.ok(Math.abs(r - 0.9) < 1e-10);
});
