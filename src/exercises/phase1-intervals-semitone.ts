import {
  INTERVALS,
  PHASE1_INTERVAL_NAMES,
  type IntervalQuality,
  type Phase1IntervalName,
} from "../theory/index.js";
import { createExercise } from "./generators.js";
import {
  PHASE1_INTERVAL_GENERATORS as BASE_PHASE1_INTERVAL_GENERATORS,
} from "./phase1-intervals.js";
import type { Exercise, ExerciseGenerator } from "./types.js";

export { phase1RootNames } from "./phase1-intervals.js";

const L1 = "intervals.lesson-1-unison-octave";
const L2 = "intervals.lesson-2-perfect-fifth";
const L3 = "intervals.lesson-3-perfect-fourth";
const L4 = "intervals.lesson-4-thirds";
const L5 = "intervals.lesson-5-sixths";
const L6 = "intervals.lesson-6-seconds";
const L7 = "intervals.lesson-7-sevenths";
const L8 = "intervals.lesson-8-tritone";
const L9 = "intervals.lesson-9-inversion-capstone";
const L10 = "intervals.lesson-10-cumulative";

/**
 * Semitone fluency is cumulative, but it is strictly gated by teaching order.
 * New interval qualities are placed first so their two-way semitone link appears
 * early in that lesson's acquisition round instead of being buried behind old material.
 */
const SEMITONE_POOLS: Readonly<Record<string, readonly Phase1IntervalName[]>> = Object.freeze({
  [L1]: ["P1", "P8"],
  [L2]: ["P5", "P1", "P8"],
  [L3]: ["P4", "P5", "P1", "P8"],
  [L4]: ["M3", "m3", "P4", "P5", "P1", "P8"],
  [L5]: ["M6", "m6", "M3", "m3", "P4", "P5", "P1", "P8"],
  [L6]: ["M2", "m2", "M6", "m6", "M3", "m3", "P4", "P5", "P1", "P8"],
  [L7]: ["M7", "m7", "M2", "m2", "M6", "m6", "M3", "m3", "P4", "P5", "P1", "P8"],
  [L8]: ["A4", "d5", "M7", "m7", "M2", "m2", "M6", "m6", "M3", "m3", "P4", "P5", "P1", "P8"],
  [L9]: PHASE1_INTERVAL_NAMES,
  [L10]: PHASE1_INTERVAL_NAMES,
});

const QUALITY_DISCRIMINATION_PAIRS: Readonly<Record<string, readonly (readonly [Phase1IntervalName, Phase1IntervalName])[]>> = Object.freeze({
  [L4]: [["m3", "M3"]],
  [L5]: [["m6", "M6"], ["m3", "M3"]],
  [L6]: [["m2", "M2"], ["m6", "M6"], ["m3", "M3"]],
  [L7]: [["m7", "M7"], ["m2", "M2"], ["m6", "M6"], ["m3", "M3"]],
  [L8]: [["m7", "M7"], ["m2", "M2"], ["m6", "M6"], ["m3", "M3"]],
  [L9]: [["m2", "M2"], ["m3", "M3"], ["m6", "M6"], ["m7", "M7"]],
  [L10]: [["m2", "M2"], ["m3", "M3"], ["m6", "M6"], ["m7", "M7"]],
});

function ordinal(number: number): string {
  if (number === 1) return "1st";
  if (number === 2) return "2nd";
  if (number === 3) return "3rd";
  return `${number}th`;
}

function qualityWord(quality: IntervalQuality): string {
  if (quality === "major") return "Major";
  if (quality === "minor") return "minor";
  if (quality === "perfect") return "Perfect";
  if (quality === "augmented") return "Augmented";
  return "Diminished";
}

function readableInterval(interval: Phase1IntervalName): string {
  if (interval === "P1") return "Perfect Unison";
  if (interval === "P8") return "Perfect Octave";
  const spec = INTERVALS[interval];
  return `${qualityWord(spec.quality)} ${ordinal(spec.number)}`;
}

function semitoneWord(count: number): string {
  return `${count} semitone${count === 1 ? "" : "s"}`;
}

function articleFor(text: string): string {
  return /^[aeiou]/i.test(text) ? "an" : "a";
}

function makeIntervalToSemitones(skillId: string, interval: Phase1IntervalName, index: number): Exercise {
  const spec = INTERVALS[interval];
  const name = readableInterval(interval);
  const tritoneGuard = interval === "A4" || interval === "d5"
    ? " Six semitones alone does not decide between A4 and d5; the written interval number still decides which name is correct."
    : "";

  return createExercise({
    skillId,
    prompt: `How many semitones are in ${articleFor(name)} ${name}?`,
    answerSpec: { kind: "number", expected: spec.semitones },
    explanation: `${name} (${interval}) spans ${semitoneWord(spec.semitones)}. Its interval number still comes from the written note-letter span; the semitone count gives the exact chromatic size.${tritoneGuard}`,
    exampleSignature: `${skillId}:interval-to-semitones:${interval}`,
    directEvidence: true,
    metadata: {
      family: "interval-semitone",
      direction: "interval-to-semitones",
      responseMode: "constructed",
      interval,
      intervalNumber: spec.number,
      quality: spec.quality,
      semitones: spec.semitones,
      competencies: ["quality-discrimination"],
    },
  }, index);
}

function makeSemitonesToInterval(skillId: string, interval: Phase1IntervalName, index: number): Exercise {
  const spec = INTERVALS[interval];
  const name = readableInterval(interval);
  const family = ordinal(spec.number);
  const accepted = [interval, INTERVALS[interval].name, `${qualityWord(spec.quality)} ${family}`];
  const tritoneGuard = interval === "A4" || interval === "d5"
    ? ` The family is already fixed as a ${family}, which is why this six-semitone interval is ${interval} rather than its enharmonic tritone partner.`
    : "";

  return createExercise({
    skillId,
    prompt: `A ${family} spans ${semitoneWord(spec.semitones)}. What interval is it? Enter the interval name or abbreviation.`,
    answerSpec: { kind: "text", expected: name, accepted, caseSensitive: false },
    explanation: `The written-note family is already fixed as a ${family}. Within that family, ${semitoneWord(spec.semitones)} gives ${name} (${interval}).${tritoneGuard}`,
    exampleSignature: `${skillId}:semitones-to-interval:${interval}`,
    directEvidence: true,
    metadata: {
      family: "interval-semitone",
      direction: "semitones-to-interval",
      responseMode: "constructed",
      interval,
      intervalNumber: spec.number,
      quality: spec.quality,
      semitones: spec.semitones,
      competencies: ["quality-discrimination"],
    },
  }, index);
}

function makeQualityDiscrimination(
  skillId: string,
  pair: readonly [Phase1IntervalName, Phase1IntervalName],
  index: number,
): Exercise {
  const [minorInterval, majorInterval] = pair;
  const minor = INTERVALS[minorInterval];
  const major = INTERVALS[majorInterval];
  const askLarger = Math.floor(Math.max(0, index) / 10) % 2 === 0;
  const expectedInterval = askLarger ? majorInterval : minorInterval;
  const expected = readableInterval(expectedInterval);
  const minorName = readableInterval(minorInterval);
  const majorName = readableInterval(majorInterval);

  return createExercise({
    skillId,
    prompt: `Which is ${askLarger ? "larger" : "smaller"}: ${minorName} or ${majorName}?`,
    answerSpec: { kind: "choice", expected, choices: [minorName, majorName] },
    explanation: `${minorName} (${minorInterval}) is ${semitoneWord(minor.semitones)}. ${majorName} (${majorInterval}) is ${semitoneWord(major.semitones)}. For the same interval number, the Major form is one semitone larger than the minor form.`,
    exampleSignature: `${skillId}:quality-discrimination:${minorInterval}:${majorInterval}:${askLarger ? "larger" : "smaller"}`,
    directEvidence: true,
    metadata: {
      family: "interval-quality-discrimination",
      direction: "quality-discrimination",
      responseMode: "discrimination",
      interval: expectedInterval,
      comparedIntervals: [minorInterval, majorInterval],
      intervalNumber: minor.number,
      competencies: ["quality-discrimination"],
    },
  }, index);
}

function semitoneIntervalFor(skillId: string, index: number): Phase1IntervalName {
  const pool = SEMITONE_POOLS[skillId];
  if (!pool?.length) throw new Error(`No semitone pool for ${skillId}`);
  const cycle = Math.floor(Math.max(0, index) / 10);
  return pool[cycle % pool.length];
}

function discriminationPairFor(skillId: string, index: number): readonly [Phase1IntervalName, Phase1IntervalName] | undefined {
  const pairs = QUALITY_DISCRIMINATION_PAIRS[skillId];
  if (!pairs?.length) return undefined;
  const cycle = Math.floor(Math.max(0, index) / 10);
  return pairs[cycle % pairs.length];
}

function wrapGenerator(skillId: string, base: ExerciseGenerator): ExerciseGenerator {
  return (index: number) => {
    const safe = Math.max(0, index);
    const slot = safe % 10;

    // Lesson 1 has a deliberately short 10-question acquisition round, so both
    // P1 and P8 receive both semitone directions inside that first round.
    if (skillId === L1) {
      if (slot === 0) return makeIntervalToSemitones(skillId, "P1", safe);
      if (slot === 1) return makeSemitonesToInterval(skillId, "P1", safe);
      if (slot === 2) return makeIntervalToSemitones(skillId, "P8", safe);
      if (slot === 3) return makeSemitonesToInterval(skillId, "P8", safe);
      return base(safe);
    }

    // In later lessons, semitone mapping is one representation among several:
    // 20% direct bidirectional mapping, plus a 10% Major/minor discrimination
    // slot only after those qualities have actually been introduced.
    const semitoneInterval = semitoneIntervalFor(skillId, safe);
    if (slot === 0) return makeIntervalToSemitones(skillId, semitoneInterval, safe);
    if (slot === 1) return makeSemitonesToInterval(skillId, semitoneInterval, safe);
    if (slot === 2) {
      const pair = discriminationPairFor(skillId, safe);
      if (pair) return makeQualityDiscrimination(skillId, pair, safe);
    }

    return base(safe);
  };
}

export const PHASE1_INTERVAL_GENERATORS: ReadonlyMap<string, ExerciseGenerator> = new Map(
  [...BASE_PHASE1_INTERVAL_GENERATORS].map(([skillId, generator]) => [skillId, wrapGenerator(skillId, generator)]),
);

export function phase1ExerciseForSkill(skillId: string, index = 0): Exercise | undefined {
  return PHASE1_INTERVAL_GENERATORS.get(skillId)?.(index);
}

export function phase1SemitoneIntervalsForSkill(skillId: string): readonly Phase1IntervalName[] {
  return SEMITONE_POOLS[skillId] ?? [];
}
