import { type Exercise } from "../exercises/index.js";
import type { DerivedSkillEvidence, LearningAttempt, ResponseMode } from "../learning/index.js";
export type EvidenceQuality = "learning-event" | "weak" | "moderate" | "strong" | "very-strong";
export type AdaptivePracticeAction = "complete" | "continue" | "corrective-next-example" | "reteach" | "stop-for-now";
export interface AdaptivePracticeDecision {
    action: AdaptivePracticeAction;
    reason: string;
    preferredResponseMode?: ResponseMode;
}
export interface AdaptiveExerciseSelection {
    exercise: Exercise;
    index: number;
    semanticSignature: string;
    reason: "unseen-example" | "avoid-recent-duplicate" | "best-available";
}
export declare function evidenceQualityForAttempt(attempt: LearningAttempt): EvidenceQuality;
export declare function semanticExerciseSignature(exercise: Exercise): string;
export declare function decideAdaptivePractice(attempts: readonly LearningAttempt[], evidence: DerivedSkillEvidence): AdaptivePracticeDecision;
export declare function selectAdaptiveExercise(skillId: string, attempts: readonly LearningAttempt[], startIndex?: number, poolSize?: number): AdaptiveExerciseSelection;
export declare function confusionPartnerFor(skillId: string, evidence: DerivedSkillEvidence): string | undefined;
export declare function interleavingTargets(evidenceBySkill: ReadonlyMap<string, DerivedSkillEvidence>): string[];
export declare function inferredConfusionPartner(skillId: string, submitted: unknown): string | undefined;
