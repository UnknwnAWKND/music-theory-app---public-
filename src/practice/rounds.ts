import { SKILL_BY_ID } from "../curriculum/index.js";

export type PracticeRoundKind = "new" | "acquisition" | "review" | "repair" | "review-repair" | "interleave";

export interface PracticeRoundPlan {
  size: number;
  purpose: "acquisition" | "review" | "repair" | "interleave";
}

/**
 * A round is only a learner-facing UX container. Finishing it never grants READY or RETAINED.
 * The evidence engine still decides what the completed evidence means.
 */
export function practiceRoundPlan(skillId: string, kind: PracticeRoundKind, followUp = false): PracticeRoundPlan {
  const skill = SKILL_BY_ID.get(skillId);

  if (kind === "review") return { size: 5, purpose: "review" };
  if (kind === "repair" || kind === "review-repair") return { size: followUp ? 5 : 6, purpose: "repair" };
  if (kind === "interleave") return { size: 5, purpose: "interleave" };

  const initial = Math.max(5, Math.min(12, skill?.acquisitionRoundSize ?? 8));
  if (!followUp) return { size: initial, purpose: "acquisition" };
  return { size: Math.max(5, Math.min(6, initial)), purpose: "acquisition" };
}
