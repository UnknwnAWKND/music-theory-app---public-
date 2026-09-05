import type { Exercise, ExerciseGenerator } from "./types.js";
export declare const PHASE6_CIRCLE_SKILL_IDS: readonly ["circle-of-fifths.lesson-1-what-it-represents", "circle-of-fifths.lesson-2-close-vs-distant", "circle-of-fifths.lesson-3-target-unfamiliar-keys", "circle-of-fifths.lesson-4-far-side-transposition"];
export declare const PHASE6_CIRCLE_GENERATORS: ReadonlyMap<string, ExerciseGenerator>;
export declare function phase6ExerciseForSkill(skillId: string, index?: number): Exercise | undefined;
