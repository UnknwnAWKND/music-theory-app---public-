import { assessNote, assessNoteSequence } from "../assessment/index.js";
import { parseNote } from "../theory/index.js";
function normalizeText(value, caseSensitive = false) {
    const text = String(value ?? "").trim().replaceAll("♯", "#").replaceAll("♭", "b").replace(/\s+/g, " ");
    return caseSensitive ? text : text.toLowerCase();
}
function canonical(value) {
    if (Array.isArray(value))
        return `[${value.map(canonical).join(",")}]`;
    if (value && typeof value === "object") {
        return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${canonical(v)}`).join(",")}}`;
    }
    return normalizeText(value);
}
export function gradeExercise(exercise, answer) {
    const spec = exercise.answerSpec;
    if (spec.kind === "self-check")
        throw new Error(`Exercise ${exercise.id} is not objectively gradable`);
    if (spec.kind === "note") {
        if (typeof answer !== "string")
            return { correct: false, code: "invalid-answer", expected: spec.expected, actual: answer };
        const candidates = [spec.expected, ...(spec.accepted ?? [])];
        for (const candidate of candidates) {
            const result = assessNote(parseNote(candidate), answer);
            if (result.correct)
                return { ...result, detail: exercise.explanation };
        }
        const result = assessNote(parseNote(spec.expected), answer);
        return { ...result, detail: result.detail ?? `Correct answer: ${spec.expected}. ${exercise.explanation}` };
    }
    if (spec.kind === "note-sequence") {
        if (!Array.isArray(answer) || !answer.every((x) => typeof x === "string")) {
            return { correct: false, code: "invalid-answer", expected: spec.expected, actual: answer };
        }
        const result = assessNoteSequence(spec.expected.map(parseNote), answer, spec.orderMatters ?? true);
        return { ...result, detail: result.correct ? exercise.explanation : result.detail ?? `Correct answer: ${spec.expected.join(" ")}. ${exercise.explanation}` };
    }
    if (spec.kind === "number") {
        const actual = typeof answer === "number" ? answer : Number(String(answer).trim());
        const correct = Number.isFinite(actual) && actual === spec.expected;
        return { correct, code: correct ? "correct" : "wrong-answer", expected: spec.expected, actual: answer, detail: correct ? exercise.explanation : `Correct answer: ${spec.expected}. ${exercise.explanation}` };
    }
    if (spec.kind === "number-sequence") {
        const actual = Array.isArray(answer) ? answer.map(Number) : [];
        const expected = [...spec.expected];
        const left = spec.orderMatters === false ? [...actual].sort((a, b) => a - b) : actual;
        const right = spec.orderMatters === false ? [...expected].sort((a, b) => a - b) : expected;
        const correct = left.length === right.length && left.every((value, index) => value === right[index]);
        return { correct, code: correct ? "correct" : "wrong-answer", expected, actual: answer, detail: correct ? exercise.explanation : `Correct answer: ${expected.join(" ")}. ${exercise.explanation}` };
    }
    if (spec.kind === "text" || spec.kind === "choice") {
        const accepted = spec.kind === "text" ? [spec.expected, ...(spec.accepted ?? [])] : [spec.expected];
        const actual = normalizeText(answer, spec.caseSensitive ?? false);
        const correct = accepted.some((candidate) => normalizeText(candidate, spec.caseSensitive ?? false) === actual);
        return { correct, code: correct ? "correct" : "wrong-answer", expected: spec.expected, actual: answer, detail: correct ? exercise.explanation : `Correct answer: ${spec.expected}. ${exercise.explanation}` };
    }
    const correct = canonical(answer) === canonical(spec.expected);
    return { correct, code: correct ? "correct" : "wrong-answer", expected: spec.expected, actual: answer, detail: correct ? exercise.explanation : `Correct answer: ${canonical(spec.expected)}. ${exercise.explanation}` };
}
