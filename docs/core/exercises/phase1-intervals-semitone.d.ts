import { type Phase1IntervalName } from "../theory/index.js";
import type { Exercise, ExerciseGenerator } from "./types.js";
export { phase1RootNames } from "./phase1-intervals.js";
export declare const PHASE1_INTERVAL_GENERATORS: ReadonlyMap<string, ExerciseGenerator>;
export declare function phase1ExerciseForSkill(skillId: string, index?: number): Exercise | undefined;
export declare function phase1SemitoneIntervalsForSkill(skillId: string): readonly Phase1IntervalName[];
