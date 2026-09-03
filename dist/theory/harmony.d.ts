import { SeventhQuality, TriadQuality } from "./chord.js";
import { Note } from "./note.js";
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
export declare function diatonicTriadsFromScale(scale: readonly Note[]): DiatonicTriad[];
export declare function majorDiatonicTriads(tonic: Note): DiatonicTriad[];
export declare function naturalMinorDiatonicTriads(tonic: Note): DiatonicTriad[];
export declare function harmonicMinorDiatonicTriads(tonic: Note): DiatonicTriad[];
export declare function melodicMinorAscendingDiatonicTriads(tonic: Note): DiatonicTriad[];
export declare function majorDiatonicSevenths(tonic: Note): DiatonicSeventh[];
