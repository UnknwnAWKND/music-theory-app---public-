import { allCheckpointDefinitions as priorCheckpointDefinitions, checkpointDefinition as priorCheckpointDefinition, } from "./checkpoints-block6.js";
export { evaluateCheckpoint, nextCheckpointCompetency, phaseCoreReady, placementDefinition, placementPrerequisitePhases, recommendStartingPhase, } from "./checkpoints-block6.js";
const PHASE6_CHECKPOINT = Object.freeze({
    phase: 6,
    minItems: 16,
    maxItems: 30,
    competencies: Object.freeze([
        {
            id: "circle-fifth-movement",
            label: "Move around the circle using the Phase 1 P5/P4 relationship in both directions",
            skillIds: ["circle-of-fifths.lesson-1-what-it-represents", "circle-of-fifths.lesson-4-far-side-transposition"],
            critical: true,
            minStrongEvidence: 2,
            minDistinctExamples: 2,
        },
        {
            id: "adjacent-six-of-seven",
            label: "Recognize that adjacent major keys share six of seven scale pitch classes",
            skillIds: ["circle-of-fifths.lesson-1-what-it-represents", "circle-of-fifths.lesson-2-close-vs-distant"],
            critical: true,
            minStrongEvidence: 2,
            minDistinctExamples: 2,
        },
        {
            id: "circle-proximity",
            label: "Distinguish immediate closely related key positions from farther key relationships",
            skillIds: ["circle-of-fifths.lesson-2-close-vs-distant", "circle-of-fifths.lesson-3-target-unfamiliar-keys"],
            critical: true,
            minStrongEvidence: 3,
            minDistinctExamples: 3,
        },
        {
            id: "relative-key-integration",
            label: "Use relative-major/minor placement correctly inside the circle map",
            skillIds: ["circle-of-fifths.lesson-2-close-vs-distant", "circle-of-fifths.lesson-3-target-unfamiliar-keys"],
            critical: true,
            minStrongEvidence: 2,
            minDistinctExamples: 2,
        },
        {
            id: "practical-transposition",
            label: "Preserve Roman-numeral relationships while rebuilding a progression in a new major key",
            skillIds: ["circle-of-fifths.lesson-3-target-unfamiliar-keys", "circle-of-fifths.lesson-4-far-side-transposition"],
            critical: true,
            minStrongEvidence: 3,
            minDistinctExamples: 3,
        },
        {
            id: "unfamiliar-key-application",
            label: "Deliberately select and use a substantially farther circle target rather than defaulting to a habitual neighbor",
            skillIds: ["circle-of-fifths.lesson-3-target-unfamiliar-keys", "circle-of-fifths.lesson-4-far-side-transposition"],
            critical: true,
            minStrongEvidence: 3,
            minDistinctExamples: 3,
            minDistinctSkills: 2,
        },
    ]),
});
export function checkpointDefinition(phase) {
    if (phase === 6)
        return PHASE6_CHECKPOINT;
    return priorCheckpointDefinition(phase);
}
export function allCheckpointDefinitions() {
    return [...priorCheckpointDefinitions(), PHASE6_CHECKPOINT];
}
