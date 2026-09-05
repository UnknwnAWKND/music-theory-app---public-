import {
  MAJOR_PITCH_CLASS_ROOTS,
  MAJOR_SCALE_DEGREE_INTERVALS,
  MAJOR_SCALE_STEP_PATTERN,
  conventionalMajorRootsForPitchClass,
  majorScaleDegreeNote,
  majorScaleNames,
  parseNote,
  pitchClass,
  scaleDegreeName,
} from "../theory/index.js";
import { createExercise } from "./generators.js";
import { phase1ExerciseForSkill } from "./phase1-intervals.js";
import type { Exercise, ExerciseGenerator } from "./types.js";

export const PHASE2_MAJOR_SCALE_SKILL_IDS = [
  "major-scales.lesson-1-formula",
  "major-scales.lesson-2-degree-names",
  "major-scales.lesson-3-build-all-roots",
  "major-scales.lesson-4-instant-recall",
] as const;

const PHASE1_SCALE_INTERVAL_REVIEW_SKILLS = [
  "intervals.lesson-1-unison-octave",
  "intervals.lesson-2-perfect-fifth",
  "intervals.lesson-3-perfect-fourth",
  "intervals.lesson-4-thirds",
  "intervals.lesson-5-sixths",
  "intervals.lesson-6-seconds",
  "intervals.lesson-7-sevenths",
] as const;

const SIMPLE_APPLICATION_ROOTS = ["C", "G", "F", "D"] as const;
const COMMON_EASY_KEYS = new Set(["C", "G", "D", "F"]);
const PIANO_PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function pianoPitchName(noteName: string): string {
  return PIANO_PITCH_NAMES[pitchClass(parseNote(noteName))];
}

function rootForPitchClassIndex(pcIndex: number, spellingRound = 0): string {
  const pc = mod(pcIndex, 12);
  const spellings = conventionalMajorRootsForPitchClass(pc);
  return spellings[mod(spellingRound, spellings.length)] ?? MAJOR_PITCH_CLASS_ROOTS[pc];
}

function rootForBuildIndex(index: number): string {
  const group = Math.floor(Math.max(0, index) / 4);
  return rootForPitchClassIndex(group, Math.floor(group / 12));
}

function rootForRecallIndex(index: number): string {
  const safe = Math.max(0, index);
  const pc = mod(safe, 12);
  const spellingRound = Math.floor(safe / 12);
  return rootForPitchClassIndex(pc, spellingRound);
}

function scaleMetadata(root: string, direction: string, responseMode: string, checkpointCompetencies: readonly string[], extra: Record<string, unknown> = {}) {
  const scale = majorScaleNames(root);
  return {
    family: "major-scale",
    root,
    pitchClassRoot: pitchClass(parseNote(root)),
    scale,
    direction,
    responseMode,
    checkpointCompetencies,
    unfamiliarKey: !COMMON_EASY_KEYS.has(root),
    pianoHighlighted: [pianoPitchName(root)],
    revealPianoNotes: scale.map(pianoPitchName),
    ...extra,
  };
}

function crossPhaseIntervalReview(index: number): Exercise {
  const safe = Math.max(0, index);
  const skillId = PHASE1_SCALE_INTERVAL_REVIEW_SKILLS[mod(Math.floor(safe / 8), PHASE1_SCALE_INTERVAL_REVIEW_SKILLS.length)];
  const item = phase1ExerciseForSkill(skillId, safe * 7 + 3);
  if (!item) throw new Error(`Missing Phase 1 interval review generator for ${skillId}`);
  return {
    ...item,
    metadata: {
      ...(item.metadata ?? {}),
      crossPhaseReview: true,
      reviewReason: "major-scale-interval-connection",
    },
  };
}

function formulaSequence(skillId: string, index: number): Exercise {
  const variant = mod(index, 3);
  const prompts = [
    "Write the ascending major-scale step formula using W and H.",
    "What whole-step / half-step pattern builds every ascending major scale?",
    "Complete the major-scale formula from tonic back to tonic using W and H.",
  ];
  return createExercise({
    skillId,
    prompt: prompts[variant],
    answerSpec: {
      kind: "text",
      expected: "W-W-H-W-W-W-H",
      accepted: [
        "W W H W W W H",
        "WWHWWWH",
        "whole whole half whole whole whole half",
        "whole-whole-half-whole-whole-whole-half",
      ],
    },
    explanation: "The major scale uses W-W-H-W-W-W-H. The half steps fall between degrees 3→4 and 7→1 (the octave tonic).",
    exampleSignature: `${skillId}:formula:${variant}`,
    metadata: {
      family: "major-scale-formula",
      direction: "recall-formula",
      responseMode: "constructed",
      checkpointCompetencies: ["formula-understanding"],
    },
  }, index);
}

function formulaStepLocation(skillId: string, index: number): Exercise {
  const transition = mod(index * 5, 7);
  const expected = MAJOR_SCALE_STEP_PATTERN[transition];
  const from = transition + 1;
  const to = transition === 6 ? "1 (octave)" : String(transition + 2);
  return createExercise({
    skillId,
    prompt: `In a major scale, is degree ${from} → ${to} a whole step (W) or half step (H)?`,
    answerSpec: { kind: "choice", expected, choices: ["W", "H"] },
    explanation: `The major-scale pattern is W-W-H-W-W-W-H, so degree ${from} → ${to} is ${expected === "W" ? "a whole step" : "a half step"}.`,
    exampleSignature: `${skillId}:step:${from}:${to}`,
    metadata: {
      family: "major-scale-formula",
      direction: "identify-step",
      responseMode: "discrimination",
      transition: `${from}-${to}`,
      checkpointCompetencies: ["formula-understanding"],
    },
  }, index);
}

function formulaIntervalConnection(skillId: string, index: number): Exercise {
  const degree = mod(index * 3, 7) + 2;
  const expected = MAJOR_SCALE_DEGREE_INTERVALS[degree - 1];
  const choices = ["M2", "M3", "P4", "P5", "M6", "M7", "P8"];
  return createExercise({
    skillId,
    prompt: `Connect this to Phase 1: from the tonic of a major scale up to degree ${degree}, what interval is formed?`,
    answerSpec: { kind: "choice", expected, choices },
    explanation: `Major-scale degree ${degree} sits ${expected} above the tonic. The scale formula produces the same interval relationship you learned in Phase 1.`,
    exampleSignature: `${skillId}:tonic-interval:degree-${degree}`,
    metadata: {
      family: "major-scale-formula",
      direction: "interval-connection",
      responseMode: "application",
      degree,
      interval: expected,
      checkpointCompetencies: ["formula-understanding"],
    },
  }, index);
}

function formulaAppliedScale(skillId: string, index: number): Exercise {
  const root = SIMPLE_APPLICATION_ROOTS[mod(Math.floor(index / 4), SIMPLE_APPLICATION_ROOTS.length)];
  const scale = majorScaleNames(root);
  return createExercise({
    skillId,
    prompt: `Apply W-W-H-W-W-W-H to ${root}. Spell the seven notes of ${root} major in order (do not repeat the octave tonic).`,
    answerSpec: { kind: "note-sequence", expected: scale },
    explanation: `${root} major is ${scale.join(" – ")}. Each scale degree uses the next letter name, and the W/H pattern determines the needed accidentals.`,
    exampleSignature: `${skillId}:apply-formula:${root}`,
    metadata: scaleMetadata(root, "construct", "constructed", ["formula-understanding", "scale-construction", "correct-spelling"]),
  }, index);
}

function degreeNameQuestion(skillId: string, index: number): Exercise {
  const degree = mod(index * 5, 7) + 1;
  const expected = scaleDegreeName(degree);
  return createExercise({
    skillId,
    prompt: `What is the scale-degree name for degree ${degree}?`,
    answerSpec: { kind: "text", expected, accepted: expected === "Leading Tone" ? ["leading-tone", "leading note"] : [] },
    explanation: `Degree ${degree} is the ${expected}.`,
    exampleSignature: `${skillId}:degree-name:${degree}`,
    metadata: {
      family: "scale-degree",
      direction: "number-to-name",
      responseMode: "constructed",
      degree,
      degreeName: expected,
      checkpointCompetencies: ["scale-degrees"],
    },
  }, index);
}

function degreeNumberQuestion(skillId: string, index: number): Exercise {
  const degree = mod(index * 3 + 1, 7) + 1;
  const name = scaleDegreeName(degree);
  return createExercise({
    skillId,
    prompt: `The ${name} is which scale degree number?`,
    answerSpec: { kind: "number", expected: degree },
    explanation: `${name} is scale degree ${degree}.`,
    exampleSignature: `${skillId}:degree-number:${degree}`,
    metadata: {
      family: "scale-degree",
      direction: "name-to-number",
      responseMode: "constructed",
      degree,
      degreeName: name,
      checkpointCompetencies: ["scale-degrees"],
    },
  }, index);
}

function degreeNoteQuestion(skillId: string, index: number): Exercise {
  const root = SIMPLE_APPLICATION_ROOTS[mod(Math.floor(index / 4), SIMPLE_APPLICATION_ROOTS.length)];
  const degree = mod(index * 5, 7) + 1;
  const expected = majorScaleDegreeNote(root, degree);
  return createExercise({
    skillId,
    prompt: `In ${root} major, what note is scale degree ${degree} (${scaleDegreeName(degree)})?`,
    answerSpec: { kind: "note", expected },
    explanation: `${root} major is ${majorScaleNames(root).join(" – ")}, so degree ${degree} is ${expected}.`,
    exampleSignature: `${skillId}:degree-note:${root}:${degree}`,
    metadata: scaleMetadata(root, "degree-to-note", "constructed", ["scale-degrees"], { degree, target: expected, revealPianoTarget: pianoPitchName(expected) }),
  }, index);
}

function noteDegreeQuestion(skillId: string, index: number): Exercise {
  const root = SIMPLE_APPLICATION_ROOTS[mod(Math.floor(index / 4) + 1, SIMPLE_APPLICATION_ROOTS.length)];
  const degree = mod(index * 2 + 2, 7) + 1;
  const note = majorScaleDegreeNote(root, degree);
  return createExercise({
    skillId,
    prompt: `In ${root} major, ${note} is which scale degree number?`,
    answerSpec: { kind: "number", expected: degree },
    explanation: `${note} is degree ${degree}, the ${scaleDegreeName(degree)}, in ${root} major.`,
    exampleSignature: `${skillId}:note-degree:${root}:${note}`,
    metadata: scaleMetadata(root, "note-to-degree", "application", ["scale-degrees"], { degree, target: note, pianoHighlighted: [pianoPitchName(root), pianoPitchName(note)] }),
  }, index);
}

function buildFullScale(skillId: string, root: string, index: number, recall = false): Exercise {
  const scale = majorScaleNames(root);
  const lead = recall ? "From memory, spell" : "Build";
  return createExercise({
    skillId,
    prompt: `${lead} the seven notes of ${root} major in order. Use exact theoretical spelling; do not repeat the octave tonic.`,
    answerSpec: { kind: "note-sequence", expected: scale },
    explanation: `${root} major is ${scale.join(" – ")}. A diatonic major scale uses each letter name once, then accidentals make the W-W-H-W-W-W-H distances exact.`,
    exampleSignature: `${skillId}:${recall ? "recall" : "build"}:${root}`,
    metadata: scaleMetadata(root, recall ? "instant-recall" : "construct", "constructed", ["scale-construction", "correct-spelling", "key-variety", ...(recall ? ["instant-recall"] : [])], { automaticRecall: recall }),
  }, index);
}

function missingScaleNote(skillId: string, root: string, index: number, recall = false): Exercise {
  const scale = majorScaleNames(root);
  const missingIndex = mod(index * 5 + 2, 7);
  const shown = scale.map((note, i) => i === missingIndex ? "__" : note).join(" – ");
  const expected = scale[missingIndex];
  return createExercise({
    skillId,
    prompt: `${root} major: ${shown}. What note belongs in the blank?`,
    answerSpec: { kind: "note", expected },
    explanation: `The correctly spelled ${root} major scale is ${scale.join(" – ")}. The missing degree ${missingIndex + 1} is ${expected}.`,
    exampleSignature: `${skillId}:missing:${root}:degree-${missingIndex + 1}`,
    metadata: scaleMetadata(root, "fill-missing", "constructed", ["scale-construction", "correct-spelling", "key-variety", ...(recall ? ["instant-recall"] : [])], { degree: missingIndex + 1, target: expected, revealPianoTarget: pianoPitchName(expected), automaticRecall: recall }),
  }, index);
}

function requestedDegreeNote(skillId: string, root: string, index: number, recall = false): Exercise {
  const degree = mod(index * 5 + 1, 7) + 1;
  const expected = majorScaleDegreeNote(root, degree);
  return createExercise({
    skillId,
    prompt: `What is scale degree ${degree} in ${root} major?`,
    answerSpec: { kind: "note", expected },
    explanation: `Degree ${degree} (${scaleDegreeName(degree)}) of ${root} major is ${expected}.`,
    exampleSignature: `${skillId}:degree-note:${root}:${degree}`,
    metadata: scaleMetadata(root, "degree-to-note", "constructed", ["scale-construction", "scale-degrees", "key-variety", ...(recall ? ["instant-recall"] : [])], { degree, target: expected, revealPianoTarget: pianoPitchName(expected), automaticRecall: recall }),
  }, index);
}

function identifyDegreeInKey(skillId: string, root: string, index: number, recall = false): Exercise {
  const degree = mod(index * 3 + 4, 7) + 1;
  const note = majorScaleDegreeNote(root, degree);
  return createExercise({
    skillId,
    prompt: `In ${root} major, what scale degree number is ${note}?`,
    answerSpec: { kind: "number", expected: degree },
    explanation: `${note} is degree ${degree} (${scaleDegreeName(degree)}) in ${root} major.`,
    exampleSignature: `${skillId}:note-degree:${root}:${note}`,
    metadata: scaleMetadata(root, "note-to-degree", "application", ["scale-degrees", "key-variety", ...(recall ? ["instant-recall"] : [])], { degree, target: note, pianoHighlighted: [pianoPitchName(root), pianoPitchName(note)], automaticRecall: recall }),
  }, index);
}

function phase2FormulaGenerator(index: number): Exercise {
  const safe = Math.max(0, index);
  if (safe % 9 === 8) return crossPhaseIntervalReview(safe);
  switch (safe % 4) {
    case 0: return formulaSequence(PHASE2_MAJOR_SCALE_SKILL_IDS[0], safe);
    case 1: return formulaStepLocation(PHASE2_MAJOR_SCALE_SKILL_IDS[0], safe);
    case 2: return formulaIntervalConnection(PHASE2_MAJOR_SCALE_SKILL_IDS[0], safe);
    default: return formulaAppliedScale(PHASE2_MAJOR_SCALE_SKILL_IDS[0], safe);
  }
}

function phase2DegreeGenerator(index: number): Exercise {
  const safe = Math.max(0, index);
  if (safe % 12 === 11) return crossPhaseIntervalReview(safe + 19);
  switch (safe % 4) {
    case 0: return degreeNameQuestion(PHASE2_MAJOR_SCALE_SKILL_IDS[1], safe);
    case 1: return degreeNumberQuestion(PHASE2_MAJOR_SCALE_SKILL_IDS[1], safe);
    case 2: return degreeNoteQuestion(PHASE2_MAJOR_SCALE_SKILL_IDS[1], safe);
    default: return noteDegreeQuestion(PHASE2_MAJOR_SCALE_SKILL_IDS[1], safe);
  }
}

function phase2BuildGenerator(index: number): Exercise {
  const safe = Math.max(0, index);
  if (safe % 12 === 11) return crossPhaseIntervalReview(safe + 37);
  const root = rootForBuildIndex(safe);
  switch (safe % 4) {
    case 0: return buildFullScale(PHASE2_MAJOR_SCALE_SKILL_IDS[2], root, safe);
    case 1: return missingScaleNote(PHASE2_MAJOR_SCALE_SKILL_IDS[2], root, safe);
    case 2: return requestedDegreeNote(PHASE2_MAJOR_SCALE_SKILL_IDS[2], root, safe);
    default: return identifyDegreeInKey(PHASE2_MAJOR_SCALE_SKILL_IDS[2], root, safe);
  }
}

function phase2RecallGenerator(index: number): Exercise {
  const safe = Math.max(0, index);
  if (safe % 10 === 9) return crossPhaseIntervalReview(safe + 71);
  const root = rootForRecallIndex(safe);
  const batch = mod(Math.floor(safe / 12), 5);
  if (batch === 0 || batch === 3) return buildFullScale(PHASE2_MAJOR_SCALE_SKILL_IDS[3], root, safe, true);
  if (batch === 1) return requestedDegreeNote(PHASE2_MAJOR_SCALE_SKILL_IDS[3], root, safe, true);
  if (batch === 2) return missingScaleNote(PHASE2_MAJOR_SCALE_SKILL_IDS[3], root, safe, true);
  return identifyDegreeInKey(PHASE2_MAJOR_SCALE_SKILL_IDS[3], root, safe, true);
}

export const PHASE2_MAJOR_SCALE_GENERATORS: ReadonlyMap<string, ExerciseGenerator> = new Map([
  [PHASE2_MAJOR_SCALE_SKILL_IDS[0], phase2FormulaGenerator],
  [PHASE2_MAJOR_SCALE_SKILL_IDS[1], phase2DegreeGenerator],
  [PHASE2_MAJOR_SCALE_SKILL_IDS[2], phase2BuildGenerator],
  [PHASE2_MAJOR_SCALE_SKILL_IDS[3], phase2RecallGenerator],
]);

export function phase2ExerciseForSkill(skillId: string, index = 0): Exercise | undefined {
  return PHASE2_MAJOR_SCALE_GENERATORS.get(skillId)?.(index);
}

export function phase2BalancedRootNames(count = 60): string[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => rootForRecallIndex(index));
}
