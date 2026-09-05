import { SKILLS as PRIOR_SKILLS } from "./skills.js";
import type { SkillDefinition } from "./types.js";

export const CURRICULUM_VERSION = "rebuild-block6-phase5-relatives" as const;

const phase5Shared = {
  phase: 5 as const,
  contentKind: "lesson" as const,
  assessed: true,
  blocksPhaseCompletion: true,
  foundationality: 4 as const,
  automaticRecall: 4 as const,
  reviewPriority: 4 as const,
  longTermRecurrence: 4 as const,
  prerequisiteImportance: 4 as const,
};

const PHASE5_SKILLS: readonly SkillDefinition[] = Object.freeze([
  {
    ...phase5Shared,
    id: "relatives.lesson-1-relative-major-minor",
    title: "Relative Major / Minor",
    prerequisites: ["diatonic-chords.lesson-10-own-progressions"],
    evidence: ["identify", "translate", "apply"],
    tags: ["relatives", "relative-major", "relative-minor", "natural-minor", "shared-key-signature", "tonic"],
    conceptualUnderstanding: 5,
    acquisitionRoundSize: 30,
  },
  {
    ...phase5Shared,
    id: "relatives.lesson-2-same-chords-different-numbers",
    title: "Same Chords, Different Numbers",
    prerequisites: ["relatives.lesson-1-relative-major-minor"],
    evidence: ["translate", "diagnose", "apply"],
    tags: ["relatives", "natural-minor", "diatonic-chords", "roman-numerals", "tonic-reinterpretation"],
    automaticRecall: 3,
    conceptualUnderstanding: 5,
    acquisitionRoundSize: 36,
  },
  {
    ...phase5Shared,
    id: "relatives.lesson-3-fast-identification",
    title: "Fast Identification",
    prerequisites: ["relatives.lesson-2-same-chords-different-numbers"],
    evidence: ["identify", "transform", "apply"],
    tags: ["relatives", "minor-third", "m3", "major-to-minor", "minor-to-major", "enharmonic-spelling", "automaticity"],
    automaticRecall: 5,
    conceptualUnderstanding: 4,
    acquisitionRoundSize: 36,
  },
  {
    ...phase5Shared,
    id: "relatives.lesson-4-instant-recall",
    title: "Relative-Key Instant Recall Drill",
    prerequisites: ["relatives.lesson-3-fast-identification"],
    evidence: ["identify", "transform", "translate", "apply"],
    tags: ["relatives", "automaticity", "all-key-pairs", "enharmonic-spelling", "mixed-practice", "distributed-retrieval"],
    automaticRecall: 5,
    conceptualUnderstanding: 4,
    acquisitionRoundSize: 48,
  },
]);

export const SKILLS: readonly SkillDefinition[] = Object.freeze([...PRIOR_SKILLS, ...PHASE5_SKILLS]);
export const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]));
