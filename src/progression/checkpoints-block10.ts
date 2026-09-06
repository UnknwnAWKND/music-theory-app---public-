import type { PhaseNumber } from "../curriculum/index.js";
import {
  allCheckpointDefinitions as priorAllCheckpointDefinitions,
  checkpointDefinition as priorCheckpointDefinition,
  evaluateCheckpoint as priorEvaluateCheckpoint,
  phaseCoreReady,
  placementDefinition,
  placementPrerequisitePhases,
  recommendStartingPhase,
} from "./checkpoints-block8.js";
import type {
  AssessmentEvaluation,
  CompetencyDefinition,
  DiagnosticItemResult,
  PhaseCheckpointDefinition,
} from "./checkpoints-block8.js";

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
  phaseCoreReady,
  placementDefinition,
  placementPrerequisitePhases,
  recommendStartingPhase,
};

const CHECKPOINT_ITEMS = 200;

function fullCheckpoint(definition: PhaseCheckpointDefinition | undefined): PhaseCheckpointDefinition | undefined {
  if (!definition) return undefined;
  return Object.freeze({ ...definition, minItems: CHECKPOINT_ITEMS, maxItems: CHECKPOINT_ITEMS });
}

export function checkpointDefinition(phase: PhaseNumber): PhaseCheckpointDefinition | undefined {
  return fullCheckpoint(priorCheckpointDefinition(phase));
}

export function allCheckpointDefinitions(): PhaseCheckpointDefinition[] {
  return priorAllCheckpointDefinitions().map((definition) => fullCheckpoint(definition)!);
}

/**
 * Keep sampling broad for the whole 200-item assessment. Intermediate
 * competency success is intentionally withheld from the selection layer so a
 * checkpoint cannot spend its remaining questions only on one early miss.
 * At item 200 the original competency/pass logic is returned unchanged.
 */
export function evaluateCheckpoint(
  definition: PhaseCheckpointDefinition,
  results: readonly DiagnosticItemResult[],
): AssessmentEvaluation {
  const evaluation = priorEvaluateCheckpoint(definition, results);
  if (results.length >= CHECKPOINT_ITEMS) return evaluation;
  return {
    ...evaluation,
    passed: false,
    complete: false,
    strong: [],
    review: definition.competencies.map((competency) => competency.label),
    competencies: evaluation.competencies.map((competency) => ({ ...competency, demonstrated: false })),
  };
}

export function nextCheckpointCompetency(
  definition: PhaseCheckpointDefinition,
  results: readonly DiagnosticItemResult[],
): CompetencyDefinition | undefined {
  if (!definition.competencies.length || results.length >= CHECKPOINT_ITEMS) return undefined;
  const counts = new Map<string, number>();
  for (const result of results) counts.set(result.competencyId, (counts.get(result.competencyId) ?? 0) + 1);
  return [...definition.competencies].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
}
