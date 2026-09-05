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
export interface RelativeKeyPair { major: string; minor: string; }
export interface RelativeChordRenumbering {
  chordRoot: string;
  triadQuality: DerivedChord["triadQuality"];
  majorDegree: number;
  majorRomanNumeral: string;
  minorDegree: number;
  minorRomanNumeral: string;
}

function relativeMinorForMajor(majorTonicName: string): string {
  return formatNote(relativeMinorTonic(parseNote(majorTonicName)));
}
function relativeMajorForMinor(minorTonicName: string): string {
  return formatNote(relativeMajorTonic(parseNote(minorTonicName)));
}

/** Conventional written relative pairs through seven accidentals. */
export const RELATIVE_KEY_PAIRS: readonly RelativeKeyPair[] = Object.freeze(
  SUPPORTED_MAJOR_KEY_NAMES.map((major) => Object.freeze({ major, minor: relativeMinorForMajor(major) })),
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
  const minorPc = pitchClass(parseNote(relativeMinorForMajor(majorTonicName)));
  return (majorPc - minorPc + 12) % 12;
}
export function minorToRelativeMajorSemitones(minorTonicName: string): number {
  const minorPc = pitchClass(parseNote(minorTonicName));
  const majorPc = pitchClass(parseNote(relativeMajorForMinor(minorTonicName)));
  return (majorPc - minorPc + 12) % 12;
}

function sameWrittenCollection(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSet = new Set(left.map((note) => formatNote(parseNote(note))));
  const rightSet = new Set(right.map((note) => formatNote(parseNote(note))));
  return leftSet.size === rightSet.size && [...leftSet].every((note) => rightSet.has(note));
}

/** Exact shared-collection rule: relative major + relative NATURAL minor only. */
export function shareRelativeNaturalMinorCollection(majorTonicName: string, minorTonicName: string): boolean {
  if (relativeMinorForMajor(majorTonicName) !== formatNote(parseNote(minorTonicName))) return false;
  return sameWrittenCollection(majorScaleNames(majorTonicName), naturalMinorScaleNames(minorTonicName));
}
export function harmonicMinorMatchesRelativeMajorCollection(majorTonicName: string, minorTonicName: string): boolean {
  return sameWrittenCollection(majorScaleNames(majorTonicName), harmonicMinorScaleNames(minorTonicName));
}
export function melodicMinorMatchesRelativeMajorCollection(majorTonicName: string, minorTonicName: string): boolean {
  return sameWrittenCollection(majorScaleNames(majorTonicName), melodicMinorAscendingScaleNames(minorTonicName));
}

export function majorDegreeToRelativeMinorDegree(degree: number): number {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error(`Invalid scale degree: ${degree}`);
  return ((degree + 1) % 7) + 1;
}
export function minorDegreeToRelativeMajorDegree(degree: number): number {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error(`Invalid scale degree: ${degree}`);
  return ((degree + 4) % 7) + 1;
}

export function relativeNaturalMinorChordRenumbering(majorTonicName: string): RelativeChordRenumbering[] {
  const minorTonicName = relativeMinorForMajor(majorTonicName);
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
