import { type PhaseNumber } from "../curriculum/index.js";
export type AssessmentKind = "checkpoint" | "placement";
export type AssessmentResponseMode = "recognition" | "constructed" | "discrimination" | "application";
export interface CompetencyDefinition {
    id: string;
    label: string;
    skillIds: readonly string[];
    critical?: boolean;
}
export interface PhaseCheckpointDefinition {
    phase: PhaseNumber;
    competencies: readonly CompetencyDefinition[];
    minItems: number;
    maxItems: number;
}
export interface DiagnosticItemResult {
    competencyId: string;
    skillId: string;
    promptSignature: string;
    exampleSignature: string;
    correct: boolean;
    firstSubmission: boolean;
    independent: boolean;
    responseMode: AssessmentResponseMode;
    guidanceUsed?: boolean;
    solutionSeen?: boolean;
}
export interface CompetencyAssessment {
    competencyId: string;
    label: string;
    demonstrated: boolean;
    strongEvidence: number;
    moderateEvidence: number;
    failures: number;
    distinctSkills: number;
    distinctExamples: number;
}
export interface AssessmentEvaluation {
    passed: boolean;
    complete: boolean;
    strong: string[];
    review: string[];
    competencies: CompetencyAssessment[];
    recommendedPhase?: PhaseNumber;
}
export declare function checkpointDefinition(phase: PhaseNumber): PhaseCheckpointDefinition | undefined;
export declare function allCheckpointDefinitions(): PhaseCheckpointDefinition[];
export declare function evaluateCheckpoint(definition: PhaseCheckpointDefinition, results: readonly DiagnosticItemResult[]): AssessmentEvaluation;
export declare function nextCheckpointCompetency(definition: PhaseCheckpointDefinition, results: readonly DiagnosticItemResult[]): CompetencyDefinition | undefined;
/** Placement prerequisites remain graph-derived; no Phase 2+ placement content is authored in Block 2. */
export declare function placementPrerequisitePhases(targetPhase: PhaseNumber): PhaseNumber[];
export declare function placementDefinition(targetPhase: PhaseNumber): PhaseCheckpointDefinition;
export declare function recommendStartingPhase(targetPhase: PhaseNumber, evaluation: AssessmentEvaluation): PhaseNumber;
export declare function phaseCoreReady(phase: PhaseNumber, readySkillIds: ReadonlySet<string>): boolean;
