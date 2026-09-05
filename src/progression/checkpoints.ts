import { SKILLS, SKILL_BY_ID, type PhaseNumber } from "../curriculum/index.js";

export type AssessmentKind = "checkpoint" | "placement";
export type AssessmentResponseMode = "recognition" | "constructed" | "discrimination" | "application";

export interface CompetencyDefinition {
  id: string;
  label: string;
  skillIds: readonly string[];
  critical?: boolean;
  minStrongEvidence?: number;
  minDistinctExamples?: number;
  minDistinctSkills?: number;
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

const PHASE1_CHECKPOINT: PhaseCheckpointDefinition = Object.freeze({
  phase: 1,
  minItems: 14,
  maxItems: 24,
  competencies: Object.freeze([
    { id: "perfect-construction", label: "Construct perfect unisons, octaves, 5ths, and 4ths", skillIds: ["intervals.lesson-1-unison-octave", "intervals.lesson-2-perfect-fifth", "intervals.lesson-3-perfect-fourth"], critical: true },
    { id: "major-minor-construction", label: "Construct major and minor 2nds, 3rds, 6ths, and 7ths", skillIds: ["intervals.lesson-4-thirds", "intervals.lesson-5-sixths", "intervals.lesson-6-seconds", "intervals.lesson-7-sevenths"], critical: true },
    { id: "interval-identification", label: "Identify exact interval number and quality from two notes", skillIds: SKILLS.filter((skill) => skill.phase === 1).map((skill) => skill.id), critical: true },
    { id: "interval-inversion", label: "Invert interval numbers and qualities accurately", skillIds: ["intervals.lesson-3-perfect-fourth", "intervals.lesson-5-sixths", "intervals.lesson-7-sevenths", "intervals.lesson-9-inversion-capstone"], critical: true },
    { id: "quality-discrimination", label: "Discriminate perfect, major, minor, augmented, and diminished qualities", skillIds: ["intervals.lesson-4-thirds", "intervals.lesson-5-sixths", "intervals.lesson-6-seconds", "intervals.lesson-7-sevenths", "intervals.lesson-8-tritone"], critical: true },
    { id: "tritone-spelling", label: "Distinguish and construct A4 versus d5 by spelling", skillIds: ["intervals.lesson-8-tritone", "intervals.lesson-10-cumulative"], critical: true },
    { id: "varied-root-spelling", label: "Construct intervals above natural, sharp, and flat roots", skillIds: ["intervals.lesson-8-tritone", "intervals.lesson-10-cumulative"], critical: true },
  ]),
});

const PHASE2_CHECKPOINT: PhaseCheckpointDefinition = Object.freeze({
  phase: 2,
  minItems: 14,
  maxItems: 24,
  competencies: Object.freeze([
    { id: "formula-understanding", label: "Apply W-W-H-W-W-W-H and connect it to tonic-based intervals", skillIds: ["major-scales.lesson-1-formula"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
    { id: "scale-construction", label: "Construct complete major scales and individual scale tones", skillIds: ["major-scales.lesson-1-formula", "major-scales.lesson-3-build-all-roots", "major-scales.lesson-4-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
    { id: "correct-spelling", label: "Use exact theoretical major-scale spelling rather than enharmonic substitutes", skillIds: ["major-scales.lesson-3-build-all-roots", "major-scales.lesson-4-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
    { id: "scale-degrees", label: "Translate scale-degree numbers, names, and notes accurately", skillIds: ["major-scales.lesson-2-degree-names", "major-scales.lesson-3-build-all-roots", "major-scales.lesson-4-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
    { id: "key-variety", label: "Demonstrate major-scale knowledge across varied roots, not only easy keys", skillIds: ["major-scales.lesson-3-build-all-roots", "major-scales.lesson-4-instant-recall"], critical: true, minStrongEvidence: 3, minDistinctExamples: 3 },
    { id: "instant-recall", label: "Recall major-scale information without formula scaffolding", skillIds: ["major-scales.lesson-4-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
  ]),
});

const PHASE3_CHECKPOINT: PhaseCheckpointDefinition = Object.freeze({
  phase: 3,
  minItems: 18,
  maxItems: 32,
  competencies: Object.freeze([
    {
      id: "natural-formula",
      label: "Apply W-H-W-W-H-W-W and connect natural minor to interval relationships",
      skillIds: ["minor-scales.lesson-1-natural-formula"],
      critical: true,
      minStrongEvidence: 2,
      minDistinctExamples: 2,
    },
    {
      id: "all-root-construction",
      label: "Construct natural-minor scales and scale tones across varied roots",
      skillIds: ["minor-scales.lesson-2-natural-all-roots", "minor-scales.lesson-5-instant-recall"],
      critical: true,
      minStrongEvidence: 3,
      minDistinctExamples: 3,
    },
    {
      id: "harmonic-alteration",
      label: "Transform natural minor into harmonic minor by raising degree 7",
      skillIds: ["minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-5-instant-recall"],
      critical: true,
      minStrongEvidence: 2,
      minDistinctExamples: 2,
    },
    {
      id: "melodic-alteration",
      label: "Apply raised 6 and 7 ascending and natural-minor pitches descending",
      skillIds: ["minor-scales.lesson-4-melodic-minor", "minor-scales.lesson-5-instant-recall"],
      critical: true,
      minStrongEvidence: 2,
      minDistinctExamples: 2,
    },
    {
      id: "correct-spelling",
      label: "Spell minor forms with the correct scale-degree letters and accidentals",
      skillIds: ["minor-scales.lesson-2-natural-all-roots", "minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-4-melodic-minor", "minor-scales.lesson-5-instant-recall"],
      critical: true,
      minStrongEvidence: 3,
      minDistinctExamples: 3,
    },
    {
      id: "form-discrimination",
      label: "Discriminate natural, harmonic, melodic ascending, and melodic descending forms",
      skillIds: ["minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-4-melodic-minor", "minor-scales.lesson-5-instant-recall"],
      critical: true,
      minStrongEvidence: 2,
      minDistinctExamples: 2,
    },
    {
      id: "leading-tone",
      label: "Identify the raised seventh as a leading tone and explain its tonic/dominant pull",
      skillIds: ["minor-scales.lesson-3-harmonic-minor"],
      critical: true,
      minStrongEvidence: 2,
      minDistinctExamples: 2,
    },
    {
      id: "augmented-second",
      label: "Identify the harmonic-minor augmented 2nd between degrees 6 and 7",
      skillIds: ["minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-4-melodic-minor"],
      critical: true,
      minStrongEvidence: 2,
      minDistinctExamples: 2,
    },
    {
      id: "key-variety",
      label: "Demonstrate minor-scale knowledge across varied roots rather than overusing A minor",
      skillIds: ["minor-scales.lesson-2-natural-all-roots", "minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-4-melodic-minor", "minor-scales.lesson-5-instant-recall"],
      critical: true,
      minStrongEvidence: 3,
      minDistinctExamples: 3,
    },
  ]),
});

export function checkpointDefinition(phase: PhaseNumber): PhaseCheckpointDefinition | undefined {
  if (phase === 1) return PHASE1_CHECKPOINT;
  if (phase === 2) return PHASE2_CHECKPOINT;
  if (phase === 3) return PHASE3_CHECKPOINT;
  return undefined;
}

export function allCheckpointDefinitions(): PhaseCheckpointDefinition[] {
  return [PHASE1_CHECKPOINT, PHASE2_CHECKPOINT, PHASE3_CHECKPOINT];
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
    const successful = [...strong, ...moderate];
    const distinctSkills = new Set(successful.map((result) => result.skillId)).size;
    const distinctExamples = new Set(successful.map((result) => result.exampleSignature)).size;
    const minStrong = competency.minStrongEvidence ?? 1;
    const minExamples = competency.minDistinctExamples ?? 1;
    const minSkills = competency.minDistinctSkills ?? 1;
    const enoughEvidence = strong.length >= minStrong
      || (minStrong === 1 && moderate.length >= 2 && distinctExamples >= 2);
    const demonstrated = failures === 0
      && enoughEvidence
      && distinctExamples >= minExamples
      && distinctSkills >= minSkills;
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

/** Placement prerequisites remain graph-derived; Phase 4+ placement content is not authored in Block 4. */
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
