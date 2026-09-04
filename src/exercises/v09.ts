import { SKILLS } from "../curriculum/index.js";
import type { Exercise } from "./types.js";
import { exerciseForSkill as legacyExerciseForSkill } from "./catalog.js";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const ROOTS = ["C", "D", "E", "F", "G", "A", "B", "F#", "Bb", "Eb", "Ab"] as const;

const NUMBER_GROUPS: Readonly<Record<string, readonly number[]>> = Object.freeze({
  "interval.number-3-8": [3, 8],
  "interval.number-4-5": [4, 5],
  "interval.number-mix-3-4-5-8": [3, 4, 5, 8],
  "interval.number-2-7": [2, 7],
  "interval.number-mix-2-3-4-5-7-8": [2, 3, 4, 5, 7, 8],
  "interval.number-6": [6],
});

function pick<T>(items: readonly T[], index: number): T {
  return items[((index % items.length) + items.length) % items.length];
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function rootLetter(root: string): string {
  return root[0].toUpperCase();
}

function targetLetter(root: string, number: number): string {
  const start = LETTERS.indexOf(rootLetter(root) as (typeof LETTERS)[number]);
  return LETTERS[(start + number - 1) % LETTERS.length];
}

function intervalNumberExercise(skillId: string, index: number): Exercise {
  const numbers = NUMBER_GROUPS[skillId];
  if (!numbers) throw new Error(`Unknown interval-number subset ${skillId}`);
  const number = pick(numbers, index * 5 + 1);
  const root = pick(ROOTS, index * 3 + numbers.length);
  const target = targetLetter(root, number);

  // Construction is deliberately more common than recognition. Accidentals are
  // shown on some roots later in the sequence, but the task is only the letter-distance map.
  if (index % 3 !== 2) {
    return {
      id: `${skillId}:build:${index}`,
      skillId,
      type: "concept-check",
      prompt: `What note letter is a ${ordinal(number)} above ${root}? Ignore sharps/flats for this interval-number question.`,
      assessmentMode: "objective",
      payload: { expected: target, root, intervalNumber: number, mode: "construct-number" },
    };
  }

  return {
    id: `${skillId}:identify:${index}`,
    skillId,
    type: "concept-check",
    prompt: `${root} to ${target} is what interval number?`,
    assessmentMode: "objective",
    payload: {
      expected: ordinal(number),
      choices: numbers.map(ordinal),
      root,
      target,
      intervalNumber: number,
      mode: "identify-number",
    },
  };
}

function progressionTargetingExercise(index: number): Exercise {
  const examples = [
    ["C major", "C major", "C E G"],
    ["C major", "G major", "G B D"],
    ["G major", "E minor", "E G B"],
    ["D major", "A major", "A C# E"],
    ["F major", "Bb major", "Bb D F"],
    ["A major", "F# minor", "F# A C#"],
    ["Eb major", "Bb major", "Bb D F"],
    ["Bb major", "G minor", "G Bb D"],
  ] as const;
  const [key, chord, expected] = pick(examples, index);
  return {
    id: `melody.progression-targeting:${index}`,
    skillId: "melody.progression-targeting",
    type: "concept-check",
    prompt: `In ${key}, the current chord is ${chord}. Which three notes are its basic chord tones? Type them root, 3rd, 5th.`,
    assessmentMode: "objective",
    payload: { expected, key, chord, mode: "chord-tone-targeting" },
  };
}

export function exerciseForSkill(skillId: string, index = 0): Exercise {
  if (NUMBER_GROUPS[skillId]) return intervalNumberExercise(skillId, index);
  if (skillId === "melody.progression-targeting") return progressionTargetingExercise(index);
  return legacyExerciseForSkill(skillId, index);
}

export function exerciseCoverage() {
  return SKILLS.map((skill) => ({ skillId: skill.id, exercise: exerciseForSkill(skill.id, 0) }));
}
