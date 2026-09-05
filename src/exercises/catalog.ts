import { PHASE1_INTERVAL_GENERATORS } from "./phase1-intervals.js";
import { PHASE2_MAJOR_SCALE_GENERATORS } from "./phase2-major-scales.js";
import { PHASE3_MINOR_SCALE_GENERATORS } from "./phase3-minor-scales.js";
import type { Exercise, ExerciseGenerator } from "./types.js";

const phase2Generators = [...PHASE2_MAJOR_SCALE_GENERATORS].map(([skillId, generator]) => {
  if (skillId !== "major-scales.lesson-4-instant-recall") return [skillId, generator] as const;
  // Keep the very first 12 direct recall probes balanced across all 12 pitch
  // classes before the first embedded Phase 1 review. Later cross-phase review
  // continues on the normal schedule.
  const balancedRecall: ExerciseGenerator = (index) => generator(index === 9 ? 21 : index);
  return [skillId, balancedRecall] as const;
});

const GENERATORS = new Map<string, ExerciseGenerator>([
  ...PHASE1_INTERVAL_GENERATORS,
  ...phase2Generators,
  ...PHASE3_MINOR_SCALE_GENERATORS,
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
