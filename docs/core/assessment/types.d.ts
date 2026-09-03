export type DiagnosticCode = "correct" | "invalid-answer" | "wrong-note-selection" | "enharmonic-spelling-error" | "wrong-length" | "wrong-order" | "wrong-root" | "wrong-quality" | "wrong-degree" | "wrong-roman-numeral" | "wrong-answer";
export interface AssessmentResult<TExpected = unknown, TActual = unknown> {
    correct: boolean;
    code: DiagnosticCode;
    expected: TExpected;
    actual?: TActual;
    detail?: string;
}
