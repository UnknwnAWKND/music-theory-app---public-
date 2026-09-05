import type { LessonProgressState } from "./types.js";
export interface LessonOpeningState {
    stage: "teaching";
    teachingStepIndex: 0;
    canSkipToReview: boolean;
    skipPlacement: "teaching-bottom" | null;
}
export interface LessonCompletionEvidence {
    ready?: boolean;
    fragile?: boolean;
}
export declare function freshLessonProgress(lessonId: string): LessonProgressState;
export declare function lessonIsCompleted(progress: LessonProgressState | undefined): boolean;
/** Every open/reopen starts at the beginning of teaching. */
export declare function lessonOpeningState(progress: LessonProgressState): LessonOpeningState;
/**
 * The existing completion contract: a finished practice round can record lesson completion
 * only when the adaptive evidence is READY and not fragile. READY by itself, including a
 * mid-round READY transition, is not lesson completion.
 */
export declare function lessonCompletionEligibleAfterRound(progress: LessonProgressState, evidence: LessonCompletionEvidence | undefined): boolean;
/** Completion is recorded only after teaching + required practice actually complete. */
export declare function markLessonCompleted(progress: LessonProgressState, completedAt: string): LessonProgressState;
/** Abandoning an unfinished first attempt must not unlock replay skipping. */
export declare function markLessonAbandoned(progress: LessonProgressState): LessonProgressState;
