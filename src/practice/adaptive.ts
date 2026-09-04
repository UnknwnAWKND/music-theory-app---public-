import { SKILL_BY_ID } from "../curriculum/index.js";
import { exerciseForSkill, type Exercise } from "../exercises/index.js";
import type { DerivedSkillEvidence, LearningAttempt, ResponseMode } from "../learning/index.js";

export type EvidenceQuality = "learning-event" | "weak" | "moderate" | "strong" | "very-strong";
export type AdaptivePracticeAction = "complete" | "continue" | "corrective-next-example" | "reteach" | "stop-for-now";

export interface AdaptivePracticeDecision {
  action: AdaptivePracticeAction;
  reason: string;
  preferredResponseMode?: ResponseMode;
}

export interface AdaptiveExerciseSelection {
  exercise: Exercise;
  index: number;
  semanticSignature: string;
  reason: "unseen-example" | "avoid-recent-duplicate" | "best-available";
}

const CONFUSION_PAIRS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "interval.m3": ["interval.M3"],
  "interval.M3": ["interval.m3"],
  "interval.P4": ["interval.P5"],
  "interval.P5": ["interval.P4"],
  "triad.major": ["triad.minor"],
  "triad.minor": ["triad.major"],
  "seventh.major7": ["seventh.dominant7"],
  "seventh.dominant7": ["seventh.major7"],
  "function.tonic": ["function.predominant", "function.dominant"],
  "function.predominant": ["function.tonic", "function.dominant"],
  "function.dominant": ["function.tonic", "function.predominant"],
});

function eventKind(attempt: LearningAttempt) {
  if (attempt.eventKind) return attempt.eventKind;
  if (attempt.outcome === "hinted") return "hint";
  if (attempt.outcome === "revealed") return "answer-reveal";
  if (attempt.outcome === "exposed") return "explanation";
  return "response";
}

function guidance(attempt: LearningAttempt) {
  if (attempt.guidance) return attempt.guidance;
  if (attempt.outcome === "hinted") return "hint";
  if (attempt.outcome === "revealed") return "answer-reveal";
  return attempt.independent ? "none" : "explanation";
}

function isFirst(attempt: LearningAttempt) {
  if (typeof attempt.firstSubmission === "boolean") return attempt.firstSubmission;
  return (attempt.submissionIndex ?? 1) === 1;
}

export function evidenceQualityForAttempt(attempt: LearningAttempt): EvidenceQuality {
  if (eventKind(attempt) !== "response" || attempt.solutionSeen || attempt.outcome === "revealed" || attempt.outcome === "exposed") return "learning-event";
  if (attempt.outcome !== "correct") return "weak";
  if (!attempt.independent || guidance(attempt) !== "none" || !isFirst(attempt) || attempt.stage === "retry" || attempt.stage === "relearning") return "weak";
  if (attempt.coldProbe && attempt.responseMode && attempt.responseMode !== "recognition") return "very-strong";
  if (attempt.responseMode === "constructed" || attempt.responseMode === "discrimination" || attempt.responseMode === "application") return "strong";
  return "moderate";
}

export function semanticExerciseSignature(exercise: Exercise): string {
  const payload = (exercise.payload ?? {}) as Record<string, unknown>;
  const keys = ["root", "tonic", "note", "interval", "quality", "degree", "mode", "romans", "expectedRoot", "expectedQuality", "naturalKeyIndex"];
  const attributes: Record<string, unknown> = {};
  for (const key of keys) {
    const value = payload[key];
    if (["string", "number", "boolean"].includes(typeof value) || (Array.isArray(value) && value.every((x) => ["string", "number"].includes(typeof x)))) attributes[key] = value;
  }
  const names = Object.keys(attributes).sort();
  const prompt = exercise.prompt.trim().toLowerCase();
  if (!names.length) return `${exercise.type}:${prompt}`;
  return `${exercise.type}:${prompt}:${JSON.stringify(Object.fromEntries(names.map((key) => [key, attributes[key]])))}`;
}

function acquisitionResponses(attempts: readonly LearningAttempt[]) {
  return attempts.filter((attempt) => attempt.context === "acquisition" && eventKind(attempt) === "response");
}

export function decideAdaptivePractice(
  attempts: readonly LearningAttempt[],
  evidence: DerivedSkillEvidence,
): AdaptivePracticeDecision {
  if (evidence.ready) return { action: "complete", reason: "readiness-evidence-satisfied" };

  const responses = acquisitionResponses(attempts);
  if (!responses.length) return { action: "continue", reason: "need-first-retrieval", preferredResponseMode: "recognition" };
  const latest = responses.at(-1)!;
  const recent = responses.slice(-4);
  const recentIndependentFailures = recent.filter((x) => x.outcome === "incorrect" && x.independent && guidance(x) === "none" && isFirst(x)).length;
  const guided = recent.filter((x) => guidance(x) !== "none" || !x.independent).length;

  if (recentIndependentFailures >= 3) return { action: "stop-for-now", reason: "repeated-independent-failure" };
  if (recentIndependentFailures >= 2) return { action: "reteach", reason: "repeated-failure-needs-scaffold", preferredResponseMode: "recognition" };
  if (latest.outcome === "incorrect" || latest.outcome === "revealed") return { action: "corrective-next-example", reason: "repair-with-different-example", preferredResponseMode: "recognition" };
  if (guided > 0 && evidence.independentFirstAttemptSuccesses === 0) return { action: "continue", reason: "fade-guidance", preferredResponseMode: "constructed" };
  if (evidence.distinctSuccessfulExamples < 2) return { action: "continue", reason: "need-example-variety", preferredResponseMode: "constructed" };
  if (evidence.constructedSuccesses + evidence.discriminationSuccesses + evidence.applicationSuccesses === 0) {
    return { action: "continue", reason: "need-stronger-than-recognition", preferredResponseMode: "constructed" };
  }
  return { action: "continue", reason: "evidence-still-incomplete", preferredResponseMode: "constructed" };
}

export function selectAdaptiveExercise(
  skillId: string,
  attempts: readonly LearningAttempt[],
  startIndex = 0,
  poolSize = 12,
): AdaptiveExerciseSelection {
  const recentPromptIds = attempts
    .filter((x) => eventKind(x) === "response")
    .slice(-3)
    .map((x) => x.promptSignature);
  const seenSemantic = new Set(attempts.map((x) => x.exampleSignature).filter((x): x is string => Boolean(x)));
  const candidates: Array<AdaptiveExerciseSelection & { score: number }> = [];

  for (let offset = 0; offset < Math.max(1, poolSize); offset++) {
    const index = startIndex + offset;
    const exercise = exerciseForSkill(skillId, index);
    const semanticSignature = semanticExerciseSignature(exercise);
    let score = 0;
    if (!seenSemantic.has(semanticSignature)) score += 8;
    if (!recentPromptIds.includes(exercise.id)) score += 5;
    if (recentPromptIds.at(-1) !== exercise.id) score += 3;
    score -= offset * 0.05;
    candidates.push({
      exercise,
      index,
      semanticSignature,
      reason: !seenSemantic.has(semanticSignature) ? "unseen-example" : !recentPromptIds.includes(exercise.id) ? "avoid-recent-duplicate" : "best-available",
      score,
    });
  }

  const selected = [...candidates].sort((a, b) => b.score - a.score || a.index - b.index)[0];
  return {
    exercise: selected.exercise,
    index: selected.index,
    semanticSignature: selected.semanticSignature,
    reason: selected.reason,
  };
}

export function confusionPartnerFor(skillId: string, evidence: DerivedSkillEvidence): string | undefined {
  const partners = CONFUSION_PAIRS[skillId] ?? [];
  const explicitlyConfused = partners
    .map((id) => ({ id, count: evidence.confusions[id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .find((x) => x.count > 0);
  return explicitlyConfused?.id;
}

export function interleavingTargets(evidenceBySkill: ReadonlyMap<string, DerivedSkillEvidence>): string[] {
  const targets: string[] = [];
  for (const [skillId, evidence] of evidenceBySkill) {
    if (!evidence.ready || evidence.fragile) continue;
    const partner = confusionPartnerFor(skillId, evidence);
    if (!partner || !SKILL_BY_ID.has(partner)) continue;
    const partnerEvidence = evidenceBySkill.get(partner);
    if (!partnerEvidence?.ready || partnerEvidence.fragile) continue;
    if (!targets.includes(skillId)) targets.push(skillId);
    if (!targets.includes(partner)) targets.push(partner);
    if (targets.length >= 2) break;
  }
  return targets.slice(0, 2);
}

export function inferredConfusionPartner(skillId: string, submitted: unknown): string | undefined {
  const value = String(submitted ?? "").trim().replace(/♭/g, "b").replace(/♯/g, "#");
  if (skillId === "interval.M3" && /^m3$/i.test(value) && value !== "M3") return "interval.m3";
  if (skillId === "interval.m3" && value === "M3") return "interval.M3";
  if (skillId === "interval.P4" && /^P5$/i.test(value)) return "interval.P5";
  if (skillId === "interval.P5" && /^P4$/i.test(value)) return "interval.P4";
  return undefined;
}
