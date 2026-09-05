import type { Exercise, ExerciseGenerator } from "./types.js";
export declare const PHASE4_DIATONIC_CHORD_SKILL_IDS: readonly ["diatonic-chords.lesson-1-stacking-thirds", "diatonic-chords.lesson-2-major-triads", "diatonic-chords.lesson-3-natural-minor-triads", "diatonic-chords.lesson-4-harmonic-minor-triads", "diatonic-chords.lesson-5-melodic-minor-triads", "diatonic-chords.lesson-6-seventh-chords", "diatonic-chords.lesson-8-function", "diatonic-chords.lesson-9-progressions", "diatonic-chords.lesson-10-own-progressions"];
export declare const PHASE4_DIATONIC_CHORD_GENERATORS: ReadonlyMap<string, ExerciseGenerator>;
export declare function phase4ExerciseForSkill(skillId: string, index?: number): Exercise | undefined;
