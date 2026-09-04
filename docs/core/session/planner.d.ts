import type { DerivedSkillEvidence } from "../learning/index.js";
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
    allowOptionalNew?: boolean;
    nowIso?: string;
    longBreakDays?: number;
    guidedPhaseAccess?: readonly number[];
    validatedEntryPhases?: readonly number[];
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
export declare function planSession(input: SessionPlannerInput): SessionPlan;
