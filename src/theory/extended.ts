import { buildSeventh, buildTriad, type SeventhQuality, type TriadQuality } from "./chord.js";
import { INTERVALS, intervalAbove } from "./interval.js";
import { formatNote, mod, parseNote, pitchClass, type Note } from "./note.js";
import {
  majorScale,
  naturalMinorScale,
  relativeMajorTonic,
  relativeMinorTonic,
  scaleFromOffsets,
} from "./scale.js";

export const MAJOR_ROMANS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
export const MAJOR_TRIAD_QUALITIES: readonly TriadQuality[] = [
  "major", "minor", "minor", "major", "major", "minor", "diminished",
] as const;
export const MAJOR_SEVENTH_QUALITIES: readonly SeventhQuality[] = [
  "major7", "minor7", "minor7", "major7", "dominant7", "minor7", "halfDiminished7",
] as const;

export function majorRomanForDegree(degree: number): string {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error(`Invalid degree: ${degree}`);
  return MAJOR_ROMANS[degree - 1];
}

export function majorDegreeForRoman(roman: string): number {
  const normalized = roman.trim().replace(/o$/i, "°");
  const i = MAJOR_ROMANS.indexOf(normalized as (typeof MAJOR_ROMANS)[number]);
  if (i < 0) throw new Error(`Unsupported major-key Roman numeral: ${roman}`);
  return i + 1;
}

export function majorTriadForDegree(tonic: Note, degree: number): { root: Note; quality: TriadQuality; notes: Note[]; roman: string } {
  const scale = majorScale(tonic);
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error(`Invalid degree: ${degree}`);
  const root = scale[degree - 1];
  const quality = MAJOR_TRIAD_QUALITIES[degree - 1];
  return { root, quality, notes: buildTriad(root, quality), roman: majorRomanForDegree(degree) };
}

export function majorProgression(tonic: Note, romans: readonly string[]) {
  return romans.map((roman) => majorTriadForDegree(tonic, majorDegreeForRoman(roman)));
}

export type ModeName = "ionian" | "dorian" | "phrygian" | "lydian" | "mixolydian" | "aeolian" | "locrian";
export const MODE_OFFSETS: Record<ModeName, readonly number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
};

export function modeScale(tonic: Note, mode: ModeName): Note[] {
  return scaleFromOffsets(tonic, MODE_OFFSETS[mode]);
}

export type ColorChordQuality = "sus2" | "sus4" | "majorAdd9" | "minorAdd9" | "major6" | "minor6" | "major69" | "minor69";
export function buildColorChord(root: Note, quality: ColorChordQuality): Note[] {
  const p1 = intervalAbove(root, INTERVALS.P1);
  const p5 = intervalAbove(root, INTERVALS.P5);
  switch (quality) {
    case "sus2": return [p1, intervalAbove(root, INTERVALS.M2), p5];
    case "sus4": return [p1, intervalAbove(root, INTERVALS.P4), p5];
    case "majorAdd9": return [...buildTriad(root, "major"), intervalAbove(root, INTERVALS.M2)];
    case "minorAdd9": return [...buildTriad(root, "minor"), intervalAbove(root, INTERVALS.M2)];
    case "major6": return [...buildTriad(root, "major"), intervalAbove(root, INTERVALS.M6)];
    case "minor6": return [...buildTriad(root, "minor"), intervalAbove(root, INTERVALS.M6)];
    case "major69": return [...buildTriad(root, "major"), intervalAbove(root, INTERVALS.M6), intervalAbove(root, INTERVALS.M2)];
    case "minor69": return [...buildTriad(root, "minor"), intervalAbove(root, INTERVALS.M6), intervalAbove(root, INTERVALS.M2)];
  }
}

export type NinthQuality = "major9" | "minor9" | "dominant9";
export function buildNinth(root: Note, quality: NinthQuality): Note[] {
  const ninth = intervalAbove(root, INTERVALS.M2);
  switch (quality) {
    case "major9": return [...buildSeventh(root, "major7"), ninth];
    case "minor9": return [...buildSeventh(root, "minor7"), ninth];
    case "dominant9": return [...buildSeventh(root, "dominant7"), ninth];
  }
}

/** Full theoretical tertian stacks. Real voicings may omit members. */
export function buildDominantExtension(root: Note, extension: 11 | 13): Note[] {
  const base = buildNinth(root, "dominant9");
  if (extension === 11) return [...base, intervalAbove(root, INTERVALS.P4)];
  return [...base, intervalAbove(root, INTERVALS.P4), intervalAbove(root, INTERVALS.M6)];
}

export interface KeySignatureInfo {
  tonic: string;
  accidentalType: "sharp" | "flat" | "none";
  count: number;
  alteredNotes: string[];
}

export function majorKeySignature(tonic: Note): KeySignatureInfo {
  const scale = majorScale(tonic);
  const accidentals = scale.filter((n) => n.accidental !== 0);
  const sharpCount = accidentals.filter((n) => n.accidental > 0).reduce((n, x) => n + x.accidental, 0);
  const flatCount = accidentals.filter((n) => n.accidental < 0).reduce((n, x) => n - x.accidental, 0);
  if (sharpCount && flatCount) throw new Error(`Nonstandard mixed key signature generated for ${formatNote(tonic)}`);
  return {
    tonic: formatNote(tonic),
    accidentalType: sharpCount ? "sharp" : flatCount ? "flat" : "none",
    count: sharpCount || flatCount,
    alteredNotes: accidentals.map(formatNote),
  };
}

export const SHARP_ORDER = ["F♯", "C♯", "G♯", "D♯", "A♯", "E♯", "B♯"] as const;
export const FLAT_ORDER = ["B♭", "E♭", "A♭", "D♭", "G♭", "C♭", "F♭"] as const;
export const CIRCLE_SHARP_MAJOR = ["C", "G", "D", "A", "E", "B", "F♯", "C♯"] as const;
export const CIRCLE_FLAT_MAJOR = ["C", "F", "B♭", "E♭", "A♭", "D♭", "G♭", "C♭"] as const;

export function relativeMinorName(majorTonic: string): string {
  return formatNote(relativeMinorTonic(parseNote(majorTonic)));
}
export function relativeMajorName(minorTonic: string): string {
  return formatNote(relativeMajorTonic(parseNote(minorTonic)));
}

export function areEnharmonicNotes(a: Note, b: Note): boolean {
  return pitchClass(a) === pitchClass(b);
}

const CHROMATIC_SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"] as const;
export const STANDARD_GUITAR_OPEN_PCS = [4, 9, 2, 7, 11, 4] as const; // strings 6 -> 1: E A D G B E

export function guitarPitchClass(stringNumber: 1 | 2 | 3 | 4 | 5 | 6, fret: number): number {
  if (!Number.isInteger(fret) || fret < 0) throw new Error(`Invalid fret: ${fret}`);
  const openPc = STANDARD_GUITAR_OPEN_PCS[6 - stringNumber];
  return mod(openPc + fret, 12);
}

export function canonicalGuitarNoteName(stringNumber: 1 | 2 | 3 | 4 | 5 | 6, fret: number): string {
  return CHROMATIC_SHARP_NAMES[guitarPitchClass(stringNumber, fret)];
}

export function samePitchClassName(answer: string, expectedPc: number): boolean {
  try { return pitchClass(parseNote(answer)) === expectedPc; } catch { return false; }
}

/** Finds all scale degrees shared as pitch classes between two seven-note collections. */
export function sharedPitchClasses(a: readonly Note[], b: readonly Note[]): number[] {
  const bPcs = new Set(b.map(pitchClass));
  return [...new Set(a.map(pitchClass).filter((pc) => bPcs.has(pc)))];
}

export function parallelNaturalMinorAlterations(tonic: Note): { degree: number; major: Note; minor: Note }[] {
  const maj = majorScale(tonic);
  const min = naturalMinorScale(tonic);
  return [3, 6, 7].map((degree) => ({ degree, major: maj[degree - 1], minor: min[degree - 1] }));
}
