import { Note } from "./note.js";
export interface IntervalSpec {
    number: number;
    semitones: number;
    name: string;
}
export declare const INTERVALS: {
    readonly P1: {
        readonly number: 1;
        readonly semitones: 0;
        readonly name: "perfect unison";
    };
    readonly m2: {
        readonly number: 2;
        readonly semitones: 1;
        readonly name: "minor second";
    };
    readonly M2: {
        readonly number: 2;
        readonly semitones: 2;
        readonly name: "major second";
    };
    readonly A2: {
        readonly number: 2;
        readonly semitones: 3;
        readonly name: "augmented second";
    };
    readonly d3: {
        readonly number: 3;
        readonly semitones: 2;
        readonly name: "diminished third";
    };
    readonly m3: {
        readonly number: 3;
        readonly semitones: 3;
        readonly name: "minor third";
    };
    readonly M3: {
        readonly number: 3;
        readonly semitones: 4;
        readonly name: "major third";
    };
    readonly P4: {
        readonly number: 4;
        readonly semitones: 5;
        readonly name: "perfect fourth";
    };
    readonly A4: {
        readonly number: 4;
        readonly semitones: 6;
        readonly name: "augmented fourth";
    };
    readonly d5: {
        readonly number: 5;
        readonly semitones: 6;
        readonly name: "diminished fifth";
    };
    readonly P5: {
        readonly number: 5;
        readonly semitones: 7;
        readonly name: "perfect fifth";
    };
    readonly A5: {
        readonly number: 5;
        readonly semitones: 8;
        readonly name: "augmented fifth";
    };
    readonly d6: {
        readonly number: 6;
        readonly semitones: 7;
        readonly name: "diminished sixth";
    };
    readonly m6: {
        readonly number: 6;
        readonly semitones: 8;
        readonly name: "minor sixth";
    };
    readonly M6: {
        readonly number: 6;
        readonly semitones: 9;
        readonly name: "major sixth";
    };
    readonly d7: {
        readonly number: 7;
        readonly semitones: 9;
        readonly name: "diminished seventh";
    };
    readonly m7: {
        readonly number: 7;
        readonly semitones: 10;
        readonly name: "minor seventh";
    };
    readonly M7: {
        readonly number: 7;
        readonly semitones: 11;
        readonly name: "major seventh";
    };
    readonly P8: {
        readonly number: 8;
        readonly semitones: 12;
        readonly name: "perfect octave";
    };
};
export type IntervalName = keyof typeof INTERVALS;
export declare function intervalAbove(root: Note, interval: IntervalSpec): Note;
