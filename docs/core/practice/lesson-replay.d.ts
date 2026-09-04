import type { LessonProgressState } from "./types.js";
export interface LessonOpeningState {
    stage: "teaching";
    teachingStepIndex: 0;
    canSkipToReview: boolean;
    skipPlacement: "teaching-bottom" | null;
}
export declare function freshLessonProgress(lessonId: string): LessonProgressState;
/** Every open/reopen starts at the beginning of teaching. */
export declare function lessonOpeningState(progress: LessonProgressState): LessonOpeningState;
/** Completion is recorded only after teaching + required practice actually complete. */
export declare function markLessonCompleted(progress: LessonProgressState, completedAt: string): LessonProgressState;
/** Abandoning an unfinished first attempt must not unlock replay skipping. */
export declare function markLessonAbandoned(progress: LessonProgressState): LessonProgressState;
