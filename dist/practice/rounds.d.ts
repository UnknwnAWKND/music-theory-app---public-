export type PracticeRoundKind = "new" | "acquisition" | "review" | "repair" | "review-repair" | "interleave";
export interface PracticeRoundPlan {
    size: number;
    purpose: "acquisition" | "review" | "repair" | "interleave";
}
export declare const MINIMUM_PRACTICE_ROUND_SIZE = 30;
/**
 * A round is only a learner-facing UX container. Finishing it never grants READY or RETAINED.
 * The evidence engine still decides what the completed evidence means.
 *
 * Every learner-visible practice round contains at least 30 questions. Foundational skills can
 * request larger rounds through acquisitionRoundSize, while repeated rounds and spaced returns
 * allow important relationships to accumulate hundreds of retrievals over time.
 */
export declare function practiceRoundPlan(skillId: string, kind: PracticeRoundKind, followUp?: boolean): PracticeRoundPlan;
