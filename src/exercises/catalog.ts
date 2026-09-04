import { PHASE1_INTERVAL_GENERATORS } from "./phase1-intervals.js";
import type { Exercise, ExerciseGenerator } from "./types.js";

const GENERATORS = new Map<string, ExerciseGenerator>(PHASE1_INTERVAL_GENERATORS);

export function registerExerciseGenerator(skillId: string, generator: ExerciseGenerator): void {
  GENERATORS.set(skillId, generator);
}

export function exerciseForSkill(skillId: string, index = 0): Exercise | undefined {
  return GENERATORS.get(skillId)?.(index);
}

export function activeExerciseSkillIds(): string[] {
  return [...GENERATORS.keys()];
}
