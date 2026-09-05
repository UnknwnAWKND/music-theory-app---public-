import { activeExerciseSkillIds as priorActiveExerciseSkillIds, exerciseForSkill as priorExerciseForSkill, registerExerciseGenerator as priorRegisterExerciseGenerator, } from "./catalog-block6.js";
import { PHASE6_CIRCLE_GENERATORS } from "./phase6-circle-of-fifths.js";
const PHASE6_GENERATORS = new Map(PHASE6_CIRCLE_GENERATORS);
export function registerExerciseGenerator(skillId, generator) {
    if (skillId.startsWith("circle-of-fifths."))
        PHASE6_GENERATORS.set(skillId, generator);
    else
        priorRegisterExerciseGenerator(skillId, generator);
}
export function exerciseForSkill(skillId, index = 0) {
    return PHASE6_GENERATORS.get(skillId)?.(index) ?? priorExerciseForSkill(skillId, index);
}
export function activeExerciseSkillIds() {
    return [...priorActiveExerciseSkillIds(), ...PHASE6_GENERATORS.keys()];
}
