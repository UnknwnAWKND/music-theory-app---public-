import type {
  AcquisitionAction,
  DerivedSkillEvidence,
  GuidanceKind,
  LearningAttempt,
  LearningEventKind,
  ReadinessBasis,
  ReadinessMode,
  SkillEvidencePolicy,
} from "./types.js";

export const DEFAULT_EVIDENCE_POLICY: SkillEvidencePolicy = {
  readinessMode: "varied",
  retainedSuccessfulReviewSessions: 2,
  fragileFailuresInWindow: 2,
  fragileReviewWindow: 3,
  repeatedAcquisitionFailuresBeforeScaffold: 2,
  preserveLegacyReady: true,
};

export function evidencePolicyForModes(modes: readonly string[] = []): SkillEvidencePolicy {
  const onlyApplication = modes.length > 0 && modes.every((mode) => mode === "apply");
  const hasRelationalEvidence = modes.some((mode) => ["construct", "translate", "transform", "diagnose", "apply"].includes(mode));
  const readinessMode: ReadinessMode = onlyApplication ? "application" : hasRelationalEvidence ? "varied" : "atomic";
  return { ...DEFAULT_EVIDENCE_POLICY, readinessMode };
}

function chronological(attempts: readonly LearningAttempt[]): LearningAttempt[] {
  return [...attempts].sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
}

function eventKind(attempt: LearningAttempt): LearningEventKind {
  if (attempt.eventKind) return attempt.eventKind;
  if (attempt.outcome === "hinted") return "hint";
  if (attempt.outcome === "revealed") return "answer-reveal";
  if (attempt.outcome === "exposed") return "explanation";
  return "response";
}

function guidance(attempt: LearningAttempt): GuidanceKind {
  if (attempt.guidance) return attempt.guidance;
  if (attempt.outcome === "hinted") return "hint";
  if (attempt.outcome === "revealed") return "answer-reveal";
  return attempt.independent ? "none" : "explanation";
}

function firstSubmission(attempt: LearningAttempt): boolean {
  if (typeof attempt.firstSubmission === "boolean") return attempt.firstSubmission;
  if (typeof attempt.submissionIndex === "number") return attempt.submissionIndex === 1;
  // Historical v1 rows did not store this field. The old UI allowed only one submit per rendered prompt.
  return true;
}

function isLegacy(attempt: LearningAttempt): boolean {
  return !attempt.evidenceVersion || attempt.evidenceVersion === "legacy-v1";
}

function isResponse(attempt: LearningAttempt): boolean {
  return eventKind(attempt) === "response";
}

function isCleanFirstResponse(attempt: LearningAttempt): boolean {
  return isResponse(attempt)
    && firstSubmission(attempt)
    && attempt.independent
    && attempt.directEvidence
    && guidance(attempt) === "none"
    && !attempt.solutionSeen
    && (attempt.outcome === "correct" || attempt.outcome === "incorrect");
}

function lastDirectOutcome(attempts: readonly LearningAttempt[], context?: LearningAttempt["context"]): "correct" | "incorrect" | undefined {
  const direct = [...attempts]
    .reverse()
    .find((x) => isResponse(x)
      && (!context || x.context === context)
      && x.directEvidence
      && x.independent
      && (x.outcome === "correct" || x.outcome === "incorrect"));
  return direct?.outcome as "correct" | "incorrect" | undefined;
}

function legacyReady(attempts: readonly LearningAttempt[], policy: SkillEvidencePolicy): { ready: boolean; establishedAt?: string } {
  if (!policy.preserveLegacyReady) return { ready: false };
  const acquisition = attempts.filter((x) => isLegacy(x)
    && isResponse(x)
    && x.context === "acquisition"
    && x.directEvidence
    && x.independent
    && x.outcome === "correct");
  if (acquisition.length < 3 || new Set(acquisition.map((x) => x.promptSignature)).size < 3) return { ready: false };
  const lastLegacyAcquisition = [...attempts].reverse().find((x) => isLegacy(x)
    && isResponse(x)
    && x.context === "acquisition"
    && x.directEvidence
    && x.independent
    && (x.outcome === "correct" || x.outcome === "incorrect"));
  if (lastLegacyAcquisition?.outcome !== "correct") return { ready: false };

  const successes: LearningAttempt[] = [];
  const signatures = new Set<string>();
  for (const attempt of acquisition) {
    successes.push(attempt);
    signatures.add(attempt.promptSignature);
    if (successes.length >= 3 && signatures.size >= 3) return { ready: true, establishedAt: attempt.occurredAt };
  }
  return { ready: false };
}

function currentReadiness(
  attempts: readonly LearningAttempt[],
  mode: ReadinessMode,
): { ready: boolean; basis: ReadinessBasis; establishedAt?: string } {
  const cleanCorrect = attempts.filter((x) => !isLegacy(x)
    && x.context !== "review"
    && isCleanFirstResponse(x)
    && x.outcome === "correct");

  // READY is a current teaching decision, not a permanent reward for an early streak.
  // A later independent acquisition miss leaves the skill acquiring until the learner
  // repairs it with a later clean retrieval. Historical successes remain in the log.
  const lastCurrentAcquisition = [...attempts].reverse().find((x) => !isLegacy(x)
    && x.context === "acquisition"
    && isCleanFirstResponse(x));
  if (lastCurrentAcquisition?.outcome === "incorrect") {
    return { ready: false, basis: "none" };
  }

  const qualifies = (subset: readonly LearningAttempt[]): ReadinessBasis => {
    if (!subset.length) return "none";
    const semanticExamples = new Set(subset.map((x) => x.exampleSignature || x.promptSignature));
    const promptForms = new Set(subset.map((x) => x.promptSignature));
    const strongResponses = subset.filter((x) => ["constructed", "discrimination", "application"].includes(x.responseMode ?? ""));
    const applications = subset.filter((x) => x.responseMode === "application" || x.context === "transfer");

    if (mode === "application") {
      return semanticExamples.size > 1 && applications.length > 0 ? "application" : "none";
    }
    if (mode === "atomic") {
      // Atomic facts do not always have meaningful root/key variation, but one immediately repeated answer is not enough.
      return promptForms.size > 1 && subset.length > 1 ? "atomic-retrieval" : "none";
    }
    // Relational skills require more than one semantic example and at least one generative/discriminative/application response.
    return semanticExamples.size > 1 && strongResponses.length > 0 ? "varied-independent" : "none";
  };

  for (let i = 0; i < cleanCorrect.length; i++) {
    const basis = qualifies(cleanCorrect.slice(0, i + 1));
    if (basis !== "none") return { ready: true, basis, establishedAt: cleanCorrect[i].occurredAt };
  }
  return { ready: false, basis: "none" };
}

function reviewSessionColdResults(attempts: readonly LearningAttempt[]): Array<{
  sessionId: string;
  result: "success" | "failure";
  time: number;
  occurredAt: string;
}> {
  const firstBySession = new Map<string, LearningAttempt>();
  for (const attempt of attempts) {
    if (attempt.context !== "review"
      || !attempt.coldProbe
      || !isCleanFirstResponse(attempt)) continue;
    if (!firstBySession.has(attempt.sessionId)) firstBySession.set(attempt.sessionId, attempt);
  }
  return [...firstBySession.values()]
    .map((x) => ({
      sessionId: x.sessionId,
      result: x.outcome === "correct" ? "success" as const : "failure" as const,
      time: Date.parse(x.occurredAt),
      occurredAt: x.occurredAt,
    }))
    .sort((a, b) => a.time - b.time);
}

export function normalizeLearningAttempt(
  input: LearningAttempt,
  previousInput: readonly LearningAttempt[] = [],
): LearningAttempt {
  const previous = chronological(previousInput);
  const kind = eventKind(input);
  const prior = previous.at(-1);
  const priorResponsesForPrompt = previous.filter((x) => isResponse(x)
    && x.sessionId === input.sessionId
    && x.skillId === input.skillId
    && x.promptSignature === input.promptSignature);
  const submissionIndex = kind === "response"
    ? (input.submissionIndex ?? priorResponsesForPrompt.length + 1)
    : input.submissionIndex;
  const first = kind === "response"
    ? (input.firstSubmission ?? submissionIndex === 1)
    : false;
  const support = guidance(input);
  const priorColdFailure = previous.some((x) => x.sessionId === input.sessionId
    && x.skillId === input.skillId
    && x.context === "review"
    && x.coldProbe
    && isCleanFirstResponse(x)
    && x.outcome === "incorrect");
  const stage = input.stage ?? (
    kind === "response" && priorColdFailure && !input.coldProbe && input.context === "review"
      ? "relearning"
      : kind === "response" && (submissionIndex ?? 1) > 1
        ? "retry"
        : "initial"
  );
  const priorRelevantExposureAt = input.priorRelevantExposureAt ?? prior?.occurredAt;
  const elapsedSinceRelevantExposureMs = input.elapsedSinceRelevantExposureMs ?? (
    priorRelevantExposureAt
      ? Math.max(0, Date.parse(input.occurredAt) - Date.parse(priorRelevantExposureAt))
      : undefined
  );
  const coldProbe = Boolean(input.coldProbe
    && kind === "response"
    && first
    && input.independent
    && input.directEvidence
    && support === "none");

  return {
    ...input,
    eventKind: kind,
    submissionIndex,
    firstSubmission: first,
    stage,
    guidance: support,
    solutionSeen: input.solutionSeen ?? (support === "answer-reveal" || kind === "answer-reveal" || input.outcome === "revealed"),
    coldProbe,
    priorRelevantExposureAt,
    elapsedSinceRelevantExposureMs,
    evidenceVersion: input.evidenceVersion ?? "v2",
  };
}

export function deriveSkillEvidence(
  attemptsInput: readonly LearningAttempt[],
  policy: SkillEvidencePolicy = DEFAULT_EVIDENCE_POLICY,
): DerivedSkillEvidence {
  const attempts = chronological(attemptsInput);
  const empty: DerivedSkillEvidence = {
    state: "new",
    ready: false,
    retained: false,
    fragile: false,
    retentionAtRisk: false,
    everRetained: false,
    readinessBasis: "none",
    acquisitionIndependentSuccesses: 0,
    acquisitionDistinctSuccessfulPrompts: 0,
    successfulDelayedReviewSessions: 0,
    independentFirstAttemptSuccesses: 0,
    independentFirstAttemptFailures: 0,
    distinctSuccessfulExamples: 0,
    recognitionSuccesses: 0,
    constructedSuccesses: 0,
    discriminationSuccesses: 0,
    applicationSuccesses: 0,
    hintedOrGuidedSuccesses: 0,
    answerRevealEvents: 0,
    immediatePostInstructionResponses: 0,
    successfulColdRetrievals: 0,
    failedColdRetrievals: 0,
    successfulRelearningEvents: 0,
    recentColdReviewResults: [],
    evidenceBasis: "none",
    confusions: {},
    evidenceVersion: "v2",
  };
  if (attempts.length === 0) return empty;

  const directSources = new Set(attempts
    .filter((x) => isResponse(x) && x.directEvidence && x.independent)
    .map((x) => x.evidenceSource ?? "objective"));
  const evidenceBasis: DerivedSkillEvidence["evidenceBasis"] = directSources.size === 0
    ? "none"
    : directSources.size > 1
      ? "mixed"
      : directSources.has("self-report") ? "self-report" : "objective";

  const acquisitionSuccesses = attempts.filter((x) => isResponse(x)
    && x.context === "acquisition"
    && x.directEvidence
    && x.independent
    && x.outcome === "correct");
  const cleanFirst = attempts.filter((x) => isCleanFirstResponse(x));
  const cleanFirstCorrect = cleanFirst.filter((x) => x.outcome === "correct");
  const currentFirstCorrect = cleanFirstCorrect.filter((x) => !isLegacy(x));
  const currentFirstIncorrect = cleanFirst.filter((x) => !isLegacy(x) && x.outcome === "incorrect");
  const successfulExamples = new Set(currentFirstCorrect.map((x) => x.exampleSignature || x.promptSignature));
  const responseSuccesses = attempts.filter((x) => isResponse(x) && x.outcome === "correct");
  const guidedSuccesses = responseSuccesses.filter((x) => !x.independent || guidance(x) !== "none" || !firstSubmission(x));
  const revealEvents = attempts.filter((x) => eventKind(x) === "answer-reveal" || x.outcome === "revealed");
  const relearningSuccesses = responseSuccesses.filter((x) => x.stage === "relearning" && !x.coldProbe);

  const legacy = legacyReady(attempts, policy);
  const current = currentReadiness(attempts, policy.readinessMode);
  const ready = legacy.ready || current.ready;
  const readinessBasis: ReadinessBasis = current.ready ? current.basis : legacy.ready ? "legacy-v1" : "none";
  const readyEstablishedAt = [legacy.establishedAt, current.establishedAt]
    .filter((x): x is string => Boolean(x))
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0];

  const reviewResults = reviewSessionColdResults(attempts);
  const successfulCold = reviewResults.filter((x) => x.result === "success");
  const failedCold = reviewResults.filter((x) => x.result === "failure");
  const lastCold = reviewResults.at(-1);
  const everRetained = ready && successfulCold.length >= policy.retainedSuccessfulReviewSessions;
  const retained = everRetained && lastCold?.result === "success";
  const retainedEstablishedAt = successfulCold.length >= policy.retainedSuccessfulReviewSessions
    ? successfulCold[policy.retainedSuccessfulReviewSessions - 1]?.occurredAt
    : undefined;
  const retentionAtRisk = ready && lastCold?.result === "failure";

  const recent = reviewResults.slice(-policy.fragileReviewWindow).map((x) => x.result);
  const recentFailures = recent.filter((x) => x === "failure").length;
  const fragile = ready && recent.length > 0 && recentFailures >= policy.fragileFailuresInWindow;

  let state: DerivedSkillEvidence["state"];
  if (fragile) state = "fragile";
  else if (retained) state = "retained";
  else if (ready && reviewResults.length > 0) state = "consolidating";
  else if (ready) state = "ready";
  else state = "acquiring";

  const confusions: Record<string, number> = {};
  for (const attempt of attempts) {
    if (!attempt.confusionWith) continue;
    confusions[attempt.confusionWith] = (confusions[attempt.confusionWith] ?? 0) + 1;
  }

  const countMode = (mode: string) => currentFirstCorrect.filter((x) => x.responseMode === mode).length;

  return {
    state,
    ready,
    retained,
    fragile,
    retentionAtRisk,
    everRetained,
    readinessBasis,
    readyEstablishedAt,
    retainedEstablishedAt,
    acquisitionIndependentSuccesses: acquisitionSuccesses.length,
    acquisitionDistinctSuccessfulPrompts: new Set(acquisitionSuccesses.map((x) => x.promptSignature)).size,
    successfulDelayedReviewSessions: successfulCold.length,
    independentFirstAttemptSuccesses: currentFirstCorrect.length,
    independentFirstAttemptFailures: currentFirstIncorrect.length,
    distinctSuccessfulExamples: successfulExamples.size,
    recognitionSuccesses: countMode("recognition"),
    constructedSuccesses: countMode("constructed"),
    discriminationSuccesses: countMode("discrimination"),
    applicationSuccesses: countMode("application"),
    hintedOrGuidedSuccesses: guidedSuccesses.length,
    answerRevealEvents: revealEvents.length,
    immediatePostInstructionResponses: attempts.filter((x) => isResponse(x) && guidance(x) === "explanation").length,
    successfulColdRetrievals: successfulCold.length,
    failedColdRetrievals: failedCold.length,
    successfulRelearningEvents: relearningSuccesses.length,
    recentColdReviewResults: recent,
    lastColdOutcome: lastCold?.result,
    lastDirectOutcome: lastDirectOutcome(attempts),
    evidenceBasis,
    confusions,
    evidenceVersion: "v2",
  };
}

export function nextAcquisitionAction(
  attemptsInput: readonly LearningAttempt[],
  policy: SkillEvidencePolicy = DEFAULT_EVIDENCE_POLICY,
): AcquisitionAction {
  const attempts = chronological(attemptsInput);
  const responses = attempts.filter((x) => x.context === "acquisition" && isResponse(x));
  if (responses.length === 0) return "continue-independent";
  const latest = responses.at(-1)!;
  if (latest.outcome === "correct") return "continue-independent";
  if (guidance(latest) !== "none" || latest.outcome === "hinted" || latest.outcome === "revealed") return "scaffold-and-retry";

  const sessionAttempts = responses.filter((x) => x.sessionId === latest.sessionId);
  let consecutiveIndependentFailures = 0;
  for (let i = sessionAttempts.length - 1; i >= 0; i--) {
    const x = sessionAttempts[i];
    if (!x.independent || !x.directEvidence || guidance(x) !== "none") continue;
    if (x.outcome === "incorrect") consecutiveIndependentFailures += 1;
    else if (x.outcome === "correct") break;
  }
  if (consecutiveIndependentFailures >= policy.repeatedAcquisitionFailuresBeforeScaffold + 1) return "stop-unit-for-now";
  if (consecutiveIndependentFailures >= policy.repeatedAcquisitionFailuresBeforeScaffold) return "scaffold-and-retry";
  return "give-corrective-feedback";
}

export function stateSatisfiesPrerequisite(evidence: DerivedSkillEvidence): boolean {
  return evidence.ready && !evidence.fragile;
}
