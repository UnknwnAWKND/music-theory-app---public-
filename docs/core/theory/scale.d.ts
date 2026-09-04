import { Note } from "./note.js";
export declare const MAJOR_OFFSETS: readonly [0, 2, 4, 5, 7, 9, 11];
export declare const NATURAL_MINOR_OFFSETS: readonly [0, 2, 3, 5, 7, 8, 10];
export declare const HARMONIC_MINOR_OFFSETS: readonly [0, 2, 3, 5, 7, 8, 11];
export declare const MELODIC_MINOR_ASC_OFFSETS: readonly [0, 2, 3, 5, 7, 9, 11];
export declare function scaleFromOffsets(tonic: Note, offsets: readonly number[]): Note[];
export declare function majorScale(tonic: Note): Note[];
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
