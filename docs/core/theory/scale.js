import { accidentalForPitchClass, formatNote, letterAt, letterIndex, mod, parseNote, pitchClass, } from "./note.js";
export const MAJOR_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
export const MAJOR_SCALE_STEP_PATTERN = ["W", "W", "H", "W", "W", "W", "H"];
export const MAJOR_SCALE_DEGREE_INTERVALS = ["P1", "M2", "M3", "P4", "P5", "M6", "M7", "P8"];
export const SCALE_DEGREE_NAMES = [
    "Tonic",
    "Supertonic",
    "Mediant",
    "Subdominant",
    "Dominant",
    "Submediant",
    "Leading Tone",
];
/**
 * One practical spelling for each of the 12 pitch classes. These are used to
 * balance recall practice by sound/piano position rather than over-sampling
 * enharmonic duplicates.
 */
export const MAJOR_PITCH_CLASS_ROOTS = [
    "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
];
/**
 * Conventional major-key spellings through seven accidentals. The three
 * enharmonic pairs (C#/Db, F#/Gb, B/Cb) intentionally coexist because their
 * written scales are different even when the piano pitches match.
 */
export const SUPPORTED_MAJOR_KEY_NAMES = [
    "C", "G", "D", "A", "E", "B", "F#", "C#",
    "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb",
];
export const NATURAL_MINOR_OFFSETS = [0, 2, 3, 5, 7, 8, 10];
export const HARMONIC_MINOR_OFFSETS = [0, 2, 3, 5, 7, 8, 11];
export const MELODIC_MINOR_ASC_OFFSETS = [0, 2, 3, 5, 7, 9, 11];
export function scaleFromOffsets(tonic, offsets) {
    return offsets.map((offset, degreeIndex) => {
        const letter = letterAt(letterIndex(tonic.letter) + degreeIndex);
        const desiredPc = mod(pitchClass(tonic) + offset, 12);
        return { letter, accidental: accidentalForPitchClass(letter, desiredPc) };
    });
}
export function majorScale(tonic) {
    return scaleFromOffsets(tonic, MAJOR_OFFSETS);
}
export function majorScaleNames(tonicName) {
    return majorScale(parseNote(tonicName)).map(formatNote);
}
export function scaleDegreeName(degree) {
    if (!Number.isInteger(degree) || degree < 1 || degree > 7)
        throw new Error(`Invalid scale degree: ${degree}`);
    return SCALE_DEGREE_NAMES[degree - 1];
}
export function majorScaleDegreeNote(tonicName, degree) {
    if (!Number.isInteger(degree) || degree < 1 || degree > 7)
        throw new Error(`Invalid scale degree: ${degree}`);
    return majorScaleNames(tonicName)[degree - 1];
}
export function majorScaleDegreeForNote(tonicName, noteName) {
    const notePc = pitchClass(parseNote(noteName));
    const scale = majorScale(parseNote(tonicName));
    const index = scale.findIndex((note) => pitchClass(note) === notePc);
    return index >= 0 ? index + 1 : undefined;
}
/** Return the practical 12-root spelling for a pitch class. */
export function majorRootForPitchClass(pc) {
    return MAJOR_PITCH_CLASS_ROOTS[mod(pc, 12)];
}
/**
 * Alternate conventional written roots for pitch classes that have two common
 * major-key spellings. The first item is the balanced 12-root practice name.
 */
export function conventionalMajorRootsForPitchClass(pc) {
    switch (mod(pc, 12)) {
        case 1: return ["Db", "C#"];
        case 6: return ["F#", "Gb"];
        case 11: return ["B", "Cb"];
        default: return [majorRootForPitchClass(pc)];
    }
}
export function naturalMinorScale(tonic) {
    return scaleFromOffsets(tonic, NATURAL_MINOR_OFFSETS);
}
export function harmonicMinorScale(tonic) {
    return scaleFromOffsets(tonic, HARMONIC_MINOR_OFFSETS);
}
/** Ascending classical melodic minor; this is also the pitch collection commonly called jazz melodic minor. */
export function melodicMinorAscendingScale(tonic) {
    return scaleFromOffsets(tonic, MELODIC_MINOR_ASC_OFFSETS);
}
/**
 * Classical melodic minor in traversal order, omitting the repeated octave tonic.
 * Ascending raises scale degrees 6 and 7; descending uses natural-minor 7 and 6.
 */
export function classicalMelodicMinor(tonic) {
    const ascending = melodicMinorAscendingScale(tonic);
    const natural = naturalMinorScale(tonic);
    return {
        ascending,
        descending: [natural[0], natural[6], natural[5], natural[4], natural[3], natural[2], natural[1]],
    };
}
/** In common jazz usage, melodic minor normally keeps raised 6 and 7 in both directions. */
export function jazzMelodicMinorScale(tonic) {
    return melodicMinorAscendingScale(tonic);
}
/** Relative minor tonic = scale degree 6 of the major scale. */
export function relativeMinorTonic(majorTonic) {
    return majorScale(majorTonic)[5];
}
/** Relative major tonic = scale degree 3 of the natural-minor collection. */
export function relativeMajorTonic(minorTonic) {
    return naturalMinorScale(minorTonic)[2];
}
