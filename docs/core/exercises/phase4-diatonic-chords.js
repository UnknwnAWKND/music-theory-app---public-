import { basicChordFunction, deriveDiatonicChord, deriveDiatonicHarmony, functionExplanation, parseNote, pitchClass, transposeRomanProgression, } from "../theory/index.js";
import { createExercise } from "./generators.js";
import { phase1ExerciseForSkill } from "./phase1-intervals.js";
import { phase2ExerciseForSkill } from "./phase2-major-scales.js";
import { phase3ExerciseForSkill } from "./phase3-minor-scales.js";
export const PHASE4_DIATONIC_CHORD_SKILL_IDS = [
    "diatonic-chords.lesson-1-stacking-thirds",
    "diatonic-chords.lesson-2-major-triads",
    "diatonic-chords.lesson-3-natural-minor-triads",
    "diatonic-chords.lesson-4-harmonic-minor-triads",
    "diatonic-chords.lesson-5-melodic-minor-triads",
    "diatonic-chords.lesson-6-seventh-chords",
    "diatonic-chords.lesson-8-function",
    "diatonic-chords.lesson-9-progressions",
    "diatonic-chords.lesson-10-own-progressions",
];
const ROOTS = ["C", "F#", "Eb", "A", "Bb", "E", "G", "C#", "F", "D", "Ab", "B"];
const MINOR_ROOTS = ["A", "F#", "C", "Eb", "G#", "D", "Bb", "E", "C#", "F", "B", "G"];
const QUALITY_CHOICES = ["major", "minor", "diminished", "augmented"];
const SEVENTH_CHOICES = ["major7", "minor7", "dominant7", "half-diminished7", "diminished7", "minor-major7", "augmented-major7"];
const FUNCTION_CHOICES = ["tonic", "predominant", "dominant", "context-dependent"];
function mod(n, m) { return ((n % m) + m) % m; }
function rootFor(form, index) { return form === "major" ? ROOTS[mod(index, ROOTS.length)] : MINOR_ROOTS[mod(index, MINOR_ROOTS.length)]; }
function formName(form) {
    if (form === "major")
        return "major";
    if (form === "natural-minor")
        return "natural minor";
    if (form === "harmonic-minor")
        return "harmonic minor";
    return "ascending melodic minor";
}
function seventhName(value) {
    return { major7: "major7", minor7: "minor7", dominant7: "dominant7", halfDiminished7: "half-diminished7", diminished7: "diminished7", minorMajor7: "minor-major7", augmentedMajor7: "augmented-major7" }[value] ?? value;
}
function qualityLabel(value) { return value; }
function pianoName(note) {
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return names[pitchClass(parseNote(note))];
}
function metadata(chord, competencies, extra = {}) {
    return {
        family: "diatonic-harmony",
        root: chord.tonic,
        pitchClassRoot: pitchClass(parseNote(chord.tonic)),
        scaleForm: chord.form,
        degree: chord.degree,
        chordRoot: chord.root,
        chordQuality: chord.seventhQuality ?? chord.triadQuality,
        romanNumeral: chord.romanNumeral,
        scale: deriveDiatonicHarmony(chord.tonic, chord.form).map((item) => item.root),
        responseMode: "constructed",
        checkpointCompetencies: competencies,
        pianoHighlighted: [pianoName(chord.root)],
        revealPianoNotes: chord.notes.map(pianoName),
        ...extra,
    };
}
const REVIEW_SOURCES = [
    () => phase1ExerciseForSkill("intervals.lesson-4-thirds", 17),
    () => phase1ExerciseForSkill("intervals.lesson-7-sevenths", 23),
    () => phase2ExerciseForSkill("major-scales.lesson-4-instant-recall", 29),
    () => phase3ExerciseForSkill("minor-scales.lesson-5-instant-recall", 31),
];
function priorFoundationReview(index) {
    const item = REVIEW_SOURCES[mod(Math.floor(index / 13), REVIEW_SOURCES.length)]();
    if (!item)
        throw new Error("Missing prior-foundation review generator");
    return { ...item, metadata: { ...(item.metadata ?? {}), crossPhaseReview: true, reviewPhase: item.skillId.startsWith("intervals.") ? 1 : item.skillId.startsWith("major-scales.") ? 2 : 3, reviewReason: "apply-foundation-inside-harmony" } };
}
function withReview(index, own) { return index > 0 && index % 13 === 0 ? priorFoundationReview(index) : own(index); }
function constructTriad(skillId, form, index, competencies) {
    const degree = mod(index * 3 + 1, 7) + 1;
    const root = rootFor(form, Math.floor(index / 2) + degree);
    const chord = deriveDiatonicChord(root, form, degree);
    return createExercise({
        skillId,
        prompt: `In ${root} ${formName(form)}, build the diatonic triad on scale degree ${degree}. Enter root, 3rd, 5th in order.`,
        answerSpec: { kind: "note-sequence", expected: chord.notes },
        explanation: `${chord.romanNumeral} is ${chord.chordSymbol}: ${chord.notes.join("–")}. It comes from stacking every other note of the scale.`,
        exampleSignature: `${skillId}:${form}:${root}:${degree}:construct`,
        metadata: metadata(chord, competencies, { direction: "construct-triad", automaticRecall: form === "major" || form === "natural-minor" }),
    }, index);
}
function identifyTriadQuality(skillId, form, index, competencies) {
    const degree = mod(index * 5 + 2, 7) + 1;
    const root = rootFor(form, index + 4);
    const chord = deriveDiatonicChord(root, form, degree);
    return createExercise({
        skillId,
        prompt: `${chord.notes.join("–")} is the degree-${degree} triad in ${root} ${formName(form)}. What is its triad quality?`,
        answerSpec: { kind: "choice", expected: qualityLabel(chord.triadQuality), choices: QUALITY_CHOICES },
        explanation: `${chord.notes.join("–")} is ${chord.triadQuality}; its Roman numeral is ${chord.romanNumeral}.`,
        exampleSignature: `${skillId}:${form}:${root}:${degree}:quality`,
        metadata: metadata(chord, competencies, { direction: "identify-quality", responseMode: "discrimination" }),
    }, index);
}
function identifyRoman(skillId, form, index, competencies) {
    const degree = mod(index * 2 + 3, 7) + 1;
    const root = rootFor(form, index + 7);
    const chord = deriveDiatonicChord(root, form, degree);
    const choices = deriveDiatonicHarmony(root, form).map((item) => item.romanNumeral);
    return createExercise({
        skillId,
        prompt: `In ${root} ${formName(form)}, what Roman numeral labels ${chord.chordSymbol} (${chord.notes.join("–")})?`,
        answerSpec: { kind: "choice", expected: chord.romanNumeral, choices },
        explanation: `${chord.root} is scale degree ${degree}, and stacking diatonic thirds gives a ${chord.triadQuality} triad, so the label is ${chord.romanNumeral}.`,
        exampleSignature: `${skillId}:${form}:${root}:${degree}:roman`,
        metadata: metadata(chord, competencies, { direction: "roman-translation", responseMode: "application", automaticRecall: true }),
    }, index);
}
function stackingGenerator(index) {
    const skillId = PHASE4_DIATONIC_CHORD_SKILL_IDS[0];
    return withReview(index, (safe) => {
        if (safe % 3 === 0)
            return constructTriad(skillId, "major", safe, ["stacking-thirds"]);
        const degree = mod(safe + 1, 7) + 1;
        const root = ROOTS[mod(safe, ROOTS.length)];
        const chord = deriveDiatonicChord(root, "major", degree);
        if (safe % 3 === 1)
            return createExercise({ skillId, prompt: `For ${chord.notes.join("–")}, which note is the chord root?`, answerSpec: { kind: "choice", expected: chord.notes[0], choices: chord.notes }, explanation: `${chord.notes[0]} is the root; ${chord.notes[1]} is its 3rd and ${chord.notes[2]} its 5th.`, exampleSignature: `${skillId}:${root}:${degree}:member-root`, metadata: metadata(chord, ["stacking-thirds"], { responseMode: "recognition", direction: "identify-member" }) }, safe);
        return createExercise({ skillId, prompt: `A diatonic triad starts on scale degree ${degree}. Which scale degrees are stacked to make it?`, answerSpec: { kind: "number-sequence", expected: [degree, mod(degree + 1, 7) + 1, mod(degree + 3, 7) + 1] }, explanation: "Triads take every other scale note: root, third, fifth. Scale-degree numbers wrap after 7.", exampleSignature: `${skillId}:stack:${degree}`, metadata: metadata(chord, ["stacking-thirds"], { responseMode: "constructed", direction: "stack-degrees" }) }, safe);
    });
}
function triadFormGenerator(skillId, form, index, competencies) {
    return withReview(index, (safe) => {
        if (safe % 3 === 0)
            return constructTriad(skillId, form, safe, competencies);
        if (safe % 3 === 1)
            return identifyTriadQuality(skillId, form, safe, competencies);
        return identifyRoman(skillId, form, safe, [...competencies, "roman-numeral-translation"]);
    });
}
function harmonicGenerator(index) {
    const skillId = PHASE4_DIATONIC_CHORD_SKILL_IDS[3];
    return withReview(index, (safe) => {
        if (safe % 5 < 3)
            return triadFormGenerator(skillId, "harmonic-minor", safe, ["harmonic-minor-triads"]);
        if (safe % 5 === 3) {
            const root = rootFor("harmonic-minor", safe);
            const v = deriveDiatonicChord(root, "harmonic-minor", 5);
            return createExercise({ skillId, prompt: `Why is V major in ${root} harmonic minor?`, answerSpec: { kind: "choice", expected: "The raised 7th is the major 3rd of V", choices: ["The raised 7th is the major 3rd of V", "Degree 6 becomes the root of V", "The tonic is raised", "All harmonic-minor triads are major"] }, explanation: `${v.notes.join("–")} is V. Raised degree 7 supplies V's major 3rd and also acts as the leading tone toward tonic.`, exampleSignature: `${skillId}:${root}:why-V`, metadata: metadata(v, ["harmonic-minor-triads", "harmonic-minor-reason"], { responseMode: "application", direction: "explain" }) }, safe);
        }
        const root = rootFor("harmonic-minor", safe + 3);
        const iii = deriveDiatonicChord(root, "harmonic-minor", 3);
        return createExercise({ skillId, prompt: `In ${root} harmonic minor, why is III+ augmented?`, answerSpec: { kind: "choice", expected: "The raised 7th becomes III's augmented 5th", choices: ["The raised 7th becomes III's augmented 5th", "Degree 3 is raised", "The root of III is sharpened", "Every III chord is augmented"] }, explanation: `${iii.notes.join("–")} is III+. The raised scale degree 7 is an augmented 5th above the degree-3 root.`, exampleSignature: `${skillId}:${root}:why-IIIplus`, metadata: metadata(iii, ["harmonic-minor-triads", "harmonic-minor-reason"], { responseMode: "application", direction: "explain" }) }, safe);
    });
}
function seventhGenerator(index) {
    const skillId = PHASE4_DIATONIC_CHORD_SKILL_IDS[5];
    return withReview(index, (safe) => {
        const forms = ["major", "natural-minor", "harmonic-minor", "melodic-minor-ascending"];
        const form = forms[mod(Math.floor(safe / 3), forms.length)];
        const root = rootFor(form, safe + 5);
        const degree = mod(safe * 3 + 2, 7) + 1;
        const chord = deriveDiatonicChord(root, form, degree, true);
        if (safe % 3 === 0)
            return createExercise({ skillId, prompt: `In ${root} ${formName(form)}, build the diatonic seventh chord on degree ${degree}. Enter root, 3rd, 5th, 7th.`, answerSpec: { kind: "note-sequence", expected: chord.notes }, explanation: `${chord.romanNumeral} is ${chord.chordSymbol}: ${chord.notes.join("–")}.`, exampleSignature: `${skillId}:${form}:${root}:${degree}:construct7`, metadata: metadata(chord, ["seventh-chords", "correct-spelling"], { direction: "construct-seventh" }) }, safe);
        if (safe % 3 === 1)
            return createExercise({ skillId, prompt: `What seventh-chord quality is ${chord.notes.join("–")} in ${root} ${formName(form)}?`, answerSpec: { kind: "choice", expected: seventhName(chord.seventhQuality), choices: SEVENTH_CHOICES }, explanation: `${chord.notes.join("–")} is ${seventhName(chord.seventhQuality)} and is labeled ${chord.romanNumeral}.`, exampleSignature: `${skillId}:${form}:${root}:${degree}:quality7`, metadata: metadata(chord, ["seventh-chords"], { responseMode: "discrimination", direction: "identify-seventh-quality" }) }, safe);
        const choices = deriveDiatonicHarmony(root, form, true).map((item) => item.romanNumeral);
        return createExercise({ skillId, prompt: `In ${root} ${formName(form)}, what Roman numeral labels ${chord.chordSymbol}?`, answerSpec: { kind: "choice", expected: chord.romanNumeral, choices }, explanation: `${chord.chordSymbol} is degree ${degree}: ${chord.romanNumeral}.`, exampleSignature: `${skillId}:${form}:${root}:${degree}:roman7`, metadata: metadata(chord, ["seventh-chords", "roman-numeral-translation"], { responseMode: "application", direction: "roman-seventh" }) }, safe);
    });
}
function functionGenerator(index) {
    const skillId = PHASE4_DIATONIC_CHORD_SKILL_IDS[6];
    return withReview(index, (safe) => {
        const degreePool = [1, 2, 4, 5, 7, 3, 6];
        const degree = degreePool[mod(safe, degreePool.length)];
        const root = ROOTS[mod(safe + 4, ROOTS.length)];
        const chord = deriveDiatonicChord(root, "major", degree);
        const expected = basicChordFunction(degree);
        return createExercise({ skillId, prompt: `In ${root} major, ${chord.romanNumeral} (${chord.chordSymbol}) most clearly belongs to which beginner functional category?`, answerSpec: { kind: "choice", expected, choices: FUNCTION_CHOICES }, explanation: functionExplanation(degree), exampleSignature: `${skillId}:${root}:${degree}:function`, metadata: metadata(chord, ["chord-function"], { responseMode: "application", direction: "function", function: expected }) }, safe);
    });
}
const MAJOR_PROGRESSIONS = [[1, 5, 6, 4], [6, 4, 1, 5], [2, 5, 1], [1, 6, 2, 5]];
const MINOR_PROGRESSION = [1, 6, 3, 7];
function progressionGenerator(index) {
    const skillId = PHASE4_DIATONIC_CHORD_SKILL_IDS[7];
    return withReview(index, (safe) => {
        const minor = safe % 5 === 4;
        const form = minor ? "natural-minor" : "major";
        const degrees = minor ? MINOR_PROGRESSION : MAJOR_PROGRESSIONS[mod(safe, MAJOR_PROGRESSIONS.length)];
        const root = rootFor(form, safe + 2);
        const chords = transposeRomanProgression(root, form, degrees);
        if (safe % 2 === 0)
            return createExercise({ skillId, prompt: `Transpose ${degrees.map((d) => deriveDiatonicChord(root, form, d).romanNumeral).join("–")} into ${root} ${formName(form)}. Enter the chord roots in order.`, answerSpec: { kind: "note-sequence", expected: chords.map((chord) => chord.root) }, explanation: `The progression becomes ${chords.map((chord) => chord.chordSymbol).join(" – ")}. Roman numerals preserve the scale-degree relationships when the key changes.`, exampleSignature: `${skillId}:${form}:${root}:${degrees.join("-")}:transpose`, metadata: metadata(chords[0], ["progression-application", "roman-numeral-translation"], { responseMode: "application", direction: "transpose-progression", progressionDegrees: [...degrees] }) }, safe);
        const target = chords[mod(safe, chords.length)];
        return createExercise({ skillId, prompt: `In ${root} ${formName(form)}, the progression contains ${target.chordSymbol}. What is its Roman numeral?`, answerSpec: { kind: "choice", expected: target.romanNumeral, choices: deriveDiatonicHarmony(root, form).map((item) => item.romanNumeral) }, explanation: `${target.chordSymbol} is scale degree ${target.degree}: ${target.romanNumeral}.`, exampleSignature: `${skillId}:${form}:${root}:${target.degree}:progression-roman`, metadata: metadata(target, ["progression-application", "roman-numeral-translation"], { responseMode: "application", direction: "progression-roman" }) }, safe);
    });
}
function ownProgressionGenerator(index) {
    const skillId = PHASE4_DIATONIC_CHORD_SKILL_IDS[8];
    return withReview(index, (safe) => {
        const form = safe % 3 === 0 ? "natural-minor" : "major";
        const root = rootFor(form, safe + 3);
        const degree = mod(safe * 4 + 1, 7) + 1;
        const chord = deriveDiatonicChord(root, form, degree);
        if (safe % 2 === 0)
            return createExercise({ skillId, prompt: `Structured analysis: key = ${root} ${formName(form)}; chord = ${chord.chordSymbol}. Is this chord inside the current diatonic set?`, answerSpec: { kind: "choice", expected: "diatonic", choices: ["diatonic", "outside current diatonic set"] }, explanation: `${chord.chordSymbol} is ${chord.romanNumeral}, so it is diatonic to this scale collection.`, exampleSignature: `${skillId}:${form}:${root}:${degree}:inside`, metadata: metadata(chord, ["progression-application", "roman-numeral-translation"], { responseMode: "application", direction: "structured-analysis" }) }, safe);
        const wrongQuality = chord.triadQuality === "major" ? "minor" : "major";
        return createExercise({ skillId, prompt: `Structured analysis: key = ${root} ${formName(form)}; root = ${chord.root}; selected quality = ${wrongQuality}. How should the app classify that chord for this phase?`, answerSpec: { kind: "choice", expected: "outside current diatonic set", choices: ["diatonic", "outside current diatonic set"] }, explanation: `The diatonic chord on ${chord.root} here is ${chord.chordSymbol} (${chord.romanNumeral}), not ${wrongQuality}. The selected chord may still be musically useful, but chromatic explanation is outside this phase.`, exampleSignature: `${skillId}:${form}:${root}:${degree}:outside`, metadata: metadata(chord, ["progression-application"], { responseMode: "application", direction: "structured-analysis", nonDiatonicCase: true }) }, safe);
    });
}
export const PHASE4_DIATONIC_CHORD_GENERATORS = new Map([
    [PHASE4_DIATONIC_CHORD_SKILL_IDS[0], stackingGenerator],
    [PHASE4_DIATONIC_CHORD_SKILL_IDS[1], (index) => triadFormGenerator(PHASE4_DIATONIC_CHORD_SKILL_IDS[1], "major", index, ["major-diatonic-triads", "correct-spelling"])],
    [PHASE4_DIATONIC_CHORD_SKILL_IDS[2], (index) => triadFormGenerator(PHASE4_DIATONIC_CHORD_SKILL_IDS[2], "natural-minor", index, ["natural-minor-triads", "correct-spelling"])],
    [PHASE4_DIATONIC_CHORD_SKILL_IDS[3], harmonicGenerator],
    [PHASE4_DIATONIC_CHORD_SKILL_IDS[4], (index) => triadFormGenerator(PHASE4_DIATONIC_CHORD_SKILL_IDS[4], "melodic-minor-ascending", index, ["melodic-minor-awareness"])],
    [PHASE4_DIATONIC_CHORD_SKILL_IDS[5], seventhGenerator],
    [PHASE4_DIATONIC_CHORD_SKILL_IDS[6], functionGenerator],
    [PHASE4_DIATONIC_CHORD_SKILL_IDS[7], progressionGenerator],
    [PHASE4_DIATONIC_CHORD_SKILL_IDS[8], ownProgressionGenerator],
]);
export function phase4ExerciseForSkill(skillId, index = 0) { return PHASE4_DIATONIC_CHORD_GENERATORS.get(skillId)?.(index); }
