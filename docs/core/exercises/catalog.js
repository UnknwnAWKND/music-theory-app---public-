import { PHASE1_INTERVAL_GENERATORS } from "./phase1-intervals.js";
import { PHASE2_MAJOR_SCALE_GENERATORS } from "./phase2-major-scales.js";
const phase2Generators = [...PHASE2_MAJOR_SCALE_GENERATORS].map(([skillId, generator]) => {
    if (skillId !== "major-scales.lesson-4-instant-recall")
        return [skillId, generator];
    // Keep the very first 12 direct recall probes balanced across all 12 pitch
    // classes before the first embedded Phase 1 review. Later cross-phase review
    // continues on the normal schedule.
    const balancedRecall = (index) => generator(index === 9 ? 21 : index);
    return [skillId, balancedRecall];
});
const GENERATORS = new Map([
    ...PHASE1_INTERVAL_GENERATORS,
    ...phase2Generators,
]);
export function registerExerciseGenerator(skillId, generator) {
    GENERATORS.set(skillId, generator);
}
export function exerciseForSkill(skillId, index = 0) {
    return GENERATORS.get(skillId)?.(index);
}
export function activeExerciseSkillIds() {
    return [...GENERATORS.keys()];
}
