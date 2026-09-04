import type { LessonProgressState } from "./types.js";

export interface LessonOpeningState {
  stage: "teaching";
  teachingStepIndex: 0;
  canSkipToReview: boolean;
  skipPlacement: "teaching-bottom" | null;
}

export function freshLessonProgress(lessonId: string): LessonProgressState {
  return { lessonId, completionCount: 0 };
}

/** Every open/reopen starts at the beginning of teaching. */
export function lessonOpeningState(progress: LessonProgressState): LessonOpeningState {
  const completedBefore = progress.completionCount > 0;
  return {
    stage: "teaching",
    teachingStepIndex: 0,
    canSkipToReview: completedBefore,
    skipPlacement: completedBefore ? "teaching-bottom" : null,
  };
}

/** Completion is recorded only after teaching + required practice actually complete. */
export function markLessonCompleted(progress: LessonProgressState, completedAt: string): LessonProgressState {
  return {
    ...progress,
    completionCount: progress.completionCount + 1,
    firstCompletedAt: progress.firstCompletedAt ?? completedAt,
    lastCompletedAt: completedAt,
  };
}

/** Abandoning an unfinished first attempt must not unlock replay skipping. */
export function markLessonAbandoned(progress: LessonProgressState): LessonProgressState {
  return { ...progress };
}
