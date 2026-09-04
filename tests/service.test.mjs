import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryTutorRepository } from "../dist/persistence/index.js";
import { TutorService } from "../dist/service/index.js";

class FakeScheduler {
  createCard(skillId, now) {
    return { skillId, dueAt: now.toISOString(), stability: 0, difficulty: 0, elapsedDays: 0,
      scheduledDays: 0, learningSteps: 0, reps: 0, lapses: 0, state: "new",
      schedulerVersion: "fsrs-6" };
  }
  initializeAfterAcquisition(skillId, acquiredAt) {
    const before = this.createCard(skillId, acquiredAt);
    const after = { ...before, dueAt: new Date(acquiredAt.getTime() + 86_400_000).toISOString(),
      stability: 1, difficulty: 5, scheduledDays: 1, reps: 1, state: "review", lastReviewAt: acquiredAt.toISOString() };
    return { card: after, log: { skillId, reviewedAt: acquiredAt.toISOString(), rating: "good",
      dueBefore: before.dueAt, dueAfter: after.dueAt, cardBefore: before, cardAfter: after } };
  }
  schedule(card, rating, reviewedAt) {
    const days = rating === "good" ? 3 : 1;
    const after = { ...card, dueAt: new Date(reviewedAt.getTime() + days * 86_400_000).toISOString(),
      scheduledDays: days, reps: card.reps + 1, lapses: card.lapses + (rating === "again" ? 1 : 0),
      lastReviewAt: reviewedAt.toISOString(), state: rating === "again" ? "relearning" : "review" };
    return { card: after, log: { skillId: card.skillId, reviewedAt: reviewedAt.toISOString(), rating,
      dueBefore: card.dueAt, dueAfter: after.dueAt, cardBefore: card, cardAfter: after } };
  }
  retrievability() { return null; }
}

function acquisition(userId, sessionId, signature, time, overrides = {}) {
  return { userId, sessionId, skillId: "interval.number-3-8", promptSignature: signature,
    occurredAt: time, outcome: "correct", independent: true, directEvidence: true, context: "acquisition",
    eventKind: "response", responseMode: "constructed", guidance: "none", evidenceVersion: "v2",
    exampleSignature: signature, ...overrides };
}

test("service establishes READY from the skill evidence profile and seeds review only on the transition", async () => {
  const repo = new InMemoryTutorRepository();
  const service = new TutorService({ repository: repo, scheduler: new FakeScheduler() });
  const started = await service.startSession("u1", new Date("2026-09-03T12:00:00Z"));
  assert.equal(started.plan.newSkillId, "interval.number-3-8");

  const one = await service.submitAttempt(acquisition("u1", started.sessionId, "number-3-8:1", "2026-09-03T12:01:00Z"));
  assert.equal(one.ready, false);
  const evidence = await service.submitAttempt(acquisition("u1", started.sessionId, "number-3-8:2", "2026-09-03T12:03:00Z"));
  assert.equal(evidence.ready, true);
  assert.equal(evidence.retained, false);
  assert.equal(repo.cards.size, 1);
  assert.equal(repo.schedulerReviews.length, 1);
  assert.equal(repo.schedulerReviews[0].eventKind, "initial-seed");
});

test("service preserves first response and marks a later same-prompt response as retry", async () => {
  const repo = new InMemoryTutorRepository();
  const service = new TutorService({ repository: repo, scheduler: new FakeScheduler() });
  const session = await repo.createSession("u1", "2026-09-03T12:00:00Z");
  await service.submitAttempt(acquisition("u1", session.id, "same", "2026-09-03T12:01:00Z", { outcome: "incorrect" }));
  await service.submitAttempt(acquisition("u1", session.id, "same", "2026-09-03T12:02:00Z"));
  const rows = await repo.attemptsForSkill("u1", "interval.number-3-8");
  assert.equal(rows[0].outcome, "incorrect");
  assert.equal(rows[0].firstSubmission, true);
  assert.equal(rows[1].outcome, "correct");
  assert.equal(rows[1].firstSubmission, false);
  assert.equal(rows[1].stage, "retry");
});

test("only a cold independent first-submission review probe advances the scheduler", async () => {
  const repo = new InMemoryTutorRepository();
  const service = new TutorService({ repository: repo, scheduler: new FakeScheduler() });
  const session = await repo.createSession("u1", "2026-09-03T12:00:00Z");
  await service.submitAttempt(acquisition("u1", session.id, "a", "2026-09-03T12:01:00Z"));
  await service.submitAttempt(acquisition("u1", session.id, "b", "2026-09-03T12:02:00Z"));
  const initialCount = repo.schedulerReviews.length;

  const reviewSession = await repo.createSession("u1", "2026-09-04T12:00:00Z");
  await service.submitAttempt({ userId: "u1", sessionId: reviewSession.id, skillId: "interval.number-3-8",
    promptSignature: "review-a", occurredAt: "2026-09-04T12:00:00Z", outcome: "incorrect",
    independent: true, directEvidence: true, context: "review", coldProbe: true,
    eventKind: "response", responseMode: "constructed", guidance: "none", evidenceVersion: "v2" });
  assert.equal(repo.schedulerReviews.length, initialCount + 1);

  await service.submitAttempt({ userId: "u1", sessionId: reviewSession.id, skillId: "interval.number-3-8",
    promptSignature: "repair", occurredAt: "2026-09-04T12:01:00Z", outcome: "correct",
    independent: false, directEvidence: true, context: "review", coldProbe: false,
    eventKind: "response", responseMode: "constructed", guidance: "explanation", evidenceVersion: "v2" });
  assert.equal(repo.schedulerReviews.length, initialCount + 1, "relearning must not be credited as a successful cold review");
});

test("previewPlan can recompute unlocked work without creating a new study session", async () => {
  const repo = new InMemoryTutorRepository();
  const service = new TutorService({ repository: repo, scheduler: new FakeScheduler() });
  const plan = await service.previewPlan("preview-user", new Date("2026-09-03T12:00:00Z"));
  assert.equal(plan.newSkillId, "interval.number-3-8");
});
