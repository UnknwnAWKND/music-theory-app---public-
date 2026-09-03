import { identifySeventh, identifyTriad, SeventhQuality, TriadQuality } from "./chord.js";
import { Note } from "./note.js";
import {
  harmonicMinorScale,
  majorScale,
  melodicMinorAscendingScale,
  naturalMinorScale,
} from "./scale.js";

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

export function diatonicTriadsFromScale(scale: readonly Note[]): DiatonicTriad[] {
  if (scale.length !== 7) throw new Error("Diatonic triad generation requires a seven-note scale");
  return scale.map((_, i) => {
    const notes: [Note, Note, Note] = [scale[i], scale[(i + 2) % 7], scale[(i + 4) % 7]];
    return { degree: i + 1, notes, quality: identifyTriad(notes) };
  });
}

export function majorDiatonicTriads(tonic: Note): DiatonicTriad[] {
  return diatonicTriadsFromScale(majorScale(tonic));
}

export function naturalMinorDiatonicTriads(tonic: Note): DiatonicTriad[] {
  return diatonicTriadsFromScale(naturalMinorScale(tonic));
}

export function harmonicMinorDiatonicTriads(tonic: Note): DiatonicTriad[] {
  return diatonicTriadsFromScale(harmonicMinorScale(tonic));
}

export function melodicMinorAscendingDiatonicTriads(tonic: Note): DiatonicTriad[] {
  return diatonicTriadsFromScale(melodicMinorAscendingScale(tonic));
}

export function majorDiatonicSevenths(tonic: Note): DiatonicSeventh[] {
  const scale = majorScale(tonic);
  return scale.map((_, i) => {
    const notes: [Note, Note, Note, Note] = [
      scale[i],
      scale[(i + 2) % 7],
      scale[(i + 4) % 7],
      scale[(i + 6) % 7],
    ];
    return { degree: i + 1, notes, quality: identifySeventh(notes) };
  });
}
