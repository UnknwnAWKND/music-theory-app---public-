import { INTERVALS, formatNote, intervalAbove, parseNote, type IntervalName, type TriadQuality } from "../theory/index.js";
import type { Exercise } from "./types.js";

export const PRACTICAL_ROOTS = [
  "C", "G", "D", "A", "E", "B", "F#", "F", "Bb", "Eb", "Ab", "Db", "Gb",
] as const;

/** All 15 conventional written major key signatures. */
export const CONVENTIONAL_MAJOR_TONICS = [
  "C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb",
] as const;

function pick<T>(items: readonly T[], index: number): T {
  if (items.length === 0) throw new Error("Cannot pick from an empty list");
  return items[((index % items.length) + items.length) % items.length];
}

export function intervalBuildExercise(interval: IntervalName, index: number): Exercise<{ root: string; interval: IntervalName; expected: string }> {
  const root = pick(PRACTICAL_ROOTS, index);
  const expected = formatNote(intervalAbove(parseNote(root), INTERVALS[interval]));
  return {
    id: `interval-build:${interval}:${index}`,
    skillId: `interval.${interval === "A4" || interval === "d5" ? "A4-d5" : interval}`,
    type: "interval-build-note",
    prompt: `Build a ${INTERVALS[interval].name} above ${formatNote(parseNote(root))}.`,
    payload: { root, interval, expected },
  };
}

export function triadBuildExercise(quality: TriadQuality, index: number): Exercise<{ root: string; quality: TriadQuality }> {
  const root = pick(PRACTICAL_ROOTS, index * 5 + 1);
  return {
    id: `triad-build:${quality}:${index}`,
    skillId: `triad.${quality}`,
    type: "triad-build-notes",
    prompt: `Build ${formatNote(parseNote(root))} ${quality}.`,
    payload: { root, quality },
  };
}

export function majorScaleExercise(index: number): Exercise<{ tonic: string }> {
  const tonic = pick(CONVENTIONAL_MAJOR_TONICS, index * 7 + 2);
  return {
    id: `major-scale:${index}`,
    skillId: "major.construct",
    type: "major-scale-build",
    prompt: `Build ${formatNote(parseNote(tonic))} major.`,
    payload: { tonic },
  };
}

export function majorDegreeExercise(index: number): Exercise<{ tonic: string; degree: number }> {
  const tonic = pick(PRACTICAL_ROOTS, index * 3 + 4);
  const degree = (index % 7) + 1;
  return {
    id: `major-degree:${index}`,
    skillId: "major.degree-to-note",
    type: "major-degree-note",
    prompt: `What is scale degree ${degree} of ${formatNote(parseNote(tonic))} major?`,
    payload: { tonic, degree },
  };
}
