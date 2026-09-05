import type { Exercise, ExerciseGenerator } from "./types.js";
export declare const PHASE2_MAJOR_SCALE_SKILL_IDS: readonly ["major-scales.lesson-1-formula", "major-scales.lesson-2-degree-names", "major-scales.lesson-3-build-all-roots", "major-scales.lesson-4-instant-recall"];
export declare const PHASE2_MAJOR_SCALE_GENERATORS: ReadonlyMap<string, ExerciseGenerator>;
export declare function phase2ExerciseForSkill(skillId: string, index?: number): Exercise | undefined;
export declare function phase2BalancedRootNames(count?: number): string[];
