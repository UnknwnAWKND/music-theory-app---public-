import type { Exercise, ExerciseGenerator } from "./types.js";
export declare const PHASE5_RELATIVE_SKILL_IDS: readonly ["relatives.lesson-1-relative-major-minor", "relatives.lesson-2-same-chords-different-numbers", "relatives.lesson-3-fast-identification", "relatives.lesson-4-instant-recall"];
export declare const PHASE5_RELATIVE_GENERATORS: ReadonlyMap<string, ExerciseGenerator>;
export declare function phase5ExerciseForSkill(skillId: string, index?: number): Exercise | undefined;
