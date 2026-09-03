export const DEFAULT_EVIDENCE_POLICY = {
    readyIndependentSuccesses: 3,
    readyDistinctPromptSignatures: 3,
    retainedSuccessfulReviewSessions: 3,
    fragileFailuresInWindow: 2,
    fragileReviewWindow: 3,
    repeatedAcquisitionFailuresBeforeScaffold: 2,
};
function chronological(attempts) {
    return [...attempts].sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
}
function lastDirectOutcome(attempts, context) {
    const direct = [...attempts]
        .reverse()
        .find((x) => (!context || x.context === context) && x.directEvidence && x.independent && (x.outcome === "correct" || x.outcome === "incorrect"));
    return direct?.outcome;
}
function acquisitionEvidence(attempts) {
    const successes = attempts.filter((x) => x.context === "acquisition" && x.directEvidence && x.independent && x.outcome === "correct");
    return {
        successes: successes.length,
        distinctPrompts: new Set(successes.map((x) => x.promptSignature)).size,
    };
}
function reviewSessionColdResults(attempts) {
    const firstBySession = new Map();
    for (const attempt of attempts) {
        if (attempt.context !== "review" || !attempt.coldProbe || !attempt.directEvidence || !attempt.independent)
            continue;
        if (attempt.outcome !== "correct" && attempt.outcome !== "incorrect")
            continue;
        if (!firstBySession.has(attempt.sessionId))
            firstBySession.set(attempt.sessionId, attempt);
    }
    return [...firstBySession.values()]
        .map((x) => ({
        sessionId: x.sessionId,
        result: x.outcome === "correct" ? "success" : "failure",
        time: Date.parse(x.occurredAt),
    }))
        .sort((a, b) => a.time - b.time);
}
export function deriveSkillEvidence(attemptsInput, policy = DEFAULT_EVIDENCE_POLICY) {
    const attempts = chronological(attemptsInput);
    if (attempts.length === 0) {
        return {
            state: "new",
            ready: false,
            retained: false,
            fragile: false,
            acquisitionIndependentSuccesses: 0,
            acquisitionDistinctSuccessfulPrompts: 0,
            successfulDelayedReviewSessions: 0,
            recentColdReviewResults: [],
            evidenceBasis: "none",
        };
    }
    const sources = new Set(attempts.filter((x) => x.directEvidence && x.independent).map((x) => x.evidenceSource ?? "objective"));
    const evidenceBasis = sources.size === 0 ? "none" : sources.size > 1 ? "mixed" : sources.has("self-report") ? "self-report" : "objective";
    const acquisition = acquisitionEvidence(attempts);
    const lastAcquisitionOutcome = lastDirectOutcome(attempts, "acquisition");
    const lastOutcome = lastDirectOutcome(attempts);
    const ready = acquisition.successes >= policy.readyIndependentSuccesses &&
        acquisition.distinctPrompts >= policy.readyDistinctPromptSignatures &&
        lastAcquisitionOutcome === "correct";
    const reviewResults = reviewSessionColdResults(attempts);
    const successfulDelayedReviewSessions = reviewResults.filter((x) => x.result === "success").length;
    const retained = ready && successfulDelayedReviewSessions >= policy.retainedSuccessfulReviewSessions;
    const recent = reviewResults.slice(-policy.fragileReviewWindow).map((x) => x.result);
    const recentFailures = recent.filter((x) => x === "failure").length;
    const fragile = ready && recent.length > 0 && recentFailures >= policy.fragileFailuresInWindow;
    let state;
    if (fragile)
        state = "fragile";
    else if (retained)
        state = "retained";
    else if (ready && reviewResults.length > 0)
        state = "consolidating";
    else if (ready)
        state = "ready";
    else
        state = "acquiring";
    return {
        state,
        ready,
        retained,
        fragile,
        acquisitionIndependentSuccesses: acquisition.successes,
        acquisitionDistinctSuccessfulPrompts: acquisition.distinctPrompts,
        successfulDelayedReviewSessions,
        recentColdReviewResults: recent,
        lastDirectOutcome: lastOutcome,
        evidenceBasis,
    };
}
export function nextAcquisitionAction(attemptsInput, policy = DEFAULT_EVIDENCE_POLICY) {
    const attempts = chronological(attemptsInput);
    if (attempts.length === 0)
        return "continue-independent";
    const latest = attempts[attempts.length - 1];
    if (latest.outcome === "correct")
        return "continue-independent";
    if (latest.outcome === "hinted" || latest.outcome === "revealed")
        return "scaffold-and-retry";
    const sessionAttempts = attempts.filter((x) => x.sessionId === latest.sessionId && x.context === "acquisition");
    let consecutiveIndependentFailures = 0;
    for (let i = sessionAttempts.length - 1; i >= 0; i--) {
        const x = sessionAttempts[i];
        if (!x.independent || !x.directEvidence)
            continue;
        if (x.outcome === "incorrect")
            consecutiveIndependentFailures += 1;
        else if (x.outcome === "correct")
            break;
    }
    if (consecutiveIndependentFailures >= policy.repeatedAcquisitionFailuresBeforeScaffold + 1) {
        return "stop-unit-for-now";
    }
    if (consecutiveIndependentFailures >= policy.repeatedAcquisitionFailuresBeforeScaffold) {
        return "scaffold-and-retry";
    }
    return "give-corrective-feedback";
}
export function stateSatisfiesPrerequisite(evidence) {
    return evidence.ready && !evidence.fragile;
}
