import type { PhaseNumber } from "../curriculum/index.js";
import { phaseCoreReady, placementDefinition, placementPrerequisitePhases, recommendStartingPhase } from "./checkpoints-block8.js";
import type { AssessmentEvaluation, CompetencyDefinition, DiagnosticItemResult, PhaseCheckpointDefinition } from "./checkpoints-block8.js";
export type { AssessmentKind, AssessmentResponseMode, CompetencyAssessment, CompetencyDefinition, DiagnosticItemResult, PhaseCheckpointDefinition, AssessmentEvaluation, } from "./checkpoints-block8.js";
export { phaseCoreReady, placementDefinition, placementPrerequisitePhases, recommendStartingPhase, };
export declare function checkpointDefinition(phase: PhaseNumber): PhaseCheckpointDefinition | undefined;
export declare function allCheckpointDefinitions(): PhaseCheckpointDefinition[];
/**
 * Keep sampling broad for the whole 200-item assessment. Intermediate
 * competency success is intentionally withheld from the selection layer so a
 * checkpoint cannot spend its remaining questions only on one early miss.
 * At item 200 the original competency/pass logic is returned unchanged.
 */
export declare function evaluateCheckpoint(definition: PhaseCheckpointDefinition, results: readonly DiagnosticItemResult[]): AssessmentEvaluation;
export declare function nextCheckpointCompetency(definition: PhaseCheckpointDefinition, results: readonly DiagnosticItemResult[]): CompetencyDefinition | undefined;
