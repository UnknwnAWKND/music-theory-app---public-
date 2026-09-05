import type { PhaseNumber } from "../curriculum/index.js";
export type { AssessmentKind, AssessmentResponseMode, CompetencyAssessment, CompetencyDefinition, DiagnosticItemResult, PhaseCheckpointDefinition, AssessmentEvaluation, } from "./checkpoints.js";
export { evaluateCheckpoint, nextCheckpointCompetency, phaseCoreReady, placementDefinition, placementPrerequisitePhases, recommendStartingPhase, } from "./checkpoints.js";
import type { PhaseCheckpointDefinition } from "./checkpoints.js";
export declare function checkpointDefinition(phase: PhaseNumber): PhaseCheckpointDefinition | undefined;
export declare function allCheckpointDefinitions(): PhaseCheckpointDefinition[];
