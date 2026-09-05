import { RELATIVE_KEY_PAIRS, harmonicMinorScaleNames, majorScaleNames, naturalMinorScaleNames, relativeNaturalMinorChordRenumbering, } from "../theory/index.js";
import { createExercise } from "./generators.js";
import { phase1ExerciseForSkill } from "./phase1-intervals.js";
import { phase2ExerciseForSkill } from "./phase2-major-scales.js";
import { phase3ExerciseForSkill } from "./phase3-minor-scales.js";
import { phase4ExerciseForSkill } from "./phase4-diatonic-chords.js";
export const PHASE5_RELATIVE_SKILL_IDS = [
    "relatives.lesson-1-relative-major-minor",
    "relatives.lesson-2-same-chords-different-numbers",
    "relatives.lesson-3-fast-identification",
    "relatives.lesson-4-instant-recall",
];
function mod(n, m) { return ((n % m) + m) % m; }
function pairAt(index) { return RELATIVE_KEY_PAIRS[mod(index, RELATIVE_KEY_PAIRS.length)]; }
function isEasy(pair) { return ["C", "G", "F", "D"].includes(pair.major); }
function metadata(pair, competencies, extra = {}) {
    return {
        family: "relative-keys",
        majorKey: pair.major,
        minorKey: pair.minor,
        root: pair.major,
        pitchClassRoot: null,
        checkpointCompetencies: competencies,
        unfamiliarKey: !isEasy(pair),
        responseMode: "application",
        ...extra,
    };
}
function priorReview(index) {
    const slot = mod(Math.floor(index / 17), 4);
    let item;
    let reviewPhase = 1;
    if (slot === 0) {
        item = phase1ExerciseForSkill("intervals.lesson-4-thirds", 4 + mod(index, 8));
        reviewPhase = 1;
    }
    else if (slot === 1) {
        item = phase2ExerciseForSkill("major-scales.lesson-4-instant-recall", 28 + mod(index, 8) * 10);
        reviewPhase = 2;
    }
    else if (slot === 2) {
        item = phase3ExerciseForSkill("minor-scales.lesson-2-natural-all-roots", 2 + mod(index, 10) * 4);
        reviewPhase = 3;
    }
    else {
        item = phase4ExerciseForSkill("diatonic-chords.lesson-2-major-triads", 2 + mod(index, 10) * 3);
        reviewPhase = 4;
    }
    if (!item)
        throw new Error("Missing Phase 5 prior-foundation review item");
    return {
        ...item,
        metadata: {
            ...(item.metadata ?? {}),
            crossPhaseReview: true,
            reviewPhase,
            reviewReason: reviewPhase === 1 ? "relative-key-minor-third" : "relative-key-applied-foundation",
        },
    };
}
function withReview(index, own) {
    return index > 0 && index % 17 === 0 ? priorReview(index) : own(index);
}
function sharedCollectionQuestion(skillId, index) {
    const variant = mod(index, 3);
    // Decouple task type from key-pair rotation so each conceptual prompt reaches
    // many different written key signatures instead of repeating the same small
    // pair/task combinations.
    const pair = pairAt(Math.floor(index / 3) + (variant * 5));
    const major = majorScaleNames(pair.major);
    const minor = naturalMinorScaleNames(pair.minor);
    if (variant === 0) {
        return createExercise({
            skillId,
            prompt: `${pair.major} major and ${pair.minor} natural minor are relative keys. Which statement is true?`,
            answerSpec: { kind: "choice", expected: "Same seven pitch classes; different tonic", choices: ["Same seven pitch classes; different tonic", "Same tonic; different key signature", "Harmonic minor is identical to the major scale", "They must sound functionally identical"] },
            explanation: `They share the same key signature and the same seven-note major/natural-minor collection. ${pair.major} and ${pair.minor} are different tonics, so the notes can take different functions.`,
            exampleSignature: `${skillId}:${pair.major}:${pair.minor}:shared-definition`,
            metadata: metadata(pair, ["shared-natural-minor-collection"], { direction: "shared-collection", responseMode: "discrimination" }),
        }, index);
    }
    if (variant === 1) {
        return createExercise({
            skillId,
            prompt: `Do ${pair.major} major and ${pair.minor} NATURAL minor use the same seven written pitch classes?`,
            answerSpec: { kind: "choice", expected: "yes", choices: ["yes", "no"] },
            explanation: `${pair.major} major: ${major.join(" ")}. ${pair.minor} natural minor: ${minor.join(" ")}. The collection is the same, reordered around a different tonic.`,
            exampleSignature: `${skillId}:${pair.major}:${pair.minor}:same-notes`,
            metadata: metadata(pair, ["shared-natural-minor-collection"], { direction: "compare-collections", responseMode: "application" }),
        }, index);
    }
    return createExercise({
        skillId,
        prompt: `Which change turns the relative-major/natural-minor note collection into a different key interpretation?`,
        answerSpec: { kind: "choice", expected: "Which note functions as tonic", choices: ["Which note functions as tonic", "Adding a new eighth pitch class", "Making every chord minor", "Changing equal-tempered tuning"] },
        explanation: `Relative keys reuse the same seven pitch classes, but the tonic changes the scale degrees, harmonic functions, and sense of home.`,
        exampleSignature: `${skillId}:${pair.major}:${pair.minor}:tonic-interpretation`,
        metadata: metadata(pair, ["shared-natural-minor-collection"], { direction: "tonic-interpretation", responseMode: "application" }),
    }, index);
}
function lesson1Generator(index) {
    const skillId = PHASE5_RELATIVE_SKILL_IDS[0];
    return withReview(index, (safe) => {
        if (safe % 5 < 3)
            return sharedCollectionQuestion(skillId, safe);
        const pair = pairAt(safe + 5);
        if (safe % 5 === 3) {
            const harmonic = harmonicMinorScaleNames(pair.minor);
            return createExercise({
                skillId,
                prompt: `Does ${pair.minor} harmonic minor still have the exact same seven-note collection as ${pair.major} major?`,
                answerSpec: { kind: "choice", expected: "no", choices: ["yes", "no"] },
                explanation: `No. The exact shared collection is ${pair.major} major with ${pair.minor} NATURAL minor. Harmonic minor raises degree 7; ${pair.minor} harmonic minor is ${harmonic.join(" ")}.`,
                exampleSignature: `${skillId}:${pair.major}:${pair.minor}:harmonic-limit`,
                metadata: metadata(pair, ["shared-natural-minor-collection"], { direction: "natural-minor-limit", responseMode: "discrimination" }),
            }, safe);
        }
        return createExercise({
            skillId,
            prompt: `What is the relative minor of ${pair.major} major?`,
            answerSpec: { kind: "text", expected: pair.minor },
            explanation: `${pair.major} major and ${pair.minor} natural minor share a key signature and seven-note collection; ${pair.minor} is the different tonic.`,
            exampleSignature: `${skillId}:${pair.major}:major-to-minor-intro`,
            metadata: metadata(pair, ["relative-major-to-minor", "key-variety"], { direction: "major-to-minor" }),
        }, safe);
    });
}
function renumberQuestion(skillId, index) {
    const pair = pairAt(index + 4);
    const mapping = relativeNaturalMinorChordRenumbering(pair.major)[mod(index * 3 + 1, 7)];
    if (index % 2 === 0) {
        const choices = relativeNaturalMinorChordRenumbering(pair.major).map((item) => item.minorRomanNumeral);
        return createExercise({
            skillId,
            prompt: `${mapping.chordRoot} ${mapping.triadQuality} is ${mapping.majorRomanNumeral} in ${pair.major} major. What Roman numeral is that SAME chord in relative ${pair.minor} natural minor?`,
            answerSpec: { kind: "choice", expected: mapping.minorRomanNumeral, choices },
            explanation: `The chord itself stays ${mapping.chordRoot} ${mapping.triadQuality}. Changing tonic renumbers it from major degree ${mapping.majorDegree} (${mapping.majorRomanNumeral}) to natural-minor degree ${mapping.minorDegree} (${mapping.minorRomanNumeral}).`,
            exampleSignature: `${skillId}:${pair.major}:${mapping.chordRoot}:major-to-minor-rn`,
            metadata: metadata(pair, ["roman-renumbering", "key-variety"], { direction: "major-rn-to-minor-rn", responseMode: "application", chordRoot: mapping.chordRoot, majorRoman: mapping.majorRomanNumeral, minorRoman: mapping.minorRomanNumeral }),
        }, index);
    }
    const choices = relativeNaturalMinorChordRenumbering(pair.major).map((item) => item.majorRomanNumeral);
    return createExercise({
        skillId,
        prompt: `${mapping.chordRoot} ${mapping.triadQuality} is ${mapping.minorRomanNumeral} in ${pair.minor} natural minor. What Roman numeral is that SAME chord in relative ${pair.major} major?`,
        answerSpec: { kind: "choice", expected: mapping.majorRomanNumeral, choices },
        explanation: `The tonic changes the number: natural-minor degree ${mapping.minorDegree} (${mapping.minorRomanNumeral}) becomes major degree ${mapping.majorDegree} (${mapping.majorRomanNumeral}).`,
        exampleSignature: `${skillId}:${pair.major}:${mapping.chordRoot}:minor-to-major-rn`,
        metadata: metadata(pair, ["roman-renumbering", "key-variety"], { direction: "minor-rn-to-major-rn", responseMode: "application", chordRoot: mapping.chordRoot, majorRoman: mapping.majorRomanNumeral, minorRoman: mapping.minorRomanNumeral }),
    }, index);
}
function lesson2Generator(index) {
    const skillId = PHASE5_RELATIVE_SKILL_IDS[1];
    return withReview(index, (safe) => {
        if (safe % 5 < 4)
            return renumberQuestion(skillId, safe);
        const pair = pairAt(safe + 7);
        return createExercise({
            skillId,
            prompt: `Why can the seven triads of ${pair.major} major be reused in ${pair.minor} NATURAL minor but receive different Roman numerals?`,
            answerSpec: { kind: "choice", expected: "The tonic changed, so the same chord roots occupy new scale degrees", choices: ["The tonic changed, so the same chord roots occupy new scale degrees", "Every chord changed quality", "Natural minor adds a new pitch class", "Roman numerals ignore the tonic"] },
            explanation: "Roman numerals describe a chord relative to the current tonic. Relative major/natural minor keeps the collection but rotates which note is degree 1.",
            exampleSignature: `${skillId}:${pair.major}:${pair.minor}:why-renumber`,
            metadata: metadata(pair, ["roman-renumbering", "shared-natural-minor-collection"], { direction: "explain-renumbering", responseMode: "application" }),
        }, safe);
    });
}
function directRelativeQuestion(skillId, index, automatic = false) {
    const pair = pairAt(index);
    const majorToMinor = index % 2 === 0;
    if (majorToMinor) {
        return createExercise({
            skillId,
            prompt: `Name the relative minor of ${pair.major} major.`,
            answerSpec: { kind: "text", expected: pair.minor },
            explanation: `${pair.minor} is a minor 3rd (three semitones) below ${pair.major}, with the spelling that preserves the shared key signature.`,
            exampleSignature: `${skillId}:${pair.major}:to:${pair.minor}`,
            metadata: metadata(pair, ["relative-major-to-minor", "key-variety"], { direction: "major-to-minor", automaticRecall: automatic }),
        }, index);
    }
    return createExercise({
        skillId,
        prompt: `Name the relative major of ${pair.minor} minor.`,
        answerSpec: { kind: "text", expected: pair.major },
        explanation: `${pair.major} is a minor 3rd (three semitones) above ${pair.minor}, and the two keys share a key signature.`,
        exampleSignature: `${skillId}:${pair.minor}:to:${pair.major}`,
        metadata: metadata(pair, ["relative-minor-to-major", "key-variety"], { direction: "minor-to-major", automaticRecall: automatic }),
    }, index);
}
function lesson3Generator(index) {
    const skillId = PHASE5_RELATIVE_SKILL_IDS[2];
    return withReview(index, (safe) => {
        if (safe % 4 < 3)
            return directRelativeQuestion(skillId, safe + Math.floor(safe / 4), true);
        const pair = pairAt(safe + 9);
        const majorDirection = safe % 8 === 3;
        return createExercise({
            skillId,
            prompt: majorDirection ? `To find ${pair.major} major's relative minor quickly, which interval move is correct?` : `To find ${pair.minor} minor's relative major quickly, which interval move is correct?`,
            answerSpec: { kind: "choice", expected: majorDirection ? "down a minor 3rd" : "up a minor 3rd", choices: ["down a minor 3rd", "up a minor 3rd", "down a major 3rd", "up a perfect 4th"] },
            explanation: majorDirection ? `Major → relative minor is down a minor 3rd: ${pair.major} → ${pair.minor}.` : `Minor → relative major is up a minor 3rd: ${pair.minor} → ${pair.major}.`,
            exampleSignature: `${skillId}:${pair.major}:${majorDirection ? "direction-down" : "direction-up"}`,
            metadata: metadata(pair, [majorDirection ? "relative-major-to-minor" : "relative-minor-to-major"], { direction: "interval-rule", responseMode: "discrimination", automaticRecall: true }),
        }, safe);
    });
}
function lesson4Generator(index) {
    const skillId = PHASE5_RELATIVE_SKILL_IDS[3];
    return withReview(index, (safe) => {
        const pairIndex = mod(safe * 7 + Math.floor(safe / 15), RELATIVE_KEY_PAIRS.length);
        if (safe % 6 < 4)
            return directRelativeQuestion(skillId, pairIndex * 2 + (safe % 2), true);
        if (safe % 6 === 4)
            return renumberQuestion(skillId, safe + 31);
        return sharedCollectionQuestion(skillId, safe + 37);
    });
}
export const PHASE5_RELATIVE_GENERATORS = new Map([
    [PHASE5_RELATIVE_SKILL_IDS[0], lesson1Generator],
    [PHASE5_RELATIVE_SKILL_IDS[1], lesson2Generator],
    [PHASE5_RELATIVE_SKILL_IDS[2], lesson3Generator],
    [PHASE5_RELATIVE_SKILL_IDS[3], lesson4Generator],
]);
export function phase5ExerciseForSkill(skillId, index = 0) {
    return PHASE5_RELATIVE_GENERATORS.get(skillId)?.(index);
}
