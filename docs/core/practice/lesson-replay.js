export function freshLessonProgress(lessonId) {
    return { lessonId, completionCount: 0 };
}
/** Every open/reopen starts at the beginning of teaching. */
export function lessonOpeningState(progress) {
    const completedBefore = progress.completionCount > 0;
    return {
        stage: "teaching",
        teachingStepIndex: 0,
        canSkipToReview: completedBefore,
        skipPlacement: completedBefore ? "teaching-bottom" : null,
    };
}
/** Completion is recorded only after teaching + required practice actually complete. */
export function markLessonCompleted(progress, completedAt) {
    return {
        ...progress,
        completionCount: progress.completionCount + 1,
        firstCompletedAt: progress.firstCompletedAt ?? completedAt,
        lastCompletedAt: completedAt,
    };
}
/** Abandoning an unfinished first attempt must not unlock replay skipping. */
export function markLessonAbandoned(progress) {
    return { ...progress };
}
