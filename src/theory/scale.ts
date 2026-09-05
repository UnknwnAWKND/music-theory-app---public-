import {
  Note,
  accidentalForPitchClass,
  formatNote,
  letterAt,
  letterIndex,
  mod,
  parseNote,
  pitchClass,
} from "./note.js";

export const MAJOR_OFFSETS = [0, 2, 4, 5, 7, 9, 11] as const;
export const MAJOR_SCALE_STEP_PATTERN = ["W", "W", "H", "W", "W", "W", "H"] as const;
export const MAJOR_SCALE_DEGREE_INTERVALS = ["P1", "M2", "M3", "P4", "P5", "M6", "M7", "P8"] as const;
export const SCALE_DEGREE_NAMES = [
  "Tonic",
  "Supertonic",
  "Mediant",
  "Subdominant",
  "Dominant",
  "Submediant",
  "Leading Tone",
] as const;

/**
 * One practical spelling for each of the 12 pitch classes. These are used to
 * balance recall practice by sound/piano position rather than over-sampling
 * enharmonic duplicates.
 */
export const MAJOR_PITCH_CLASS_ROOTS = [
  "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
] as const;

/** Conventional major-key spellings through seven accidentals. */
export const SUPPORTED_MAJOR_KEY_NAMES = [
  "C", "G", "D", "A", "E", "B", "F#", "C#",
  "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb",
] as const;

export const NATURAL_MINOR_OFFSETS = [0, 2, 3, 5, 7, 8, 10] as const;
export const HARMONIC_MINOR_OFFSETS = [0, 2, 3, 5, 7, 8, 11] as const;
export const MELODIC_MINOR_ASC_OFFSETS = [0, 2, 3, 5, 7, 9, 11] as const;

export const NATURAL_MINOR_STEP_PATTERN = ["W", "H", "W", "W", "H", "W", "W"] as const;
export const HARMONIC_MINOR_SEMITONE_STEPS = [2, 1, 2, 2, 1, 3, 1] as const;
export const MELODIC_MINOR_ASC_STEP_PATTERN = ["W", "H", "W", "W", "W", "W", "H"] as const;
export const NATURAL_MINOR_DEGREE_INTERVALS = ["P1", "M2", "m3", "P4", "P5", "m6", "m7", "P8"] as const;
export const HARMONIC_MINOR_DEGREE_INTERVALS = ["P1", "M2", "m3", "P4", "P5", "m6", "M7", "P8"] as const;
export const MELODIC_MINOR_ASC_DEGREE_INTERVALS = ["P1", "M2", "m3", "P4", "P5", "M6", "M7", "P8"] as const;

/**
 * One practical minor-key spelling for each pitch class. These defaults favor
 * conventional spellings with manageable key signatures while still balancing
 * all 12 piano pitch classes.
 */
export const MINOR_PITCH_CLASS_ROOTS = [
  "C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B",
] as const;

/**
 * Conventional written minor keys through seven accidentals. The three pairs
 * G#/Ab, D#/Eb, and A#/Bb are enharmonic on piano but require different exact
 * scale spellings.
 */
export const SUPPORTED_MINOR_KEY_NAMES = [
  "A", "E", "B", "F#", "C#", "G#", "D#", "A#",
  "D", "G", "C", "F", "Bb", "Eb", "Ab",
] as const;

export function scaleFromOffsets(tonic: Note, offsets: readonly number[]): Note[] {
  return offsets.map((offset, degreeIndex) => {
    const letter = letterAt(letterIndex(tonic.letter) + degreeIndex);
    const desiredPc = mod(pitchClass(tonic) + offset, 12);
    return { letter, accidental: accidentalForPitchClass(letter, desiredPc) };
  });
}

export function majorScale(tonic: Note): Note[] {
  return scaleFromOffsets(tonic, MAJOR_OFFSETS);
}

export function majorScaleNames(tonicName: string): string[] {
  return majorScale(parseNote(tonicName)).map(formatNote);
}

export function scaleDegreeName(degree: number): (typeof SCALE_DEGREE_NAMES)[number] {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error(`Invalid scale degree: ${degree}`);
  return SCALE_DEGREE_NAMES[degree - 1];
}

export function majorScaleDegreeNote(tonicName: string, degree: number): string {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error(`Invalid scale degree: ${degree}`);
  return majorScaleNames(tonicName)[degree - 1];
}

export function majorScaleDegreeForNote(tonicName: string, noteName: string): number | undefined {
  const notePc = pitchClass(parseNote(noteName));
  const scale = majorScale(parseNote(tonicName));
  const index = scale.findIndex((note) => pitchClass(note) === notePc);
  return index >= 0 ? index + 1 : undefined;
}

/** Return the practical 12-root spelling for a pitch class. */
export function majorRootForPitchClass(pc: number): (typeof MAJOR_PITCH_CLASS_ROOTS)[number] {
  return MAJOR_PITCH_CLASS_ROOTS[mod(pc, 12)];
}

/** Alternate conventional written major roots for enharmonic pitch classes. */
export function conventionalMajorRootsForPitchClass(pc: number): readonly string[] {
  switch (mod(pc, 12)) {
    case 1: return ["Db", "C#"];
    case 6: return ["F#", "Gb"];
    case 11: return ["B", "Cb"];
    default: return [majorRootForPitchClass(pc)];
  }
}

export function naturalMinorScale(tonic: Note): Note[] {
  return scaleFromOffsets(tonic, NATURAL_MINOR_OFFSETS);
}

export function naturalMinorScaleNames(tonicName: string): string[] {
  return naturalMinorScale(parseNote(tonicName)).map(formatNote);
}

export function harmonicMinorScale(tonic: Note): Note[] {
  return scaleFromOffsets(tonic, HARMONIC_MINOR_OFFSETS);
}

export function harmonicMinorScaleNames(tonicName: string): string[] {
  return harmonicMinorScale(parseNote(tonicName)).map(formatNote);
}

/** Ascending classical melodic minor: natural minor with raised degrees 6 and 7. */
export function melodicMinorAscendingScale(tonic: Note): Note[] {
  return scaleFromOffsets(tonic, MELODIC_MINOR_ASC_OFFSETS);
}

export function melodicMinorAscendingScaleNames(tonicName: string): string[] {
  return melodicMinorAscendingScale(parseNote(tonicName)).map(formatNote);
}

/**
 * Classical melodic minor in traversal order, omitting the repeated ending
 * tonic so each answer uses seven scale-degree names. Ascending raises 6 and 7;
 * descending returns to natural minor for this curriculum.
 */
export function classicalMelodicMinor(tonic: Note): { ascending: Note[]; descending: Note[] } {
  const ascending = melodicMinorAscendingScale(tonic);
  const natural = naturalMinorScale(tonic);
  return {
    ascending,
    descending: [natural[0], natural[6], natural[5], natural[4], natural[3], natural[2], natural[1]],
  };
}

export function classicalMelodicMinorNames(tonicName: string): { ascending: string[]; descending: string[] } {
  const result = classicalMelodicMinor(parseNote(tonicName));
  return {
    ascending: result.ascending.map(formatNote),
    descending: result.descending.map(formatNote),
  };
}

/** In common jazz usage, melodic minor normally keeps raised 6 and 7 in both directions. */
export function jazzMelodicMinorScale(tonic: Note): Note[] {
  return melodicMinorAscendingScale(tonic);
}

/** The harmonic-minor leading tone is the raised seventh, one semitone below tonic. */
export function minorLeadingToneName(tonicName: string): string {
  return harmonicMinorScaleNames(tonicName)[6];
}

/**
 * Degree 6 -> raised degree 7 in harmonic minor is an augmented second:
 * adjacent letter names spanning three semitones.
 */
export function harmonicMinorAugmentedSecond(tonicName: string): { degree6: string; degree7: string; semitones: 3; interval: "A2" } {
  const scale = harmonicMinorScaleNames(tonicName);
  return { degree6: scale[5], degree7: scale[6], semitones: 3, interval: "A2" };
}

export function minorScaleDegreeNote(tonicName: string, form: "natural" | "harmonic" | "melodic-ascending", degree: number): string {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error(`Invalid scale degree: ${degree}`);
  if (form === "natural") return naturalMinorScaleNames(tonicName)[degree - 1];
  if (form === "harmonic") return harmonicMinorScaleNames(tonicName)[degree - 1];
  return melodicMinorAscendingScaleNames(tonicName)[degree - 1];
}

export function minorRootForPitchClass(pc: number): (typeof MINOR_PITCH_CLASS_ROOTS)[number] {
  return MINOR_PITCH_CLASS_ROOTS[mod(pc, 12)];
}

export function conventionalMinorRootsForPitchClass(pc: number): readonly string[] {
  switch (mod(pc, 12)) {
    case 3: return ["Eb", "D#"];
    case 8: return ["G#", "Ab"];
    case 10: return ["Bb", "A#"];
    default: return [minorRootForPitchClass(pc)];
  }
}

/** Relative minor tonic = scale degree 6 of the major scale. */
export function relativeMinorTonic(majorTonic: Note): Note {
  return majorScale(majorTonic)[5];
}

/** Relative major tonic = scale degree 3 of the natural-minor collection. */
export function relativeMajorTonic(minorTonic: Note): Note {
  return naturalMinorScale(minorTonic)[2];
}
