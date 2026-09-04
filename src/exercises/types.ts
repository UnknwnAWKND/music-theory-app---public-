export type ExerciseAnswerSpec =
  | { kind: "note"; expected: string; accepted?: readonly string[] }
  | { kind: "note-sequence"; expected: readonly string[]; orderMatters?: boolean }
  | { kind: "text"; expected: string; accepted?: readonly string[]; caseSensitive?: boolean }
  | { kind: "number"; expected: number }
  | { kind: "number-sequence"; expected: readonly number[]; orderMatters?: boolean }
  | { kind: "choice"; expected: string; choices: readonly string[]; caseSensitive?: boolean }
  | { kind: "structured"; expected: unknown }
  | { kind: "self-check" };

export interface Exercise<TMetadata extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  skillId: string;
  promptSignature: string;
  exampleSignature: string;
  prompt: string;
  answerSpec: ExerciseAnswerSpec;
  explanation: string;
  directEvidence: boolean;
  metadata?: TMetadata;
}

export interface ExerciseGrade {
  correct: boolean;
  code: string;
  expected?: unknown;
  actual?: unknown;
  detail?: string;
}

export type ExerciseGenerator = (index: number) => Exercise;
