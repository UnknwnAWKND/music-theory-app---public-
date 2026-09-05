import { INTERVALS, PHASE1_INTERVAL_NAMES, formatNote, intervalAbove, invertPhase1Interval, parseNote, pitchClass, } from "../theory/index.js";
import { createExercise } from "./generators.js";
const ROOT_NAMES = Object.freeze([
    "C", "G", "D", "A", "E", "B", "F",
    "F#", "C#", "G#", "D#", "A#", "E#", "B#",
    "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb",
]);
const LESSON_POOLS = Object.freeze({
    "intervals.lesson-1-unison-octave": ["P1", "P8"],
    "intervals.lesson-2-perfect-fifth": ["P5", "P5", "P1", "P8"],
    "intervals.lesson-3-perfect-fourth": ["P4", "P4", "P5", "P1", "P8"],
    "intervals.lesson-4-thirds": ["M3", "m3", "M3", "m3", "P5", "P4", "P8", "P1"],
    "intervals.lesson-5-sixths": ["M6", "m6", "M6", "m6", "M3", "m3", "P5", "P4", "P8", "P1"],
    "intervals.lesson-6-seconds": ["M2", "m2", "M2", "m2", "M6", "m6", "M3", "m3", "P5", "P4", "P8", "P1"],
    "intervals.lesson-7-sevenths": ["M7", "m7", "M7", "m7", "M2", "m2", "M6", "m6", "M3", "m3", "P5", "P4", "P8", "P1"],
    "intervals.lesson-8-tritone": ["A4", "d5", "A4", "d5", "M7", "m7", "M2", "m2", "M6", "m6", "M3", "m3", "P5", "P4", "P8", "P1"],
    "intervals.lesson-9-inversion-capstone": PHASE1_INTERVAL_NAMES,
    "intervals.lesson-10-cumulative": PHASE1_INTERVAL_NAMES,
});
const PERFECT_CHOICES = ["P1", "P4", "P5", "P8"];
const MAJOR_MINOR_CHOICES = ["m2", "M2", "m3", "M3", "m6", "M6", "m7", "M7"];
const TRITONE_CHOICES = ["A4", "d5", "P4", "P5"];
function rootFor(index) {
    const safe = Math.max(0, index);
    const rootName = ROOT_NAMES[(safe * 5 + Math.floor(safe / ROOT_NAMES.length)) % ROOT_NAMES.length];
    return parseNote(rootName);
}
function intervalFor(pool, index) {
    const safe = Math.max(0, index);
    // 11 is coprime with every pool length used here, so variety appears quickly instead of cycling a small subset.
    return pool[(safe * 11 + Math.floor(safe / ROOT_NAMES.length)) % pool.length];
}
function keyboardPitchName(noteName) {
    const note = parseNote(noteName);
    return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][pitchClass(note)];
}
function intervalChoices(interval) {
    if (interval === "A4" || interval === "d5")
        return TRITONE_CHOICES;
    if (INTERVALS[interval].quality === "perfect")
        return PERFECT_CHOICES;
    const sameNumber = MAJOR_MINOR_CHOICES.filter((candidate) => INTERVALS[candidate].number === INTERVALS[interval].number);
    const inversion = invertPhase1Interval(interval);
    return [...new Set([interval, ...sameNumber, inversion, INTERVALS[interval].quality === "major" ? `m${INTERVALS[interval].number}` : `M${INTERVALS[interval].number}`])].slice(0, 4);
}
function pairPrompt(rootName, targetName, interval) {
    if (interval === "P1")
        return `${rootName} to ${targetName} at the same pitch: identify the interval.`;
    if (interval === "P8")
        return `${rootName} to the next ${targetName} one octave higher: identify the interval.`;
    return `${rootName} up to ${targetName}: identify the exact interval.`;
}
function makeIdentify(skillId, interval, index) {
    const root = rootFor(index);
    const target = intervalAbove(root, INTERVALS[interval]);
    const rootName = formatNote(root);
    const targetName = formatNote(target);
    return createExercise({
        skillId,
        prompt: pairPrompt(rootName, targetName, interval),
        answerSpec: { kind: "choice", expected: interval, choices: intervalChoices(interval) },
        explanation: `${rootName} to ${targetName} is ${INTERVALS[interval].name} (${interval}): a ${INTERVALS[interval].number} by letter spelling and ${INTERVALS[interval].semitones} semitone${INTERVALS[interval].semitones === 1 ? "" : "s"}.`,
        exampleSignature: `${skillId}:identify:${rootName}:${targetName}:${interval}`,
        directEvidence: true,
        metadata: { family: "interval", direction: "identify", responseMode: "recognition", interval, root: rootName, target: targetName, pianoHighlighted: [keyboardPitchName(rootName), keyboardPitchName(targetName)] },
    }, index);
}
function makeConstruct(skillId, interval, index) {
    const root = rootFor(index + 11);
    const target = intervalAbove(root, INTERVALS[interval]);
    const rootName = formatNote(root);
    const targetName = formatNote(target);
    return createExercise({
        skillId,
        prompt: `Construct ${INTERVALS[interval].name} (${interval}) above ${rootName}. Enter the correctly spelled target note.`,
        answerSpec: { kind: "note", expected: targetName },
        explanation: `The target must first be a ${INTERVALS[interval].number} by letter name, then the accidental must make the distance ${INTERVALS[interval].semitones} semitone${INTERVALS[interval].semitones === 1 ? "" : "s"}. The correct spelling is ${targetName}.`,
        exampleSignature: `${skillId}:construct:${rootName}:${interval}:${targetName}`,
        directEvidence: true,
        metadata: { family: "interval", direction: "construct", responseMode: "constructed", interval, root: rootName, target: targetName, pianoHighlighted: [keyboardPitchName(rootName)], revealPianoTarget: keyboardPitchName(targetName) },
    }, index);
}
function makeInversion(skillId, interval, index) {
    const inverse = invertPhase1Interval(interval);
    const choices = [...new Set([inverse, interval, invertPhase1Interval(inverse), ...(INTERVALS[inverse].quality === "perfect" ? PERFECT_CHOICES : MAJOR_MINOR_CHOICES)])].slice(0, 5);
    return createExercise({
        skillId,
        prompt: `Invert ${INTERVALS[interval].name} (${interval}). What interval does it become?`,
        answerSpec: { kind: "choice", expected: inverse, choices },
        explanation: `${INTERVALS[interval].number} + ${INTERVALS[inverse].number} = 9, and ${INTERVALS[interval].quality} inverts to ${INTERVALS[inverse].quality}. So ${interval} ↔ ${inverse}.`,
        exampleSignature: `${skillId}:invert:${interval}:${inverse}:${index % 3}`,
        directEvidence: true,
        metadata: { family: "interval-inversion", direction: "transform", responseMode: "application", interval, inverse },
    }, index);
}
function makeTritoneSpelling(skillId, index) {
    const interval = index % 2 === 0 ? "A4" : "d5";
    const root = rootFor(index + 17);
    const target = intervalAbove(root, INTERVALS[interval]);
    const rootName = formatNote(root);
    const targetName = formatNote(target);
    const other = interval === "A4" ? "d5" : "A4";
    return createExercise({
        skillId,
        prompt: `${rootName} up to ${targetName} spans six semitones. Is the correctly spelled interval A4 or d5?`,
        answerSpec: { kind: "choice", expected: interval, choices: ["A4", "d5"] },
        explanation: `The letters make this a ${INTERVALS[interval].number}, so the six-semitone tritone is ${interval}, not ${other}. Spelling determines the interval name.`,
        exampleSignature: `${skillId}:tritone-spelling:${rootName}:${targetName}:${interval}`,
        directEvidence: true,
        metadata: { family: "tritone-spelling", direction: "diagnose", responseMode: "discrimination", interval, root: rootName, target: targetName, pianoHighlighted: [keyboardPitchName(rootName), keyboardPitchName(targetName)] },
    }, index);
}
function makeNumberInversion(skillId, index) {
    const number = (index % 4) + 1;
    const shown = index % 2 === 0 ? number : 9 - number;
    const expected = 9 - shown;
    return createExercise({
        skillId,
        prompt: `A ${shown}${shown === 1 ? "st" : shown === 2 ? "nd" : shown === 3 ? "rd" : "th"} inverts to what interval number?`,
        answerSpec: { kind: "number", expected },
        explanation: `Simple interval numbers under inversion add to 9: ${shown} + ${expected} = 9.`,
        exampleSignature: `${skillId}:invert-number:${shown}:${index % 3}`,
        directEvidence: true,
        metadata: { family: "interval-inversion", direction: "transform", responseMode: "constructed", shown, expected },
    }, index);
}
function generatorFor(skillId) {
    const pool = LESSON_POOLS[skillId];
    if (!pool)
        throw new Error(`No Phase 1 interval pool for ${skillId}`);
    return (index) => {
        const safe = Math.max(0, index);
        const interval = intervalFor(pool, safe);
        if (skillId === "intervals.lesson-3-perfect-fourth" && safe % 5 === 4)
            return makeInversion(skillId, safe % 2 === 0 ? "P5" : "P4", safe);
        if (skillId === "intervals.lesson-5-sixths" && safe % 5 === 0)
            return makeInversion(skillId, ["M3", "m6", "m3", "M6"][safe % 4], safe);
        if (skillId === "intervals.lesson-7-sevenths" && safe % 5 === 0)
            return makeInversion(skillId, ["M2", "m7", "m2", "M7"][safe % 4], safe);
        if (skillId === "intervals.lesson-8-tritone" && safe % 4 === 0)
            return makeTritoneSpelling(skillId, safe);
        if (skillId === "intervals.lesson-9-inversion-capstone") {
            if (safe % 3 === 0)
                return makeNumberInversion(skillId, safe);
            return makeInversion(skillId, PHASE1_INTERVAL_NAMES[(safe * 5) % PHASE1_INTERVAL_NAMES.length], safe);
        }
        if (skillId === "intervals.lesson-10-cumulative") {
            if (safe % 7 === 0)
                return makeInversion(skillId, interval, safe);
            if (safe % 11 === 0)
                return makeTritoneSpelling(skillId, safe);
        }
        return safe % 2 === 0 ? makeConstruct(skillId, interval, safe) : makeIdentify(skillId, interval, safe);
    };
}
export const PHASE1_INTERVAL_GENERATORS = new Map(Object.keys(LESSON_POOLS).map((skillId) => [skillId, generatorFor(skillId)]));
export function phase1ExerciseForSkill(skillId, index = 0) { return PHASE1_INTERVAL_GENERATORS.get(skillId)?.(index); }
export function phase1RootNames() { return ROOT_NAMES; }
