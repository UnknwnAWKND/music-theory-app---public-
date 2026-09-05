import { type DerivedChord } from "./harmony.js";
export type RelativeKeyMode = "major" | "minor";
export interface RelativeKeyPair {
    major: string;
    minor: string;
}
export interface RelativeChordRenumbering {
    chordRoot: string;
    triadQuality: DerivedChord["triadQuality"];
    majorDegree: number;
    majorRomanNumeral: string;
    minorDegree: number;
    minorRomanNumeral: string;
}
/** Conventional written relative pairs through seven accidentals. */
export declare const RELATIVE_KEY_PAIRS: readonly RelativeKeyPair[];
export declare function relativePairForKey(keyName: string, mode: RelativeKeyMode): RelativeKeyPair;
export declare function majorToRelativeMinorSemitones(majorTonicName: string): number;
export declare function minorToRelativeMajorSemitones(minorTonicName: string): number;
/** Exact shared-collection rule: relative major + relative NATURAL minor only. */
export declare function shareRelativeNaturalMinorCollection(majorTonicName: string, minorTonicName: string): boolean;
export declare function harmonicMinorMatchesRelativeMajorCollection(majorTonicName: string, minorTonicName: string): boolean;
export declare function melodicMinorMatchesRelativeMajorCollection(majorTonicName: string, minorTonicName: string): boolean;
export declare function majorDegreeToRelativeMinorDegree(degree: number): number;
export declare function minorDegreeToRelativeMajorDegree(degree: number): number;
export declare function relativeNaturalMinorChordRenumbering(majorTonicName: string): RelativeChordRenumbering[];
export declare function supportedRelativeMinorNames(): readonly string[];
