import type { Exercise } from "./types.js";
export declare function exerciseForSkill(skillId: string, index?: number): Exercise;
export declare function exerciseCoverage(): {
    skillId: string;
    exercise: Exercise<Record<string, unknown>>;
}[];
