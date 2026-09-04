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
export declare function planSession(input: SessionPlannerInput): SessionPlan;
