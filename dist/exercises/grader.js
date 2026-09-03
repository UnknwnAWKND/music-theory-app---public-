import { assessMajorScale, assessMajorScaleDegree, assessNote, assessNoteSequence, assessPitchClassAnswer, assessText, assessTriad, } from "../assessment/index.js";
import { parseNote } from "../theory/index.js";
function asStringArray(answer) {
    if (!Array.isArray(answer) || !answer.every((x) => typeof x === "string"))
        return null;
    return answer;
}
function normalizedJson(value) {
    if (Array.isArray(value))
        return `[${value.map(normalizedJson).join(",")}]`;
    if (value && typeof value === "object") {
        return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${normalizedJson(v)}`).join(",")}}`;
    }
    return String(value).trim().toLowerCase().replaceAll("♯", "#").replaceAll("♭", "b").replaceAll(" ", "");
}
function structured(expected, answer) {
    if (normalizedJson(expected) === normalizedJson(answer))
        return { correct: true, code: "correct", expected, actual: answer };
    return { correct: false, code: "wrong-answer", expected, actual: answer };
}
function looksLikeRomanHarmonyLabel(value) {
    if (typeof value !== "string")
        return false;
    const text = value.trim();
    // Roman-numeral harmony is case-sensitive because case carries chord quality.
    // Detect whole labels (V7/ii), progressions (I–V–vi–IV), and labels embedded
    // in short text answers ("ii and IV").
    return /(?:^|[\s(,→–—-])(?:[ivIV]{1,4})(?:[°ø+])?(?:maj|min|m|dim|aug)?\d*(?:\/[ivIV]{1,4}(?:[°ø+])?\d*)?(?=$|[\s),→–—-])/.test(text);
}
function assessCaseAwareText(expected, answer) {
    if (typeof answer !== "string")
        return { correct: false, code: "invalid-answer", expected, actual: answer };
    if (!looksLikeRomanHarmonyLabel(expected))
        return assessText(expected, answer);
    const normalize = (x) => x.trim().replaceAll(" ", "").replace(/o$/i, "°");
    const actual = normalize(answer);
    const exp = normalize(expected);
    if (actual === exp)
        return { correct: true, code: "correct", expected, actual: answer };
    return { correct: false, code: "wrong-roman-numeral", expected, actual: answer };
}
export function gradeExercise(exercise, answer) {
    if (exercise.assessmentMode === "self-check" || exercise.assessmentMode === "instructional") {
        throw new Error(`Exercise ${exercise.id} is not objectively gradable`);
    }
    const p = exercise.payload;
    switch (exercise.type) {
        case "interval-build-note":
            return typeof answer === "string" ? assessNote(parseNote(p.expected), answer) : { correct: false, code: "invalid-answer", expected: p.expected, actual: answer };
        case "triad-build-notes": {
            const a = asStringArray(answer);
            if (!a)
                return { correct: false, code: "invalid-answer", expected: p, actual: answer };
            return assessTriad(p.root, p.quality, a);
        }
        case "major-scale-build": {
            const a = asStringArray(answer);
            if (!a)
                return { correct: false, code: "invalid-answer", expected: p, actual: answer };
            return assessMajorScale(p.tonic, a);
        }
        case "major-degree-note":
            return typeof answer === "string" ? assessMajorScaleDegree(p.tonic, p.degree, answer) : { correct: false, code: "invalid-answer", expected: p, actual: answer };
        case "major-note-degree":
            return Number(answer) === Number(p.expected) ? { correct: true, code: "correct", expected: p.expected, actual: answer } : { correct: false, code: "wrong-degree", expected: p.expected, actual: answer };
        case "guitar-fret-note":
            return typeof answer === "string" ? assessPitchClassAnswer(p.expectedPitchClass, answer) : { correct: false, code: "invalid-answer", expected: p.expectedPitchClass, actual: answer };
        case "minor-scale-build": {
            if (p.expected) {
                const a = asStringArray(answer);
                return a ? assessNoteSequence(p.expected.map(parseNote), a, true) : { correct: false, code: "invalid-answer", expected: p.expected, actual: answer };
            }
            return structured({ ascending: p.expectedAscending, descending: p.expectedDescending }, answer);
        }
        case "seventh-build-notes":
        case "chord-color-build": {
            const a = asStringArray(answer);
            return a && Array.isArray(p.expected) ? assessNoteSequence(p.expected.map(parseNote), a, false) : structured(p.expected ?? p, answer);
        }
        case "mode-scale-build":
        case "inversion-build": {
            const a = asStringArray(answer);
            return a && Array.isArray(p.expected) ? assessNoteSequence(p.expected.map(parseNote), a, true) : structured(p.expected, answer);
        }
        case "diatonic-chord-build": {
            if (p.expectedNotes) {
                const a = asStringArray(answer);
                return a ? assessNoteSequence(p.expectedNotes.map(parseNote), a, false) : structured(p.expectedNotes, answer);
            }
            return structured(p.expected, answer);
        }
        case "progression-build":
            return structured(p.expected, answer);
        case "key-signature":
            return structured({ count: p.expectedCount, type: p.expectedType }, answer);
        case "major-chord-roman":
            return assessCaseAwareText(String(p.expected), answer);
        case "note-identify":
        case "concept-check":
        case "interval-identify":
        case "interval-inversion":
        case "scale-membership":
            if (Array.isArray(p.expected))
                return structured(p.expected, answer);
            return assessCaseAwareText(String(p.expected), answer);
        default:
            if ("expected" in p)
                return structured(p.expected, answer);
            throw new Error(`No grader implemented for exercise type ${exercise.type}`);
    }
}
