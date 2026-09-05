import { PHASE1_INTERVAL_GENERATORS } from "./phase1-intervals.js";
import { PHASE2_MAJOR_SCALE_GENERATORS } from "./phase2-major-scales.js";
import type { Exercise, ExerciseGenerator } from "./types.js";

const GENERATORS = new Map<string, ExerciseGenerator>([
  ...PHASE1_INTERVAL_GENERATORS,
  ...PHASE2_MAJOR_SCALE_GENERATORS,
]);

export function registerExerciseGenerator(skillId: string, generator: ExerciseGenerator): void {
  GENERATORS.set(skillId, generator);
}

export function exerciseForSkill(skillId: string, index = 0): Exercise | undefined {
  return GENERATORS.get(skillId)?.(index);
}

export function activeExerciseSkillIds(): string[] {
  return [...GENERATORS.keys()];
}
