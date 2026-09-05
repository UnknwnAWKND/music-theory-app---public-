import {
  activeExerciseSkillIds as priorActiveExerciseSkillIds,
  exerciseForSkill as priorExerciseForSkill,
  registerExerciseGenerator as priorRegisterExerciseGenerator,
} from "./catalog-block6.js";
import { PHASE6_CIRCLE_GENERATORS } from "./phase6-circle-of-fifths.js";
import type { Exercise, ExerciseGenerator } from "./types.js";

const PHASE6_GENERATORS = new Map(PHASE6_CIRCLE_GENERATORS);

export function registerExerciseGenerator(skillId: string, generator: ExerciseGenerator): void {
  if (skillId.startsWith("circle-of-fifths.")) PHASE6_GENERATORS.set(skillId, generator);
  else priorRegisterExerciseGenerator(skillId, generator);
}

export function exerciseForSkill(skillId: string, index = 0): Exercise | undefined {
  return PHASE6_GENERATORS.get(skillId)?.(index) ?? priorExerciseForSkill(skillId, index);
}

export function activeExerciseSkillIds(): string[] {
  return [...priorActiveExerciseSkillIds(), ...PHASE6_GENERATORS.keys()];
}
