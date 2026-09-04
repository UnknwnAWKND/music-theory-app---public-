import { SKILLS, type SkillDefinition } from "../curriculum/index.js";
import type { DerivedSkillEvidence } from "../learning/index.js";
import { interleavingTargets } from "../practice/adaptive.js";

const CURRENT_SKILL_IDS = new Set(SKILLS.map((skill) => skill.id));

export interface DueReview {
  skillId: string;
  dueAt: string;
  urgency: number;
}

export interface SessionPlannerInput {
  evidenceBySkill: ReadonlyMap<string, DerivedSkillEvidence>;
  dueReviews: readonly DueReview[];
  acquiringSkillIds?: readonly string[];
  normalReviewBudget?: number;
  backlogReviewBudget?: number;
  /** Optional/enrichment skills are only auto-introduced when explicitly enabled. */
  allowOptionalNew?: boolean;
  /** Used to detect a genuinely overdue recovery period without resetting progress. */
  nowIso?: string;
  longBreakDays?: number;
  /** Guided-mode phase gates. Omit to allow normal graph-only planning. */
  guidedPhaseAccess?: readonly number[];
  /** Placement-validated phases may bypass older-phase prerequisite edges without fabricating READY. */
  validatedEntryPhases?: readonly number[];
  /** When placement has validated a later phase, prefer beginning there instead of earlier untouched material. */
  preferredNewPhase?: number;
}

export interface SessionPlan {
  repairSkillIds: string[];
  reviewSkillIds: string[];
  acquiringSkillId?: string;
  newSkillId?: string;
  interleaveSkillIds: string[];
  reasonNoNewSkill?: string;
}

function isReadyForPrerequisites(evidence: DerivedSkillEvidence | undefined): boolean {
  return Boolean(evidence?.ready && !evidence.fragile);
}

function nextUnlockable(
  evidenceBySkill: ReadonlyMap<string, DerivedSkillEvidence>,
  skills: readonly SkillDefinition[] = SKILLS,
  allowOptional = false,
  guidedPhaseAccess?: readonly number[],
  validatedEntryPhases?: readonly number[],
): SkillDefinition | undefined {
  return skills.find((skill) => {
    if (skill.optional && !allowOptional) return false;
    if (guidedPhaseAccess && !guidedPhaseAccess.includes(skill.phase)) return false;
    const current = evidenceBySkill.get(skill.id);
    if (current && current.state !== "new") return false;
    const placementValidated = validatedEntryPhases?.includes(skill.phase) ?? false;
    return skill.prerequisites.every((dep) => {
      const dependency = SKILLS.find((candidate) => candidate.id === dep);
      if (placementValidated && dependency && dependency.phase < skill.phase) return true;
      return isReadyForPrerequisites(evidenceBySkill.get(dep));
    });
  });
}

export function planSession(input: SessionPlannerInput): SessionPlan {
  const normalBudget = input.normalReviewBudget ?? 6;
  const backlogBudget = input.backlogReviewBudget ?? 10;
  const repairSkillIds = [...input.evidenceBySkill.entries()]
    .filter(([skillId, evidence]) => CURRENT_SKILL_IDS.has(skillId) && evidence.fragile)
    .map(([skillId]) => skillId);

  const sortedDue = [...input.dueReviews]
    .filter((review) => CURRENT_SKILL_IDS.has(review.skillId))
    .sort((a, b) => {
    if (b.urgency !== a.urgency) return b.urgency - a.urgency;
    return Date.parse(a.dueAt) - Date.parse(b.dueAt);
    });
  const budget = sortedDue.length > normalBudget * 2 ? backlogBudget : normalBudget;
  const reviewSkillIds = sortedDue.slice(0, budget).map((x) => x.skillId);
  const nowMs = Date.parse(input.nowIso ?? new Date().toISOString());
  const longBreakMs = (input.longBreakDays ?? 14) * 86_400_000;
  const recoveringFromLongBreak = sortedDue.some((review) => nowMs - Date.parse(review.dueAt) >= longBreakMs);

  const acquiringSkillId = input.acquiringSkillIds?.find((id) => CURRENT_SKILL_IDS.has(id) && input.evidenceBySkill.get(id)?.state === "acquiring");

  let newSkillId: string | undefined;
  let reasonNoNewSkill: string | undefined;
  if (repairSkillIds.length > 0) {
    reasonNoNewSkill = "repair-prerequisite";
  } else if (recoveringFromLongBreak) {
    reasonNoNewSkill = "long-break-recovery";
  } else if (sortedDue.length > backlogBudget) {
    reasonNoNewSkill = "review-backlog";
  } else if (acquiringSkillId) {
    reasonNoNewSkill = "finish-current-acquisition";
  } else {
    const inferredPreferredPhase = input.preferredNewPhase ?? (input.validatedEntryPhases?.length ? Math.max(...input.validatedEntryPhases) : undefined);
    const preferredSkills = inferredPreferredPhase
      ? SKILLS.filter((skill) => skill.phase === inferredPreferredPhase)
      : SKILLS;
    newSkillId = nextUnlockable(input.evidenceBySkill, preferredSkills, input.allowOptionalNew ?? false, input.guidedPhaseAccess, input.validatedEntryPhases)?.id;
    if (!newSkillId && inferredPreferredPhase) {
      newSkillId = nextUnlockable(input.evidenceBySkill, SKILLS, input.allowOptionalNew ?? false, input.guidedPhaseAccess, input.validatedEntryPhases)?.id;
    }
    if (!newSkillId) reasonNoNewSkill = "nothing-unlocked";
  }

  const alreadyPlanned = new Set([
    ...repairSkillIds,
    ...reviewSkillIds,
    acquiringSkillId,
    newSkillId,
  ].filter((x): x is string => Boolean(x)));
  const interleaveSkillIds = repairSkillIds.length || recoveringFromLongBreak || sortedDue.length > backlogBudget
    ? []
    : interleavingTargets(input.evidenceBySkill).filter((id) => !alreadyPlanned.has(id)).slice(0, 2);

  return { repairSkillIds, reviewSkillIds, acquiringSkillId, newSkillId, interleaveSkillIds, reasonNoNewSkill };
}
