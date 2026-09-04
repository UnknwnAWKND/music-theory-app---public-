export type PracticeRoundKind = "new" | "acquisition" | "review" | "repair" | "review-repair" | "interleave";
export interface PracticeRoundPlan {
    size: number;
    purpose: "acquisition" | "review" | "repair" | "interleave";
}
/** Learner-visible practice rounds never pretend a handful of answers is enough evidence. */
export declare const MINIMUM_PRACTICE_ROUND_SIZE = 30;
/** A round is a UX container only. Finishing it never grants READY or RETAINED. */
export declare function practiceRoundPlan(skillId: string, kind: PracticeRoundKind, _followUp?: boolean): PracticeRoundPlan;
export declare function practiceRoundQuestionNumber(answered: number, size: number): number;
