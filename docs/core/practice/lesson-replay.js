export function freshLessonProgress(lessonId) {
    return { lessonId, completionCount: 0 };
}
export function lessonIsCompleted(progress) {
    return Boolean(progress && progress.completionCount > 0);
}
/** Every open/reopen starts at the beginning of teaching. */
export function lessonOpeningState(progress) {
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
export function lessonCompletionEligibleAfterRound(progress, evidence) {
    return !lessonIsCompleted(progress) && Boolean(evidence?.ready && !evidence.fragile);
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
