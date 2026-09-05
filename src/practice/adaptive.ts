import { SKILL_BY_ID } from "../curriculum/index.js";
import type { Exercise } from "../exercises/index.js";
import type { DerivedSkillEvidence, LearningAttempt } from "../learning/index.js";

export type AdaptiveAction = "continue-independent" | "corrective-feedback" | "reteach" | "follow-up-round" | "stop-for-now";
export interface AdaptivePracticeDecision { action: AdaptiveAction; reason: string; }

export function evidenceQualityForAttempt(attempt: LearningAttempt): "strong" | "supported" | "weak" {
  if (attempt.eventKind && attempt.eventKind !== "response") return "weak";
  if (!attempt.directEvidence || !attempt.independent || attempt.solutionSeen) return "weak";
  if (attempt.guidance && attempt.guidance !== "none") return "supported";
  return attempt.firstSubmission === false ? "supported" : "strong";
}

export function semanticExerciseSignature(exercise: Exercise): string {
  return exercise.exampleSignature || exercise.promptSignature || exercise.id;
}

export function selectAdaptiveExercise(
  candidates: readonly Exercise[],
  recentSignatures: readonly string[] = [],
  index = 0,
): Exercise | undefined {
  if (!candidates.length) return undefined;
  const recent = new Set(recentSignatures);
  const preferred = candidates.filter((exercise) => !recent.has(semanticExerciseSignature(exercise)));
  const pool = preferred.length ? preferred : candidates;

  // Major-scale generators deliberately order roots to distribute work across
  // all 12 pitch classes. Do not apply a second index jump on top of the
  // generator cursor or a 12-root cycle can collapse into only six roots.
  const majorScaleWindow = candidates.some((exercise) => {
    const family = String(exercise.metadata?.family ?? "");
    return family.startsWith("major-scale") || family === "scale-degree";
  });
  if (majorScaleWindow) return pool[0];

  return pool[((index % pool.length) + pool.length) % pool.length];
}

export function decideAdaptivePractice(attempts: readonly LearningAttempt[], evidence?: DerivedSkillEvidence): AdaptivePracticeDecision {
  const responses = attempts.filter((attempt) => !attempt.eventKind || attempt.eventKind === "response");
  const recent = responses.slice(-3);
  const failures = recent.filter((attempt) => attempt.outcome === "incorrect").length;
  if (evidence?.ready && !evidence.fragile) return { action: "stop-for-now", reason: "ready-evidence" };
  if (failures >= 2) return { action: "reteach", reason: "repeated-independent-errors" };
  if (failures === 1) return { action: "corrective-feedback", reason: "recent-error" };
  if (responses.length > 0) return { action: "follow-up-round", reason: "more-evidence-needed" };
  return { action: "continue-independent", reason: "begin-retrieval" };
}

export function confusionPartnerFor(evidence: DerivedSkillEvidence | undefined): string | undefined {
  if (!evidence) return undefined;
  return Object.entries(evidence.confusions ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0];
}

export function inferredConfusionPartner(_attempt: LearningAttempt): string | undefined {
  return undefined;
}

/**
 * Curriculum recurrence is intentionally separate from scheduler due dates.
 * READY foundational skills still deserve mixed retrieval. RETAINED lowers
 * extra spiral pressure, but never makes a foundational skill weight zero.
 */
export function longTermPracticeWeight(skillId: string, evidence?: DerivedSkillEvidence): number {
  const skill = SKILL_BY_ID.get(skillId);
  if (!skill) return 0;
  const curriculum = (skill.longTermRecurrence * 0.45) + (skill.reviewPriority * 0.30) + (skill.foundationality * 0.25);
  if (curriculum <= 0) return 0;
  if (evidence?.fragile) return curriculum * 1.6;
  if (!evidence?.ready) return curriculum;
  if (evidence.retained) return Math.max(0.5, curriculum * 0.35);
  return curriculum * 1.15;
}

export function interleavingTargets(evidenceBySkill: ReadonlyMap<string, DerivedSkillEvidence>): string[] {
  const targets = new Set<string>();
  for (const [skillId, evidence] of evidenceBySkill) {
    if (!evidence.ready || evidence.fragile) continue;
    const skill = SKILL_BY_ID.get(skillId);
    if (!skill) continue;

    const partner = confusionPartnerFor(evidence);
    if (partner && evidenceBySkill.get(partner)?.ready) {
      targets.add(skillId);
      targets.add(partner);
    }

    // High-recurrence foundational skills remain eligible for mixed retrieval after READY.
    if (skill.longTermRecurrence >= 4 && skill.foundationality >= 4) targets.add(skillId);
  }
  return [...targets].sort((a, b) => longTermPracticeWeight(b, evidenceBySkill.get(b)) - longTermPracticeWeight(a, evidenceBySkill.get(a)));
}
