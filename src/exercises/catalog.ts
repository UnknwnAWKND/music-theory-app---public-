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

const phase3Generators = [...PHASE3_MINOR_SCALE_GENERATORS].map(([skillId, generator]) => {
  if (skillId !== "minor-scales.lesson-2-natural-all-roots") return [skillId, generator] as const;

  // The underlying Lesson 2 generator stores four task types beside each root.
  // Interleave those groups here so every 12-question block visits all 12 pitch
  // classes. This keeps the adaptive selector from accidentally skipping a root
  // during the 48-question acquisition round while preserving all four task
  // types per root across the complete round. Later 48-question blocks retain
  // the generator's alternate conventional spellings.
  const balancedNaturalRoots: ExerciseGenerator = (index) => {
    const safe = Math.max(0, index);
    const block = Math.floor(safe / 48);
    const within = safe % 48;
    const taskCycle = Math.floor(within / 12);
    const rootIndex = within % 12;
    const mappedIndex = (block * 48) + (rootIndex * 4) + taskCycle;
    return generator(mappedIndex);
  };
  return [skillId, balancedNaturalRoots] as const;
});

const GENERATORS = new Map<string, ExerciseGenerator>([
  ...PHASE1_INTERVAL_GENERATORS,
  ...phase2Generators,
  ...phase3Generators,
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
