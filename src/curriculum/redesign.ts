import type { EvidenceMode, PhaseNumber, SkillDefinition } from "./types.js";

export const CURRICULUM_VERSION = "v0.9-spiral" as const;

export const PHASE_META: Readonly<Record<PhaseNumber, { title: string; intro: string }>> = Object.freeze({
  1: { title: "Interval Foundations", intro: "Build interval-number relationships in small sets, then add the core qualities needed for chords. These relationships keep returning later." },
  2: { title: "Triads & Chord Tones", intro: "Build major and minor chords from intervals, then expand to the other basic triads and learn to think in chord tones." },
  3: { title: "Major Scales & Interval Fluency", intro: "Complete the simple-interval map while learning major scales, scale degrees, spelling, and direct key-to-degree retrieval." },
  4: { title: "Diatonic Harmony & Number System", intro: "Derive the chords inside major keys and use scale-degree and Roman-numeral relationships instead of memorizing isolated chord lists." },
  5: { title: "Progressions, Transposition & Function", intro: "Use chord numbers to move progressions between keys and understand how tonic, predominant, and dominant behavior creates motion." },
  6: { title: "Minor Keys", intro: "Connect minor-scale construction, variable scale degrees, relative and parallel keys, and practical minor-key harmony." },
  7: { title: "Seventh Chords", intro: "Extend triads with sevenths and connect chord quality to diatonic and functional use." },
  8: { title: "Inversions & Voice Leading", intro: "Rearrange chords without losing their identity and move between harmonies with smaller, clearer voice motion." },
  9: { title: "Keys & Circle of Fifths", intro: "Organize key signatures, fifth relationships, relative keys, and nearby key areas after the core harmony is already useful." },
  10: { title: "Harmony in Real Music", intro: "Apply the foundations to chord-tone targeting, non-chord tones, and practical analysis of real progressions." },
  11: { title: "Advanced Practical Harmony", intro: "Add useful color and chromatic options after foundational harmony is fluent: extensions, secondary dominants, mixture, modes, and modulation." },
  12: { title: "Transfer to Guitar", intro: "Move the same interval, scale-degree, chord-tone, and voice-leading relationships onto the fretboard." },
});

const add = (
  id: string,
  phase: PhaseNumber,
  title: string,
  prerequisites: readonly string[],
  evidence: readonly EvidenceMode[],
  tags: readonly string[],
  practicePriority = 5,
  spiralReview = true,
): SkillDefinition => ({ id, phase, title, prerequisites, evidence, tags, practicePriority, spiralReview });

export const REDESIGNED_ADDITIONS: readonly SkillDefinition[] = [
  add("interval.number-3-8", 1, "3rds and octaves", ["interval.generic-number"], ["construct", "identify"], ["interval", "number", "foundational"]),
  add("interval.number-4-5", 1, "4ths and 5ths", ["interval.number-3-8"], ["construct", "identify"], ["interval", "number", "foundational"]),
  add("interval.number-mix-3-4-5-8", 1, "Mix 3rds, 4ths, 5ths, and octaves", ["interval.number-3-8", "interval.number-4-5"], ["construct", "identify", "diagnose"], ["interval", "number", "foundational"]),
  add("interval.number-2-7", 1, "2nds and 7ths", ["interval.number-mix-3-4-5-8"], ["construct", "identify"], ["interval", "number", "foundational"]),
  add("interval.number-mix-2-3-4-5-7-8", 1, "Mix 2nds, 3rds, 4ths, 5ths, 7ths, and octaves", ["interval.number-2-7", "interval.number-mix-3-4-5-8"], ["construct", "identify", "diagnose"], ["interval", "number", "foundational"]),
  add("interval.number-6", 1, "6ths", ["interval.number-mix-2-3-4-5-7-8"], ["construct", "identify"], ["interval", "number", "foundational"]),
  add("interval.number-all", 1, "All simple interval numbers", ["interval.number-6", "interval.number-mix-2-3-4-5-7-8"], ["construct", "identify", "diagnose"], ["interval", "number", "foundational"]),
  add("interval.major-minor-contrast", 1, "Major vs minor interval quality", ["interval.quality-system"], ["identify", "diagnose", "construct"], ["interval", "quality", "foundational"]),
  add("interval.perfect-family", 1, "Perfect interval family", ["interval.quality-system"], ["identify", "construct"], ["interval", "quality", "foundational"]),
  add("triad.major-minor-mix", 2, "Mix major and minor triads", ["triad.major", "triad.minor"], ["construct", "identify", "diagnose"], ["chord", "foundational"], 5, true),
  add("analysis.diatonic-progressions", 10, "Analyze diatonic progressions", ["progression.extract", "function.basic-flow"], ["translate", "identify", "diagnose", "apply"], ["analysis", "application"], 4, true),
  add("analysis.chord-tone-map", 10, "Map chord tones through a progression", ["melody.chord-tones", "diatonic.chord-to-degree", "inversion.triad"], ["identify", "apply"], ["analysis", "melody", "application"], 4, true),
  add("melody.targeting", 10, "Target chord tones while using non-chord tones", ["melody.nonchord", "progression.transpose"], ["identify", "apply", "diagnose"], ["melody", "application"], 4, true),
] as const;

const PHASE_OVERRIDES: Readonly<Record<string, PhaseNumber>> = Object.freeze({
  "interval.P1": 1,
  "interval.m3": 1,
  "interval.M3": 1,
  "interval.P4": 1,
  "interval.P5": 1,
  "interval.P8": 1,
  "interval.A4-d5": 2,
  "interval.m2": 3,
  "interval.M2": 3,
  "interval.m6": 3,
  "interval.M6": 3,
  "interval.m7": 3,
  "interval.M7": 3,
  "interval.mixed-core": 3,
  "interval.spelling": 3,
  "interval.inversion": 8,
  "melody.chord-tones": 2,
  "function.tonic": 5,
  "function.dominant": 5,
  "function.V-I": 5,
  "function.predominant": 5,
  "function.basic-flow": 5,
  "cadence.basic": 5,
  "function.context": 5,
  "minor.parallel-alterations": 6,
  "minor.natural-construct": 6,
  "minor.relative": 6,
  "minor.parallel": 6,
  "minor.raised7": 6,
  "minor.harmonic": 6,
  "minor.V-v": 6,
  "minor.variable6-7": 6,
  "minor.melodic": 6,
  "minor.melodic-jazz": 6,
  "minor.harmony": 6,
  "seventh.members": 7,
  "seventh.major7": 7,
  "seventh.minor7": 7,
  "seventh.dominant7": 7,
  "seventh.halfdim7": 7,
  "seventh.dim7": 7,
  "seventh.mixed": 7,
  "seventh.major-diatonic": 7,
  "seventh.minor-context": 7,
  "inversion.triad": 8,
  "inversion.slash": 8,
  "voicing.distinction": 8,
  "inversion.seventh": 8,
  "voice.common-tones": 8,
  "voice.economical": 8,
  "voice.guide-tones": 8,
  "keys.signatures": 9,
  "keys.accidental-order": 9,
  "circle.major": 9,
  "keys.minor-signatures": 9,
  "circle.relative-minor": 9,
  "keys.closely-related": 9,
  "keys.enharmonic": 9,
  "melody.nonchord": 10,
});

const OPTIONAL_LATER = new Set([
  "extension.11-13",
  "color.six",
  "mode.major-family",
  "mode.minor-family",
  "mode.locrian",
  "modulation.direct",
  "modulation.pivot",
  "analysis.integrated",
]);

const FOUNDATION_IDS = new Set([
  "interval.generic-number", "interval.quality-system", "interval.m3", "interval.M3", "interval.P4", "interval.P5", "interval.P8",
  "interval.m2", "interval.M2", "interval.m6", "interval.M6", "interval.m7", "interval.M7", "interval.mixed-core", "interval.spelling",
  "triad.members", "triad.major", "triad.minor", "triad.mixed", "melody.chord-tones",
  "major.formula", "scale.degree-numbers", "major.degree-intervals", "major.construct", "major.degree-to-note", "major.note-to-degree",
  "diatonic.major-pattern", "roman.major-basic", "diatonic.degree-to-chord", "diatonic.chord-to-degree", "diatonic.harmonize-key",
  "progression.absolute-relative", "progression.I-IV-V", "progression.transpose", "function.tonic", "function.dominant", "function.V-I", "function.basic-flow",
]);

const SPIRAL_IDS = new Set([
  ...FOUNDATION_IDS,
  "triad.root-vs-bass",
  "major.membership",
  "progression.extract",
  "minor.natural-construct",
  "seventh.dominant7",
  "inversion.triad",
]);

const CUSTOM_PREREQS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "interval.quality-system": ["interval.number-all"],
  "interval.P1": ["interval.perfect-family"],
  "interval.P4": ["interval.perfect-family"],
  "interval.P5": ["interval.perfect-family"],
  "interval.P8": ["interval.perfect-family"],
  "interval.m2": ["interval.major-minor-contrast"],
  "interval.M2": ["interval.major-minor-contrast"],
  "interval.m3": ["interval.major-minor-contrast"],
  "interval.M3": ["interval.major-minor-contrast"],
  "interval.m6": ["interval.major-minor-contrast"],
  "interval.M6": ["interval.major-minor-contrast"],
  "interval.m7": ["interval.major-minor-contrast"],
  "interval.M7": ["interval.major-minor-contrast"],
  "interval.A4-d5": ["interval.P4", "interval.P5", "interval.quality-system"],
  "interval.mixed-core": ["interval.P1", "interval.m2", "interval.M2", "interval.m3", "interval.M3", "interval.P4", "interval.A4-d5", "interval.P5", "interval.m6", "interval.M6", "interval.m7", "interval.M7", "interval.P8", "interval.number-all"],
  "triad.major": ["triad.members", "interval.M3", "interval.P5"],
  "triad.minor": ["triad.members", "interval.m3", "interval.P5"],
  "triad.diminished": ["triad.minor", "interval.A4-d5"],
  "triad.augmented": ["triad.major", "interval.major-minor-contrast"],
  "major.degree-intervals": ["major.formula", "scale.degree-numbers", "interval.M2", "interval.M3", "interval.P4", "interval.P5", "interval.M6", "interval.M7"],
  "guitar.open-strings": ["analysis.diatonic-progressions"],
});

const ORDER = [
  "interval.generic-number",
  "interval.number-3-8",
  "interval.number-4-5",
  "interval.number-mix-3-4-5-8",
  "interval.number-2-7",
  "interval.number-mix-2-3-4-5-7-8",
  "interval.number-6",
  "interval.number-all",
  "interval.quality-system",
  "interval.major-minor-contrast",
  "interval.perfect-family",
  "interval.m3", "interval.M3", "interval.P4", "interval.P5", "interval.P8", "interval.P1",
  "triad.members", "triad.major", "triad.minor", "triad.major-minor-mix", "interval.A4-d5", "triad.diminished", "triad.augmented", "triad.mixed", "triad.root-vs-bass", "triad.symbols", "melody.chord-tones",
  "interval.m2", "interval.M2", "interval.m6", "interval.M6", "interval.m7", "interval.M7", "interval.mixed-core", "interval.spelling",
];
const ORDER_INDEX = new Map(ORDER.map((id, index) => [id, index]));

function priorityFor(skill: SkillDefinition): number {
  if (FOUNDATION_IDS.has(skill.id) || skill.id.startsWith("interval.number-")) return 5;
  if (skill.phase <= 10 && !skill.optional) return 4;
  if (skill.phase === 11 && !skill.optional) return 3;
  return 2;
}

export function redesignSkills(legacy: readonly SkillDefinition[]): readonly SkillDefinition[] {
  const legacyIndex = new Map(legacy.map((skill, index) => [skill.id, index]));
  const transformed = legacy.map((skill): SkillDefinition => {
    const phase = PHASE_OVERRIDES[skill.id] ?? skill.phase;
    const optional = OPTIONAL_LATER.has(skill.id) ? true : skill.optional;
    const prerequisites = CUSTOM_PREREQS[skill.id] ?? skill.prerequisites;
    const next: SkillDefinition = {
      ...skill,
      phase,
      optional,
      prerequisites,
      practicePriority: priorityFor({ ...skill, phase, optional }),
      spiralReview: SPIRAL_IDS.has(skill.id),
    };
    if (skill.id === "interval.quality-system") next.title = "Major/minor/perfect interval framework";
    if (skill.id === "interval.generic-number") next.title = "How interval numbers work";
    return next;
  });
  const additions = REDESIGNED_ADDITIONS.map((skill) => ({ ...skill }));
  return [...transformed, ...additions].sort((a, b) => {
    if (a.phase !== b.phase) return a.phase - b.phase;
    const ao = ORDER_INDEX.get(a.id);
    const bo = ORDER_INDEX.get(b.id);
    if (ao != null || bo != null) return (ao ?? 10000) - (bo ?? 10000);
    return (legacyIndex.get(a.id) ?? 10000) - (legacyIndex.get(b.id) ?? 10000);
  });
}

export function practicePriorityForSkill(skillId: string, skills: readonly SkillDefinition[]): number {
  return skills.find((skill) => skill.id === skillId)?.practicePriority ?? 3;
}

export function isSpiralReviewSkill(skillId: string, skills: readonly SkillDefinition[]): boolean {
  return Boolean(skills.find((skill) => skill.id === skillId)?.spiralReview);
}
