import { SKILL_BY_ID } from "../curriculum/index.js";
import { INTERVALS, buildTriad, formatNote, intervalAbove, majorProgression, parseNote } from "../theory/index.js";
import { PRACTICAL_ROOTS } from "./generators.js";
import { exerciseForSkill as legacyExerciseForSkill } from "./catalog.js";
import type { Exercise } from "./types.js";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

const NUMBER_SETS: Readonly<Record<string, readonly number[]>> = Object.freeze({
  "interval.number-3-8": [3, 8],
  "interval.number-4-5": [4, 5],
  "interval.number-mix-3-4-5-8": [3, 4, 5, 8],
  "interval.number-2-7": [2, 7],
  "interval.number-mix-2-3-4-5-7-8": [2, 3, 4, 5, 7, 8],
  "interval.number-6": [6],
  "interval.number-mixed-all": [2, 3, 4, 5, 6, 7, 8],
});

function pick<T>(items: readonly T[], index: number): T {
  if (!items.length) throw new Error("Cannot pick from empty list");
  return items[((index % items.length) + items.length) % items.length];
}

function noteLetter(value: string): string {
  const match = value.match(/[A-G]/i);
  if (!match) throw new Error(`Invalid note root ${value}`);
  return match[0].toUpperCase();
}

function targetLetter(root: string, intervalNumber: number, direction: "above" | "below"): string {
  const start = LETTERS.indexOf(noteLetter(root) as (typeof LETTERS)[number]);
  const shift = intervalNumber - 1;
  const raw = direction === "above" ? start + shift : start - shift;
  return LETTERS[((raw % 7) + 7) % 7];
}

function intervalNumberExercise(skillId: string, index: number): Exercise {
  const numbers = NUMBER_SETS[skillId];
  if (!numbers) throw new Error(`No interval-number set for ${skillId}`);
  const intervalNumber = pick(numbers, index);
  const root = pick(PRACTICAL_ROOTS, index * 5 + intervalNumber);
  const mixed = skillId.includes("mix") || skillId === "interval.number-mixed-all";
  const direction: "above" | "below" = mixed && Math.abs(index) % 5 === 4 ? "below" : "above";
  const expected = targetLetter(root, intervalNumber, direction);
  const suffix = intervalNumber === 2 ? "nd" : intervalNumber === 3 ? "rd" : "th";
  return {
    id: `${skillId}:${index}`,
    skillId,
    type: "concept-check",
    prompt: `For interval NUMBER only, what letter name is a ${intervalNumber}${suffix} ${direction} ${formatNote(parseNote(root))}?`,
    assessmentMode: "objective",
    payload: {
      expected,
      root,
      fromLetter: noteLetter(root),
      toLetter: expected,
      intervalNumber,
      direction,
      detail: "Count letter names inclusively. Accidentals change quality later, but they do not change the interval number.",
    },
  };
}

function progressionChordToneExercise(skillId: string, index: number): Exercise {
  const tonic = pick(PRACTICAL_ROOTS, index * 3 + 2);
  const romans = ["I", "V", "vi", "IV"] as const;
  const progression = majorProgression(parseNote(tonic), romans);
  const position = Math.abs(index) % progression.length;
  const chord = progression[position];
  const notes = buildTriad(chord.root, chord.quality);
  const isChordTone = Math.abs(index) % 2 === 0;
  const candidate = isChordTone
    ? notes[(Math.floor(Math.abs(index) / 2)) % notes.length]
    : intervalAbove(chord.root, INTERVALS.M2);
  const chordName = `${formatNote(chord.root)} ${chord.quality}`;
  return {
    id: `${skillId}:${index}`,
    skillId,
    type: "concept-check",
    prompt: `In ${tonic} major during I–V–vi–IV, the current chord is ${romans[position]} (${chordName}). Is ${formatNote(candidate)} a chord tone of the current chord?`,
    assessmentMode: "objective",
    payload: {
      expected: isChordTone ? "yes" : "no",
      choices: ["yes", "no"],
      tonic,
      romans: [...romans],
      expectedRoot: formatNote(chord.root),
      expectedQuality: chord.quality,
      note: formatNote(candidate),
      detail: `Chord tones are the root, 3rd, and 5th of the chord sounding right now: ${notes.map(formatNote).join("–")}.`,
    },
  };
}

export function exerciseForSkill(skillId: string, index = 0): Exercise {
  if (!SKILL_BY_ID.has(skillId)) throw new Error(`Unknown skill: ${skillId}`);
  if (skillId in NUMBER_SETS) return intervalNumberExercise(skillId, index);
  if (skillId === "melody.progression-targeting") return progressionChordToneExercise(skillId, index);
  return legacyExerciseForSkill(skillId, index);
}

export function exerciseCoverage() {
  return [...SKILL_BY_ID.keys()].map((skillId) => ({ skillId, exercise: exerciseForSkill(skillId, 0) }));
}
