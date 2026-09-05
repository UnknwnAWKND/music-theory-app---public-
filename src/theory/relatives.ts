import { deriveDiatonicHarmony, type DerivedChord } from "./harmony.js";
import { formatNote, parseNote, pitchClass } from "./note.js";
import {
  SUPPORTED_MAJOR_KEY_NAMES,
  SUPPORTED_MINOR_KEY_NAMES,
  harmonicMinorScaleNames,
  majorScaleNames,
  melodicMinorAscendingScaleNames,
  naturalMinorScaleNames,
  relativeMajorTonic,
  relativeMinorTonic,
} from "./scale.js";

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

export function relativeMinorName(majorTonicName: string): string {
  return formatNote(relativeMinorTonic(parseNote(majorTonicName)));
}

export function relativeMajorName(minorTonicName: string): string {
  return formatNote(relativeMajorTonic(parseNote(minorTonicName)));
}

/** Conventional written relative pairs through seven accidentals. */
export const RELATIVE_KEY_PAIRS: readonly RelativeKeyPair[] = Object.freeze(
  SUPPORTED_MAJOR_KEY_NAMES.map((major) => Object.freeze({ major, minor: relativeMinorName(major) })),
);

export function relativePairForKey(keyName: string, mode: RelativeKeyMode): RelativeKeyPair {
  const normalized = formatNote(parseNote(keyName));
  const pair = RELATIVE_KEY_PAIRS.find((item) => {
    const candidate = mode === "major" ? item.major : item.minor;
    return formatNote(parseNote(candidate)) === normalized;
  });
  if (!pair) throw new Error(`Unsupported ${mode} key spelling for relative-key practice: ${keyName}`);
  return pair;
}

export function majorToRelativeMinorSemitones(majorTonicName: string): number {
  const majorPc = pitchClass(parseNote(majorTonicName));
  const minorPc = pitchClass(parseNote(relativeMinorName(majorTonicName)));
  return (majorPc - minorPc + 12) % 12;
}

export function minorToRelativeMajorSemitones(minorTonicName: string): number {
  const minorPc = pitchClass(parseNote(minorTonicName));
  const majorPc = pitchClass(parseNote(relativeMajorName(minorTonicName)));
  return (majorPc - minorPc + 12) % 12;
}

function sameWrittenCollection(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSet = new Set(left.map((note) => formatNote(parseNote(note))));
  const rightSet = new Set(right.map((note) => formatNote(parseNote(note))));
  return leftSet.size === rightSet.size && [...leftSet].every((note) => rightSet.has(note));
}

/**
 * Relative major and relative NATURAL minor use the same seven written pitch
 * classes. Harmonic and melodic minor are deliberately not folded into this
 * rule because their altered degrees change the collection.
 */
export function shareRelativeNaturalMinorCollection(majorTonicName: string, minorTonicName: string): boolean {
  if (relativeMinorName(majorTonicName) !== formatNote(parseNote(minorTonicName))) return false;
  return sameWrittenCollection(majorScaleNames(majorTonicName), naturalMinorScaleNames(minorTonicName));
}

export function harmonicMinorMatchesRelativeMajorCollection(majorTonicName: string, minorTonicName: string): boolean {
  return sameWrittenCollection(majorScaleNames(majorTonicName), harmonicMinorScaleNames(minorTonicName));
}

export function melodicMinorMatchesRelativeMajorCollection(majorTonicName: string, minorTonicName: string): boolean {
  return sameWrittenCollection(majorScaleNames(majorTonicName), melodicMinorAscendingScaleNames(minorTonicName));
}

/** Major degree 1 becomes natural-minor degree 3, ... major degree 6 becomes minor degree 1. */
export function majorDegreeToRelativeMinorDegree(degree: number): number {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error(`Invalid scale degree: ${degree}`);
  return ((degree + 1) % 7) + 1;
}

/** Natural-minor degree 1 becomes relative-major degree 6, ... minor degree 3 becomes major degree 1. */
export function minorDegreeToRelativeMajorDegree(degree: number): number {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error(`Invalid scale degree: ${degree}`);
  return ((degree + 4) % 7) + 1;
}

/**
 * Match the exact same seven triads under two tonic interpretations. Chord
 * roots and qualities stay the same; scale degrees and Roman numerals rotate.
 */
export function relativeNaturalMinorChordRenumbering(majorTonicName: string): RelativeChordRenumbering[] {
  const minorTonicName = relativeMinorName(majorTonicName);
  const majorHarmony = deriveDiatonicHarmony(majorTonicName, "major");
  const minorHarmony = deriveDiatonicHarmony(minorTonicName, "natural-minor");

  return majorHarmony.map((majorChord) => {
    const minorChord = minorHarmony.find((candidate) => candidate.root === majorChord.root && candidate.triadQuality === majorChord.triadQuality);
    if (!minorChord) throw new Error(`Relative harmony mismatch for ${majorTonicName}/${minorTonicName}: ${majorChord.chordSymbol}`);
    return {
      chordRoot: majorChord.root,
      triadQuality: majorChord.triadQuality,
      majorDegree: majorChord.degree,
      majorRomanNumeral: majorChord.romanNumeral,
      minorDegree: minorChord.degree,
      minorRomanNumeral: minorChord.romanNumeral,
    };
  });
}

export function supportedRelativeMinorNames(): readonly string[] {
  const supported = new Set(SUPPORTED_MINOR_KEY_NAMES.map((name) => formatNote(parseNote(name))));
  return RELATIVE_KEY_PAIRS.map((pair) => pair.minor).filter((name) => supported.has(formatNote(parseNote(name))));
}
