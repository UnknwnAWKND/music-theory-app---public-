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

export function freshLessonProgress(lessonId: string): LessonProgressState {
  return { lessonId, completionCount: 0 };
}

export function lessonIsCompleted(progress: LessonProgressState | undefined): boolean {
  return Boolean(progress && progress.completionCount > 0);
}

/** Every open/reopen starts at the beginning of teaching. */
export function lessonOpeningState(progress: LessonProgressState): LessonOpeningState {
  const completedBefore = lessonIsCompleted(progress);
  return {
    stage: "teaching",
    teachingStepIndex: 0,
    canSkipToReview: completedBefore,
    skipPlacement: completedBefore ? "teaching-bottom" : null,
  };
}

/**
 * The existing completion contract: a finished practice round can record lesson completion
 * only when the adaptive evidence is READY and not fragile. READY by itself, including a
 * mid-round READY transition, is not lesson completion.
 */
export function lessonCompletionEligibleAfterRound(
  progress: LessonProgressState,
  evidence: LessonCompletionEvidence | undefined,
): boolean {
  return !lessonIsCompleted(progress) && Boolean(evidence?.ready && !evidence.fragile);
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
