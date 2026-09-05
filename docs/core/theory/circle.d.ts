export type CircleDirection = "clockwise" | "counterclockwise";
export interface CirclePosition {
    index: number;
    majorAliases: readonly string[];
    relativeMinorAliases: readonly string[];
}
export interface CircleMove {
    from: string;
    to: string;
    direction: CircleDirection;
    circleSteps: 1;
    pitchClassSemitones: 7 | 5;
    relationship: "P5 up" | "P5 down / P4 up";
    enharmonicRespelling: boolean;
}
export interface TransposedRomanChord {
    roman: string;
    root: string;
    quality: string;
    notes: string[];
}
export interface SavedProgressionLike {
    form?: string;
    romanNumerals?: readonly string[];
}
export declare const CIRCLE_MAJOR_ORDER: readonly ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
export declare const CIRCLE_POSITIONS: readonly CirclePosition[];
export declare function circlePositionForMajorKey(keyName: string): CirclePosition;
export declare function circleMajorDisplayLabel(positionIndex: number): string;
export declare function circleMinorDisplayLabel(positionIndex: number): string;
export declare function circleDistanceBetweenMajors(a: string, b: string): number;
export declare function circleMoveMajor(keyName: string, direction: CircleDirection): CircleMove;
export declare function sharedMajorScalePitchClasses(a: string, b: string): number[];
export declare function sharedMajorScaleNoteCount(a: string, b: string): number;
export declare function areAdjacentMajorKeys(a: string, b: string): boolean;
export declare function relativeMinorAtMajorKey(majorName: string): string;
export declare function closelyRelatedKeysForMajor(homeMajor: string): {
    majors: string[];
    minors: string[];
};
export declare function isFarSideMajorTarget(homeMajor: string, targetMajor: string): boolean;
export declare function farSideMajorTargets(homeMajor: string): string[];
export declare function selectFarSideMajorTarget(homeMajor: string, index?: number): string;
export declare function parseMajorRomanProgression(input: string | readonly string[]): string[];
export declare function transposeMajorRomanProgression(targetMajor: string, progression: string | readonly string[]): TransposedRomanChord[];
export declare const PHASE6_FALLBACK_ROMAN_PROGRESSION: readonly ["I", "V", "vi", "IV"];
export declare function resolveFarSideProgression(saved?: SavedProgressionLike | null): {
    source: "saved" | "fallback";
    romanNumerals: string[];
};
