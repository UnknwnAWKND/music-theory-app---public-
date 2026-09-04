import type { Exercise, ExerciseAnswerSpec } from "./types.js";

export interface ExerciseFactoryInput {
  skillId: string;
  prompt: string;
  answerSpec: ExerciseAnswerSpec;
  explanation: string;
  exampleSignature: string;
  promptSignature?: string;
  directEvidence?: boolean;
  metadata?: Record<string, unknown>;
}

/** Generic deterministic factory. Curriculum blocks supply the musical content later. */
export function createExercise(input: ExerciseFactoryInput, index = 0): Exercise {
  return {
    id: `${input.skillId}:${input.exampleSignature}:${index}`,
    skillId: input.skillId,
    promptSignature: input.promptSignature ?? `${input.skillId}:${input.exampleSignature}`,
    exampleSignature: input.exampleSignature,
    prompt: input.prompt,
    answerSpec: input.answerSpec,
    explanation: input.explanation,
    directEvidence: input.directEvidence ?? input.answerSpec.kind !== "self-check",
    metadata: input.metadata,
  };
}

export function cycleDeterministically<T>(items: readonly T[], index: number): T {
  if (items.length === 0) throw new Error("Cannot choose from an empty exercise source");
  return items[((index % items.length) + items.length) % items.length];
}
