import { SKILL_BY_ID } from "../curriculum/index.js";

export type PracticeRoundKind = "new" | "acquisition" | "review" | "repair" | "review-repair" | "interleave";
export interface PracticeRoundPlan { size: number; purpose: "acquisition" | "review" | "repair" | "interleave"; }

export const MINIMUM_PRACTICE_ROUND_SIZE = 30;
const SHORT_FOUNDATION_LESSON = "intervals.lesson-1-unison-octave";

/** A round is a UX container only. Finishing it never grants READY or RETAINED. */
export function practiceRoundPlan(skillId: string, kind: PracticeRoundKind, _followUp = false): PracticeRoundPlan {
  const minimum = MINIMUM_PRACTICE_ROUND_SIZE;
  if (kind === "review") return { size: minimum, purpose: "review" };
  if (kind === "repair" || kind === "review-repair") return { size: minimum, purpose: "repair" };
  if (kind === "interleave") return { size: minimum, purpose: "interleave" };

  // Explicit correction-pass exception: only the simple P1/P8 acquisition
  // lesson uses a 10-question learning round. Every other assessed lesson keeps
  // the existing 30+ floor, and review/repair rounds keep that floor too.
  if (skillId === SHORT_FOUNDATION_LESSON) {
    return { size: SKILL_BY_ID.get(skillId)?.acquisitionRoundSize ?? 10, purpose: "acquisition" };
  }
  return { size: Math.max(minimum, SKILL_BY_ID.get(skillId)?.acquisitionRoundSize ?? minimum), purpose: "acquisition" };
}

export function practiceRoundQuestionNumber(answered: number, size: number): number {
  return Math.min(Math.max(1, size), Math.max(0, answered) + 1);
}
