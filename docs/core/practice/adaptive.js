export function evidenceQualityForAttempt(attempt) {
    if (attempt.eventKind && attempt.eventKind !== "response")
        return "weak";
    if (!attempt.directEvidence || !attempt.independent || attempt.solutionSeen)
        return "weak";
    if (attempt.guidance && attempt.guidance !== "none")
        return "supported";
    return attempt.firstSubmission === false ? "supported" : "strong";
}
export function semanticExerciseSignature(exercise) {
    return exercise.exampleSignature || exercise.promptSignature || exercise.id;
}
export function selectAdaptiveExercise(candidates, recentSignatures = [], index = 0) {
    if (!candidates.length)
        return undefined;
    const recent = new Set(recentSignatures);
    const preferred = candidates.filter((exercise) => !recent.has(semanticExerciseSignature(exercise)));
    const pool = preferred.length ? preferred : candidates;
    return pool[((index % pool.length) + pool.length) % pool.length];
}
export function decideAdaptivePractice(attempts, evidence) {
    const responses = attempts.filter((attempt) => !attempt.eventKind || attempt.eventKind === "response");
    const recent = responses.slice(-3);
    const failures = recent.filter((attempt) => attempt.outcome === "incorrect").length;
    if (evidence?.ready && !evidence.fragile)
        return { action: "stop-for-now", reason: "ready-evidence" };
    if (failures >= 2)
        return { action: "reteach", reason: "repeated-independent-errors" };
    if (failures === 1)
        return { action: "corrective-feedback", reason: "recent-error" };
    if (responses.length > 0)
        return { action: "follow-up-round", reason: "more-evidence-needed" };
    return { action: "continue-independent", reason: "begin-retrieval" };
}
export function confusionPartnerFor(evidence) {
    if (!evidence)
        return undefined;
    return Object.entries(evidence.confusions ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0];
}
export function inferredConfusionPartner(_attempt) {
    // Curriculum-specific diagnostic mappings were intentionally removed in Block 1.
    return undefined;
}
export function interleavingTargets(evidenceBySkill) {
    const targets = new Set();
    for (const [skillId, evidence] of evidenceBySkill) {
        if (!evidence.ready || evidence.fragile)
            continue;
        const partner = confusionPartnerFor(evidence);
        if (partner && evidenceBySkill.get(partner)?.ready) {
            targets.add(skillId);
            targets.add(partner);
        }
    }
    return [...targets];
}
