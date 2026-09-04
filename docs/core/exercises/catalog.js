/** Empty by design in Block 1. Future curriculum blocks register generators here. */
const GENERATORS = new Map();
export function registerExerciseGenerator(skillId, generator) {
    GENERATORS.set(skillId, generator);
}
export function exerciseForSkill(skillId, index = 0) {
    return GENERATORS.get(skillId)?.(index);
}
export function activeExerciseSkillIds() {
    return [...GENERATORS.keys()];
}
