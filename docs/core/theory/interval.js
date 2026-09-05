import { accidentalForPitchClass, letterAt, letterIndex, mod, pitchClass, } from "./note.js";
export const INTERVALS = {
    P1: { number: 1, semitones: 0, name: "perfect unison", quality: "perfect" },
    m2: { number: 2, semitones: 1, name: "minor second", quality: "minor" },
    M2: { number: 2, semitones: 2, name: "major second", quality: "major" },
    A2: { number: 2, semitones: 3, name: "augmented second", quality: "augmented" },
    d3: { number: 3, semitones: 2, name: "diminished third", quality: "diminished" },
    m3: { number: 3, semitones: 3, name: "minor third", quality: "minor" },
    M3: { number: 3, semitones: 4, name: "major third", quality: "major" },
    P4: { number: 4, semitones: 5, name: "perfect fourth", quality: "perfect" },
    A4: { number: 4, semitones: 6, name: "augmented fourth", quality: "augmented" },
    d5: { number: 5, semitones: 6, name: "diminished fifth", quality: "diminished" },
    P5: { number: 5, semitones: 7, name: "perfect fifth", quality: "perfect" },
    A5: { number: 5, semitones: 8, name: "augmented fifth", quality: "augmented" },
    d6: { number: 6, semitones: 7, name: "diminished sixth", quality: "diminished" },
    m6: { number: 6, semitones: 8, name: "minor sixth", quality: "minor" },
    M6: { number: 6, semitones: 9, name: "major sixth", quality: "major" },
    d7: { number: 7, semitones: 9, name: "diminished seventh", quality: "diminished" },
    m7: { number: 7, semitones: 10, name: "minor seventh", quality: "minor" },
    M7: { number: 7, semitones: 11, name: "major seventh", quality: "major" },
    P8: { number: 8, semitones: 12, name: "perfect octave", quality: "perfect" },
};
/** Exact interval spellings taught in Phase 1. A4 and d5 are distinct spellings. */
export const PHASE1_INTERVAL_NAMES = Object.freeze([
    "P1", "P8", "P5", "P4", "M3", "m3", "M6", "m6", "M2", "m2", "M7", "m7", "A4", "d5",
]);
const INVERSION_MAP = Object.freeze({
    P1: "P8",
    P8: "P1",
    P5: "P4",
    P4: "P5",
    M3: "m6",
    m6: "M3",
    m3: "M6",
    M6: "m3",
    M2: "m7",
    m7: "M2",
    m2: "M7",
    M7: "m2",
    A4: "d5",
    d5: "A4",
});
export function intervalAbove(root, interval) {
    const targetLetter = letterAt(letterIndex(root.letter) + interval.number - 1);
    const desiredPc = mod(pitchClass(root) + interval.semitones, 12);
    return {
        letter: targetLetter,
        accidental: accidentalForPitchClass(targetLetter, desiredPc),
    };
}
export function invertSimpleIntervalNumber(number) {
    if (!Number.isInteger(number) || number < 1 || number > 8)
        throw new Error(`Simple interval number must be 1–8, received ${number}`);
    return 9 - number;
}
export function invertPhase1Interval(name) {
    return INVERSION_MAP[name];
}
export function inversionQuality(quality) {
    if (quality === "perfect")
        return "perfect";
    if (quality === "major")
        return "minor";
    if (quality === "minor")
        return "major";
    if (quality === "augmented")
        return "diminished";
    return "augmented";
}
export function isSimpleIntervalNumber(number) {
    return Number.isInteger(number) && number >= 1 && number <= 8;
}
export function simpleToCompoundIntervalNumber(number) {
    if (!isSimpleIntervalNumber(number))
        throw new Error(`Expected a simple interval number 1–8, received ${number}`);
    return number + 7;
}
