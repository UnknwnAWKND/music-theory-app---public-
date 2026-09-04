export type PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type EvidenceMode =
  | "construct"
  | "identify"
  | "translate"
  | "transform"
  | "diagnose"
  | "apply";

export type CurriculumPriority = "foundation" | "core" | "support" | "extension";
export type CurriculumThread = "interval" | "scale" | "triad" | "number-system" | "function" | "chord-tone" | "guitar";

export interface SkillDefinition {
  id: string;
  phase: PhaseNumber;
  title: string;
  prerequisites: readonly string[];
  evidence: readonly EvidenceMode[];
  tags?: readonly string[];
  optional?: boolean;
  /** Importance controls planning priority; it does not itself grant READY/RETAINED. */
  priority?: CurriculumPriority;
  /** Relative priority when multiple legitimate reviews are due at the same time. */
  recurrenceWeight?: number;
  /** Suggested first acquisition round. The round is a UX container, not a mastery threshold. */
  acquisitionRoundSize?: number;
  /** Cross-phase spiral thread this skill contributes to. */
  thread?: CurriculumThread;
}

export interface GraphValidationResult {
  ok: boolean;
  missingPrerequisites: Array<{ skillId: string; prerequisiteId: string }>;
  duplicateIds: string[];
  cycles: string[][];
}
