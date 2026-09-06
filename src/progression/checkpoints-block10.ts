import type { PhaseNumber } from "../curriculum/index.js";
import {
  allCheckpointDefinitions as priorAllCheckpointDefinitions,
  checkpointDefinition as priorCheckpointDefinition,
  evaluateCheckpoint,
  nextCheckpointCompetency,
  phaseCoreReady,
  placementDefinition,
  placementPrerequisitePhases,
  recommendStartingPhase,
} from "./checkpoints-block8.js";
import type { PhaseCheckpointDefinition } from "./checkpoints-block8.js";

export type {
  AssessmentKind,
  AssessmentResponseMode,
  CompetencyAssessment,
  CompetencyDefinition,
  DiagnosticItemResult,
  PhaseCheckpointDefinition,
  AssessmentEvaluation,
} from "./checkpoints-block8.js";

export {
  evaluateCheckpoint,
  nextCheckpointCompetency,
  phaseCoreReady,
  placementDefinition,
  placementPrerequisitePhases,
  recommendStartingPhase,
};

const CHECKPOINT_ITEMS = 200;

function fullCheckpoint(definition: PhaseCheckpointDefinition | undefined): PhaseCheckpointDefinition | undefined {
  if (!definition) return undefined;
  return Object.freeze({
    ...definition,
    minItems: CHECKPOINT_ITEMS,
    maxItems: CHECKPOINT_ITEMS,
  });
}

/**
 * Major phase validation is intentionally exhaustive in this correction pass.
 * Competency definitions and pass logic are unchanged; only assessment length
 * is normalized to exactly 200 first-attempt items.
 */
export function checkpointDefinition(phase: PhaseNumber): PhaseCheckpointDefinition | undefined {
  return fullCheckpoint(priorCheckpointDefinition(phase));
}

export function allCheckpointDefinitions(): PhaseCheckpointDefinition[] {
  return priorAllCheckpointDefinitions().map((definition) => fullCheckpoint(definition)!);
}
