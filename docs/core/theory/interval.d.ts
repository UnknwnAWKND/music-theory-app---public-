import { Note } from "./note.js";
export type IntervalQuality = "perfect" | "major" | "minor" | "augmented" | "diminished";
export interface IntervalSpec {
    number: number;
    semitones: number;
    name: string;
    quality: IntervalQuality;
}
export declare const INTERVALS: {
    readonly P1: {
        readonly number: 1;
        readonly semitones: 0;
        readonly name: "perfect unison";
        readonly quality: "perfect";
    };
    readonly m2: {
        readonly number: 2;
        readonly semitones: 1;
        readonly name: "minor second";
        readonly quality: "minor";
    };
    readonly M2: {
        readonly number: 2;
        readonly semitones: 2;
        readonly name: "major second";
        readonly quality: "major";
    };
    readonly A2: {
        readonly number: 2;
        readonly semitones: 3;
        readonly name: "augmented second";
        readonly quality: "augmented";
    };
    readonly d3: {
        readonly number: 3;
        readonly semitones: 2;
        readonly name: "diminished third";
        readonly quality: "diminished";
    };
    readonly m3: {
        readonly number: 3;
        readonly semitones: 3;
        readonly name: "minor third";
        readonly quality: "minor";
    };
    readonly M3: {
        readonly number: 3;
        readonly semitones: 4;
        readonly name: "major third";
        readonly quality: "major";
    };
    readonly P4: {
        readonly number: 4;
        readonly semitones: 5;
        readonly name: "perfect fourth";
        readonly quality: "perfect";
    };
    readonly A4: {
        readonly number: 4;
        readonly semitones: 6;
        readonly name: "augmented fourth";
        readonly quality: "augmented";
    };
    readonly d5: {
        readonly number: 5;
        readonly semitones: 6;
        readonly name: "diminished fifth";
        readonly quality: "diminished";
    };
    readonly P5: {
        readonly number: 5;
        readonly semitones: 7;
        readonly name: "perfect fifth";
        readonly quality: "perfect";
    };
    readonly A5: {
        readonly number: 5;
        readonly semitones: 8;
        readonly name: "augmented fifth";
        readonly quality: "augmented";
    };
    readonly d6: {
        readonly number: 6;
        readonly semitones: 7;
        readonly name: "diminished sixth";
        readonly quality: "diminished";
    };
    readonly m6: {
        readonly number: 6;
        readonly semitones: 8;
        readonly name: "minor sixth";
        readonly quality: "minor";
    };
    readonly M6: {
        readonly number: 6;
        readonly semitones: 9;
        readonly name: "major sixth";
        readonly quality: "major";
    };
    readonly d7: {
        readonly number: 7;
        readonly semitones: 9;
        readonly name: "diminished seventh";
        readonly quality: "diminished";
    };
    readonly m7: {
        readonly number: 7;
        readonly semitones: 10;
        readonly name: "minor seventh";
        readonly quality: "minor";
    };
    readonly M7: {
        readonly number: 7;
        readonly semitones: 11;
        readonly name: "major seventh";
        readonly quality: "major";
    };
    readonly P8: {
        readonly number: 8;
        readonly semitones: 12;
        readonly name: "perfect octave";
        readonly quality: "perfect";
    };
};
export type IntervalName = keyof typeof INTERVALS;
/** Exact interval spellings taught in Phase 1. A4 and d5 are distinct spellings. */
export declare const PHASE1_INTERVAL_NAMES: readonly ["P1", "P8", "P5", "P4", "M3", "m3", "M6", "m6", "M2", "m2", "M7", "m7", "A4", "d5"];
export type Phase1IntervalName = (typeof PHASE1_INTERVAL_NAMES)[number];
export declare function intervalAbove(root: Note, interval: IntervalSpec): Note;
export declare function invertSimpleIntervalNumber(number: number): number;
export declare function invertPhase1Interval(name: Phase1IntervalName): Phase1IntervalName;
export declare function inversionQuality(quality: IntervalQuality): IntervalQuality;
export declare function isSimpleIntervalNumber(number: number): boolean;
export declare function simpleToCompoundIntervalNumber(number: number): number;
