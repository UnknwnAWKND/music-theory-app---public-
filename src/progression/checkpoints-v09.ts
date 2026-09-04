import { SKILLS, SKILL_BY_ID, type PhaseNumber } from "../curriculum/index.js";
import {
  evaluateCheckpoint,
  nextCheckpointCompetency,
  type AssessmentEvaluation,
  type CompetencyDefinition,
  type PhaseCheckpointDefinition,
} from "./checkpoints.js";

function group(id: string, label: string, skillIds: readonly string[], critical = true): CompetencyDefinition {
  return { id, label, skillIds, critical };
}

const GROUPS: Record<number, readonly CompetencyDefinition[]> = {
  1: [
    group("interval-number-core", "Interval-number construction", [
      "interval.number-3-8",
      "interval.number-4-5",
      "interval.number-mix-3-4-5-8",
      "interval.number-2-7",
      "interval.number-mix-2-3-4-5-7-8",
      "interval.number-6",
      "interval.number-mixed-all",
    ]),
    group("interval-core-quality", "Core 3rds, 4ths, 5ths & octave", [
      "interval.quality-system", "interval.M3", "interval.m3", "interval.P4", "interval.P5", "interval.P8",
    ]),
  ],
  2: [
    group("triad-members-spelling", "Interval spelling, chord members & chord tones", ["interval.spelling", "triad.members", "melody.chord-tones", "triad.root-vs-bass"]),
    group("triad-major-minor", "Major & minor triads", ["triad.major", "triad.minor"]),
    group("triad-dim-aug", "Diminished & augmented triads", ["interval.A4-d5", "triad.diminished", "triad.augmented"]),
    group("triad-mixed", "Mixed triads & symbols", ["triad.mixed", "triad.symbols"]),
  ],
  3: [
    group("interval-quality-expansion", "2nd, 6th & 7th interval fluency", ["interval.M2", "interval.m2", "interval.M6", "interval.m6", "interval.M7", "interval.m7", "interval.mixed-core"]),
    group("major-formula-degrees", "Major-scale formula & degrees", ["major.formula", "scale.degree-numbers", "major.degree-intervals"]),
    group("major-construct", "Major-scale construction & spelling", ["major.spelling", "major.construct"]),
    group("major-degree-retrieval", "Key/degree retrieval", ["major.degree-to-note", "major.note-to-degree"]),
    group("major-membership", "Diatonic membership", ["major.membership"]),
  ],
  4: [
    group("diatonic-building", "Build diatonic triads", ["diatonic.stack-thirds", "diatonic.major-pattern"]),
    group("number-system", "Scale degree & chord-number thinking", ["progression.scale-degree-vs-chord", "roman.major-basic", "progression.absolute-relative"]),
    group("degree-chord", "Degree ↔ chord", ["diatonic.degree-to-chord", "diatonic.chord-to-degree"]),
    group("harmonize", "Harmonize & diagnose a key", ["diatonic.harmonize-key", "diatonic.check-chord", "diatonic.definition"]),
  ],
  5: [
    group("iiv", "I–IV–V", ["progression.I-IV-V"]),
    group("transpose", "Progression transposition", ["progression.transpose"]),
    group("analysis", "Progression analysis & ii–V–I", ["progression.extract", "progression.ii-V-I"]),
    group("chord-tone-targeting", "Chord-tone targeting", ["melody.progression-targeting"]),
  ],
  6: [
    group("tonic-dominant", "Tonic & dominant", ["function.tonic", "function.dominant", "function.V-I"]),
    group("predominant-flow", "Predominant & functional flow", ["function.predominant", "function.basic-flow"]),
    group("cadences", "Cadences", ["cadence.basic"]),
    group("function-context", "Function in context", ["function.context"]),
  ],
  7: [
    group("minor-natural", "Natural minor & key relationships", ["minor.parallel-alterations", "minor.natural-construct", "minor.relative", "minor.parallel"]),
    group("minor-variable", "Variable 6 & 7", ["minor.variable6-7", "minor.raised7"]),
    group("minor-dominant", "Harmonic minor & dominant", ["minor.harmonic", "minor.V-v"]),
    group("minor-harmony", "Minor-key harmony", ["minor.harmony"]),
  ],
  8: [
    group("seventh-members", "Seventh-chord members", ["seventh.members"]),
    group("seventh-core", "Major 7, minor 7 & dominant 7", ["seventh.major7", "seventh.minor7", "seventh.dominant7"]),
    group("seventh-diminished", "Diminished seventh types", ["seventh.halfdim7", "seventh.dim7"]),
    group("seventh-diatonic", "Diatonic seventh chords", ["seventh.major-diatonic", "seventh.mixed", "seventh.minor-context"]),
  ],
  9: [
    group("triad-inversions", "Triad inversions", ["inversion.triad", "inversion.slash"]),
    group("seventh-inversions", "Seventh-chord inversions", ["inversion.seventh"]),
    group("voicing", "Voicing", ["voicing.distinction"]),
    group("voice-leading", "Voice leading", ["voice.common-tones", "voice.economical", "voice.guide-tones"]),
  ],
  10: [
    group("key-signatures", "Key signatures", ["keys.signatures"]),
    group("circle", "Circle of Fifths", ["circle.major"]),
    group("relatives-nearby", "Relative & nearby keys", ["circle.relative-minor", "keys.closely-related"]),
    group("minor-signatures", "Minor key signatures", ["keys.minor-signatures"]),
  ],
  11: [
    group("color", "Suspended & added-note colors", ["color.sus", "color.add"]),
    group("extensions", "Practical extensions", ["extension.compound-intervals", "extension.9"]),
    group("chromatic", "Secondary dominants & borrowed harmony", ["secondary.V", "mixture.parallel"]),
    group("analysis", "Tonal center & integrated analysis", ["mode.tonic-center", "analysis.integrated"]),
  ],
};

function validateSkills(skillIds: readonly string[]): string[] {
  const missing = skillIds.filter((id) => !SKILL_BY_ID.has(id));
  if (missing.length) throw new Error(`Checkpoint references unknown curriculum skills: ${missing.join(", ")}`);
  return [...skillIds];
}

export function checkpointDefinition(phase: PhaseNumber): PhaseCheckpointDefinition | undefined {
  if (phase === 12) return undefined;
  const competencies = (GROUPS[phase] ?? []).map((c) => ({ ...c, skillIds: validateSkills(c.skillIds) }));
  const minItems = competencies.length + 1;
  const maxItems = Math.max(minItems, competencies.length * 3);
  return { phase, competencies, minItems, maxItems };
}

export function allCheckpointDefinitions(): PhaseCheckpointDefinition[] {
  return Array.from({ length: 11 }, (_, index) => checkpointDefinition((index + 1) as PhaseNumber)!).filter(Boolean);
}

export function placementPrerequisitePhases(targetPhase: PhaseNumber): PhaseNumber[] {
  if (targetPhase <= 1) return [];
  const required = new Set<number>();
  const seen = new Set<string>();
  const visit = (skillId: string) => {
    if (seen.has(skillId)) return;
    seen.add(skillId);
    const skill = SKILL_BY_ID.get(skillId);
    if (!skill) return;
    for (const depId of skill.prerequisites) {
      const dep = SKILL_BY_ID.get(depId);
      if (!dep) continue;
      if (dep.phase < targetPhase) required.add(dep.phase);
      visit(depId);
    }
  };
  SKILLS.filter((skill) => skill.phase === targetPhase && !skill.optional).forEach((skill) => visit(skill.id));
  return [...required].sort((a, b) => a - b) as PhaseNumber[];
}

export function placementDefinition(targetPhase: PhaseNumber): PhaseCheckpointDefinition {
  const phases = placementPrerequisitePhases(targetPhase);
  // Placement stays diagnostic: experienced musicians prove representative dependencies,
  // rather than being forced through the long-term practice volume used for learning.
  const selected = phases.flatMap((phase) => (checkpointDefinition(phase)?.competencies ?? []).filter((c) => c.critical !== false).slice(0, 1));
  const minItems = selected.length + 1;
  const maxItems = Math.max(minItems, selected.length * 3);
  return { phase: targetPhase, competencies: selected, minItems, maxItems };
}

export function recommendStartingPhase(targetPhase: PhaseNumber, evaluation: AssessmentEvaluation): PhaseNumber {
  const weak = new Set(evaluation.review);
  for (const phase of placementPrerequisitePhases(targetPhase)) {
    const def = checkpointDefinition(phase);
    if (def?.competencies.some((c) => weak.has(c.label))) return phase;
  }
  return targetPhase;
}

export function phaseCoreReady(phase: PhaseNumber, readySkillIds: ReadonlySet<string>): boolean {
  const required = SKILLS.filter((skill) => skill.phase === phase && !skill.optional);
  return required.length > 0 && required.every((skill) => readySkillIds.has(skill.id));
}

export { evaluateCheckpoint, nextCheckpointCompetency };
export type {
  AssessmentEvaluation,
  AssessmentKind,
  AssessmentResponseMode,
  CompetencyAssessment,
  CompetencyDefinition,
  DiagnosticItemResult,
  PhaseCheckpointDefinition,
} from "./checkpoints.js";
