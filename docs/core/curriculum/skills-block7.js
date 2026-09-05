import { SKILLS as PRIOR_SKILLS } from "./skills-block6.js";
export const CURRICULUM_VERSION = "rebuild-block7-phase6-circle-of-fifths";
const phase6Shared = {
    phase: 6,
    contentKind: "lesson",
    assessed: true,
    blocksPhaseCompletion: true,
    foundationality: 4,
    automaticRecall: 4,
    reviewPriority: 4,
    longTermRecurrence: 4,
    prerequisiteImportance: 4,
};
const PHASE6_SKILLS = Object.freeze([
    {
        ...phase6Shared,
        id: "circle-of-fifths.lesson-1-what-it-represents",
        title: "What the Circle Represents",
        prerequisites: ["relatives.lesson-4-instant-recall"],
        evidence: ["identify", "transform", "apply"],
        tags: ["circle-of-fifths", "perfect-fifth", "perfect-fourth", "adjacent-keys", "shared-notes", "key-signatures"],
        conceptualUnderstanding: 5,
        acquisitionRoundSize: 30,
    },
    {
        ...phase6Shared,
        id: "circle-of-fifths.lesson-2-close-vs-distant",
        title: "Closely Related vs Distant Keys",
        prerequisites: ["circle-of-fifths.lesson-1-what-it-represents"],
        evidence: ["identify", "diagnose", "apply"],
        tags: ["circle-of-fifths", "closely-related", "distant-keys", "shared-material", "relative-keys"],
        automaticRecall: 3,
        conceptualUnderstanding: 5,
        acquisitionRoundSize: 30,
    },
    {
        ...phase6Shared,
        id: "circle-of-fifths.lesson-3-target-unfamiliar-keys",
        title: "Use the Circle to Target Unfamiliar Keys",
        prerequisites: ["circle-of-fifths.lesson-2-close-vs-distant"],
        evidence: ["identify", "transform", "apply"],
        tags: ["circle-of-fifths", "key-selection", "unfamiliar-keys", "major-scales", "minor-scales", "roman-numerals", "relative-keys"],
        conceptualUnderstanding: 5,
        acquisitionRoundSize: 36,
    },
    {
        ...phase6Shared,
        id: "circle-of-fifths.lesson-4-far-side-transposition",
        title: "Practical Far-Side Transposition Drill",
        prerequisites: ["circle-of-fifths.lesson-3-target-unfamiliar-keys"],
        evidence: ["transform", "translate", "apply"],
        tags: ["circle-of-fifths", "transposition", "roman-numerals", "far-side", "progressions", "production", "piano"],
        conceptualUnderstanding: 5,
        acquisitionRoundSize: 48,
    },
]);
export const SKILLS = Object.freeze([...PRIOR_SKILLS, ...PHASE6_SKILLS]);
export const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]));
