import type { Exercise, ExerciseGenerator } from "./types.js";

/** Empty by design in Block 1. Future curriculum blocks register generators here. */
const GENERATORS = new Map<string, ExerciseGenerator>();

export function registerExerciseGenerator(skillId: string, generator: ExerciseGenerator): void {
  GENERATORS.set(skillId, generator);
}

export function exerciseForSkill(skillId: string, index = 0): Exercise | undefined {
  return GENERATORS.get(skillId)?.(index);
}

export function activeExerciseSkillIds(): string[] {
  return [...GENERATORS.keys()];
}
