import {
  buildTriad,
  formatNote,
  majorDiatonicTriads,
  majorRomanForDegree,
  majorScale,
  parseNote,
  pitchClass,
  type Note,
  type TriadQuality,
} from "../theory/index.js";
import type { AssessmentResult } from "./types.js";

function safeParseNote(input: string): Note | null {
  try {
    return parseNote(input);
  } catch {
    return null;
  }
}

export function assessNote(expected: Note, answer: string): AssessmentResult<string, string> {
  const parsed = safeParseNote(answer);
  const expectedName = formatNote(expected);
  if (!parsed) return { correct: false, code: "invalid-answer", expected: expectedName, actual: answer };
  const actualName = formatNote(parsed);
  if (actualName === expectedName) return { correct: true, code: "correct", expected: expectedName, actual: actualName };
  if (pitchClass(parsed) === pitchClass(expected)) {
    return {
      correct: false,
      code: "enharmonic-spelling-error",
      expected: expectedName,
      actual: actualName,
      detail: `${actualName} uses the same piano key, but the theoretical spelling required here is ${expectedName}.`,
    };
  }
  return { correct: false, code: "wrong-note-selection", expected: expectedName, actual: actualName };
}

export function assessNoteSequence(
  expected: readonly Note[],
  answers: readonly string[],
  orderMatters = true,
): AssessmentResult<string[], string[]> {
  const expectedNames = expected.map(formatNote);
  if (answers.length !== expected.length) {
    return { correct: false, code: "wrong-length", expected: expectedNames, actual: [...answers] };
  }
  const parsed = answers.map(safeParseNote);
  if (parsed.some((x) => x === null)) {
    return { correct: false, code: "invalid-answer", expected: expectedNames, actual: [...answers] };
  }
  const actualNotes = parsed as Note[];
  const actualNames = actualNotes.map(formatNote);

  if (orderMatters) {
    if (actualNames.every((name, i) => name === expectedNames[i])) {
      return { correct: true, code: "correct", expected: expectedNames, actual: actualNames };
    }
    if (actualNotes.every((note, i) => pitchClass(note) === pitchClass(expected[i]))) {
      return {
        correct: false,
        code: "enharmonic-spelling-error",
        expected: expectedNames,
        actual: actualNames,
      };
    }
    const expectedPcs = expected.map(pitchClass);
    const actualPcs = actualNotes.map(pitchClass);
    if ([...actualPcs].sort((a,b)=>a-b).join(",") === [...expectedPcs].sort((a,b)=>a-b).join(",")) {
      return { correct: false, code: "wrong-order", expected: expectedNames, actual: actualNames };
    }
    return { correct: false, code: "wrong-note-selection", expected: expectedNames, actual: actualNames };
  }

  const key = (notes: readonly Note[], exact: boolean) => notes
    .map((n) => exact ? formatNote(n) : String(pitchClass(n)))
    .sort()
    .join("|");
  if (key(actualNotes, true) === key(expected, true)) {
    return { correct: true, code: "correct", expected: expectedNames, actual: actualNames };
  }
  if (key(actualNotes, false) === key(expected, false)) {
    return { correct: false, code: "enharmonic-spelling-error", expected: expectedNames, actual: actualNames };
  }
  return { correct: false, code: "wrong-note-selection", expected: expectedNames, actual: actualNames };
}

export function assessMajorScale(tonic: string, answers: readonly string[]) {
  const root = safeParseNote(tonic);
  if (!root) return { correct: false, code: "invalid-answer", expected: [], actual: [...answers] } as AssessmentResult<string[], string[]>;
  return assessNoteSequence(majorScale(root), answers, true);
}

export function assessTriad(
  root: string,
  quality: TriadQuality,
  answers: readonly string[],
): AssessmentResult<string[], string[]> {
  const parsedRoot = safeParseNote(root);
  if (!parsedRoot) return { correct: false, code: "invalid-answer", expected: [], actual: [...answers] };
  return assessNoteSequence(buildTriad(parsedRoot, quality), answers, false);
}

export function assessMajorScaleDegree(tonic: string, degree: number, answer: string): AssessmentResult<string, string> {
  const parsedRoot = safeParseNote(tonic);
  if (!parsedRoot || degree < 1 || degree > 7 || !Number.isInteger(degree)) {
    return { correct: false, code: "invalid-answer", expected: "", actual: answer };
  }
  return assessNote(majorScale(parsedRoot)[degree - 1], answer);
}

export function assessMajorRomanForChord(
  tonic: string,
  chordRoot: string,
  quality: TriadQuality,
  answer: string,
): AssessmentResult<string, string> {
  const t = safeParseNote(tonic);
  const r = safeParseNote(chordRoot);
  if (!t || !r) return { correct: false, code: "invalid-answer", expected: "", actual: answer };
  const triads = majorDiatonicTriads(t);
  const match = triads.find((x) => pitchClass(x.notes[0]) === pitchClass(r) && x.quality === quality);
  if (!match) {
    return {
      correct: false,
      code: "wrong-quality",
      expected: "not-diatonic",
      actual: answer,
      detail: `${formatNote(r)} ${quality} is not a diatonic triad in ${formatNote(t)} major.`,
    };
  }
  const expected = majorRomanForDegree(match.degree);
  const normalized = answer.trim().replace(/o$/i, "°");
  if (normalized === expected) return { correct: true, code: "correct", expected, actual: normalized };
  return { correct: false, code: "wrong-roman-numeral", expected, actual: normalized };
}

export function assessText(expected: string, answer: string, aliases: readonly string[] = []): AssessmentResult<string, string> {
  const normalize = (x: string) => x.trim().toLowerCase().replaceAll(" ", "").replaceAll("->", "→").replaceAll("o", "°");
  const actual = answer.trim();
  if ([expected, ...aliases].some((x) => normalize(x) === normalize(actual))) {
    return { correct: true, code: "correct", expected, actual };
  }
  return { correct: false, code: "wrong-answer", expected, actual };
}

export function assessPitchClassAnswer(expectedPc: number, answer: string): AssessmentResult<number, string> {
  const parsed = safeParseNote(answer);
  if (!parsed) return { correct: false, code: "invalid-answer", expected: expectedPc, actual: answer };
  if (pitchClass(parsed) === ((expectedPc % 12) + 12) % 12) return { correct: true, code: "correct", expected: expectedPc, actual: formatNote(parsed) };
  return { correct: false, code: "wrong-note-selection", expected: expectedPc, actual: formatNote(parsed) };
}
