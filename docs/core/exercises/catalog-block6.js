import { activeExerciseSkillIds as priorActiveExerciseSkillIds, exerciseForSkill as priorExerciseForSkill, registerExerciseGenerator as priorRegisterExerciseGenerator, } from "./catalog.js";
import { PHASE5_RELATIVE_GENERATORS } from "./phase5-relatives.js";
const PHASE5_GENERATORS = new Map(PHASE5_RELATIVE_GENERATORS);
export function registerExerciseGenerator(skillId, generator) {
    if (skillId.startsWith("relatives."))
        PHASE5_GENERATORS.set(skillId, generator);
    else
        priorRegisterExerciseGenerator(skillId, generator);
}
export function exerciseForSkill(skillId, index = 0) {
    return PHASE5_GENERATORS.get(skillId)?.(index) ?? priorExerciseForSkill(skillId, index);
}
export function activeExerciseSkillIds() {
    return [...priorActiveExerciseSkillIds(), ...PHASE5_GENERATORS.keys()];
}
