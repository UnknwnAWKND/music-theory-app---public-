import type { DiagnosticCode } from "../assessment/index.js";

export type PracticeAnswerKind =
  | "note"
  | "note-sequence"
  | "text"
  | "number"
  | "number-sequence"
  | "choice"
  | "self-check";

export interface PracticeExercise {
  id: string;
  skillId: string;
  promptSignature: string;
  prompt: string;
  answerKind: PracticeAnswerKind;
  expected?: string | string[] | number | number[];
  accepted?: string[];
  choices?: string[];
  orderMatters?: boolean;
  explanation: string;
  /** Strong objective evidence is eligible to build READY/RETAINED. */
  directEvidence: boolean;
  /** True when the task is verified by the learner rather than objectively by the browser. */
  selfCheck?: boolean;
  inputHint?: string;
  /** Preserve letter case when case carries meaning, e.g. Roman-numeral chord quality. */
  caseSensitive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PracticeGrade {
  correct: boolean;
  code: DiagnosticCode;
  detail?: string;
  expected?: PracticeExercise["expected"];
  actual?: unknown;
}

export interface LessonCard {
  skillId: string;
  title: string;
  summary: string;
  rule?: string;
  workedExample?: string;
}
