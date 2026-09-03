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
    /** Optional/enrichment skills are only auto-introduced when explicitly enabled. */
    allowOptionalNew?: boolean;
}
export interface SessionPlan {
    repairSkillIds: string[];
    reviewSkillIds: string[];
    acquiringSkillId?: string;
    newSkillId?: string;
    reasonNoNewSkill?: string;
}
export declare function planSession(input: SessionPlannerInput): SessionPlan;
