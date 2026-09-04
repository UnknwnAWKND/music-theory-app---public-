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
export declare function createExercise(input: ExerciseFactoryInput, index?: number): Exercise;
export declare function cycleDeterministically<T>(items: readonly T[], index: number): T;
