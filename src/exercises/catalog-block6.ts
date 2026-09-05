import {
  activeExerciseSkillIds as priorActiveExerciseSkillIds,
  exerciseForSkill as priorExerciseForSkill,
  registerExerciseGenerator as priorRegisterExerciseGenerator,
} from "./catalog.js";
import { PHASE5_RELATIVE_GENERATORS } from "./phase5-relatives.js";
import type { Exercise, ExerciseGenerator } from "./types.js";

const PHASE5_GENERATORS = new Map(PHASE5_RELATIVE_GENERATORS);

export function registerExerciseGenerator(skillId: string, generator: ExerciseGenerator): void {
  if (skillId.startsWith("relatives.")) PHASE5_GENERATORS.set(skillId, generator);
  else priorRegisterExerciseGenerator(skillId, generator);
}

export function exerciseForSkill(skillId: string, index = 0): Exercise | undefined {
  return PHASE5_GENERATORS.get(skillId)?.(index) ?? priorExerciseForSkill(skillId, index);
}

export function activeExerciseSkillIds(): string[] {
  return [...priorActiveExerciseSkillIds(), ...PHASE5_GENERATORS.keys()];
}
