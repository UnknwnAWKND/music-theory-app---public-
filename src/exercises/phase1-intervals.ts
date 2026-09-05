import {
  INTERVALS,
  PHASE1_INTERVAL_NAMES,
  formatNote,
  intervalAbove,
  invertPhase1Interval,
  parseNote,
  pitchClass,
  type Phase1IntervalName,
} from "../theory/index.js";
import { createExercise } from "./generators.js";
import type { Exercise, ExerciseGenerator } from "./types.js";

const ROOT_NAMES = Object.freeze([
  "C", "G", "D", "A", "E", "B", "F",
  "F#", "C#", "G#", "D#", "A#", "E#", "B#",
  "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb",
]);

const LESSON_POOLS: Readonly<Record<string, readonly Phase1IntervalName[]>> = Object.freeze({
  "intervals.lesson-1-unison-octave": ["P1", "P8"],
  "intervals.lesson-2-perfect-fifth": ["P5", "P5", "P1", "P8"],
  "intervals.lesson-3-perfect-fourth": ["P4", "P4", "P5", "P1", "P8"],
  "intervals.lesson-4-thirds": ["M3", "m3", "M3", "m3", "P5", "P4", "P8", "P1"],
  "intervals.lesson-5-sixths": ["M6", "m6", "M6", "m6", "M3", "m3", "P5", "P4", "P8", "P1"],
  "intervals.lesson-6-seconds": ["M2", "m2", "M2", "m2", "M6", "m6", "M3", "m3", "P5", "P4", "P8", "P1"],
  "intervals.lesson-7-sevenths": ["M7", "m7", "M7", "m7", "M2", "m2", "M6", "m6", "M3", "m3", "P5", "P4", "P8", "P1"],
  "intervals.lesson-8-tritone": ["A4", "d5", "A4", "d5", "M7", "m7", "M2", "m2", "M6", "m6", "M3", "m3", "P5", "P4", "P8", "P1"],
  "intervals.lesson-9-inversion-capstone": PHASE1_INTERVAL_NAMES,
  "intervals.lesson-10-cumulative": PHASE1_INTERVAL_NAMES,
});

const PERFECT_CHOICES = ["P1", "P4", "P5", "P8"] as const;
const MAJOR_MINOR_CHOICES = ["m2", "M2", "m3", "M3", "m6", "M6", "m7", "M7"] as const;
const TRITONE_CHOICES = ["A4", "d5", "P4", "P5"] as const;
const PRE_CHROMATIC_DETAIL_SKILLS = new Set([
  "intervals.lesson-1-unison-octave",
  "intervals.lesson-2-perfect-fifth",
  "intervals.lesson-3-perfect-fourth",
]);

function rootFor(index: number) {
  const safe = Math.max(0, index);
  const rootName = ROOT_NAMES[(safe * 5 + Math.floor(safe / ROOT_NAMES.length)) % ROOT_NAMES.length];
  return parseNote(rootName);
}

function intervalFor(pool: readonly Phase1IntervalName[], index: number): Phase1IntervalName {
  const safe = Math.max(0, index);
  // 11 is coprime with every pool length used here, so variety appears quickly instead of cycling a small subset.
  return pool[(safe * 11 + Math.floor(safe / ROOT_NAMES.length)) % pool.length];
}

function keyboardPitchName(noteName: string): string {
  const note = parseNote(noteName);
  return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][pitchClass(note)];
}

function ordinal(number: number): string {
  if (number === 1) return "1st";
  if (number === 2) return "2nd";
  if (number === 3) return "3rd";
  return `${number}th`;
}

function intervalChoices(skillId: string, interval: Phase1IntervalName): readonly string[] {
  // Early lessons must never display untaught interval labels as distractors.
  if (skillId === "intervals.lesson-1-unison-octave") return ["P1", "P8"];
  if (skillId === "intervals.lesson-2-perfect-fifth") return ["P1", "P5", "P8"];
  if (skillId === "intervals.lesson-3-perfect-fourth") return ["P1", "P4", "P5", "P8"];

  if (interval === "A4" || interval === "d5") return TRITONE_CHOICES;
  if (INTERVALS[interval].quality === "perfect") return PERFECT_CHOICES;
  const sameNumber = MAJOR_MINOR_CHOICES.filter((candidate) => INTERVALS[candidate].number === INTERVALS[interval].number);
  const inversion = invertPhase1Interval(interval);
  return [...new Set([interval, ...sameNumber, inversion, INTERVALS[interval].quality === "major" ? `m${INTERVALS[interval].number}` : `M${INTERVALS[interval].number}`])].slice(0, 4);
}

function pairPrompt(rootName: string, targetName: string, interval: Phase1IntervalName): string {
  if (interval === "P1") return `${rootName} to ${targetName} at the same pitch: identify the interval.`;
  if (interval === "P8") return `${rootName} to the next ${targetName} one octave higher: identify the interval.`;
  return `${rootName} up to ${targetName}: identify the exact interval.`;
}

function earlyIdentifyExplanation(rootName: string, targetName: string, interval: Phase1IntervalName): string {
  if (interval === "P1") return `${rootName} to ${targetName} at the same pitch is a Perfect Unison (P1).`;
  if (interval === "P8") return `${rootName} to the next ${targetName} one octave higher is a Perfect Octave (P8).`;
  const number = INTERVALS[interval].number;
  return `${rootName} to ${targetName} is ${INTERVALS[interval].name} (${interval}). The written letters span ${number} letter names, so the interval number is a ${ordinal(number)}.`;
}

function earlyConstructExplanation(rootName: string, targetName: string, interval: Phase1IntervalName): string {
  if (interval === "P1") return `A Perfect Unison keeps the same written note at the same pitch. The correct answer is ${targetName}.`;
  if (interval === "P8") return `A Perfect Octave keeps the same letter name one octave higher. The correct answer is ${targetName}.`;
  const number = INTERVALS[interval].number;
  return `First choose the target letter that makes a ${ordinal(number)} above ${rootName}. Then match the named ${INTERVALS[interval].name} keyboard relationship from the lesson. The correct spelling is ${targetName}.`;
}

function makeIdentify(skillId: string, interval: Phase1IntervalName, index: number): Exercise {
  const root = rootFor(index);
  const target = intervalAbove(root, INTERVALS[interval]);
  const rootName = formatNote(root);
  const targetName = formatNote(target);
  const explanation = PRE_CHROMATIC_DETAIL_SKILLS.has(skillId)
    ? earlyIdentifyExplanation(rootName, targetName, interval)
    : `${rootName} to ${targetName} is ${INTERVALS[interval].name} (${interval}): a ${INTERVALS[interval].number} by letter spelling and ${INTERVALS[interval].semitones} semitone${INTERVALS[interval].semitones === 1 ? "" : "s"}.`;
  return createExercise({
    skillId,
    prompt: pairPrompt(rootName, targetName, interval),
    answerSpec: { kind: "choice", expected: interval, choices: intervalChoices(skillId, interval) },
    explanation,
    exampleSignature: `${skillId}:identify:${rootName}:${targetName}:${interval}`,
    directEvidence: true,
    metadata: { family: "interval", direction: "identify", responseMode: "recognition", interval, root: rootName, target: targetName, pianoHighlighted: [keyboardPitchName(rootName), keyboardPitchName(targetName)] },
  }, index);
}

function makeConstruct(skillId: string, interval: Phase1IntervalName, index: number): Exercise {
  const root = rootFor(index + 11);
  const target = intervalAbove(root, INTERVALS[interval]);
  const rootName = formatNote(root);
  const targetName = formatNote(target);
  const explanation = PRE_CHROMATIC_DETAIL_SKILLS.has(skillId)
    ? earlyConstructExplanation(rootName, targetName, interval)
    : `The target must first be a ${INTERVALS[interval].number} by letter name, then the accidental must make the distance ${INTERVALS[interval].semitones} semitone${INTERVALS[interval].semitones === 1 ? "" : "s"}. The correct spelling is ${targetName}.`;
  return createExercise({
    skillId,
    prompt: `Construct ${INTERVALS[interval].name} (${interval}) above ${rootName}. Enter the correctly spelled target note.`,
    answerSpec: { kind: "note", expected: targetName },
    explanation,
    exampleSignature: `${skillId}:construct:${rootName}:${interval}:${targetName}`,
    directEvidence: true,
    metadata: { family: "interval", direction: "construct", responseMode: "constructed", interval, root: rootName, target: targetName, pianoHighlighted: [keyboardPitchName(rootName)], revealPianoTarget: keyboardPitchName(targetName) },
  }, index);
}

function makeInversion(skillId: string, interval: Phase1IntervalName, index: number): Exercise {
  const inverse = invertPhase1Interval(interval);
  const choices = [...new Set([inverse, interval, invertPhase1Interval(inverse), ...(INTERVALS[inverse].quality === "perfect" ? PERFECT_CHOICES : MAJOR_MINOR_CHOICES)])].slice(0, 5);
  return createExercise({
    skillId,
    prompt: `Invert ${INTERVALS[interval].name} (${interval}). What interval does it become?`,
    answerSpec: { kind: "choice", expected: inverse, choices },
    explanation: `${INTERVALS[interval].number} + ${INTERVALS[inverse].number} = 9, and ${INTERVALS[interval].quality} inverts to ${INTERVALS[inverse].quality}. So ${interval} ↔ ${inverse}.`,
    exampleSignature: `${skillId}:invert:${interval}:${inverse}:${index % 3}`,
    directEvidence: true,
    metadata: { family: "interval-inversion", direction: "transform", responseMode: "application", interval, inverse },
  }, index);
}

function makeTritoneSpelling(skillId: string, index: number): Exercise {
  const interval: Phase1IntervalName = index % 2 === 0 ? "A4" : "d5";
  const root = rootFor(index + 17);
  const target = intervalAbove(root, INTERVALS[interval]);
  const rootName = formatNote(root);
  const targetName = formatNote(target);
  const other = interval === "A4" ? "d5" : "A4";
  return createExercise({
    skillId,
    prompt: `${rootName} up to ${targetName} spans six semitones. Is the correctly spelled interval A4 or d5?`,
    answerSpec: { kind: "choice", expected: interval, choices: ["A4", "d5"] },
    explanation: `The letters make this a ${INTERVALS[interval].number}, so the six-semitone tritone is ${interval}, not ${other}. Spelling determines the interval name.`,
    exampleSignature: `${skillId}:tritone-spelling:${rootName}:${targetName}:${interval}`,
    directEvidence: true,
    metadata: { family: "tritone-spelling", direction: "diagnose", responseMode: "discrimination", interval, root: rootName, target: targetName, pianoHighlighted: [keyboardPitchName(rootName), keyboardPitchName(targetName)] },
  }, index);
}

function makeNumberInversion(skillId: string, index: number): Exercise {
  const number = (index % 4) + 1;
  const shown = index % 2 === 0 ? number : 9 - number;
  const expected = 9 - shown;
  return createExercise({
    skillId,
    prompt: `A ${shown}${shown === 1 ? "st" : shown === 2 ? "nd" : shown === 3 ? "rd" : "th"} inverts to what interval number?`,
    answerSpec: { kind: "number", expected },
    explanation: `Simple interval numbers under inversion add to 9: ${shown} + ${expected} = 9.`,
    exampleSignature: `${skillId}:invert-number:${shown}:${index % 3}`,
    directEvidence: true,
    metadata: { family: "interval-inversion", direction: "transform", responseMode: "constructed", shown, expected },
  }, index);
}

function generatorFor(skillId: string): ExerciseGenerator {
  const pool = LESSON_POOLS[skillId];
  if (!pool) throw new Error(`No Phase 1 interval pool for ${skillId}`);
  return (index: number) => {
    const safe = Math.max(0, index);
    const interval = intervalFor(pool, safe);
    if (skillId === "intervals.lesson-3-perfect-fourth" && safe % 5 === 4) return makeInversion(skillId, safe % 2 === 0 ? "P5" : "P4", safe);
    if (skillId === "intervals.lesson-5-sixths" && safe % 5 === 0) return makeInversion(skillId, ["M3", "m6", "m3", "M6"][safe % 4] as Phase1IntervalName, safe);
    if (skillId === "intervals.lesson-7-sevenths" && safe % 5 === 0) return makeInversion(skillId, ["M2", "m7", "m2", "M7"][safe % 4] as Phase1IntervalName, safe);
    if (skillId === "intervals.lesson-8-tritone" && safe % 4 === 0) return makeTritoneSpelling(skillId, safe);
    if (skillId === "intervals.lesson-9-inversion-capstone") {
      if (safe % 3 === 0) return makeNumberInversion(skillId, safe);
      return makeInversion(skillId, PHASE1_INTERVAL_NAMES[(safe * 5) % PHASE1_INTERVAL_NAMES.length], safe);
    }
    if (skillId === "intervals.lesson-10-cumulative") {
      if (safe % 7 === 0) return makeInversion(skillId, interval, safe);
      if (safe % 11 === 0) return makeTritoneSpelling(skillId, safe);
    }
    return safe % 2 === 0 ? makeConstruct(skillId, interval, safe) : makeIdentify(skillId, interval, safe);
  };
}

export const PHASE1_INTERVAL_GENERATORS: ReadonlyMap<string, ExerciseGenerator> = new Map(Object.keys(LESSON_POOLS).map((skillId) => [skillId, generatorFor(skillId)]));
export function phase1ExerciseForSkill(skillId: string, index = 0): Exercise | undefined { return PHASE1_INTERVAL_GENERATORS.get(skillId)?.(index); }
export function phase1RootNames(): readonly string[] { return ROOT_NAMES; }
