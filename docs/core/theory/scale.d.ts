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
/** Conventional major-key spellings through seven accidentals. */
export declare const SUPPORTED_MAJOR_KEY_NAMES: readonly ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
export declare const NATURAL_MINOR_OFFSETS: readonly [0, 2, 3, 5, 7, 8, 10];
export declare const HARMONIC_MINOR_OFFSETS: readonly [0, 2, 3, 5, 7, 8, 11];
export declare const MELODIC_MINOR_ASC_OFFSETS: readonly [0, 2, 3, 5, 7, 9, 11];
export declare const NATURAL_MINOR_STEP_PATTERN: readonly ["W", "H", "W", "W", "H", "W", "W"];
export declare const HARMONIC_MINOR_SEMITONE_STEPS: readonly [2, 1, 2, 2, 1, 3, 1];
export declare const MELODIC_MINOR_ASC_STEP_PATTERN: readonly ["W", "H", "W", "W", "W", "W", "H"];
export declare const NATURAL_MINOR_DEGREE_INTERVALS: readonly ["P1", "M2", "m3", "P4", "P5", "m6", "m7", "P8"];
export declare const HARMONIC_MINOR_DEGREE_INTERVALS: readonly ["P1", "M2", "m3", "P4", "P5", "m6", "M7", "P8"];
export declare const MELODIC_MINOR_ASC_DEGREE_INTERVALS: readonly ["P1", "M2", "m3", "P4", "P5", "M6", "M7", "P8"];
/**
 * One practical minor-key spelling for each pitch class. These defaults favor
 * conventional spellings with manageable key signatures while still balancing
 * all 12 piano pitch classes.
 */
export declare const MINOR_PITCH_CLASS_ROOTS: readonly ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];
/**
 * Conventional written minor keys through seven accidentals. The three pairs
 * G#/Ab, D#/Eb, and A#/Bb are enharmonic on piano but require different exact
 * scale spellings.
 */
export declare const SUPPORTED_MINOR_KEY_NAMES: readonly ["A", "E", "B", "F#", "C#", "G#", "D#", "A#", "D", "G", "C", "F", "Bb", "Eb", "Ab"];
export declare function scaleFromOffsets(tonic: Note, offsets: readonly number[]): Note[];
export declare function majorScale(tonic: Note): Note[];
export declare function majorScaleNames(tonicName: string): string[];
export declare function scaleDegreeName(degree: number): (typeof SCALE_DEGREE_NAMES)[number];
export declare function majorScaleDegreeNote(tonicName: string, degree: number): string;
export declare function majorScaleDegreeForNote(tonicName: string, noteName: string): number | undefined;
/** Return the practical 12-root spelling for a pitch class. */
export declare function majorRootForPitchClass(pc: number): (typeof MAJOR_PITCH_CLASS_ROOTS)[number];
/** Alternate conventional written major roots for enharmonic pitch classes. */
export declare function conventionalMajorRootsForPitchClass(pc: number): readonly string[];
export declare function naturalMinorScale(tonic: Note): Note[];
export declare function naturalMinorScaleNames(tonicName: string): string[];
export declare function harmonicMinorScale(tonic: Note): Note[];
export declare function harmonicMinorScaleNames(tonicName: string): string[];
/** Ascending classical melodic minor: natural minor with raised degrees 6 and 7. */
export declare function melodicMinorAscendingScale(tonic: Note): Note[];
export declare function melodicMinorAscendingScaleNames(tonicName: string): string[];
/**
 * Classical melodic minor in traversal order, omitting the repeated ending
 * tonic so each answer uses seven scale-degree names. Ascending raises 6 and 7;
 * descending returns to natural minor for this curriculum.
 */
export declare function classicalMelodicMinor(tonic: Note): {
    ascending: Note[];
    descending: Note[];
};
export declare function classicalMelodicMinorNames(tonicName: string): {
    ascending: string[];
    descending: string[];
};
/** In common jazz usage, melodic minor normally keeps raised 6 and 7 in both directions. */
export declare function jazzMelodicMinorScale(tonic: Note): Note[];
/** The harmonic-minor leading tone is the raised seventh, one semitone below tonic. */
export declare function minorLeadingToneName(tonicName: string): string;
/**
 * Degree 6 -> raised degree 7 in harmonic minor is an augmented second:
 * adjacent letter names spanning three semitones.
 */
export declare function harmonicMinorAugmentedSecond(tonicName: string): {
    degree6: string;
    degree7: string;
    semitones: 3;
    interval: "A2";
};
export declare function minorScaleDegreeNote(tonicName: string, form: "natural" | "harmonic" | "melodic-ascending", degree: number): string;
export declare function minorRootForPitchClass(pc: number): (typeof MINOR_PITCH_CLASS_ROOTS)[number];
export declare function conventionalMinorRootsForPitchClass(pc: number): readonly string[];
/** Relative minor tonic = scale degree 6 of the major scale. */
export declare function relativeMinorTonic(majorTonic: Note): Note;
/** Relative major tonic = scale degree 3 of the natural-minor collection. */
export declare function relativeMajorTonic(minorTonic: Note): Note;
