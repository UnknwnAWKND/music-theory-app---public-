import { accidentalForPitchClass, letterAt, letterIndex, mod, pitchClass, } from "./note.js";
export const INTERVALS = {
    P1: { number: 1, semitones: 0, name: "perfect unison" },
    m2: { number: 2, semitones: 1, name: "minor second" },
    M2: { number: 2, semitones: 2, name: "major second" },
    A2: { number: 2, semitones: 3, name: "augmented second" },
    d3: { number: 3, semitones: 2, name: "diminished third" },
    m3: { number: 3, semitones: 3, name: "minor third" },
    M3: { number: 3, semitones: 4, name: "major third" },
    P4: { number: 4, semitones: 5, name: "perfect fourth" },
    A4: { number: 4, semitones: 6, name: "augmented fourth" },
    d5: { number: 5, semitones: 6, name: "diminished fifth" },
    P5: { number: 5, semitones: 7, name: "perfect fifth" },
    A5: { number: 5, semitones: 8, name: "augmented fifth" },
    d6: { number: 6, semitones: 7, name: "diminished sixth" },
    m6: { number: 6, semitones: 8, name: "minor sixth" },
    M6: { number: 6, semitones: 9, name: "major sixth" },
    d7: { number: 7, semitones: 9, name: "diminished seventh" },
    m7: { number: 7, semitones: 10, name: "minor seventh" },
    M7: { number: 7, semitones: 11, name: "major seventh" },
    P8: { number: 8, semitones: 12, name: "perfect octave" },
};
export function intervalAbove(root, interval) {
    const targetLetter = letterAt(letterIndex(root.letter) + interval.number - 1);
    const desiredPc = mod(pitchClass(root) + interval.semitones, 12);
    return {
        letter: targetLetter,
        accidental: accidentalForPitchClass(targetLetter, desiredPc),
    };
}
