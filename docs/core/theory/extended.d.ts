import { type SeventhQuality, type TriadQuality } from "./chord.js";
import { type Note } from "./note.js";
export declare const MAJOR_ROMANS: readonly ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
export declare const MAJOR_TRIAD_QUALITIES: readonly TriadQuality[];
export declare const MAJOR_SEVENTH_QUALITIES: readonly SeventhQuality[];
export declare function majorRomanForDegree(degree: number): string;
export declare function majorDegreeForRoman(roman: string): number;
export declare function majorTriadForDegree(tonic: Note, degree: number): {
    root: Note;
    quality: TriadQuality;
    notes: Note[];
    roman: string;
};
export declare function majorProgression(tonic: Note, romans: readonly string[]): {
    root: Note;
    quality: TriadQuality;
    notes: Note[];
    roman: string;
}[];
export type ModeName = "ionian" | "dorian" | "phrygian" | "lydian" | "mixolydian" | "aeolian" | "locrian";
export declare const MODE_OFFSETS: Record<ModeName, readonly number[]>;
export declare function modeScale(tonic: Note, mode: ModeName): Note[];
export type ColorChordQuality = "sus2" | "sus4" | "majorAdd9" | "minorAdd9" | "major6" | "minor6" | "major69" | "minor69";
export declare function buildColorChord(root: Note, quality: ColorChordQuality): Note[];
export type NinthQuality = "major9" | "minor9" | "dominant9";
export declare function buildNinth(root: Note, quality: NinthQuality): Note[];
/** Full theoretical tertian stacks. Real voicings may omit members. */
export declare function buildDominantExtension(root: Note, extension: 11 | 13): Note[];
export interface KeySignatureInfo {
    tonic: string;
    accidentalType: "sharp" | "flat" | "none";
    count: number;
    alteredNotes: string[];
}
export declare function majorKeySignature(tonic: Note): KeySignatureInfo;
export declare const SHARP_ORDER: readonly ["F♯", "C♯", "G♯", "D♯", "A♯", "E♯", "B♯"];
export declare const FLAT_ORDER: readonly ["B♭", "E♭", "A♭", "D♭", "G♭", "C♭", "F♭"];
export declare const CIRCLE_SHARP_MAJOR: readonly ["C", "G", "D", "A", "E", "B", "F♯", "C♯"];
export declare const CIRCLE_FLAT_MAJOR: readonly ["C", "F", "B♭", "E♭", "A♭", "D♭", "G♭", "C♭"];
export declare function relativeMinorName(majorTonic: string): string;
export declare function relativeMajorName(minorTonic: string): string;
export declare function areEnharmonicNotes(a: Note, b: Note): boolean;
export declare const STANDARD_GUITAR_OPEN_PCS: readonly [4, 9, 2, 7, 11, 4];
export declare function guitarPitchClass(stringNumber: 1 | 2 | 3 | 4 | 5 | 6, fret: number): number;
export declare function canonicalGuitarNoteName(stringNumber: 1 | 2 | 3 | 4 | 5 | 6, fret: number): string;
export declare function samePitchClassName(answer: string, expectedPc: number): boolean;
/** Finds all scale degrees shared as pitch classes between two seven-note collections. */
export declare function sharedPitchClasses(a: readonly Note[], b: readonly Note[]): number[];
export declare function parallelNaturalMinorAlterations(tonic: Note): {
    degree: number;
    major: Note;
    minor: Note;
}[];
