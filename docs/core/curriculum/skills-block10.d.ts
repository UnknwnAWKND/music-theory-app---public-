/**
 * Focused correction pass: only Phase 1 Lesson 1 gets a shorter acquisition
 * round. Curriculum order, prerequisites, priorities, and all other lesson
 * round sizes remain unchanged.
 */
export declare const CURRICULUM_VERSION: "rebuild-block8-final";
export declare const SKILLS: (import("./types.js").SkillDefinition | Readonly<{
    acquisitionRoundSize: 10;
    id: string;
    phase: import("./types.js").PhaseNumber;
    title: string;
    prerequisites: readonly string[];
    evidence: readonly import("./types.js").EvidenceMode[];
    tags: readonly string[];
    contentKind: import("./types.js").CurriculumContentKind;
    assessed: boolean;
    blocksPhaseCompletion: boolean;
    optional?: boolean;
    foundationality: import("./types.js").PriorityScore;
    automaticRecall: import("./types.js").PriorityScore;
    conceptualUnderstanding: import("./types.js").PriorityScore;
    reviewPriority: import("./types.js").PriorityScore;
    longTermRecurrence: import("./types.js").PriorityScore;
    prerequisiteImportance: import("./types.js").PriorityScore;
}>)[];
export declare const SKILL_BY_ID: Map<string, import("./types.js").SkillDefinition | Readonly<{
    acquisitionRoundSize: 10;
    id: string;
    phase: import("./types.js").PhaseNumber;
    title: string;
    prerequisites: readonly string[];
    evidence: readonly import("./types.js").EvidenceMode[];
    tags: readonly string[];
    contentKind: import("./types.js").CurriculumContentKind;
    assessed: boolean;
    blocksPhaseCompletion: boolean;
    optional?: boolean;
    foundationality: import("./types.js").PriorityScore;
    automaticRecall: import("./types.js").PriorityScore;
    conceptualUnderstanding: import("./types.js").PriorityScore;
    reviewPriority: import("./types.js").PriorityScore;
    longTermRecurrence: import("./types.js").PriorityScore;
    prerequisiteImportance: import("./types.js").PriorityScore;
}>>;
