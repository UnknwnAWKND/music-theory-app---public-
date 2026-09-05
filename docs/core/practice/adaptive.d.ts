import type { Exercise } from "../exercises/index.js";
import type { DerivedSkillEvidence, LearningAttempt } from "../learning/index.js";
export type AdaptiveAction = "continue-independent" | "corrective-feedback" | "reteach" | "follow-up-round" | "stop-for-now";
export interface AdaptivePracticeDecision {
    action: AdaptiveAction;
    reason: string;
}
export declare function evidenceQualityForAttempt(attempt: LearningAttempt): "strong" | "supported" | "weak";
export declare function semanticExerciseSignature(exercise: Exercise): string;
export declare function selectAdaptiveExercise(candidates: readonly Exercise[], recentSignatures?: readonly string[], index?: number): Exercise | undefined;
export declare function decideAdaptivePractice(attempts: readonly LearningAttempt[], evidence?: DerivedSkillEvidence): AdaptivePracticeDecision;
export declare function confusionPartnerFor(evidence: DerivedSkillEvidence | undefined): string | undefined;
export declare function inferredConfusionPartner(_attempt: LearningAttempt): string | undefined;
/**
 * Curriculum recurrence is intentionally separate from scheduler due dates.
 * READY foundational skills still deserve mixed retrieval. RETAINED lowers
 * extra spiral pressure, but never makes a foundational skill weight zero.
 */
export declare function longTermPracticeWeight(skillId: string, evidence?: DerivedSkillEvidence): number;
export declare function interleavingTargets(evidenceBySkill: ReadonlyMap<string, DerivedSkillEvidence>): string[];
