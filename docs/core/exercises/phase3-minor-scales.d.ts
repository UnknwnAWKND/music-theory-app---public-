import type { Exercise, ExerciseGenerator } from "./types.js";
export declare const PHASE3_MINOR_SCALE_SKILL_IDS: readonly ["minor-scales.lesson-1-natural-formula", "minor-scales.lesson-2-natural-all-roots", "minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-4-melodic-minor", "minor-scales.lesson-5-instant-recall"];
export declare const PHASE3_MINOR_SCALE_GENERATORS: ReadonlyMap<string, ExerciseGenerator>;
export declare function phase3ExerciseForSkill(skillId: string, index?: number): Exercise | undefined;
export declare function phase3BalancedRootNames(count?: number): string[];
