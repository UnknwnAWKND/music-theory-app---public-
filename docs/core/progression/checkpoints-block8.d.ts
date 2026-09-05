import { type PhaseNumber } from "../curriculum/index.js";
import { allCheckpointDefinitions, checkpointDefinition, evaluateCheckpoint, nextCheckpointCompetency, phaseCoreReady } from "./checkpoints-block7.js";
import type { AssessmentEvaluation, PhaseCheckpointDefinition } from "./checkpoints-block7.js";
export type { AssessmentKind, AssessmentResponseMode, CompetencyAssessment, CompetencyDefinition, DiagnosticItemResult, PhaseCheckpointDefinition, AssessmentEvaluation, } from "./checkpoints-block7.js";
export { allCheckpointDefinitions, checkpointDefinition, evaluateCheckpoint, nextCheckpointCompetency, phaseCoreReady, };
/**
 * Placement tests verify the prerequisite knowledge needed to START a target
 * phase. They never sample skills from the destination phase itself.
 */
export declare function placementPrerequisitePhases(targetPhase: PhaseNumber): PhaseNumber[];
export declare function placementDefinition(targetPhase: PhaseNumber): PhaseCheckpointDefinition;
export declare function recommendStartingPhase(targetPhase: PhaseNumber, evaluation: AssessmentEvaluation): PhaseNumber;
