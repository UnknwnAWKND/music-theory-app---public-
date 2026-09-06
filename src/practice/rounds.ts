import { SKILL_BY_ID } from "../curriculum/index.js";

export type PracticeRoundKind = "new" | "acquisition" | "review" | "repair" | "review-repair" | "interleave";
export interface PracticeRoundPlan { size: number; purpose: "acquisition" | "review" | "repair" | "interleave"; }

/** Default learner-visible practice rounds remain substantial. */
export const MINIMUM_PRACTICE_ROUND_SIZE = 30;
export const LESSON1_INITIAL_ROUND_SIZE = 10;
const LESSON1_ID = "intervals.lesson-1-unison-octave";

/** A round is a UX container only. Finishing it never grants READY or RETAINED. */
export function practiceRoundPlan(skillId: string, kind: PracticeRoundKind, followUp = false): PracticeRoundPlan {
  const minimum = MINIMUM_PRACTICE_ROUND_SIZE;
  if (!followUp && skillId === LESSON1_ID && (kind === "new" || kind === "acquisition")) {
    return { size: LESSON1_INITIAL_ROUND_SIZE, purpose: "acquisition" };
  }
  if (kind === "review") return { size: minimum, purpose: "review" };
  if (kind === "repair" || kind === "review-repair") return { size: minimum, purpose: "repair" };
  if (kind === "interleave") return { size: minimum, purpose: "interleave" };
  return { size: Math.max(minimum, SKILL_BY_ID.get(skillId)?.acquisitionRoundSize ?? minimum), purpose: "acquisition" };
}

export function practiceRoundQuestionNumber(answered: number, size: number): number {
  return Math.min(Math.max(1, size), Math.max(0, answered) + 1);
}
