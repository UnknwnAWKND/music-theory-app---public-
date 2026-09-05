import { PHASE1_INTERVAL_GENERATORS } from "./phase1-intervals.js";
import { PHASE2_MAJOR_SCALE_GENERATORS } from "./phase2-major-scales.js";
import { PHASE3_MINOR_SCALE_GENERATORS } from "./phase3-minor-scales.js";
import { PHASE4_DIATONIC_CHORD_GENERATORS } from "./phase4-diatonic-chords.js";
import type { Exercise, ExerciseGenerator } from "./types.js";

const phase2Generators = [...PHASE2_MAJOR_SCALE_GENERATORS].map(([skillId, generator]) => {
  if (skillId !== "major-scales.lesson-4-instant-recall") return [skillId, generator] as const;
  const balancedRecall: ExerciseGenerator = (index) => generator(index === 9 ? 21 : index);
  return [skillId, balancedRecall] as const;
});

const phase3Generators = [...PHASE3_MINOR_SCALE_GENERATORS].map(([skillId, generator]) => {
  if (skillId !== "minor-scales.lesson-2-natural-all-roots") return [skillId, generator] as const;
  const balancedNaturalRoots: ExerciseGenerator = (index) => {
    const safe = Math.max(0, index);
    const block = Math.floor(safe / 48);
    const within = safe % 48;
    const taskCycle = Math.floor(within / 12);
    const rootIndex = within % 12;
    return generator((block * 48) + (rootIndex * 4) + taskCycle);
  };
  return [skillId, balancedNaturalRoots] as const;
});

const GENERATORS = new Map<string, ExerciseGenerator>([
  ...PHASE1_INTERVAL_GENERATORS,
  ...phase2Generators,
  ...phase3Generators,
  ...PHASE4_DIATONIC_CHORD_GENERATORS,
]);

export function registerExerciseGenerator(skillId: string, generator: ExerciseGenerator): void { GENERATORS.set(skillId, generator); }
export function exerciseForSkill(skillId: string, index = 0): Exercise | undefined { return GENERATORS.get(skillId)?.(index); }
export function activeExerciseSkillIds(): string[] { return [...GENERATORS.keys()]; }
