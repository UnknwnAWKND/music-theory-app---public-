import {
  HARMONIC_MINOR_DEGREE_INTERVALS,
  MELODIC_MINOR_ASC_DEGREE_INTERVALS,
  MINOR_PITCH_CLASS_ROOTS,
  NATURAL_MINOR_DEGREE_INTERVALS,
  NATURAL_MINOR_STEP_PATTERN,
  classicalMelodicMinorNames,
  conventionalMinorRootsForPitchClass,
  harmonicMinorAugmentedSecond,
  harmonicMinorScaleNames,
  melodicMinorAscendingScaleNames,
  minorLeadingToneName,
  minorRootForPitchClass,
  minorScaleDegreeNote,
  naturalMinorScaleNames,
  parseNote,
  pitchClass,
} from "../theory/index.js";
import { createExercise } from "./generators.js";
import { phase1ExerciseForSkill } from "./phase1-intervals.js";
import { phase2ExerciseForSkill } from "./phase2-major-scales.js";
import type { Exercise, ExerciseGenerator } from "./types.js";

export const PHASE3_MINOR_SCALE_SKILL_IDS = [
  "minor-scales.lesson-1-natural-formula",
  "minor-scales.lesson-2-natural-all-roots",
  "minor-scales.lesson-3-harmonic-minor",
  "minor-scales.lesson-4-melodic-minor",
  "minor-scales.lesson-5-instant-recall",
] as const;

type MinorForm = "natural" | "harmonic" | "melodic-ascending" | "melodic-descending";

const PHASE1_REVIEW_SKILLS = [
  "intervals.lesson-4-thirds",
  "intervals.lesson-5-sixths",
  "intervals.lesson-6-seconds",
  "intervals.lesson-7-sevenths",
  "intervals.lesson-10-cumulative",
] as const;
const PHASE2_REVIEW_SKILLS = [
  "major-scales.lesson-1-formula",
  "major-scales.lesson-2-degree-names",
  "major-scales.lesson-3-build-all-roots",
  "major-scales.lesson-4-instant-recall",
] as const;
const COMMON_EASY_MINOR_KEYS = new Set(["A", "E", "D", "C", "G"]);
const PIANO_PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function pianoPitchName(noteName: string): string {
  return PIANO_PITCH_NAMES[pitchClass(parseNote(noteName))];
}

function rootForPitchClassIndex(pcIndex: number, spellingRound = 0): string {
  const pc = mod(pcIndex, 12);
  const spellings = conventionalMinorRootsForPitchClass(pc);
  return spellings[mod(spellingRound, spellings.length)] ?? MINOR_PITCH_CLASS_ROOTS[pc];
}

function rootForBuildIndex(index: number): string {
  const group = Math.floor(Math.max(0, index) / 4);
  return rootForPitchClassIndex(group, Math.floor(group / 12));
}

function rootForRecallIndex(index: number): string {
  const safe = Math.max(0, index);
  return rootForPitchClassIndex(safe, Math.floor(safe / 12));
}

function scaleForForm(root: string, form: MinorForm): string[] {
  if (form === "natural") return naturalMinorScaleNames(root);
  if (form === "harmonic") return harmonicMinorScaleNames(root);
  if (form === "melodic-ascending") return melodicMinorAscendingScaleNames(root);
  return classicalMelodicMinorNames(root).descending;
}

function formLabel(form: MinorForm): string {
  if (form === "natural") return "natural minor";
  if (form === "harmonic") return "harmonic minor";
  if (form === "melodic-ascending") return "melodic minor ascending";
  return "melodic minor descending";
}

function scaleMetadata(
  root: string,
  form: MinorForm,
  direction: string,
  responseMode: string,
  checkpointCompetencies: readonly string[],
  extra: Record<string, unknown> = {},
) {
  const scale = scaleForForm(root, form);
  return {
    family: "minor-scale",
    root,
    pitchClassRoot: pitchClass(parseNote(root)),
    form,
    scale,
    direction,
    responseMode,
    checkpointCompetencies,
    unfamiliarKey: !COMMON_EASY_MINOR_KEYS.has(root),
    pianoHighlighted: [pianoPitchName(root)],
    revealPianoNotes: scale.map(pianoPitchName),
    ...extra,
  };
}

function crossPhaseFoundationReview(index: number): Exercise {
  const safe = Math.max(0, index);
  if (safe % 2 === 0) {
    const skillId = PHASE1_REVIEW_SKILLS[mod(Math.floor(safe / 2), PHASE1_REVIEW_SKILLS.length)];
    const item = phase1ExerciseForSkill(skillId, safe * 7 + 5);
    if (!item) throw new Error(`Missing Phase 1 review generator for ${skillId}`);
    return {
      ...item,
      metadata: { ...(item.metadata ?? {}), crossPhaseReview: true, reviewPhase: 1, reviewReason: "minor-scale-interval-foundation" },
    };
  }

  const skillId = PHASE2_REVIEW_SKILLS[mod(Math.floor(safe / 2), PHASE2_REVIEW_SKILLS.length)];
  for (let offset = 0; offset < 40; offset += 1) {
    const item = phase2ExerciseForSkill(skillId, safe * 11 + offset);
    if (item?.skillId === skillId) {
      return {
        ...item,
        metadata: { ...(item.metadata ?? {}), crossPhaseReview: true, reviewPhase: 2, reviewReason: "minor-scale-major-scale-foundation" },
      };
    }
  }
  throw new Error(`Missing direct Phase 2 review generator for ${skillId}`);
}

function naturalFormulaQuestion(skillId: string, index: number): Exercise {
  return createExercise({
    skillId,
    prompt: "Write the ascending natural-minor whole-step / half-step formula using W and H.",
    answerSpec: {
      kind: "text",
      expected: "W-H-W-W-H-W-W",
      accepted: ["W H W W H W W", "WHWWHWW", "whole half whole whole half whole whole", "whole-half-whole-whole-half-whole-whole"],
    },
    explanation: "Natural minor uses W-H-W-W-H-W-W.",
    exampleSignature: `${skillId}:natural-formula:${mod(index, 3)}`,
    metadata: { family: "minor-formula", form: "natural", direction: "recall-formula", responseMode: "constructed", checkpointCompetencies: ["natural-formula"] },
  }, index);
}

function naturalFormulaStep(skillId: string, index: number): Exercise {
  const transition = mod(index * 5, 7);
  const expected = NATURAL_MINOR_STEP_PATTERN[transition];
  const from = transition + 1;
  const to = transition === 6 ? "1 (octave)" : String(transition + 2);
  return createExercise({
    skillId,
    prompt: `In natural minor, is degree ${from} → ${to} a whole step (W) or half step (H)?`,
    answerSpec: { kind: "choice", expected, choices: ["W", "H"] },
    explanation: `Natural minor follows W-H-W-W-H-W-W, so degree ${from} → ${to} is ${expected === "W" ? "a whole step" : "a half step"}.`,
    exampleSignature: `${skillId}:natural-step:${from}:${to}`,
    metadata: { family: "minor-formula", form: "natural", direction: "identify-step", responseMode: "discrimination", checkpointCompetencies: ["natural-formula"] },
  }, index);
}

function naturalIntervalConnection(skillId: string, index: number): Exercise {
  const degree = mod(index * 3, 7) + 1;
  const expected = NATURAL_MINOR_DEGREE_INTERVALS[degree - 1];
  const choices = ["P1", "M2", "m3", "P4", "P5", "m6", "m7"];
  return createExercise({
    skillId,
    prompt: `Connect to Phase 1: from a natural-minor tonic to scale degree ${degree}, what interval is formed?`,
    answerSpec: { kind: "choice", expected, choices },
    explanation: `Natural-minor degree ${degree} is ${expected} above the tonic.`,
    exampleSignature: `${skillId}:natural-interval:degree-${degree}`,
    metadata: { family: "minor-formula", form: "natural", direction: "interval-connection", responseMode: "application", degree, interval: expected, checkpointCompetencies: ["natural-formula"] },
  }, index);
}

function naturalAppliedScale(skillId: string, index: number): Exercise {
  const root = ["C", "D", "E", "F", "G", "Bb"][mod(Math.floor(index / 4), 6)];
  const scale = naturalMinorScaleNames(root);
  return createExercise({
    skillId,
    prompt: `Apply W-H-W-W-H-W-W to ${root}. Spell the seven notes of ${root} natural minor in order; do not repeat the octave tonic.`,
    answerSpec: { kind: "note-sequence", expected: scale },
    explanation: `${root} natural minor is ${scale.join(" – ")}.`,
    exampleSignature: `${skillId}:apply-natural:${root}`,
    metadata: scaleMetadata(root, "natural", "construct", "constructed", ["natural-formula", "correct-spelling"]),
  }, index);
}

function buildNaturalScale(skillId: string, root: string, index: number, recall = false): Exercise {
  const scale = naturalMinorScaleNames(root);
  return createExercise({
    skillId,
    prompt: `${recall ? "From memory, spell" : "Build"} the seven notes of ${root} natural minor in order. Use exact theoretical spelling.`,
    answerSpec: { kind: "note-sequence", expected: scale },
    explanation: `${root} natural minor is ${scale.join(" – ")}. Each scale degree keeps the next letter name while W-H-W-W-H-W-W determines accidentals.`,
    exampleSignature: `${skillId}:${recall ? "recall" : "build"}:natural:${root}`,
    metadata: scaleMetadata(root, "natural", recall ? "instant-recall" : "construct", "constructed", ["all-root-construction", "correct-spelling", "key-variety"], { automaticRecall: recall }),
  }, index);
}

function missingMinorNote(skillId: string, root: string, form: MinorForm, index: number, recall = false): Exercise {
  const scale = scaleForForm(root, form);
  const missingIndex = mod(index * 5 + 2, 7);
  const shown = scale.map((note, i) => i === missingIndex ? "__" : note).join(" – ");
  const expected = scale[missingIndex];
  return createExercise({
    skillId,
    prompt: `${root} ${formLabel(form)}: ${shown}. What note belongs in the blank?`,
    answerSpec: { kind: "note", expected },
    explanation: `The correctly spelled ${root} ${formLabel(form)} scale is ${scale.join(" – ")}.`,
    exampleSignature: `${skillId}:missing:${form}:${root}:degree-${missingIndex + 1}`,
    metadata: scaleMetadata(root, form, "fill-missing", "constructed", ["all-root-construction", "correct-spelling", "key-variety", ...(form === "harmonic" ? ["harmonic-alteration"] : []), ...(form.startsWith("melodic") ? ["melodic-alteration"] : [])], { degree: missingIndex + 1, target: expected, revealPianoTarget: pianoPitchName(expected), automaticRecall: recall }),
  }, index);
}

function requestedMinorDegree(skillId: string, root: string, form: "natural" | "harmonic" | "melodic-ascending", index: number, recall = false): Exercise {
  const degree = mod(index * 5 + 1, 7) + 1;
  const expected = minorScaleDegreeNote(root, form, degree);
  return createExercise({
    skillId,
    prompt: `What is scale degree ${degree} in ${root} ${formLabel(form)}?`,
    answerSpec: { kind: "note", expected },
    explanation: `Degree ${degree} of ${root} ${formLabel(form)} is ${expected}.`,
    exampleSignature: `${skillId}:degree-note:${form}:${root}:${degree}`,
    metadata: scaleMetadata(root, form, "degree-to-note", "constructed", ["all-root-construction", "correct-spelling", "key-variety", ...(form === "harmonic" ? ["harmonic-alteration", "leading-tone"] : []), ...(form === "melodic-ascending" ? ["melodic-alteration"] : [])], { degree, target: expected, revealPianoTarget: pianoPitchName(expected), automaticRecall: recall }),
  }, index);
}

function identifyNaturalDegree(skillId: string, root: string, index: number): Exercise {
  const degree = mod(index * 3 + 4, 7) + 1;
  const scale = naturalMinorScaleNames(root);
  const note = scale[degree - 1];
  return createExercise({
    skillId,
    prompt: `In ${root} natural minor, what scale degree number is ${note}?`,
    answerSpec: { kind: "number", expected: degree },
    explanation: `${note} is degree ${degree} in ${root} natural minor.`,
    exampleSignature: `${skillId}:note-degree:natural:${root}:${note}`,
    metadata: scaleMetadata(root, "natural", "note-to-degree", "application", ["all-root-construction", "key-variety"], { degree, target: note, pianoHighlighted: [pianoPitchName(root), pianoPitchName(note)] }),
  }, index);
}

function buildHarmonicScale(skillId: string, root: string, index: number, recall = false): Exercise {
  const scale = harmonicMinorScaleNames(root);
  return createExercise({
    skillId,
    prompt: `${recall ? "From memory, spell" : "Start from natural minor, raise degree 7, and spell"} ${root} harmonic minor.`,
    answerSpec: { kind: "note-sequence", expected: scale },
    explanation: `${root} harmonic minor is ${scale.join(" – ")}. Harmonic minor changes only degree 7 relative to natural minor.`,
    exampleSignature: `${skillId}:${recall ? "recall" : "build"}:harmonic:${root}`,
    metadata: scaleMetadata(root, "harmonic", recall ? "instant-recall" : "construct", "constructed", ["harmonic-alteration", "correct-spelling", "key-variety"], { automaticRecall: recall }),
  }, index);
}

function harmonicRaisedDegree(skillId: string, index: number): Exercise {
  const variant = mod(index, 4);
  const prompts = [
    "Which scale degree is raised when natural minor becomes harmonic minor?",
    "Harmonic minor differs from natural minor by raising which degree?",
    "To create harmonic minor from natural minor, what scale degree changes?",
    "Which degree becomes a leading tone in harmonic minor?",
  ];
  return createExercise({
    skillId,
    prompt: prompts[variant],
    answerSpec: { kind: "number", expected: 7 },
    explanation: "Harmonic minor raises scale degree 7 by one half step.",
    exampleSignature: `${skillId}:harmonic-raised-7:${variant}`,
    metadata: { family: "harmonic-minor", form: "harmonic", direction: "identify-alteration", responseMode: "constructed", degree: 7, checkpointCompetencies: ["harmonic-alteration", "leading-tone"] },
  }, index);
}

function harmonicLeadingTone(skillId: string, root: string, index: number): Exercise {
  const expected = minorLeadingToneName(root);
  return createExercise({
    skillId,
    prompt: `What is the leading tone (raised degree 7) in ${root} harmonic minor?`,
    answerSpec: { kind: "note", expected },
    explanation: `${expected} is one half step below ${root}, so it is the leading tone in ${root} harmonic minor.`,
    exampleSignature: `${skillId}:leading-tone:${root}`,
    metadata: scaleMetadata(root, "harmonic", "leading-tone", "constructed", ["leading-tone", "harmonic-alteration", "correct-spelling", "key-variety"], { degree: 7, target: expected, pianoHighlighted: [pianoPitchName(expected), pianoPitchName(root)] }),
  }, index);
}

function harmonicAugmentedSecond(skillId: string, root: string, index: number): Exercise {
  const pair = harmonicMinorAugmentedSecond(root);
  const variant = mod(index, 2);
  if (variant === 0) {
    return createExercise({
      skillId,
      prompt: `In ${root} harmonic minor, the augmented 2nd occurs between which scale degrees?`,
      answerSpec: { kind: "choice", expected: "6 → 7", choices: ["2 → 3", "5 → 6", "6 → 7", "7 → 1"] },
      explanation: `Degrees 6→7 are ${pair.degree6}→${pair.degree7}. They use adjacent letter names but span three half steps, so the interval is an augmented 2nd.`,
      exampleSignature: `${skillId}:aug2-location:${root}`,
      metadata: scaleMetadata(root, "harmonic", "augmented-second-location", "discrimination", ["augmented-second", "key-variety"], { interval: "A2", degree6: pair.degree6, degree7: pair.degree7, pianoHighlighted: [pianoPitchName(pair.degree6), pianoPitchName(pair.degree7)] }),
    }, index);
  }
  return createExercise({
    skillId,
    prompt: `${pair.degree6}→${pair.degree7} is degrees 6→7 in ${root} harmonic minor. What interval quality/number is this?`,
    answerSpec: { kind: "text", expected: "augmented 2nd", accepted: ["A2", "augmented second"] },
    explanation: `It is an augmented 2nd: a written 2nd spanning three half steps.`,
    exampleSignature: `${skillId}:aug2-name:${root}`,
    metadata: scaleMetadata(root, "harmonic", "identify-augmented-second", "constructed", ["augmented-second", "key-variety"], { interval: "A2", degree6: pair.degree6, degree7: pair.degree7 }),
  }, index);
}

function harmonicReason(skillId: string, index: number): Exercise {
  return createExercise({
    skillId,
    prompt: "Why is scale degree 7 commonly raised in tonal minor harmony?",
    answerSpec: { kind: "choice", expected: "To create a leading tone and strengthen dominant-to-tonic pull", choices: ["To create a leading tone and strengthen dominant-to-tonic pull", "To make every interval a whole step", "To remove the minor 3rd", "To make the scale use only white keys"] },
    explanation: "Raising degree 7 places it a half step below tonic, creating a leading tone and strengthening dominant-to-tonic resolution.",
    exampleSignature: `${skillId}:harmonic-reason:${mod(index, 3)}`,
    metadata: { family: "harmonic-minor", form: "harmonic", direction: "explain-purpose", responseMode: "application", checkpointCompetencies: ["leading-tone", "harmonic-alteration"] },
  }, index);
}

function buildMelodicAscending(skillId: string, root: string, index: number, recall = false): Exercise {
  const scale = melodicMinorAscendingScaleNames(root);
  return createExercise({
    skillId,
    prompt: `${recall ? "From memory, spell" : "Start from natural minor, raise degrees 6 and 7, and spell"} ${root} melodic minor ascending.`,
    answerSpec: { kind: "note-sequence", expected: scale },
    explanation: `${root} melodic minor ascending is ${scale.join(" – ")}. Degrees 6 and 7 are raised relative to natural minor.`,
    exampleSignature: `${skillId}:${recall ? "recall" : "build"}:melodic-ascending:${root}`,
    metadata: scaleMetadata(root, "melodic-ascending", recall ? "instant-recall" : "construct", "constructed", ["melodic-alteration", "correct-spelling", "key-variety"], { automaticRecall: recall }),
  }, index);
}

function buildMelodicDescending(skillId: string, root: string, index: number, recall = false): Exercise {
  const scale = classicalMelodicMinorNames(root).descending;
  return createExercise({
    skillId,
    prompt: `${recall ? "From memory, spell" : "Spell"} ${root} melodic minor descending under this curriculum's classical convention. Start on the upper tonic and omit the repeated ending tonic.`,
    answerSpec: { kind: "note-sequence", expected: scale },
    explanation: `Descending returns to natural-minor pitches: ${scale.join(" – ")}.`,
    exampleSignature: `${skillId}:${recall ? "recall" : "build"}:melodic-descending:${root}`,
    metadata: scaleMetadata(root, "melodic-descending", recall ? "instant-recall" : "construct", "constructed", ["melodic-alteration", "correct-spelling", "form-discrimination", "key-variety"], { automaticRecall: recall, curriculumConvention: "classical-descending-natural-minor" }),
  }, index);
}

function melodicChangedDegrees(skillId: string, index: number): Exercise {
  return createExercise({
    skillId,
    prompt: "Relative to natural minor, which scale degrees are raised in classical melodic minor when ascending?",
    answerSpec: { kind: "text", expected: "6 and 7", accepted: ["6 7", "6, 7", "degrees 6 and 7", "6th and 7th"] },
    explanation: "Classical melodic minor ascending raises degrees 6 and 7. Descending returns both to natural-minor pitches in this curriculum.",
    exampleSignature: `${skillId}:melodic-raised-6-7:${mod(index, 4)}`,
    metadata: { family: "melodic-minor", form: "melodic-ascending", direction: "identify-alterations", responseMode: "constructed", checkpointCompetencies: ["melodic-alteration"] },
  }, index);
}

function melodicWhySix(skillId: string, index: number): Exercise {
  return createExercise({
    skillId,
    prompt: "Why is degree 6 also raised in classical melodic minor when ascending?",
    answerSpec: { kind: "choice", expected: "To smooth the augmented 2nd created by natural 6 and raised 7", choices: ["To smooth the augmented 2nd created by natural 6 and raised 7", "To remove the tonic", "To make the scale chromatic", "To lower the leading tone"] },
    explanation: "Raising degree 6 turns the 6→7 augmented 2nd of harmonic minor into a whole step, making the ascent smoother while keeping the raised leading tone.",
    exampleSignature: `${skillId}:melodic-reason:${mod(index, 3)}`,
    metadata: { family: "melodic-minor", form: "melodic-ascending", direction: "explain-purpose", responseMode: "application", checkpointCompetencies: ["melodic-alteration", "augmented-second"] },
  }, index);
}

function descendingConvention(skillId: string, index: number): Exercise {
  return createExercise({
    skillId,
    prompt: "Under this curriculum's classical melodic-minor convention, what happens to degrees 6 and 7 when the scale descends?",
    answerSpec: { kind: "choice", expected: "They return to natural-minor 6 and 7", choices: ["They return to natural-minor 6 and 7", "They stay raised", "Only degree 6 stays raised", "Both are raised another half step"] },
    explanation: "Descending classical melodic minor returns to the natural-minor form in this curriculum.",
    exampleSignature: `${skillId}:descending-convention:${mod(index, 3)}`,
    metadata: { family: "melodic-minor", form: "melodic-descending", direction: "descending-convention", responseMode: "discrimination", checkpointCompetencies: ["melodic-alteration", "form-discrimination"] },
  }, index);
}

function formDiscrimination(skillId: string, root: string, form: MinorForm, index: number): Exercise {
  const scale = scaleForForm(root, form);
  const expected = formLabel(form);
  return createExercise({
    skillId,
    prompt: `${root}: ${scale.join(" – ")}. Which requested minor form/direction is shown?`,
    answerSpec: { kind: "choice", expected, choices: ["natural minor", "harmonic minor", "melodic minor ascending", "melodic minor descending"] },
    explanation: `${scale.join(" – ")} is ${root} ${expected}.`,
    exampleSignature: `${skillId}:discriminate:${form}:${root}`,
    metadata: scaleMetadata(root, form, "form-discrimination", "discrimination", ["form-discrimination", "key-variety", ...(form === "harmonic" ? ["harmonic-alteration"] : []), ...(form.startsWith("melodic") ? ["melodic-alteration"] : [])]),
  }, index);
}

function phase3NaturalFormulaGenerator(index: number): Exercise {
  const safe = Math.max(0, index);
  if (safe % 13 === 12) return crossPhaseFoundationReview(safe);
  switch (safe % 4) {
    case 0: return naturalFormulaQuestion(PHASE3_MINOR_SCALE_SKILL_IDS[0], safe);
    case 1: return naturalFormulaStep(PHASE3_MINOR_SCALE_SKILL_IDS[0], safe);
    case 2: return naturalIntervalConnection(PHASE3_MINOR_SCALE_SKILL_IDS[0], safe);
    default: return naturalAppliedScale(PHASE3_MINOR_SCALE_SKILL_IDS[0], safe);
  }
}

function phase3NaturalRootsGenerator(index: number): Exercise {
  const safe = Math.max(0, index);
  if (safe % 17 === 16) return crossPhaseFoundationReview(safe + 31);
  const root = rootForBuildIndex(safe);
  switch (safe % 4) {
    case 0: return buildNaturalScale(PHASE3_MINOR_SCALE_SKILL_IDS[1], root, safe);
    case 1: return missingMinorNote(PHASE3_MINOR_SCALE_SKILL_IDS[1], root, "natural", safe);
    case 2: return requestedMinorDegree(PHASE3_MINOR_SCALE_SKILL_IDS[1], root, "natural", safe);
    default: return identifyNaturalDegree(PHASE3_MINOR_SCALE_SKILL_IDS[1], root, safe);
  }
}

function phase3HarmonicGenerator(index: number): Exercise {
  const safe = Math.max(0, index);
  if (safe % 17 === 16) return crossPhaseFoundationReview(safe + 53);
  const root = rootForRecallIndex(Math.floor(safe / 2));
  switch (safe % 7) {
    case 0: return buildHarmonicScale(PHASE3_MINOR_SCALE_SKILL_IDS[2], root, safe);
    case 1: return harmonicRaisedDegree(PHASE3_MINOR_SCALE_SKILL_IDS[2], safe);
    case 2: return harmonicLeadingTone(PHASE3_MINOR_SCALE_SKILL_IDS[2], root, safe);
    case 3: return harmonicAugmentedSecond(PHASE3_MINOR_SCALE_SKILL_IDS[2], root, safe);
    case 4: return harmonicReason(PHASE3_MINOR_SCALE_SKILL_IDS[2], safe);
    case 5: return missingMinorNote(PHASE3_MINOR_SCALE_SKILL_IDS[2], root, "harmonic", safe);
    default: return formDiscrimination(PHASE3_MINOR_SCALE_SKILL_IDS[2], root, safe % 2 ? "harmonic" : "natural", safe);
  }
}

function phase3MelodicGenerator(index: number): Exercise {
  const safe = Math.max(0, index);
  if (safe % 17 === 16) return crossPhaseFoundationReview(safe + 79);
  const root = rootForRecallIndex(Math.floor(safe / 2));
  switch (safe % 7) {
    case 0: return buildMelodicAscending(PHASE3_MINOR_SCALE_SKILL_IDS[3], root, safe);
    case 1: return buildMelodicDescending(PHASE3_MINOR_SCALE_SKILL_IDS[3], root, safe);
    case 2: return melodicChangedDegrees(PHASE3_MINOR_SCALE_SKILL_IDS[3], safe);
    case 3: return melodicWhySix(PHASE3_MINOR_SCALE_SKILL_IDS[3], safe);
    case 4: return descendingConvention(PHASE3_MINOR_SCALE_SKILL_IDS[3], safe);
    case 5: return requestedMinorDegree(PHASE3_MINOR_SCALE_SKILL_IDS[3], root, "melodic-ascending", safe);
    default: return formDiscrimination(PHASE3_MINOR_SCALE_SKILL_IDS[3], root, safe % 2 ? "melodic-ascending" : "melodic-descending", safe);
  }
}

function phase3RecallGenerator(index: number): Exercise {
  const safe = Math.max(0, index);
  if (safe % 19 === 18) return crossPhaseFoundationReview(safe + 101);
  const root = rootForRecallIndex(safe);
  const cycle = mod(Math.floor(safe / 12), 6);
  if (cycle === 0) return buildNaturalScale(PHASE3_MINOR_SCALE_SKILL_IDS[4], root, safe, true);
  if (cycle === 1) return buildHarmonicScale(PHASE3_MINOR_SCALE_SKILL_IDS[4], root, safe, true);
  if (cycle === 2) return buildMelodicAscending(PHASE3_MINOR_SCALE_SKILL_IDS[4], root, safe, true);
  if (cycle === 3) return buildMelodicDescending(PHASE3_MINOR_SCALE_SKILL_IDS[4], root, safe, true);
  if (cycle === 4) {
    const form: "natural" | "harmonic" | "melodic-ascending" = ["natural", "harmonic", "melodic-ascending"][mod(safe, 3)] as "natural" | "harmonic" | "melodic-ascending";
    return requestedMinorDegree(PHASE3_MINOR_SCALE_SKILL_IDS[4], root, form, safe, true);
  }
  const form: MinorForm = ["natural", "harmonic", "melodic-ascending", "melodic-descending"][mod(safe, 4)] as MinorForm;
  return formDiscrimination(PHASE3_MINOR_SCALE_SKILL_IDS[4], root, form, safe);
}

export const PHASE3_MINOR_SCALE_GENERATORS: ReadonlyMap<string, ExerciseGenerator> = new Map([
  [PHASE3_MINOR_SCALE_SKILL_IDS[0], phase3NaturalFormulaGenerator],
  [PHASE3_MINOR_SCALE_SKILL_IDS[1], phase3NaturalRootsGenerator],
  [PHASE3_MINOR_SCALE_SKILL_IDS[2], phase3HarmonicGenerator],
  [PHASE3_MINOR_SCALE_SKILL_IDS[3], phase3MelodicGenerator],
  [PHASE3_MINOR_SCALE_SKILL_IDS[4], phase3RecallGenerator],
]);

export function phase3ExerciseForSkill(skillId: string, index = 0): Exercise | undefined {
  return PHASE3_MINOR_SCALE_GENERATORS.get(skillId)?.(index);
}

export function phase3BalancedRootNames(count = 60): string[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => rootForRecallIndex(index));
}
