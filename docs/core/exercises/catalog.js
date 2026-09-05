import { PHASE1_INTERVAL_GENERATORS } from "./phase1-intervals.js";
import { PHASE2_MAJOR_SCALE_GENERATORS, phase2ExerciseForSkill } from "./phase2-major-scales.js";
import { PHASE3_MINOR_SCALE_GENERATORS } from "./phase3-minor-scales.js";
import { PHASE4_DIATONIC_CHORD_GENERATORS } from "./phase4-diatonic-chords.js";
const phase2Generators = [...PHASE2_MAJOR_SCALE_GENERATORS].map(([skillId, generator]) => {
    if (skillId !== "major-scales.lesson-4-instant-recall")
        return [skillId, generator];
    const balancedRecall = (index) => generator(index === 9 ? 21 : index);
    return [skillId, balancedRecall];
});
const phase3Generators = [...PHASE3_MINOR_SCALE_GENERATORS].map(([skillId, generator]) => {
    if (skillId !== "minor-scales.lesson-2-natural-all-roots")
        return [skillId, generator];
    const balancedNaturalRoots = (index) => {
        const safe = Math.max(0, index);
        const block = Math.floor(safe / 48);
        const within = safe % 48;
        const taskCycle = Math.floor(within / 12);
        const rootIndex = within % 12;
        return generator((block * 48) + (rootIndex * 4) + taskCycle);
    };
    return [skillId, balancedNaturalRoots];
});
const phase4Generators = [...PHASE4_DIATONIC_CHORD_GENERATORS].map(([skillId, generator]) => {
    const correctedFoundationReview = (index) => {
        const item = generator(index);
        const safe = Math.max(0, index);
        const intendedReviewSlot = safe > 0 && safe % 13 === 0 ? Math.floor(safe / 13) % 4 : -1;
        if (intendedReviewSlot !== 2 || !item.metadata?.crossPhaseReview)
            return item;
        // Phase 4 deliberately asks for a direct Phase 2 recall item in this slot.
        // The raw Phase 2 generator's index 29 is itself an embedded Phase 1 review,
        // so use a nearby direct major-scale recall probe instead of accidentally
        // converting the intended Phase 2 application back into another interval item.
        const review = phase2ExerciseForSkill("major-scales.lesson-4-instant-recall", 28);
        if (!review)
            return item;
        return {
            ...review,
            metadata: {
                ...(review.metadata ?? {}),
                crossPhaseReview: true,
                reviewPhase: 2,
                reviewReason: "apply-foundation-inside-harmony",
            },
        };
    };
    return [skillId, correctedFoundationReview];
});
const GENERATORS = new Map([
    ...PHASE1_INTERVAL_GENERATORS,
    ...phase2Generators,
    ...phase3Generators,
    ...phase4Generators,
]);
export function registerExerciseGenerator(skillId, generator) { GENERATORS.set(skillId, generator); }
export function exerciseForSkill(skillId, index = 0) { return GENERATORS.get(skillId)?.(index); }
export function activeExerciseSkillIds() { return [...GENERATORS.keys()]; }
