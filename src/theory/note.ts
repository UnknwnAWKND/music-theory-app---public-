export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export type Letter = (typeof LETTERS)[number];

const NATURAL_PC: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export interface Note {
  letter: Letter;
  accidental: number; // -2 = bb, -1 = b, 0 = natural, 1 = #, 2 = ##
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function normalizeNoteInput(input: string): string {
  let text = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[‐‑‒–—−-]+/g, " ")
    .replaceAll("♯", "#")
    .replaceAll("♭", "b")
    .replace(/\bdouble\s+sharp\b/g, "##")
    .replace(/\bdouble\s+flat\b/g, "bb")
    .replace(/\bsharp\b/g, "#")
    .replace(/\bflat\b/g, "b")
    .replace(/\bnatural\b/g, "")
    .replace(/\s+/g, "");
  if (!text) return text;
  return text[0].toUpperCase() + text.slice(1);
}

export function parseNote(input: string): Note {
  const normalized = normalizeNoteInput(input);
  const match = /^([A-G])([#b]*)$/.exec(normalized);
  if (!match) throw new Error(`Invalid note: ${input}`);
  const letter = match[1] as Letter;
  const symbols = match[2];
  let accidental = 0;
  for (const symbol of symbols) accidental += symbol === "#" ? 1 : -1;
  return { letter, accidental };
}

export function pitchClass(note: Note): number {
  return mod(NATURAL_PC[note.letter] + note.accidental, 12);
}

export function formatNote(note: Note): string {
  if (note.accidental === 0) return note.letter;
  if (note.accidental > 0) return note.letter + "♯".repeat(note.accidental);
  return note.letter + "♭".repeat(-note.accidental);
}

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter);
}

export function letterAt(index: number): Letter {
  return LETTERS[mod(index, 7)];
}

export function naturalPitchClass(letter: Letter): number {
  return NATURAL_PC[letter];
}

export function accidentalForPitchClass(letter: Letter, desiredPc: number): number {
  const natural = naturalPitchClass(letter);
  const raw = mod(desiredPc - natural, 12);
  // Pick the closest enharmonic alteration; theory generated here should stay within a few accidentals.
  return raw > 6 ? raw - 12 : raw;
}
