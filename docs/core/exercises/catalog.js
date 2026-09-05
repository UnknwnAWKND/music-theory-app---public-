import { PHASE1_INTERVAL_GENERATORS } from "./phase1-intervals.js";
const GENERATORS = new Map(PHASE1_INTERVAL_GENERATORS);
export function registerExerciseGenerator(skillId, generator) {
    GENERATORS.set(skillId, generator);
}
export function exerciseForSkill(skillId, index = 0) {
    return GENERATORS.get(skillId)?.(index);
}
export function activeExerciseSkillIds() {
    return [...GENERATORS.keys()];
}
