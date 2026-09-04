export declare const LETTERS: readonly ["C", "D", "E", "F", "G", "A", "B"];
export type Letter = (typeof LETTERS)[number];
export interface Note {
    letter: Letter;
    accidental: number;
}
export declare function mod(n: number, m: number): number;
export declare function normalizeNoteInput(input: string): string;
export declare function parseNote(input: string): Note;
export declare function pitchClass(note: Note): number;
export declare function formatNote(note: Note): string;
export declare function letterIndex(letter: Letter): number;
export declare function letterAt(index: number): Letter;
export declare function naturalPitchClass(letter: Letter): number;
export declare function accidentalForPitchClass(letter: Letter, desiredPc: number): number;
