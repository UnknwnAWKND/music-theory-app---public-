import { type IntervalName, type TriadQuality } from "../theory/index.js";
import type { Exercise } from "./types.js";
export declare const PRACTICAL_ROOTS: readonly ["C", "G", "D", "A", "E", "B", "F#", "F", "Bb", "Eb", "Ab", "Db", "Gb"];
/** All 15 conventional written major key signatures. */
export declare const CONVENTIONAL_MAJOR_TONICS: readonly ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
export declare function intervalBuildExercise(interval: IntervalName, index: number): Exercise<{
    root: string;
    interval: IntervalName;
    expected: string;
}>;
export declare function triadBuildExercise(quality: TriadQuality, index: number): Exercise<{
    root: string;
    quality: TriadQuality;
}>;
export declare function majorScaleExercise(index: number): Exercise<{
    tonic: string;
}>;
export declare function majorDegreeExercise(index: number): Exercise<{
    tonic: string;
    degree: number;
}>;
