import type { CurriculumPhaseDescriptor, PhaseNumber } from "./types.js";

export const CURRICULUM_PHASES: readonly CurriculumPhaseDescriptor[] = Object.freeze([
  { phase: 1, title: "Intervals", slug: "intervals" },
  { phase: 2, title: "Major Scales", slug: "major-scales" },
  { phase: 3, title: "Minor Scales", slug: "minor-scales" },
  { phase: 4, title: "Diatonic Chords / Roman Numerals", slug: "diatonic-chords-roman-numerals" },
  { phase: 5, title: "Relatives", slug: "relatives" },
  { phase: 6, title: "Circle of Fifths", slug: "circle-of-fifths" },
]);

export const PHASE_BY_NUMBER = new Map<PhaseNumber, CurriculumPhaseDescriptor>(
  CURRICULUM_PHASES.map((phase) => [phase.phase, phase]),
);
