import { identifySeventh, identifyTriad, type SeventhQuality, type TriadQuality } from "./chord.js";
import { formatNote, parseNote, pitchClass, type Note } from "./note.js";
import {
  harmonicMinorScale,
  majorScale,
  melodicMinorAscendingScale,
  naturalMinorScale,
} from "./scale.js";

export type HarmonyScaleForm = "major" | "natural-minor" | "harmonic-minor" | "melodic-minor-ascending";
export type BasicChordFunction = "tonic" | "predominant" | "dominant" | "context-dependent";

export interface DiatonicTriad {
  degree: number;
  notes: [Note, Note, Note];
  quality: TriadQuality;
}

export interface DiatonicSeventh {
  degree: number;
  notes: [Note, Note, Note, Note];
  quality: SeventhQuality;
}

export interface DerivedChord {
  tonic: string;
  form: HarmonyScaleForm;
  degree: number;
  notes: string[];
  root: string;
  triadQuality: TriadQuality;
  seventhQuality?: SeventhQuality;
  romanNumeral: string;
  chordSymbol: string;
}

export interface ChordTypeReferenceRow {
  id: TriadQuality | SeventhQuality;
  chordName: string;
  thirdQuality: string;
  fifthQuality: string;
  seventhQuality?: string;
  intervalFormula: string;
  example: string;
}

export interface StructuredProgressionChordInput { root: string; quality: TriadQuality; }
export interface StructuredProgressionAnalysis {
  input: StructuredProgressionChordInput;
  diatonic: boolean;
  romanNumeral?: string;
  expectedRootSpelling?: string;
  explanation: string;
}

export function diatonicTriadsFromScale(scale: readonly Note[]): DiatonicTriad[] {
  if (scale.length !== 7) throw new Error("Diatonic triad generation requires a seven-note scale");
  return scale.map((_, i) => {
    const notes: [Note, Note, Note] = [scale[i], scale[(i + 2) % 7], scale[(i + 4) % 7]];
    return { degree: i + 1, notes, quality: identifyTriad(notes) };
  });
}

export function diatonicSeventhsFromScale(scale: readonly Note[]): DiatonicSeventh[] {
  if (scale.length !== 7) throw new Error("Diatonic seventh generation requires a seven-note scale");
  return scale.map((_, i) => {
    const notes: [Note, Note, Note, Note] = [scale[i], scale[(i + 2) % 7], scale[(i + 4) % 7], scale[(i + 6) % 7]];
    return { degree: i + 1, notes, quality: identifySeventh(notes) };
  });
}

export function majorDiatonicTriads(tonic: Note): DiatonicTriad[] { return diatonicTriadsFromScale(majorScale(tonic)); }
export function naturalMinorDiatonicTriads(tonic: Note): DiatonicTriad[] { return diatonicTriadsFromScale(naturalMinorScale(tonic)); }
export function harmonicMinorDiatonicTriads(tonic: Note): DiatonicTriad[] { return diatonicTriadsFromScale(harmonicMinorScale(tonic)); }
export function melodicMinorAscendingDiatonicTriads(tonic: Note): DiatonicTriad[] { return diatonicTriadsFromScale(melodicMinorAscendingScale(tonic)); }

export function majorDiatonicSevenths(tonic: Note): DiatonicSeventh[] { return diatonicSeventhsFromScale(majorScale(tonic)); }
export function naturalMinorDiatonicSevenths(tonic: Note): DiatonicSeventh[] { return diatonicSeventhsFromScale(naturalMinorScale(tonic)); }
export function harmonicMinorDiatonicSevenths(tonic: Note): DiatonicSeventh[] { return diatonicSeventhsFromScale(harmonicMinorScale(tonic)); }
export function melodicMinorAscendingDiatonicSevenths(tonic: Note): DiatonicSeventh[] { return diatonicSeventhsFromScale(melodicMinorAscendingScale(tonic)); }

export function scaleForHarmony(tonicName: string, form: HarmonyScaleForm): Note[] {
  const tonic = parseNote(tonicName);
  if (form === "major") return majorScale(tonic);
  if (form === "natural-minor") return naturalMinorScale(tonic);
  if (form === "harmonic-minor") return harmonicMinorScale(tonic);
  return melodicMinorAscendingScale(tonic);
}

const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

export function romanNumeralForTriad(degree: number, quality: TriadQuality): string {
  const base = ROMANS[degree - 1];
  if (!base) throw new Error(`Invalid scale degree: ${degree}`);
  if (quality === "major") return base;
  if (quality === "minor") return base.toLowerCase();
  if (quality === "diminished") return `${base.toLowerCase()}°`;
  return `${base}+`;
}

export function romanNumeralForSeventh(degree: number, quality: SeventhQuality): string {
  const base = ROMANS[degree - 1];
  if (!base) throw new Error(`Invalid scale degree: ${degree}`);
  if (quality === "major7") return `${base}maj7`;
  if (quality === "minor7") return `${base.toLowerCase()}7`;
  if (quality === "dominant7") return `${base}7`;
  if (quality === "halfDiminished7") return `${base.toLowerCase()}ø7`;
  if (quality === "diminished7") return `${base.toLowerCase()}°7`;
  if (quality === "minorMajor7") return `${base.toLowerCase()}(maj7)`;
  return `${base}+maj7`;
}

export function chordSymbol(root: string, triad: TriadQuality, seventh?: SeventhQuality): string {
  if (seventh === "major7") return `${root}maj7`;
  if (seventh === "minor7") return `${root}m7`;
  if (seventh === "dominant7") return `${root}7`;
  if (seventh === "halfDiminished7") return `${root}ø7`;
  if (seventh === "diminished7") return `${root}°7`;
  if (seventh === "minorMajor7") return `${root}m(maj7)`;
  if (seventh === "augmentedMajor7") return `${root}+maj7`;
  if (triad === "major") return root;
  if (triad === "minor") return `${root}m`;
  if (triad === "diminished") return `${root}°`;
  return `${root}+`;
}

export function deriveDiatonicChord(tonicName: string, form: HarmonyScaleForm, degree: number, seventh = false): DerivedChord {
  const scale = scaleForHarmony(tonicName, form);
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) throw new Error(`Invalid scale degree: ${degree}`);
  const triad = diatonicTriadsFromScale(scale)[degree - 1];
  const seventhChord = seventh ? diatonicSeventhsFromScale(scale)[degree - 1] : undefined;
  const notes = (seventhChord?.notes ?? triad.notes).map(formatNote);
  const root = notes[0];
  return {
    tonic: formatNote(scale[0]),
    form,
    degree,
    notes,
    root,
    triadQuality: triad.quality,
    seventhQuality: seventhChord?.quality,
    romanNumeral: seventhChord ? romanNumeralForSeventh(degree, seventhChord.quality) : romanNumeralForTriad(degree, triad.quality),
    chordSymbol: chordSymbol(root, triad.quality, seventhChord?.quality),
  };
}

export function deriveDiatonicHarmony(tonicName: string, form: HarmonyScaleForm, seventh = false): DerivedChord[] {
  return Array.from({ length: 7 }, (_, index) => deriveDiatonicChord(tonicName, form, index + 1, seventh));
}

export function triadQualityPattern(form: HarmonyScaleForm): TriadQuality[] {
  return deriveDiatonicHarmony(form === "major" ? "C" : "A", form).map((chord) => chord.triadQuality);
}

export function seventhQualityPattern(form: HarmonyScaleForm): SeventhQuality[] {
  return deriveDiatonicHarmony(form === "major" ? "C" : "A", form, true).map((chord) => chord.seventhQuality!);
}

export function basicChordFunction(degree: number): BasicChordFunction {
  if (degree === 1) return "tonic";
  if (degree === 2 || degree === 4) return "predominant";
  if (degree === 5 || degree === 7) return "dominant";
  return "context-dependent";
}

export function functionExplanation(degree: number): string {
  const fn = basicChordFunction(degree);
  if (fn === "tonic") return "Tonic feels like home or a point of rest.";
  if (fn === "predominant") return degree === 4
    ? "Predominant moves away from tonic and often prepares dominant; IV is also traditionally called the subdominant chord."
    : "Predominant moves away from tonic and often prepares dominant.";
  if (fn === "dominant") return "Dominant creates forward pull and commonly moves toward tonic.";
  return "This chord can play different roles depending on context, so it should not be forced into one permanent label.";
}

export const CHORD_TYPE_REFERENCE: readonly ChordTypeReferenceRow[] = Object.freeze([
  { id: "major", chordName: "major triad", thirdQuality: "M3", fifthQuality: "P5", intervalFormula: "1–3–5", example: "C–E–G" },
  { id: "minor", chordName: "minor triad", thirdQuality: "m3", fifthQuality: "P5", intervalFormula: "1–♭3–5", example: "C–E♭–G" },
  { id: "diminished", chordName: "diminished triad", thirdQuality: "m3", fifthQuality: "d5", intervalFormula: "1–♭3–♭5", example: "C–E♭–G♭" },
  { id: "augmented", chordName: "augmented triad", thirdQuality: "M3", fifthQuality: "A5", intervalFormula: "1–3–♯5", example: "C–E–G♯" },
  { id: "major7", chordName: "major seventh", thirdQuality: "M3", fifthQuality: "P5", seventhQuality: "M7", intervalFormula: "1–3–5–7", example: "C–E–G–B" },
  { id: "minor7", chordName: "minor seventh", thirdQuality: "m3", fifthQuality: "P5", seventhQuality: "m7", intervalFormula: "1–♭3–5–♭7", example: "C–E♭–G–B♭" },
  { id: "dominant7", chordName: "dominant seventh", thirdQuality: "M3", fifthQuality: "P5", seventhQuality: "m7", intervalFormula: "1–3–5–♭7", example: "C–E–G–B♭" },
  { id: "halfDiminished7", chordName: "half-diminished seventh", thirdQuality: "m3", fifthQuality: "d5", seventhQuality: "m7", intervalFormula: "1–♭3–♭5–♭7", example: "C–E♭–G♭–B♭" },
  { id: "diminished7", chordName: "diminished seventh", thirdQuality: "m3", fifthQuality: "d5", seventhQuality: "d7", intervalFormula: "1–♭3–♭5–𝄫7", example: "C–E♭–G♭–B𝄫" },
  { id: "minorMajor7", chordName: "minor-major seventh", thirdQuality: "m3", fifthQuality: "P5", seventhQuality: "M7", intervalFormula: "1–♭3–5–7", example: "C–E♭–G–B" },
  { id: "augmentedMajor7", chordName: "augmented-major seventh", thirdQuality: "M3", fifthQuality: "A5", seventhQuality: "M7", intervalFormula: "1–3–♯5–7", example: "C–E–G♯–B" },
]);

export function transposeRomanProgression(tonicName: string, form: HarmonyScaleForm, degrees: readonly number[]): DerivedChord[] {
  return degrees.map((degree) => deriveDiatonicChord(tonicName, form, degree));
}

export function analyzeStructuredProgression(
  tonicName: string,
  form: HarmonyScaleForm,
  inputs: readonly StructuredProgressionChordInput[],
): StructuredProgressionAnalysis[] {
  const set = deriveDiatonicHarmony(tonicName, form);
  return inputs.map((input) => {
    let inputRoot: Note;
    try { inputRoot = parseNote(input.root); }
    catch { return { input, diatonic: false, explanation: `${input.root} is not a valid chord root.` }; }
    const pitchMatches = set.filter((chord) => pitchClass(parseNote(chord.root)) === pitchClass(inputRoot));
    const match = pitchMatches.find((chord) => chord.triadQuality === input.quality);
    if (!match) {
      const available = pitchMatches.map((chord) => `${chord.chordSymbol} (${chord.romanNumeral})`).join(", ");
      return {
        input,
        diatonic: false,
        explanation: available
          ? `${input.root} with ${input.quality} quality is outside this diatonic set. This scale uses ${available}.`
          : `${input.root} ${input.quality} is outside this diatonic set. That does not make it musically wrong; chromatic harmony is simply beyond this phase.`,
      };
    }
    const exactSpelling = formatNote(inputRoot) === match.root;
    return {
      input,
      diatonic: true,
      romanNumeral: match.romanNumeral,
      expectedRootSpelling: exactSpelling ? undefined : match.root,
      explanation: exactSpelling
        ? `${match.chordSymbol} is diatonic here: ${match.romanNumeral}.`
        : `${input.root} uses the same piano pitch, but this key spells the diatonic root ${match.root}. The chord is ${match.romanNumeral}.`,
    };
  });
}
