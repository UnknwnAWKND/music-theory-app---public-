import type { Exercise, ExerciseGenerator } from "./types.js";
export declare function registerExerciseGenerator(skillId: string, generator: ExerciseGenerator): void;
export declare function exerciseForSkill(skillId: string, index?: number): Exercise | undefined;
export declare function activeExerciseSkillIds(): string[];
