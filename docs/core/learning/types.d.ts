export type SkillLearningState = "new" | "acquiring" | "ready" | "consolidating" | "retained" | "fragile";
export type AttemptOutcome = "correct" | "incorrect" | "hinted" | "revealed";
export type EvidenceContext = "acquisition" | "review" | "transfer" | "diagnostic";
export type EvidenceSource = "objective" | "self-report";
export interface LearningAttempt {
    skillId: string;
    sessionId: string;
    promptSignature: string;
    occurredAt: string;
    outcome: AttemptOutcome;
    independent: boolean;
    directEvidence: boolean;
    context: EvidenceContext;
    /** True only for the first independent direct probe of this skill in a delayed review session. */
    coldProbe?: boolean;
    /** Objective grading when possible; self-report only for physical/creative tasks the browser cannot verify. */
    evidenceSource?: EvidenceSource;
}
export interface SkillEvidencePolicy {
    readyIndependentSuccesses: number;
    readyDistinctPromptSignatures: number;
    retainedSuccessfulReviewSessions: number;
    fragileFailuresInWindow: number;
    fragileReviewWindow: number;
    repeatedAcquisitionFailuresBeforeScaffold: number;
}
export interface DerivedSkillEvidence {
    state: SkillLearningState;
    ready: boolean;
    retained: boolean;
    fragile: boolean;
    acquisitionIndependentSuccesses: number;
    acquisitionDistinctSuccessfulPrompts: number;
    successfulDelayedReviewSessions: number;
    recentColdReviewResults: Array<"success" | "failure">;
    lastDirectOutcome?: "correct" | "incorrect";
    evidenceBasis: "none" | "objective" | "self-report" | "mixed";
}
export type AcquisitionAction = "continue-independent" | "give-corrective-feedback" | "scaffold-and-retry" | "stop-unit-for-now";
