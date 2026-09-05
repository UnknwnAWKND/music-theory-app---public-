import type { Exercise, ExerciseGenerator } from "./types.js";
export declare const PHASE1_INTERVAL_GENERATORS: ReadonlyMap<string, ExerciseGenerator>;
export declare function phase1ExerciseForSkill(skillId: string, index?: number): Exercise | undefined;
export declare function phase1RootNames(): readonly string[];
