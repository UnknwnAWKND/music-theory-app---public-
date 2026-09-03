import type {
  ReviewSchedulerAdapter,
  ScheduleResult,
  SchedulerCardSnapshot,
  SchedulerPolicy,
  SchedulerRating,
} from "./types.js";
import { DEFAULT_SCHEDULER_POLICY } from "./types.js";

/** Published FSRS-6 default parameters (21-weight model). */
export const FSRS6_DEFAULT_WEIGHTS = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001,
  1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014,
  1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
] as const;

const DAY_MS = 86_400_000;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const daysBetween = (later: Date, earlier?: string) => earlier
  ? Math.max(0, (later.getTime() - new Date(earlier).getTime()) / DAY_MS)
  : 0;
const grade = (rating: SchedulerRating): 1 | 3 => rating === "again" ? 1 : 3;

/**
 * Long-term FSRS-6 memory-state adapter for this tutor.
 *
 * Acquisition and same-session repair are handled by the pedagogical engine,
 * not by flashcard-style learning steps. This adapter therefore uses FSRS-6's
 * memory-state equations to choose delayed cold-review dates and supports the
 * two ratings the tutor can infer objectively: Again and Good.
 */
export class Fsrs6LongTermSchedulerAdapter implements ReviewSchedulerAdapter {
  readonly policy: SchedulerPolicy;
  readonly weights: readonly number[];

  constructor(policy: Partial<SchedulerPolicy> = {}, weights: readonly number[] = FSRS6_DEFAULT_WEIGHTS) {
    this.policy = { ...DEFAULT_SCHEDULER_POLICY, ...policy, schedulerVersion: "fsrs-6" };
    if (weights.length !== 21) throw new Error("FSRS-6 requires 21 parameters");
    this.weights = [...weights];
  }

  createCard(skillId: string, now: Date): SchedulerCardSnapshot {
    return {
      skillId,
      dueAt: now.toISOString(),
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      learningSteps: 0,
      reps: 0,
      lapses: 0,
      state: "new",
      schedulerVersion: "fsrs-6",
    };
  }

  private initialStability(g: 1 | 3): number {
    return Math.max(0.001, this.weights[g - 1]);
  }

  private initialDifficulty(g: 1 | 3, clampResult = true): number {
    const d = this.weights[4] - Math.exp(this.weights[5] * (g - 1)) + 1;
    return clampResult ? clamp(d, 1, 10) : d;
  }

  private nextDifficulty(difficulty: number, g: 1 | 3): number {
    const delta = -this.weights[6] * (g - 3);
    const dampedDelta = (10 - difficulty) * delta / 9;
    // FSRS mean reversion is toward D0(Easy). We do not expose Easy as a learner rating,
    // but calculate its D0 directly with grade 4 here.
    const d0Easy = this.weights[4] - Math.exp(this.weights[5] * 3) + 1;
    const next = this.weights[7] * d0Easy + (1 - this.weights[7]) * (difficulty + dampedDelta);
    return clamp(next, 1, 10);
  }

  retrievability(card: SchedulerCardSnapshot, at: Date): number | null {
    if (!card.lastReviewAt || card.stability <= 0) return null;
    const elapsed = daysBetween(at, card.lastReviewAt);
    const decay = this.weights[20];
    const factor = Math.pow(0.9, -1 / decay) - 1;
    return Math.pow(1 + factor * elapsed / card.stability, -decay);
  }

  private shortTermStability(stability: number, g: 1 | 3): number {
    let increase = Math.exp(this.weights[17] * (g - 3 + this.weights[18])) * Math.pow(stability, -this.weights[19]);
    if (g >= 2) increase = Math.max(increase, 1);
    return Math.max(0.001, stability * increase);
  }

  private recallStability(stability: number, difficulty: number, retrievability: number): number {
    return Math.max(0.001, stability * (
      1
      + Math.exp(this.weights[8])
      * (11 - difficulty)
      * Math.pow(stability, -this.weights[9])
      * (Math.exp((1 - retrievability) * this.weights[10]) - 1)
    ));
  }

  private forgetStability(stability: number, difficulty: number, retrievability: number): number {
    const longTerm = this.weights[11]
      * Math.pow(difficulty, -this.weights[12])
      * (Math.pow(stability + 1, this.weights[13]) - 1)
      * Math.exp((1 - retrievability) * this.weights[14]);
    const shortTermCeiling = stability / Math.exp(this.weights[17] * this.weights[18]);
    return Math.max(0.001, Math.min(longTerm, shortTermCeiling));
  }

  private intervalFor(stability: number): number {
    const decay = this.weights[20];
    const factor = Math.pow(0.9, -1 / decay) - 1;
    const raw = stability / factor * (Math.pow(this.policy.desiredRetention, -1 / decay) - 1);
    return clamp(Math.round(raw), 1, this.policy.maximumIntervalDays);
  }

  private wrap(before: SchedulerCardSnapshot, after: SchedulerCardSnapshot, rating: SchedulerRating, reviewedAt: Date): ScheduleResult {
    return {
      card: after,
      log: {
        skillId: before.skillId,
        reviewedAt: reviewedAt.toISOString(),
        rating,
        dueBefore: before.dueAt,
        dueAfter: after.dueAt,
        cardBefore: before,
        cardAfter: after,
      },
    };
  }

  initializeAfterAcquisition(skillId: string, acquiredAt: Date): ScheduleResult {
    return this.schedule(this.createCard(skillId, acquiredAt), "good", acquiredAt);
  }

  schedule(card: SchedulerCardSnapshot, rating: SchedulerRating, reviewedAt: Date): ScheduleResult {
    const g = grade(rating);
    const before = { ...card };
    const elapsed = daysBetween(reviewedAt, card.lastReviewAt);
    let stability: number;
    let difficulty: number;
    let lapses = card.lapses;

    if (card.reps === 0 || card.state === "new") {
      stability = this.initialStability(g);
      difficulty = this.initialDifficulty(g);
    } else {
      difficulty = this.nextDifficulty(card.difficulty, g);
      if (elapsed < 1) {
        stability = this.shortTermStability(card.stability, g);
      } else {
        const r = this.retrievability(card, reviewedAt) ?? 1;
        if (rating === "good") stability = this.recallStability(card.stability, difficulty, r);
        else { stability = this.forgetStability(card.stability, difficulty, r); lapses += 1; }
      }
    }

    const scheduledDays = this.intervalFor(stability);
    const after: SchedulerCardSnapshot = {
      ...card,
      dueAt: new Date(reviewedAt.getTime() + scheduledDays * DAY_MS).toISOString(),
      stability,
      difficulty,
      elapsedDays: Math.round(elapsed),
      scheduledDays,
      learningSteps: 0,
      reps: card.reps + 1,
      lapses,
      state: rating === "again" ? "relearning" : "review",
      lastReviewAt: reviewedAt.toISOString(),
      schedulerVersion: "fsrs-6",
    };
    return this.wrap(before, after, rating, reviewedAt);
  }
}
