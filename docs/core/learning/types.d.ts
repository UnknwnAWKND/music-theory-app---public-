export type SkillLearningState = "new" | "acquiring" | "ready" | "consolidating" | "retained" | "fragile";
export type AttemptOutcome = "correct" | "incorrect" | "hinted" | "revealed" | "exposed";
export type EvidenceContext = "acquisition" | "review" | "transfer" | "diagnostic";
export type EvidenceSource = "objective" | "self-report";
export type LearningEventKind = "response" | "hint" | "explanation" | "answer-reveal";
export type AttemptStage = "initial" | "retry" | "relearning";
export type ResponseMode = "recognition" | "constructed" | "discrimination" | "application";
export type GuidanceKind = "none" | "hint" | "explanation" | "answer-reveal";
export type EvidenceVersion = "legacy-v1" | "v2";
export type ReadinessMode = "atomic" | "varied" | "application";
export type EvidenceAttributeValue = string | number | boolean | null | readonly string[] | readonly number[];
export type ExampleAttributes = Record<string, EvidenceAttributeValue>;
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
    /** Response vs. a non-retrieval learning event such as explanation or answer reveal. Legacy rows default to response. */
    eventKind?: LearningEventKind;
    /** 1 for the learner's first submitted response to this prompt in the session, then 2, 3, ... for retries. */
    submissionIndex?: number;
    /** Explicit first-submission marker. Legacy rows are inferred conservatively. */
    firstSubmission?: boolean;
    /** Initial response, retry, or successful/unsuccessful relearning after a failed cold probe. */
    stage?: AttemptStage;
    /** What the learner had to do: recognize, construct, discriminate, or apply. */
    responseMode?: ResponseMode;
    /** Support available for this response. "none" is required for strongest independent retrieval evidence. */
    guidance?: GuidanceKind;
    /** True when the solution itself was shown before this response/event. */
    solutionSeen?: boolean;
    /** Stable semantic example identity, separate from the rendered prompt id. */
    exampleSignature?: string;
    /** Structured example dimensions such as root, tonic, degree, quality, interval, or spelling. */
    exampleAttributes?: ExampleAttributes;
    /** Optional concept/label the learner confused with the target, for later discrimination practice. */
    confusionWith?: string;
    /** Most recent relevant learning/retrieval event before this event, when known. */
    priorRelevantExposureAt?: string;
    /** Elapsed time from prior relevant exposure, stored as secondary evidence rather than a mastery gate. */
    elapsedSinceRelevantExposureMs?: number;
    /** Identifies legacy evidence imported from the old count-based model versus the richer model. */
    evidenceVersion?: EvidenceVersion;
}
export interface SkillEvidencePolicy {
    /** Atomic facts can use repeated clean retrieval; relational skills require semantic example variety. */
    readinessMode: ReadinessMode;
    /** RETAINED requires successful cold retrieval on more than one delayed session; configurable by skill later. */
    retainedSuccessfulReviewSessions: number;
    fragileFailuresInWindow: number;
    fragileReviewWindow: number;
    repeatedAcquisitionFailuresBeforeScaffold: number;
    /** Preserve legitimate READY progress established under the pre-v2 evidence model. */
    preserveLegacyReady: boolean;
}
export type ReadinessBasis = "none" | "legacy-v1" | "atomic-retrieval" | "varied-independent" | "application";
export interface DerivedSkillEvidence {
    state: SkillLearningState;
    ready: boolean;
    retained: boolean;
    fragile: boolean;
    retentionAtRisk: boolean;
    everRetained: boolean;
    readinessBasis: ReadinessBasis;
    readyEstablishedAt?: string;
    retainedEstablishedAt?: string;
    /** Backward-compatible aggregate names retained for persistence/UI migration. */
    acquisitionIndependentSuccesses: number;
    acquisitionDistinctSuccessfulPrompts: number;
    successfulDelayedReviewSessions: number;
    independentFirstAttemptSuccesses: number;
    independentFirstAttemptFailures: number;
    distinctSuccessfulExamples: number;
    recognitionSuccesses: number;
    constructedSuccesses: number;
    discriminationSuccesses: number;
    applicationSuccesses: number;
    hintedOrGuidedSuccesses: number;
    answerRevealEvents: number;
    immediatePostInstructionResponses: number;
    successfulColdRetrievals: number;
    failedColdRetrievals: number;
    successfulRelearningEvents: number;
    recentColdReviewResults: Array<"success" | "failure">;
    lastColdOutcome?: "success" | "failure";
    lastDirectOutcome?: "correct" | "incorrect";
    evidenceBasis: "none" | "objective" | "self-report" | "mixed";
    confusions: Record<string, number>;
    evidenceVersion: "v2";
}
export type AcquisitionAction = "continue-independent" | "give-corrective-feedback" | "scaffold-and-retry" | "stop-unit-for-now";
