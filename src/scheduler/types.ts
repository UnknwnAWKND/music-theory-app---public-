import type { LearningAttempt } from "../learning/index.js";

/**
 * The learner never sees Again/Hard/Good/Easy controls.
 * v1 intentionally emits only Again or Good from objective attempt outcomes.
 */
export type SchedulerRating = "again" | "good";

export type SchedulerCardState = "new" | "learning" | "review" | "relearning";

/** Persistence-safe shape corresponding to the state an FSRS-v6 adapter needs. */
export interface SchedulerCardSnapshot {
  skillId: string;
  dueAt: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: SchedulerCardState;
  lastReviewAt?: string;
  schedulerVersion: "fsrs-6";
}

export interface SchedulerReviewLog {
  skillId: string;
  reviewedAt: string;
  rating: SchedulerRating;
  dueBefore: string;
  dueAfter: string;
  cardBefore: SchedulerCardSnapshot;
  cardAfter: SchedulerCardSnapshot;
}

export interface ScheduleResult {
  card: SchedulerCardSnapshot;
  log: SchedulerReviewLog;
}

export interface ReviewSchedulerAdapter {
  createCard(skillId: string, now: Date): SchedulerCardSnapshot;
  /** Seeds the first delayed review after a skill earns READY status. */
  initializeAfterAcquisition(skillId: string, acquiredAt: Date): ScheduleResult;
  schedule(card: SchedulerCardSnapshot, rating: SchedulerRating, reviewedAt: Date): ScheduleResult;
  retrievability(card: SchedulerCardSnapshot, at: Date): number | null;
}

export interface SchedulerPolicy {
  desiredRetention: number;
  maximumIntervalDays: number;
  schedulerVersion: "fsrs-6";
}

export const DEFAULT_SCHEDULER_POLICY: SchedulerPolicy = {
  desiredRetention: 0.9,
  maximumIntervalDays: 36500,
  schedulerVersion: "fsrs-6",
};

export function ratingForAttempt(attempt: Pick<LearningAttempt, "outcome" | "independent" | "directEvidence">): SchedulerRating {
  if (!attempt.independent || !attempt.directEvidence) return "again";
  return attempt.outcome === "correct" ? "good" : "again";
}
