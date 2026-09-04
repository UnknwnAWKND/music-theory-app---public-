export type PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type EvidenceMode = "construct" | "identify" | "translate" | "transform" | "diagnose" | "apply";
export type CurriculumContentKind = "lesson" | "reference";
export type PriorityScore = 0 | 1 | 2 | 3 | 4 | 5;

export interface LearningPriorityProfile {
  foundationality: PriorityScore;
  automaticRecall: PriorityScore;
  conceptualUnderstanding: PriorityScore;
  reviewPriority: PriorityScore;
  longTermRecurrence: PriorityScore;
  prerequisiteImportance: PriorityScore;
}

export interface CurriculumPhaseDescriptor {
  phase: PhaseNumber;
  title: string;
  slug: string;
}

export interface SkillDefinition extends LearningPriorityProfile {
  id: string;
  phase: PhaseNumber;
  title: string;
  prerequisites: readonly string[];
  evidence: readonly EvidenceMode[];
  tags: readonly string[];
  contentKind: CurriculumContentKind;
  assessed: boolean;
  blocksPhaseCompletion: boolean;
  optional?: boolean;
  acquisitionRoundSize?: number;
}
