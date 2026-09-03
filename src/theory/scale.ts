import {
  Note,
  accidentalForPitchClass,
  letterAt,
  letterIndex,
  mod,
  pitchClass,
} from "./note.js";

export const MAJOR_OFFSETS = [0, 2, 4, 5, 7, 9, 11] as const;
export const NATURAL_MINOR_OFFSETS = [0, 2, 3, 5, 7, 8, 10] as const;
export const HARMONIC_MINOR_OFFSETS = [0, 2, 3, 5, 7, 8, 11] as const;
export const MELODIC_MINOR_ASC_OFFSETS = [0, 2, 3, 5, 7, 9, 11] as const;

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

export function naturalMinorScale(tonic: Note): Note[] {
  return scaleFromOffsets(tonic, NATURAL_MINOR_OFFSETS);
}

export function harmonicMinorScale(tonic: Note): Note[] {
  return scaleFromOffsets(tonic, HARMONIC_MINOR_OFFSETS);
}

/** Ascending classical melodic minor; this is also the pitch collection commonly called jazz melodic minor. */
export function melodicMinorAscendingScale(tonic: Note): Note[] {
  return scaleFromOffsets(tonic, MELODIC_MINOR_ASC_OFFSETS);
}

/**
 * Classical melodic minor in traversal order, omitting the repeated octave tonic.
 * Ascending raises scale degrees 6 and 7; descending uses natural-minor 7 and 6.
 */
export function classicalMelodicMinor(tonic: Note): { ascending: Note[]; descending: Note[] } {
  const ascending = melodicMinorAscendingScale(tonic);
  const natural = naturalMinorScale(tonic);
  return {
    ascending,
    descending: [natural[0], natural[6], natural[5], natural[4], natural[3], natural[2], natural[1]],
  };
}

/** In common jazz usage, melodic minor normally keeps raised 6 and 7 in both directions. */
export function jazzMelodicMinorScale(tonic: Note): Note[] {
  return melodicMinorAscendingScale(tonic);
}

/** Relative minor tonic = scale degree 6 of the major scale. */
export function relativeMinorTonic(majorTonic: Note): Note {
  return majorScale(majorTonic)[5];
}

/** Relative major tonic = scale degree 3 of the natural-minor collection. */
export function relativeMajorTonic(minorTonic: Note): Note {
  return naturalMinorScale(minorTonic)[2];
}
