export const DEFAULT_SCHEDULER_POLICY = {
    desiredRetention: 0.9,
    maximumIntervalDays: 36500,
    schedulerVersion: "fsrs-6",
};
export function ratingForAttempt(attempt) {
    if (!attempt.independent || !attempt.directEvidence)
        return "again";
    return attempt.outcome === "correct" ? "good" : "again";
}
