import { Note } from "./note.js";
export declare const MAJOR_OFFSETS: readonly [0, 2, 4, 5, 7, 9, 11];
export declare const MAJOR_SCALE_STEP_PATTERN: readonly ["W", "W", "H", "W", "W", "W", "H"];
export declare const MAJOR_SCALE_DEGREE_INTERVALS: readonly ["P1", "M2", "M3", "P4", "P5", "M6", "M7", "P8"];
export declare const SCALE_DEGREE_NAMES: readonly ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading Tone"];
/**
 * One practical spelling for each of the 12 pitch classes. These are used to
 * balance recall practice by sound/piano position rather than over-sampling
 * enharmonic duplicates.
 */
export declare const MAJOR_PITCH_CLASS_ROOTS: readonly ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
/**
 * Conventional major-key spellings through seven accidentals. The three
 * enharmonic pairs (C#/Db, F#/Gb, B/Cb) intentionally coexist because their
 * written scales are different even when the piano pitches match.
 */
export declare const SUPPORTED_MAJOR_KEY_NAMES: readonly ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
export declare const NATURAL_MINOR_OFFSETS: readonly [0, 2, 3, 5, 7, 8, 10];
export declare const HARMONIC_MINOR_OFFSETS: readonly [0, 2, 3, 5, 7, 8, 11];
export declare const MELODIC_MINOR_ASC_OFFSETS: readonly [0, 2, 3, 5, 7, 9, 11];
export declare function scaleFromOffsets(tonic: Note, offsets: readonly number[]): Note[];
export declare function majorScale(tonic: Note): Note[];
export declare function majorScaleNames(tonicName: string): string[];
export declare function scaleDegreeName(degree: number): (typeof SCALE_DEGREE_NAMES)[number];
export declare function majorScaleDegreeNote(tonicName: string, degree: number): string;
export declare function majorScaleDegreeForNote(tonicName: string, noteName: string): number | undefined;
/** Return the practical 12-root spelling for a pitch class. */
export declare function majorRootForPitchClass(pc: number): (typeof MAJOR_PITCH_CLASS_ROOTS)[number];
/**
 * Alternate conventional written roots for pitch classes that have two common
 * major-key spellings. The first item is the balanced 12-root practice name.
 */
export declare function conventionalMajorRootsForPitchClass(pc: number): readonly string[];
export declare function naturalMinorScale(tonic: Note): Note[];
export declare function harmonicMinorScale(tonic: Note): Note[];
/** Ascending classical melodic minor; this is also the pitch collection commonly called jazz melodic minor. */
export declare function melodicMinorAscendingScale(tonic: Note): Note[];
/**
 * Classical melodic minor in traversal order, omitting the repeated octave tonic.
 * Ascending raises scale degrees 6 and 7; descending uses natural-minor 7 and 6.
 */
export declare function classicalMelodicMinor(tonic: Note): {
    ascending: Note[];
    descending: Note[];
};
/** In common jazz usage, melodic minor normally keeps raised 6 and 7 in both directions. */
export declare function jazzMelodicMinorScale(tonic: Note): Note[];
/** Relative minor tonic = scale degree 6 of the major scale. */
export declare function relativeMinorTonic(majorTonic: Note): Note;
/** Relative major tonic = scale degree 3 of the natural-minor collection. */
export declare function relativeMajorTonic(minorTonic: Note): Note;
