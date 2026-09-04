import { SKILLS, SKILL_BY_ID, type PhaseNumber } from "../curriculum/index.js";

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

/** Block 1 contains no checkpoint competency content. Machinery stays available. */
export function checkpointDefinition(_phase: PhaseNumber): PhaseCheckpointDefinition | undefined {
  return undefined;
}

export function allCheckpointDefinitions(): PhaseCheckpointDefinition[] {
  return [];
}

function isStrong(result: DiagnosticItemResult): boolean {
  return result.correct && result.firstSubmission && result.independent && !result.guidanceUsed && !result.solutionSeen
    && ["constructed", "discrimination", "application"].includes(result.responseMode);
}

function isModerate(result: DiagnosticItemResult): boolean {
  return result.correct && result.firstSubmission && result.independent && !result.guidanceUsed && !result.solutionSeen
    && result.responseMode === "recognition";
}

export function evaluateCheckpoint(definition: PhaseCheckpointDefinition, results: readonly DiagnosticItemResult[]): AssessmentEvaluation {
  const competencies = definition.competencies.map((competency): CompetencyAssessment => {
    const rows = results.filter((result) => result.competencyId === competency.id);
    const strong = rows.filter(isStrong);
    const moderate = rows.filter(isModerate);
    const failures = rows.filter((result) => result.firstSubmission && result.independent && !result.correct).length;
    const distinctSkills = new Set([...strong, ...moderate].map((result) => result.skillId)).size;
    const distinctExamples = new Set([...strong, ...moderate].map((result) => result.exampleSignature)).size;
    const demonstrated = failures === 0 && (strong.length >= 1 || (moderate.length >= 2 && distinctExamples >= 2));
    return { competencyId: competency.id, label: competency.label, demonstrated, strongEvidence: strong.length, moderateEvidence: moderate.length, failures, distinctSkills, distinctExamples };
  });
  const hasContent = competencies.length > 0;
  const passed = hasContent && competencies.every((competency) => competency.demonstrated) && results.length >= definition.minItems;
  const complete = passed || (hasContent && results.length >= definition.maxItems);
  return {
    passed,
    complete,
    strong: competencies.filter((competency) => competency.demonstrated).map((competency) => competency.label),
    review: competencies.filter((competency) => !competency.demonstrated).map((competency) => competency.label),
    competencies,
  };
}

export function nextCheckpointCompetency(definition: PhaseCheckpointDefinition, results: readonly DiagnosticItemResult[]): CompetencyDefinition | undefined {
  if (!definition.competencies.length) return undefined;
  const evaluation = evaluateCheckpoint(definition, results);
  if (evaluation.complete) return undefined;
  const unresolved = definition.competencies.filter((competency) => !evaluation.competencies.find((row) => row.competencyId === competency.id)?.demonstrated);
  const candidates = unresolved.length ? unresolved : definition.competencies;
  const counts = new Map<string, number>();
  for (const result of results) counts.set(result.competencyId, (counts.get(result.competencyId) ?? 0) + 1);
  return [...candidates].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
}

/** Placement prerequisites remain graph-derived; there is no old hand-written map. */
export function placementPrerequisitePhases(targetPhase: PhaseNumber): PhaseNumber[] {
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
  SKILLS.filter((skill) => skill.phase === targetPhase && !skill.optional).forEach((skill) => visit(skill.id));
  return [...required].sort((a, b) => a - b);
}

export function placementDefinition(targetPhase: PhaseNumber): PhaseCheckpointDefinition {
  return { phase: targetPhase, competencies: [], minItems: 1, maxItems: 1 };
}

export function recommendStartingPhase(targetPhase: PhaseNumber, evaluation: AssessmentEvaluation): PhaseNumber {
  return evaluation.recommendedPhase ?? targetPhase;
}

export function phaseCoreReady(phase: PhaseNumber, readySkillIds: ReadonlySet<string>): boolean {
  const required = SKILLS.filter((skill) => skill.phase === phase && !skill.optional && skill.assessed && skill.blocksPhaseCompletion);
  return required.length > 0 && required.every((skill) => readySkillIds.has(skill.id));
}
