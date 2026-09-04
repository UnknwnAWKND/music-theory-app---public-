import { SKILL_BY_ID } from "../curriculum/index.js";

export type PracticeRoundKind = "new" | "acquisition" | "review" | "repair" | "review-repair" | "interleave";

export interface PracticeRoundPlan {
  size: number;
  purpose: "acquisition" | "review" | "repair" | "interleave";
}

export const MINIMUM_PRACTICE_ROUND_SIZE = 30;

/**
 * A round is only a learner-facing UX container. Finishing it never grants READY or RETAINED.
 * The evidence engine still decides what the completed evidence means.
 *
 * Every learner-visible practice round contains at least 30 questions. Foundational skills can
 * request larger rounds through acquisitionRoundSize, while repeated rounds and spaced returns
 * allow important relationships to accumulate hundreds of retrievals over time.
 */
export function practiceRoundPlan(skillId: string, kind: PracticeRoundKind, followUp = false): PracticeRoundPlan {
  const skill = SKILL_BY_ID.get(skillId);
  const minimum = MINIMUM_PRACTICE_ROUND_SIZE;

  if (kind === "review") return { size: minimum, purpose: "review" };
  if (kind === "repair" || kind === "review-repair") return { size: minimum, purpose: "repair" };
  if (kind === "interleave") return { size: minimum, purpose: "interleave" };

  const requested = skill?.acquisitionRoundSize ?? minimum;
  const size = Math.max(minimum, requested);
  return { size, purpose: "acquisition" };
}
