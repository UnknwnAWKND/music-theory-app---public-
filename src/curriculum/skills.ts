import type { CurriculumPriority, CurriculumThread, SkillDefinition } from "./types.js";

type SkillOptions = {
  priority?: CurriculumPriority;
  recurrenceWeight?: number;
  acquisitionRoundSize?: number;
  thread?: CurriculumThread;
};

function inferredOptions(phase: SkillDefinition["phase"], tags: readonly string[] = [], optional = false): SkillOptions {
  if (tags.includes("interval")) return { priority: "foundation", recurrenceWeight: 5, acquisitionRoundSize: 10, thread: "interval" };
  if (tags.includes("degree")) return { priority: "foundation", recurrenceWeight: 4, acquisitionRoundSize: 8, thread: "number-system" };
  if (tags.includes("scale") && phase <= 3) return { priority: "foundation", recurrenceWeight: 4, acquisitionRoundSize: 8, thread: "scale" };
  if (tags.includes("chord") && phase <= 4) return { priority: "foundation", recurrenceWeight: 4, acquisitionRoundSize: 8, thread: "triad" };
  if (tags.includes("function")) return { priority: "core", recurrenceWeight: 3, acquisitionRoundSize: 8, thread: "function" };
  if (tags.includes("melody")) return { priority: "foundation", recurrenceWeight: 4, acquisitionRoundSize: 8, thread: "chord-tone" };
  if (tags.includes("guitar")) return { priority: "core", recurrenceWeight: 2, acquisitionRoundSize: 6, thread: "guitar" };
  if (phase === 11 || optional) return { priority: "extension", recurrenceWeight: 1, acquisitionRoundSize: 6 };
  return { priority: "core", recurrenceWeight: 2, acquisitionRoundSize: 8 };
}

const s = (
  id: string,
  phase: SkillDefinition["phase"],
  title: string,
  prerequisites: readonly string[],
  evidence: SkillDefinition["evidence"] = ["construct", "identify"],
  tags: readonly string[] = [],
  optional = false,
  options: SkillOptions = {},
): SkillDefinition => ({
  id,
  phase,
  title,
  prerequisites,
  evidence,
  tags,
  optional,
  ...inferredOptions(phase, tags, optional),
  ...options,
});

export const SKILLS: readonly SkillDefinition[] = [
  // Phase 1 — interval foundations. Numbers arrive in small contrasting sets, then quality is layered on.
  s("interval.number-3-8", 1, "Interval numbers: 3rds and octaves", [], ["construct", "identify"], ["interval", "number"]),
  s("interval.number-4-5", 1, "Interval numbers: 4ths and 5ths", ["interval.number-3-8"], ["construct", "identify", "diagnose"], ["interval", "number"]),
  s("interval.number-mix-3-4-5-8", 1, "Mix 3rds, 4ths, 5ths, and octaves", ["interval.number-4-5"], ["construct", "identify"], ["interval", "number"]),
  s("interval.number-2-7", 1, "Interval numbers: 2nds and 7ths", ["interval.number-mix-3-4-5-8"], ["construct", "identify", "diagnose"], ["interval", "number"]),
  s("interval.number-mix-2-3-4-5-7-8", 1, "Mix 2nds, 3rds, 4ths, 5ths, 7ths, and octaves", ["interval.number-2-7"], ["construct", "identify"], ["interval", "number"]),
  s("interval.number-6", 1, "Interval numbers: 6ths", ["interval.number-mix-2-3-4-5-7-8"], ["construct", "identify"], ["interval", "number"]),
  // Keep this stable legacy ID: old attempt history remains valid as evidence for broad generic-number work.
  s("interval.generic-number", 1, "Mixed interval numbers", ["interval.number-6"], ["construct", "identify", "diagnose"], ["interval", "number"]),
  s("interval.quality-system", 1, "Major/minor and perfect interval families", ["interval.generic-number"], ["identify", "diagnose"], ["interval", "quality"]),
  s("interval.M3", 1, "Construct major 3rds", ["interval.quality-system"], ["construct", "identify"], ["interval"]),
  s("interval.m3", 1, "Distinguish and construct minor 3rds", ["interval.M3"], ["construct", "identify", "diagnose"], ["interval"]),
  s("interval.P4", 1, "Construct perfect 4ths", ["interval.m3"], ["construct", "identify"], ["interval"]),
  s("interval.P5", 1, "Distinguish and construct perfect 5ths", ["interval.P4"], ["construct", "identify", "diagnose"], ["interval"]),
  s("interval.M2", 1, "Construct major 2nds", ["interval.P5"], ["construct", "identify"], ["interval"]),
  s("interval.m2", 1, "Distinguish major and minor 2nds", ["interval.M2"], ["construct", "identify", "diagnose"], ["interval"]),
  s("interval.M7", 1, "Construct major 7ths", ["interval.m2"], ["construct", "identify"], ["interval"]),
  s("interval.m7", 1, "Distinguish major and minor 7ths", ["interval.M7"], ["construct", "identify", "diagnose"], ["interval"]),
  s("interval.M6", 1, "Construct major 6ths", ["interval.m7"], ["construct", "identify"], ["interval"]),
  s("interval.m6", 1, "Distinguish major and minor 6ths", ["interval.M6"], ["construct", "identify", "diagnose"], ["interval"]),
  s("interval.P8", 1, "Construct perfect octaves", ["interval.m6"], ["construct", "identify"], ["interval"]),
  s("interval.P1", 1, "Understand perfect unison", ["interval.P8"], ["construct", "identify"], ["interval"], true, { priority: "support", recurrenceWeight: 1, acquisitionRoundSize: 5 }),
  s("interval.mixed-core", 1, "Mixed major/minor/perfect interval construction", ["interval.m3", "interval.P5", "interval.m2", "interval.m7", "interval.m6", "interval.P8"], ["construct", "identify", "diagnose"], ["interval"]),
  s("interval.spelling", 1, "Correctly spell practical simple intervals", ["interval.mixed-core"], ["construct", "diagnose"], ["interval", "spelling"]),

  // Phase 2 — triads and chord-tone thinking. Tritone/aug-dim spelling arrives only when it is actually needed.
  s("triad.members", 2, "Root, third, and fifth", ["interval.M3", "interval.m3", "interval.P5"], ["identify"], ["chord"]),
  s("triad.major", 2, "Construct major triads from intervals", ["triad.members", "interval.M3", "interval.P5", "interval.spelling"], ["construct", "identify", "transform"], ["chord"]),
  s("triad.minor", 2, "Construct minor triads from intervals", ["triad.members", "interval.m3", "interval.P5", "interval.spelling"], ["construct", "identify", "transform"], ["chord"]),
  s("melody.chord-tones", 2, "Recognize chord tones against major and minor triads", ["triad.major", "triad.minor"], ["identify", "apply"], ["melody", "harmony", "thread"]),
  s("interval.A4-d5", 2, "Augmented 4th and diminished 5th", ["interval.spelling", "interval.P4", "interval.P5"], ["construct", "identify", "diagnose"], ["interval", "spelling"], false, { priority: "support", recurrenceWeight: 2, acquisitionRoundSize: 6, thread: "interval" }),
  s("triad.diminished", 2, "Construct diminished triads", ["triad.minor", "interval.A4-d5"], ["construct", "identify", "transform"], ["chord"]),
  s("triad.augmented", 2, "Construct augmented triads", ["triad.major", "interval.quality-system", "interval.spelling"], ["construct", "identify", "transform"], ["chord"]),
  s("triad.symbols", 2, "Read basic triad chord symbols", ["triad.major", "triad.minor", "triad.diminished", "triad.augmented"], ["translate", "identify"], ["chord", "notation"]),
  s("triad.mixed", 2, "Mixed triad construction and identification", ["triad.major", "triad.minor", "triad.diminished", "triad.augmented"], ["construct", "identify", "transform", "diagnose"], ["chord"]),
  s("triad.root-vs-bass", 2, "Distinguish chord root from bass note", ["triad.members"], ["identify", "diagnose"], ["chord"]),

  // Phase 3 — major scales and fluent scale-degree relationships.
  s("major.formula", 3, "Major-scale W-W-H-W-W-W-H formula", ["interval.quality-system"], ["construct", "identify"], ["scale"]),
  s("scale.degree-numbers", 3, "Scale degrees 1–7", ["major.formula"], ["translate", "identify"], ["scale", "degree"]),
  s("major.degree-intervals", 3, "Major scale degrees as tonic intervals", ["major.formula", "scale.degree-numbers", "interval.mixed-core"], ["translate", "construct"], ["scale", "degree", "interval"]),
  s("major.spelling", 3, "Spell major scales with one of each letter", ["major.formula", "interval.spelling"], ["construct", "diagnose"], ["scale", "spelling"]),
  s("major.construct", 3, "Construct major scales from any practical tonic", ["major.formula", "major.spelling", "major.degree-intervals"], ["construct", "diagnose"], ["scale"]),
  s("major.degree-to-note", 3, "Retrieve a note from key + scale degree", ["major.construct", "scale.degree-numbers"], ["translate", "construct"], ["scale", "degree"]),
  s("major.note-to-degree", 3, "Retrieve scale degree from key + note", ["major.construct", "scale.degree-numbers"], ["translate"], ["scale", "degree"]),
  s("major.membership", 3, "Identify diatonic notes in a major key", ["major.construct"], ["identify", "diagnose"], ["scale"]),
  s("major.degree-names", 3, "Recognize traditional scale-degree names", ["scale.degree-numbers"], ["identify"], ["scale", "terminology"], true, { priority: "support", recurrenceWeight: 1, acquisitionRoundSize: 5 }),
  s("major.piano-application", 3, "Map major scales and degrees to piano", ["major.construct", "major.degree-to-note"], ["apply"], ["scale", "piano"]),

  // Phase 4 — diatonic harmony and the number system are one dependency cluster, not separate memorization topics.
  s("diatonic.definition", 4, "Diatonic vs chromatic in a major key", ["major.membership", "triad.mixed"], ["identify", "diagnose"], ["harmony"]),
  s("diatonic.stack-thirds", 4, "Build 1-3-5 triads on scale degrees", ["major.construct", "triad.members"], ["construct"], ["harmony", "chord"]),
  s("diatonic.major-pattern", 4, "Derive I ii iii IV V vi vii° in major", ["diatonic.stack-thirds", "triad.mixed"], ["construct", "identify"], ["harmony", "degree"]),
  s("progression.scale-degree-vs-chord", 4, "Distinguish note degree from chord degree", ["scale.degree-numbers", "diatonic.major-pattern"], ["identify", "translate"], ["progression", "degree"]),
  s("roman.major-basic", 4, "Read major-key Roman numerals", ["diatonic.major-pattern", "progression.scale-degree-vs-chord"], ["translate", "identify"], ["roman", "harmony", "degree"]),
  s("progression.absolute-relative", 4, "Absolute chord symbols vs relative Roman numerals", ["roman.major-basic", "triad.symbols"], ["translate", "identify"], ["progression", "roman", "degree"]),
  s("diatonic.degree-to-chord", 4, "Major key + degree → chord", ["roman.major-basic", "major.degree-to-note", "triad.mixed"], ["translate", "construct"], ["harmony", "degree"]),
  s("diatonic.chord-to-degree", 4, "Major key + chord → Roman numeral", ["roman.major-basic", "major.note-to-degree", "triad.mixed"], ["translate", "identify"], ["harmony", "degree"]),
  s("diatonic.harmonize-key", 4, "Harmonize any major key with triads", ["diatonic.degree-to-chord", "diatonic.chord-to-degree"], ["construct"], ["harmony", "chord"]),
  s("diatonic.check-chord", 4, "Determine whether a triad is diatonic", ["diatonic.definition", "diatonic.chord-to-degree"], ["identify", "diagnose", "transform"], ["harmony"]),
  s("diatonic.piano-application", 4, "Play diatonic triads across major keys", ["diatonic.harmonize-key"], ["apply"], ["harmony", "piano"]),

  // Phase 5 — practical progression use, transposition, analysis, and chord-tone targeting.
  s("progression.I-IV-V", 5, "Build and recognize I-IV-V", ["diatonic.degree-to-chord", "progression.absolute-relative"], ["construct", "translate", "apply"], ["progression"]),
  s("progression.transpose", 5, "Transpose arbitrary diatonic progressions", ["progression.absolute-relative", "diatonic.degree-to-chord", "progression.I-IV-V"], ["translate", "construct", "apply"], ["progression", "degree"]),
  s("progression.extract", 5, "Extract Roman numerals from chord progressions", ["diatonic.chord-to-degree", "progression.absolute-relative"], ["translate", "diagnose"], ["progression", "analysis"]),
  s("progression.ii-V-I", 5, "Build triadic ii-V-I", ["diatonic.degree-to-chord", "progression.absolute-relative", "progression.transpose"], ["construct", "translate", "apply"], ["progression"]),
  s("melody.progression-targeting", 5, "Target chord tones through a progression", ["melody.chord-tones", "progression.transpose", "diatonic.degree-to-chord"], ["identify", "apply"], ["melody", "harmony", "progression"]),
  s("progression.I-V-vi-IV", 5, "Apply the I-V-vi-IV pop schema", ["progression.transpose"], ["construct", "translate", "apply"], ["progression", "schema"], true),
  s("progression.vi-IV-I-V", 5, "Apply the vi-IV-I-V pop schema", ["progression.transpose"], ["construct", "translate", "apply"], ["progression", "schema"], true),
  s("progression.I-vi-IV-V", 5, "Apply the I-vi-IV-V schema", ["progression.transpose"], ["construct", "translate", "apply"], ["progression", "schema"], true),
  s("progression.nashville", 5, "Translate simple Roman numerals to Nashville numbers", ["progression.absolute-relative"], ["translate", "identify"], ["progression", "notation"], true),

  // Phase 6 — harmonic function.
  s("function.tonic", 6, "Understand tonic stability and tonal center", ["progression.I-IV-V"], ["identify", "apply"], ["function"]),
  s("function.dominant", 6, "Understand dominant tendency", ["function.tonic", "progression.I-IV-V"], ["identify", "apply"], ["function"]),
  s("function.V-I", 6, "Understand V→I resolution", ["function.dominant", "function.tonic"], ["identify", "apply", "diagnose"], ["function"]),
  s("function.predominant", 6, "Understand core predominant behavior of ii and IV", ["function.V-I", "progression.ii-V-I"], ["identify", "apply"], ["function"]),
  s("function.basic-flow", 6, "Tonic→predominant→dominant organization", ["function.predominant", "function.V-I"], ["identify", "translate", "apply"], ["function"]),
  s("cadence.basic", 6, "Authentic and half cadences; deceptive resolution and plagal motion", ["function.basic-flow"], ["identify", "diagnose", "apply"], ["function", "cadence"]),
  s("function.context", 6, "Treat harmonic function as contextual rather than universal", ["cadence.basic"], ["identify", "diagnose"], ["function", "analysis"]),

  // Phase 7 — minor tonality.
  s("minor.parallel-alterations", 7, "Natural minor as ♭3 ♭6 ♭7 vs parallel major", ["major.construct", "scale.degree-numbers"], ["construct", "translate"], ["minor", "scale"]),
  s("minor.natural-construct", 7, "Construct natural minor scales", ["minor.parallel-alterations", "major.spelling"], ["construct", "diagnose"], ["minor", "scale"]),
  s("minor.relative", 7, "Relative major/minor", ["minor.natural-construct", "major.construct"], ["translate", "identify"], ["minor", "key"]),
  s("minor.parallel", 7, "Parallel major/minor", ["minor.natural-construct", "major.construct"], ["translate", "identify"], ["minor", "key"]),
  s("minor.variable6-7", 7, "Understand variable scale degrees 6 and 7 in minor tonality", ["minor.natural-construct", "minor.parallel"], ["identify", "translate"], ["minor", "scale", "degree"]),
  s("minor.raised7", 7, "Raised 7 and leading-tone behavior in minor", ["minor.variable6-7", "function.V-I"], ["construct", "identify", "apply"], ["minor", "function", "degree"]),
  s("minor.harmonic", 7, "Construct harmonic minor", ["minor.raised7", "minor.natural-construct"], ["construct", "diagnose"], ["minor", "scale"]),
  s("minor.V-v", 7, "Distinguish v and V in minor", ["minor.harmonic", "triad.major", "triad.minor"], ["construct", "identify", "apply"], ["minor", "harmony"]),
  s("minor.harmony", 7, "Core minor-key triad vocabulary with variable 6 and 7", ["minor.V-v", "minor.variable6-7", "triad.mixed"], ["construct", "translate", "identify", "diagnose"], ["minor", "harmony"]),
  s("minor.melodic", 7, "Construct the classical melodic-minor scale form", ["minor.variable6-7"], ["construct", "identify"], ["minor", "scale"], true, { priority: "support", recurrenceWeight: 1, acquisitionRoundSize: 6, thread: "scale" }),
  s("minor.melodic-jazz", 7, "Recognize the jazz melodic-minor convention", ["minor.melodic"], ["construct", "identify"], ["minor", "scale", "jazz"], true),

  // Phase 8 — seventh chords built generatively from triads + interval sevenths.
  s("seventh.members", 8, "Root, third, fifth, seventh", ["triad.members", "interval.m7", "interval.M7"], ["identify"], ["seventh", "chord"]),
  s("seventh.major7", 8, "Construct major 7 chords", ["seventh.members", "triad.major", "interval.M7"], ["construct", "identify"], ["seventh", "chord"]),
  s("seventh.minor7", 8, "Construct minor 7 chords", ["seventh.members", "triad.minor", "interval.m7"], ["construct", "identify"], ["seventh", "chord"]),
  s("seventh.dominant7", 8, "Construct dominant 7 chords", ["seventh.members", "triad.major", "interval.m7"], ["construct", "identify", "apply"], ["seventh", "function", "chord"]),
  s("seventh.halfdim7", 8, "Construct half-diminished 7 chords", ["seventh.members", "triad.diminished", "interval.m7"], ["construct", "identify"], ["seventh", "chord"]),
  s("seventh.dim7", 8, "Construct fully diminished 7 chords", ["seventh.members", "triad.diminished", "interval.quality-system"], ["construct", "identify", "diagnose"], ["seventh", "spelling", "chord"]),
  s("seventh.mixed", 8, "Mixed seventh-chord construction and identification", ["seventh.major7", "seventh.minor7", "seventh.dominant7", "seventh.halfdim7", "seventh.dim7"], ["construct", "identify", "diagnose"], ["seventh", "chord"]),
  s("seventh.major-diatonic", 8, "Derive diatonic seventh chords in major", ["seventh.mixed", "major.construct", "diatonic.stack-thirds"], ["construct", "translate"], ["seventh", "harmony"]),
  s("seventh.minor-context", 8, "Use seventh chords in minor context", ["seventh.mixed", "minor.harmony"], ["construct", "translate", "apply"], ["seventh", "minor"]),

  // Phase 9 — inversions and voice leading. Interval inversion belongs here, not in first exposure.
  s("interval.inversion", 9, "Invert simple intervals", ["interval.mixed-core"], ["translate", "identify"], ["interval"], true, { priority: "support", recurrenceWeight: 1, acquisitionRoundSize: 5, thread: "interval" }),
  s("inversion.triad", 9, "Triad root position, first inversion, second inversion", ["triad.root-vs-bass", "triad.mixed"], ["identify", "construct"], ["inversion"]),
  s("inversion.slash", 9, "Read and construct slash chords", ["inversion.triad", "triad.symbols"], ["translate", "construct"], ["inversion", "notation"]),
  s("voicing.distinction", 9, "Distinguish inversion from voicing", ["inversion.triad"], ["identify", "diagnose"], ["voicing"]),
  s("inversion.seventh", 9, "Seventh-chord inversions", ["inversion.triad", "seventh.mixed"], ["identify", "construct"], ["inversion", "seventh"]),
  s("voice.common-tones", 9, "Preserve and recognize common tones", ["voicing.distinction", "progression.transpose"], ["identify", "apply"], ["voice-leading"]),
  s("voice.economical", 9, "Move voices economically between chords", ["voice.common-tones"], ["construct", "apply", "diagnose"], ["voice-leading"]),
  s("voice.guide-tones", 9, "Guide-tone movement with thirds and sevenths", ["voice.economical", "seventh.mixed"], ["identify", "apply"], ["voice-leading", "seventh"]),

  // Phase 10 — key organization.
  s("keys.signatures", 10, "Understand major key signatures", ["major.construct", "major.spelling"], ["identify", "construct"], ["keys"]),
  s("keys.accidental-order", 10, "Order of sharps and flats", ["keys.signatures"], ["identify", "construct"], ["keys"], true, { priority: "support", recurrenceWeight: 1, acquisitionRoundSize: 5 }),
  s("circle.major", 10, "Major-key Circle of Fifths", ["keys.signatures", "interval.P5"], ["translate", "identify"], ["circle", "keys"]),
  s("keys.minor-signatures", 10, "Minor key signatures via relative major", ["keys.signatures", "minor.relative"], ["identify", "translate"], ["keys", "minor"]),
  s("circle.relative-minor", 10, "Place relative minors on the circle", ["circle.major", "keys.minor-signatures"], ["translate", "identify"], ["circle", "minor"]),
  s("keys.closely-related", 10, "Identify closely related keys", ["circle.relative-minor"], ["identify", "translate"], ["keys", "modulation"]),
  s("keys.enharmonic", 10, "Understand enharmonic key regions", ["circle.major"], ["identify", "diagnose"], ["keys", "spelling"], true, { priority: "support", recurrenceWeight: 1, acquisitionRoundSize: 5 }),

  // Phase 11 — advanced practical harmony. Useful, but intentionally not weighted like foundations.
  s("extension.compound-intervals", 11, "Compound intervals for 9ths, 11ths, and 13ths", ["interval.mixed-core"], ["translate", "identify", "construct"], ["advanced", "interval", "extension"], false, { priority: "support", recurrenceWeight: 1, acquisitionRoundSize: 6, thread: "interval" }),
  s("color.sus", 11, "sus2 and sus4 chords", ["triad.members", "interval.M2", "interval.P4", "interval.P5"], ["construct", "identify", "apply", "diagnose"], ["advanced", "chord-color"]),
  s("color.add", 11, "add2/add9 chords on major and minor triads", ["triad.major", "triad.minor", "extension.compound-intervals"], ["construct", "identify", "diagnose"], ["advanced", "chord-color"]),
  s("extension.9", 11, "Major, minor, and dominant 9th chords", ["seventh.major7", "seventh.minor7", "seventh.dominant7", "color.add", "extension.compound-intervals"], ["construct", "identify", "diagnose"], ["advanced", "extension"]),
  s("secondary.V", 11, "Secondary dominants and tonicization", ["function.V-I", "seventh.dominant7", "roman.major-basic"], ["construct", "translate", "identify", "apply"], ["advanced", "chromatic"]),
  s("mixture.parallel", 11, "Modal mixture from parallel major/minor", ["minor.parallel", "progression.extract"], ["construct", "identify", "apply"], ["advanced", "chromatic"]),
  s("mode.tonic-center", 11, "Understand modal identity through tonal center", ["major.construct", "minor.natural-construct"], ["identify", "diagnose", "apply"], ["mode", "tonal-center"]),
  s("analysis.integrated", 11, "Integrated practical harmonic analysis", ["secondary.V", "mixture.parallel", "mode.tonic-center", "melody.progression-targeting"], ["identify", "translate", "diagnose", "apply"], ["analysis"]),
  s("color.six", 11, "Major/minor 6 chords and practical 6/9 voicings", ["triad.major", "triad.minor", "interval.M6", "color.add"], ["construct", "identify"], ["advanced", "chord-color"], true),
  s("extension.11-13", 11, "11th and 13th chord logic, tensions, and omissions", ["extension.9", "extension.compound-intervals"], ["construct", "identify", "diagnose"], ["advanced", "extension"], true),
  s("melody.nonchord", 11, "Basic non-chord tones and targeting", ["melody.progression-targeting", "major.membership"], ["identify", "apply", "diagnose"], ["melody", "harmony"], true),
  s("mode.major-family", 11, "Lydian and Mixolydian by parallel comparison", ["mode.tonic-center", "major.construct", "scale.degree-numbers"], ["construct", "translate", "apply"], ["mode"], true),
  s("mode.minor-family", 11, "Dorian and Phrygian by parallel comparison", ["mode.tonic-center", "minor.natural-construct", "scale.degree-numbers"], ["construct", "translate", "apply"], ["mode"], true),
  s("mode.locrian", 11, "Locrian structure", ["mode.minor-family", "triad.diminished"], ["construct", "identify"], ["mode"], true),
  s("modulation.tonicization-vs-keychange", 11, "Distinguish tonicization from modulation", ["secondary.V", "keys.closely-related"], ["identify", "diagnose"], ["modulation"], true),
  s("modulation.direct", 11, "Direct modulation", ["modulation.tonicization-vs-keychange"], ["identify", "apply"], ["modulation"], true),
  s("modulation.pivot", 11, "Common-chord/pivot modulation", ["modulation.tonicization-vs-keychange", "diatonic.chord-to-degree", "keys.closely-related"], ["identify", "translate", "apply"], ["modulation"], true),

  // Phase 12 — guitar transfer. Same relationships, new physical map.
  s("guitar.open-strings", 12, "Standard-tuning open strings", ["analysis.integrated"], ["identify", "apply"], ["guitar"]),
  s("guitar.fret-notes", 12, "Locate notes across the fretboard", ["guitar.open-strings"], ["construct", "identify", "apply"], ["guitar"]),
  s("guitar.intervals", 12, "Map intervals from arbitrary fretboard roots", ["guitar.fret-notes", "interval.mixed-core"], ["construct", "identify", "apply"], ["guitar", "interval"]),
  s("guitar.triads", 12, "Build triads across string sets", ["guitar.intervals", "triad.mixed"], ["construct", "apply"], ["guitar", "chord"]),
  s("guitar.inversions", 12, "Map triad inversions across the neck", ["guitar.triads", "inversion.triad"], ["construct", "identify", "apply"], ["guitar", "inversion"]),
  s("guitar.scale-degrees", 12, "Map scale degrees around arbitrary roots", ["guitar.intervals", "major.degree-intervals"], ["construct", "identify", "apply"], ["guitar", "scale", "degree"]),
  s("guitar.scales", 12, "Map major/minor scales relationally", ["guitar.scale-degrees", "major.construct", "minor.natural-construct"], ["construct", "apply"], ["guitar", "scale"]),
  s("guitar.diatonic-harmony", 12, "Map diatonic chord families across the neck", ["guitar.triads", "guitar.scales", "diatonic.harmonize-key"], ["construct", "apply"], ["guitar", "harmony"]),
  s("guitar.sevenths", 12, "Build seventh chords on guitar", ["guitar.triads", "seventh.mixed"], ["construct", "apply"], ["guitar", "seventh"]),
  s("guitar.chord-tones", 12, "Target chord tones through progressions", ["guitar.diatonic-harmony", "melody.progression-targeting"], ["identify", "apply"], ["guitar", "improv"]),
  s("guitar.voice-leading", 12, "Voice lead progressions across the neck", ["guitar.inversions", "voice.economical", "guitar.chord-tones"], ["construct", "apply"], ["guitar", "voice-leading"]),
  s("guitar.alternate-tunings", 12, "Remap theory to alternate tunings", ["guitar.fret-notes", "guitar.intervals"], ["construct", "apply"], ["guitar", "tuning"]),
  s("guitar.idea-to-neck", 12, "Map imagined musical ideas to the neck using intervals and chord tones", ["guitar.chord-tones", "guitar.voice-leading", "guitar.scale-degrees"], ["apply"], ["guitar", "improv"]),
] as const;

export const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill] as const));
