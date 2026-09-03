export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
};
export function mod(n, m) {
    return ((n % m) + m) % m;
}
export function parseNote(input) {
    const normalized = input.trim().replaceAll("♯", "#").replaceAll("♭", "b");
    const match = /^([A-Ga-g])([#b]*)$/.exec(normalized);
    if (!match)
        throw new Error(`Invalid note: ${input}`);
    const letter = match[1].toUpperCase();
    const symbols = match[2];
    let accidental = 0;
    for (const symbol of symbols)
        accidental += symbol === "#" ? 1 : -1;
    return { letter, accidental };
}
export function pitchClass(note) {
    return mod(NATURAL_PC[note.letter] + note.accidental, 12);
}
export function formatNote(note) {
    if (note.accidental === 0)
        return note.letter;
    if (note.accidental > 0)
        return note.letter + "♯".repeat(note.accidental);
    return note.letter + "♭".repeat(-note.accidental);
}
export function letterIndex(letter) {
    return LETTERS.indexOf(letter);
}
export function letterAt(index) {
    return LETTERS[mod(index, 7)];
}
export function naturalPitchClass(letter) {
    return NATURAL_PC[letter];
}
export function accidentalForPitchClass(letter, desiredPc) {
    const natural = naturalPitchClass(letter);
    const raw = mod(desiredPc - natural, 12);
    // Pick the closest enharmonic alteration; theory generated here should stay within a few accidentals.
    return raw > 6 ? raw - 12 : raw;
}
