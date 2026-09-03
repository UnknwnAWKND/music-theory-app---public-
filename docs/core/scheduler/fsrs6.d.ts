import type { ReviewSchedulerAdapter, ScheduleResult, SchedulerCardSnapshot, SchedulerPolicy, SchedulerRating } from "./types.js";
/** Published FSRS-6 default parameters (21-weight model). */
export declare const FSRS6_DEFAULT_WEIGHTS: readonly [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542];
/**
 * Long-term FSRS-6 memory-state adapter for this tutor.
 *
 * Acquisition and same-session repair are handled by the pedagogical engine,
 * not by flashcard-style learning steps. This adapter therefore uses FSRS-6's
 * memory-state equations to choose delayed cold-review dates and supports the
 * two ratings the tutor can infer objectively: Again and Good.
 */
export declare class Fsrs6LongTermSchedulerAdapter implements ReviewSchedulerAdapter {
    readonly policy: SchedulerPolicy;
    readonly weights: readonly number[];
    constructor(policy?: Partial<SchedulerPolicy>, weights?: readonly number[]);
    createCard(skillId: string, now: Date): SchedulerCardSnapshot;
    private initialStability;
    private initialDifficulty;
    private nextDifficulty;
    retrievability(card: SchedulerCardSnapshot, at: Date): number | null;
    private shortTermStability;
    private recallStability;
    private forgetStability;
    private intervalFor;
    private wrap;
    initializeAfterAcquisition(skillId: string, acquiredAt: Date): ScheduleResult;
    schedule(card: SchedulerCardSnapshot, rating: SchedulerRating, reviewedAt: Date): ScheduleResult;
}
