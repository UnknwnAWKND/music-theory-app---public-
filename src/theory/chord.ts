import { INTERVALS, intervalAbove } from "./interval.js";
import { Note, mod, pitchClass } from "./note.js";

export type TriadQuality = "major" | "minor" | "diminished" | "augmented";
export type SeventhQuality =
  | "major7"
  | "minor7"
  | "dominant7"
  | "halfDiminished7"
  | "diminished7";

export function buildTriad(root: Note, quality: TriadQuality): Note[] {
  const formulas = {
    major: [INTERVALS.P1, INTERVALS.M3, INTERVALS.P5],
    minor: [INTERVALS.P1, INTERVALS.m3, INTERVALS.P5],
    diminished: [INTERVALS.P1, INTERVALS.m3, INTERVALS.d5],
    augmented: [INTERVALS.P1, INTERVALS.M3, INTERVALS.A5],
  } as const;
  return formulas[quality].map((interval) => intervalAbove(root, interval));
}

export function buildSeventh(root: Note, quality: SeventhQuality): Note[] {
  const formulas = {
    major7: [INTERVALS.P1, INTERVALS.M3, INTERVALS.P5, INTERVALS.M7],
    minor7: [INTERVALS.P1, INTERVALS.m3, INTERVALS.P5, INTERVALS.m7],
    dominant7: [INTERVALS.P1, INTERVALS.M3, INTERVALS.P5, INTERVALS.m7],
    halfDiminished7: [INTERVALS.P1, INTERVALS.m3, INTERVALS.d5, INTERVALS.m7],
    diminished7: [INTERVALS.P1, INTERVALS.m3, INTERVALS.d5, INTERVALS.d7],
  } as const;
  return formulas[quality].map((interval) => intervalAbove(root, interval));
}

export function identifyTriad(notes: readonly Note[]): TriadQuality {
  if (notes.length !== 3) throw new Error("Triad must contain three notes");
  const rootPc = pitchClass(notes[0]);
  const distances = notes.slice(1).map((n) => mod(pitchClass(n) - rootPc, 12));
  const key = distances.join(",");
  const map: Record<string, TriadQuality> = {
    "4,7": "major",
    "3,7": "minor",
    "3,6": "diminished",
    "4,8": "augmented",
  };
  const quality = map[key];
  if (!quality) throw new Error(`Unsupported triad structure: ${key}`);
  return quality;
}

export function identifySeventh(notes: readonly Note[]): SeventhQuality {
  if (notes.length !== 4) throw new Error("Seventh chord must contain four notes");
  const rootPc = pitchClass(notes[0]);
  const key = notes.slice(1).map((n) => mod(pitchClass(n) - rootPc, 12)).join(",");
  const map: Record<string, SeventhQuality> = {
    "4,7,11": "major7",
    "3,7,10": "minor7",
    "4,7,10": "dominant7",
    "3,6,10": "halfDiminished7",
    "3,6,9": "diminished7",
  };
  const quality = map[key];
  if (!quality) throw new Error(`Unsupported seventh structure: ${key}`);
  return quality;
}
