import type { PhaseNumber } from "../curriculum/index.js";
import {
  allCheckpointDefinitions as priorCheckpointDefinitions,
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

export const PHASE_CHECKPOINT_ITEM_COUNT = 200;

function normalizeCheckpoint(definition: PhaseCheckpointDefinition | undefined): PhaseCheckpointDefinition | undefined {
  if (!definition) return undefined;
  return Object.freeze({
    ...definition,
    minItems: PHASE_CHECKPOINT_ITEM_COUNT,
    maxItems: PHASE_CHECKPOINT_ITEM_COUNT,
  });
}

export function checkpointDefinition(phase: PhaseNumber): PhaseCheckpointDefinition | undefined {
  return normalizeCheckpoint(priorCheckpointDefinition(phase));
}

export function allCheckpointDefinitions(): PhaseCheckpointDefinition[] {
  return priorCheckpointDefinitions().map((definition) => normalizeCheckpoint(definition)!);
}
