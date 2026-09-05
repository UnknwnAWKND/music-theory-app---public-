import { allCheckpointDefinitions as priorCheckpointDefinitions, checkpointDefinition as priorCheckpointDefinition, } from "./checkpoints.js";
export { evaluateCheckpoint, nextCheckpointCompetency, phaseCoreReady, placementDefinition, placementPrerequisitePhases, recommendStartingPhase, } from "./checkpoints.js";
const PHASE5_CHECKPOINT = Object.freeze({
    phase: 5,
    minItems: 14,
    maxItems: 26,
    competencies: Object.freeze([
        {
            id: "relative-major-to-minor",
            label: "Identify the correctly spelled relative minor from a major key",
            skillIds: ["relatives.lesson-1-relative-major-minor", "relatives.lesson-3-fast-identification", "relatives.lesson-4-instant-recall"],
            critical: true,
            minStrongEvidence: 2,
            minDistinctExamples: 2,
        },
        {
            id: "relative-minor-to-major",
            label: "Identify the correctly spelled relative major from a minor key",
            skillIds: ["relatives.lesson-3-fast-identification", "relatives.lesson-4-instant-recall"],
            critical: true,
            minStrongEvidence: 2,
            minDistinctExamples: 2,
        },
        {
            id: "shared-natural-minor-collection",
            label: "Explain the shared major/natural-minor collection and different tonic without extending it to altered minor forms",
            skillIds: ["relatives.lesson-1-relative-major-minor", "relatives.lesson-2-same-chords-different-numbers", "relatives.lesson-4-instant-recall"],
            critical: true,
            minStrongEvidence: 2,
            minDistinctExamples: 2,
        },
        {
            id: "roman-renumbering",
            label: "Renumber the same diatonic chord under relative-major and natural-minor tonics",
            skillIds: ["relatives.lesson-2-same-chords-different-numbers", "relatives.lesson-4-instant-recall"],
            critical: true,
            minStrongEvidence: 3,
            minDistinctExamples: 3,
        },
        {
            id: "key-variety",
            label: "Apply relative-key identification and spelling across varied sharp and flat keys",
            skillIds: ["relatives.lesson-1-relative-major-minor", "relatives.lesson-2-same-chords-different-numbers", "relatives.lesson-3-fast-identification", "relatives.lesson-4-instant-recall"],
            critical: true,
            minStrongEvidence: 3,
            minDistinctExamples: 3,
            minDistinctSkills: 2,
        },
    ]),
});
export function checkpointDefinition(phase) {
    if (phase === 5)
        return PHASE5_CHECKPOINT;
    return priorCheckpointDefinition(phase);
}
export function allCheckpointDefinitions() {
    return [...priorCheckpointDefinitions(), PHASE5_CHECKPOINT];
}
