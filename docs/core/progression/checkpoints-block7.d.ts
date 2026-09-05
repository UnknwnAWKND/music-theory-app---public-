import type { PhaseNumber } from "../curriculum/index.js";
export type { AssessmentKind, AssessmentResponseMode, CompetencyAssessment, CompetencyDefinition, DiagnosticItemResult, PhaseCheckpointDefinition, AssessmentEvaluation, } from "./checkpoints-block6.js";
export { evaluateCheckpoint, nextCheckpointCompetency, phaseCoreReady, placementDefinition, placementPrerequisitePhases, recommendStartingPhase, } from "./checkpoints-block6.js";
import type { PhaseCheckpointDefinition } from "./checkpoints-block6.js";
export declare function checkpointDefinition(phase: PhaseNumber): PhaseCheckpointDefinition | undefined;
export declare function allCheckpointDefinitions(): PhaseCheckpointDefinition[];
