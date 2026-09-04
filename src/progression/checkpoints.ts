import { SKILLS, SKILL_BY_ID, type PhaseNumber } from "../curriculum/index.js";

export type AssessmentKind = "checkpoint" | "placement";
export type AssessmentResponseMode = "recognition" | "constructed" | "discrimination" | "application";

export interface CompetencyDefinition {
  id: string;
  label: string;
  skillIds: readonly string[];
  critical?: boolean;
}

export interface PhaseCheckpointDefinition {
  phase: PhaseNumber;
  competencies: readonly CompetencyDefinition[];
  minItems: number;
  maxItems: number;
}

export interface DiagnosticItemResult {
  competencyId: string;
  skillId: string;
  promptSignature: string;
  exampleSignature: string;
  correct: boolean;
  firstSubmission: boolean;
  independent: boolean;
  responseMode: AssessmentResponseMode;
  guidanceUsed?: boolean;
  solutionSeen?: boolean;
}

export interface CompetencyAssessment {
  competencyId: string;
  label: string;
  demonstrated: boolean;
  strongEvidence: number;
  moderateEvidence: number;
  failures: number;
  distinctSkills: number;
  distinctExamples: number;
}

export interface AssessmentEvaluation {
  passed: boolean;
  complete: boolean;
  strong: string[];
  review: string[];
  competencies: CompetencyAssessment[];
  recommendedPhase?: PhaseNumber;
}

function group(id: string, label: string, skillIds: readonly string[], critical = true): CompetencyDefinition {
  return { id, label, skillIds, critical };
}

const CHECKPOINT_GROUPS: Record<number, readonly CompetencyDefinition[]> = {
  1: [
    group("interval-number-quality", "Interval number & quality", ["interval.generic-number", "interval.quality-system"]),
    group("interval-major-minor", "Major & minor intervals", ["interval.m2", "interval.M2", "interval.m3", "interval.M3", "interval.m6", "interval.M6", "interval.m7", "interval.M7"]),
    group("interval-perfect-tritone", "Perfect intervals & tritones", ["interval.P1", "interval.P4", "interval.P5", "interval.P8", "interval.A4-d5"]),
    group("interval-spelling-mixed", "Mixed interval spelling", ["interval.mixed-core", "interval.spelling", "interval.inversion"]),
  ],
  2: [
    group("triad-members", "Chord members", ["triad.members", "triad.root-vs-bass"]),
    group("triad-major-minor", "Major & minor triads", ["triad.major", "triad.minor"]),
    group("triad-dim-aug", "Diminished & augmented triads", ["triad.diminished", "triad.augmented"]),
    group("triad-mixed-symbols", "Mixed triads & symbols", ["triad.mixed", "triad.symbols"]),
  ],
  3: [
    group("major-formula-degrees", "Major-scale formula & degrees", ["major.formula", "scale.degree-numbers", "major.degree-intervals"]),
    group("major-spelling", "Major-scale spelling", ["major.spelling", "major.construct"]),
    group("major-degree-retrieval", "Key/degree retrieval", ["major.degree-to-note", "major.note-to-degree"]),
    group("major-membership", "Diatonic membership", ["major.membership"]),
  ],
  4: [
    group("diatonic-building", "Build diatonic triads", ["diatonic.stack-thirds", "diatonic.major-pattern"]),
    group("roman-numerals", "Roman numerals", ["roman.major-basic"]),
    group("degree-chord-translation", "Degree ↔ chord", ["diatonic.degree-to-chord", "diatonic.chord-to-degree"]),
    group("harmonize-check", "Harmonize & diagnose", ["diatonic.harmonize-key", "diatonic.check-chord", "diatonic.definition"]),
  ],
  5: [
    group("relative-progression", "Relative chord numbers", ["progression.absolute-relative", "progression.scale-degree-vs-chord"]),
    group("iiv", "I–IV–V", ["progression.I-IV-V"]),
    group("transpose", "Progression transposition", ["progression.transpose"]),
    group("extract-iivi", "Analysis & ii–V–I", ["progression.extract", "progression.ii-V-I"]),
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
    group("minor-forms", "Harmonic & melodic minor", ["minor.harmonic", "minor.melodic"]),
    group("minor-harmony", "Minor-key harmony", ["minor.V-v", "minor.harmony"]),
  ],
  8: [
    group("seventh-members", "Seventh-chord members", ["seventh.members"]),
    group("seventh-core", "Major 7, minor 7 & dominant 7", ["seventh.maj7", "seventh.min7", "seventh.dom7"]),
    group("seventh-diminished", "Diminished seventh types", ["seventh.halfdim7", "seventh.dim7"]),
    group("seventh-diatonic", "Diatonic seventh chords", ["seventh.diatonic-major", "seventh.mixed"]),
  ],
  9: [
    group("triad-inversions", "Triad inversions", ["inversion.triad", "inversion.figured-bass"]),
    group("seventh-inversions", "Seventh-chord inversions", ["inversion.seventh"]),
    group("voicing", "Voicing", ["voicing.distinction", "voicing.close-open"]),
    group("voice-leading", "Voice leading", ["voice.common-tones", "voice.smooth"]),
  ],
  10: [
    group("key-signatures", "Key signatures", ["keys.signatures"]),
    group("circle", "Circle of Fifths", ["circle.major"]),
    group("relatives-nearby", "Relative & nearby keys", ["circle.relatives", "circle.closely-related"]),
    group("key-relations", "Key relationships", ["circle.transpose", "circle.analysis"]),
  ],
  11: [
    group("color-chords", "Suspended & added-note colors", ["color.sus", "color.add", "color.sixth"]),
    group("extensions", "Chord extensions", ["extension.compound-intervals", "extension.9", "extension.11", "extension.13"]),
    group("chromatic-function", "Secondary dominants & borrowed harmony", ["secondary.V", "mixture.parallel"]),
    group("modes-modulation", "Modes & modulation", ["mode.tonic-center", "modulation.tonicization-vs-keychange"]),
  ],
};

function existing(skillIds: readonly string[]): string[] {
  return skillIds.filter((id) => SKILL_BY_ID.has(id));
}

export function checkpointDefinition(phase: PhaseNumber): PhaseCheckpointDefinition | undefined {
  if (phase === 12) return undefined;
  const raw = CHECKPOINT_GROUPS[phase] ?? [];
  const competencies = raw
    .map((c) => ({ ...c, skillIds: existing(c.skillIds) }))
    .filter((c) => c.skillIds.length > 0);
  const minItems = competencies.length + 1;
  const maxItems = Math.max(minItems, competencies.length * 3);
  return { phase, competencies, minItems, maxItems };
}

export function allCheckpointDefinitions(): PhaseCheckpointDefinition[] {
  return Array.from({ length: 11 }, (_, i) => checkpointDefinition((i + 1) as PhaseNumber)!).filter(Boolean);
}

function isStrong(r: DiagnosticItemResult): boolean {
  return r.correct && r.firstSubmission && r.independent && !r.guidanceUsed && !r.solutionSeen
    && ["constructed", "discrimination", "application"].includes(r.responseMode);
}

function isModerate(r: DiagnosticItemResult): boolean {
  return r.correct && r.firstSubmission && r.independent && !r.guidanceUsed && !r.solutionSeen
    && r.responseMode === "recognition";
}

export function evaluateCheckpoint(def: PhaseCheckpointDefinition, results: readonly DiagnosticItemResult[]): AssessmentEvaluation {
  const competencies = def.competencies.map((c): CompetencyAssessment => {
    const rows = results.filter((r) => r.competencyId === c.id);
    const strongRows = rows.filter(isStrong);
    const moderateRows = rows.filter(isModerate);
    const failures = rows.filter((r) => r.firstSubmission && r.independent && !r.correct).length;
    const distinctSkills = new Set([...strongRows, ...moderateRows].map((r) => r.skillId)).size;
    const distinctExamples = new Set([...strongRows, ...moderateRows].map((r) => r.exampleSignature)).size;
    const demonstrated = failures === 0 && (strongRows.length >= 1 || (moderateRows.length >= 2 && distinctExamples >= 2));
    return { competencyId: c.id, label: c.label, demonstrated, strongEvidence: strongRows.length, moderateEvidence: moderateRows.length, failures, distinctSkills, distinctExamples };
  });
  const allCompetencies = competencies.length > 0 && competencies.every((c) => c.demonstrated);
  const passed = allCompetencies && results.length >= def.minItems;
  const complete = passed || results.length >= def.maxItems;
  return {
    passed,
    complete,
    strong: competencies.filter((c) => c.demonstrated).map((c) => c.label),
    review: competencies.filter((c) => !c.demonstrated).map((c) => c.label),
    competencies,
  };
}

export function nextCheckpointCompetency(def: PhaseCheckpointDefinition, results: readonly DiagnosticItemResult[]): CompetencyDefinition | undefined {
  const evaluation = evaluateCheckpoint(def, results);
  if (evaluation.complete) return undefined;
  const unresolved = def.competencies.filter((c) => !evaluation.competencies.find((x) => x.competencyId === c.id)?.demonstrated);
  const candidates = unresolved.length ? unresolved : def.competencies;
  const counts = new Map<string, number>();
  for (const r of results) counts.set(r.competencyId, (counts.get(r.competencyId) ?? 0) + 1);
  return [...candidates].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
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
  SKILLS.filter((s) => s.phase === targetPhase && !s.optional).forEach((s) => visit(s.id));
  return [...required].sort((a, b) => a - b) as PhaseNumber[];
}

export function placementDefinition(targetPhase: PhaseNumber): PhaseCheckpointDefinition {
  const phases = placementPrerequisitePhases(targetPhase);
  const competencies = phases.flatMap((phase) => checkpointDefinition(phase)?.competencies ?? []);
  // One representative critical group per prerequisite phase keeps placement broad but not exhaustive.
  const representative = phases.flatMap((phase) => (checkpointDefinition(phase)?.competencies ?? []).filter((c) => c.critical !== false).slice(0, 1));
  const selected = representative.length ? representative : competencies;
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
  const required = SKILLS.filter((s) => s.phase === phase && !s.optional);
  return required.length > 0 && required.every((s) => readySkillIds.has(s.id));
}
