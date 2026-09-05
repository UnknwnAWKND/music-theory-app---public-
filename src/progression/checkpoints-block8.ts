import { SKILLS, SKILL_BY_ID, type PhaseNumber } from "../curriculum/index.js";
import {
  allCheckpointDefinitions,
  checkpointDefinition,
  evaluateCheckpoint,
  nextCheckpointCompetency,
  phaseCoreReady,
} from "./checkpoints-block7.js";
import type {
  AssessmentEvaluation,
  PhaseCheckpointDefinition,
} from "./checkpoints-block7.js";

export type {
  AssessmentKind,
  AssessmentResponseMode,
  CompetencyAssessment,
  CompetencyDefinition,
  DiagnosticItemResult,
  PhaseCheckpointDefinition,
  AssessmentEvaluation,
} from "./checkpoints-block7.js";

export {
  allCheckpointDefinitions,
  checkpointDefinition,
  evaluateCheckpoint,
  nextCheckpointCompetency,
  phaseCoreReady,
};

/**
 * Placement tests verify the prerequisite knowledge needed to START a target
 * phase. They never sample skills from the destination phase itself.
 */
export function placementPrerequisitePhases(targetPhase: PhaseNumber): PhaseNumber[] {
  if (targetPhase <= 1) return [];
  const required = new Set<PhaseNumber>();
  const seen = new Set<string>();

  const visit = (skillId: string) => {
    if (seen.has(skillId)) return;
    seen.add(skillId);
    const skill = SKILL_BY_ID.get(skillId);
    if (!skill) return;
    for (const dependencyId of skill.prerequisites) {
      const dependency = SKILL_BY_ID.get(dependencyId);
      if (!dependency) continue;
      if (dependency.phase < targetPhase) required.add(dependency.phase);
      visit(dependencyId);
    }
  };

  SKILLS
    .filter((skill) => skill.phase === targetPhase && !skill.optional)
    .forEach((skill) => visit(skill.id));

  return [...required].sort((a, b) => a - b);
}

export function placementDefinition(targetPhase: PhaseNumber): PhaseCheckpointDefinition {
  const prerequisitePhases = placementPrerequisitePhases(targetPhase);
  const competencies = prerequisitePhases.flatMap((phase) => {
    const definition = checkpointDefinition(phase);
    if (!definition) return [];
    return definition.competencies
      .filter((competency) => competency.critical !== false)
      .map((competency) => ({
        ...competency,
        id: `placement-p${phase}--${competency.id}`,
        label: `Phase ${phase} prerequisite: ${competency.label}`,
        // Placement is representative rather than a second full phase checkpoint.
        // It still requires independent first-attempt evidence and distinct examples.
        minStrongEvidence: 1,
        minDistinctExamples: 1,
        minDistinctSkills: Math.min(competency.minDistinctSkills ?? 1, 2),
      }));
  });

  if (!competencies.length) {
    return { phase: targetPhase, competencies: [], minItems: 1, maxItems: 1 };
  }

  return {
    phase: targetPhase,
    competencies,
    minItems: competencies.length,
    maxItems: Math.max(competencies.length * 2, competencies.length + 4),
  };
}

export function recommendStartingPhase(targetPhase: PhaseNumber, evaluation: AssessmentEvaluation): PhaseNumber {
  if (evaluation.passed) return targetPhase;
  const firstGap = evaluation.competencies.find((competency) => !competency.demonstrated);
  const match = firstGap?.competencyId.match(/^placement-p([1-6])--/);
  if (!match) return targetPhase;
  return Number(match[1]) as PhaseNumber;
}
