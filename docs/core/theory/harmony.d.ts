import { type SeventhQuality, type TriadQuality } from "./chord.js";
import { type Note } from "./note.js";
export type HarmonyScaleForm = "major" | "natural-minor" | "harmonic-minor" | "melodic-minor-ascending";
export type BasicChordFunction = "tonic" | "predominant" | "dominant" | "context-dependent";
export interface DiatonicTriad {
    degree: number;
    notes: [Note, Note, Note];
    quality: TriadQuality;
}
export interface DiatonicSeventh {
    degree: number;
    notes: [Note, Note, Note, Note];
    quality: SeventhQuality;
}
export interface DerivedChord {
    tonic: string;
    form: HarmonyScaleForm;
    degree: number;
    notes: string[];
    root: string;
    triadQuality: TriadQuality;
    seventhQuality?: SeventhQuality;
    romanNumeral: string;
    chordSymbol: string;
}
export interface ChordTypeReferenceRow {
    id: TriadQuality | SeventhQuality;
    chordName: string;
    thirdQuality: string;
    fifthQuality: string;
    seventhQuality?: string;
    intervalFormula: string;
    example: string;
}
export interface StructuredProgressionChordInput {
    root: string;
    quality: TriadQuality;
}
export interface StructuredProgressionAnalysis {
    input: StructuredProgressionChordInput;
    diatonic: boolean;
    romanNumeral?: string;
    expectedRootSpelling?: string;
    explanation: string;
}
export declare function diatonicTriadsFromScale(scale: readonly Note[]): DiatonicTriad[];
export declare function diatonicSeventhsFromScale(scale: readonly Note[]): DiatonicSeventh[];
export declare function majorDiatonicTriads(tonic: Note): DiatonicTriad[];
export declare function naturalMinorDiatonicTriads(tonic: Note): DiatonicTriad[];
export declare function harmonicMinorDiatonicTriads(tonic: Note): DiatonicTriad[];
export declare function melodicMinorAscendingDiatonicTriads(tonic: Note): DiatonicTriad[];
export declare function majorDiatonicSevenths(tonic: Note): DiatonicSeventh[];
export declare function naturalMinorDiatonicSevenths(tonic: Note): DiatonicSeventh[];
export declare function harmonicMinorDiatonicSevenths(tonic: Note): DiatonicSeventh[];
export declare function melodicMinorAscendingDiatonicSevenths(tonic: Note): DiatonicSeventh[];
export declare function scaleForHarmony(tonicName: string, form: HarmonyScaleForm): Note[];
export declare function romanNumeralForTriad(degree: number, quality: TriadQuality): string;
export declare function romanNumeralForSeventh(degree: number, quality: SeventhQuality): string;
export declare function chordSymbol(root: string, triad: TriadQuality, seventh?: SeventhQuality): string;
export declare function deriveDiatonicChord(tonicName: string, form: HarmonyScaleForm, degree: number, seventh?: boolean): DerivedChord;
export declare function deriveDiatonicHarmony(tonicName: string, form: HarmonyScaleForm, seventh?: boolean): DerivedChord[];
export declare function triadQualityPattern(form: HarmonyScaleForm): TriadQuality[];
export declare function seventhQualityPattern(form: HarmonyScaleForm): SeventhQuality[];
export declare function basicChordFunction(degree: number): BasicChordFunction;
export declare function functionExplanation(degree: number): string;
export declare const CHORD_TYPE_REFERENCE: readonly ChordTypeReferenceRow[];
export declare function transposeRomanProgression(tonicName: string, form: HarmonyScaleForm, degrees: readonly number[]): DerivedChord[];
export declare function analyzeStructuredProgression(tonicName: string, form: HarmonyScaleForm, inputs: readonly StructuredProgressionChordInput[]): StructuredProgressionAnalysis[];
