import { Note } from "./note.js";
export type TriadQuality = "major" | "minor" | "diminished" | "augmented";
export type SeventhQuality = "major7" | "minor7" | "dominant7" | "halfDiminished7" | "diminished7" | "minorMajor7" | "augmentedMajor7";
export declare function buildTriad(root: Note, quality: TriadQuality): Note[];
export declare function buildSeventh(root: Note, quality: SeventhQuality): Note[];
export declare function identifyTriad(notes: readonly Note[]): TriadQuality;
export declare function identifySeventh(notes: readonly Note[]): SeventhQuality;
