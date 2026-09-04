import { SKILLS, SKILL_BY_ID } from "../curriculum/index.js";
import { interleavingTargets } from "../practice/index.js";
const CURRENT_SKILL_IDS = new Set(SKILLS.map((skill) => skill.id));
function readyForPrerequisite(evidence) {
    return Boolean(evidence?.ready && !evidence.fragile);
}
function nextUnlockable(evidenceBySkill, skills = SKILLS, allowOptional = false, guidedPhaseAccess, validatedEntryPhases) {
    return skills.find((skill) => {
        if (skill.contentKind === "reference" || !skill.assessed)
            return false;
        if (skill.optional && !allowOptional)
            return false;
        if (guidedPhaseAccess && !guidedPhaseAccess.includes(skill.phase))
            return false;
        const current = evidenceBySkill.get(skill.id);
        if (current && current.state !== "new")
            return false;
        const placementValidated = validatedEntryPhases?.includes(skill.phase) ?? false;
        return skill.prerequisites.every((dependencyId) => {
            const dependency = SKILL_BY_ID.get(dependencyId);
            if (placementValidated && dependency && dependency.phase < skill.phase)
                return true;
            return readyForPrerequisite(evidenceBySkill.get(dependencyId));
        });
    });
}
function curriculumReviewWeight(skillId) {
    const skill = SKILL_BY_ID.get(skillId);
    if (!skill)
        return 1;
    const priority = (skill.reviewPriority * 0.45) + (skill.longTermRecurrence * 0.35) + (skill.foundationality * 0.20);
    return 1 + priority / 10;
}
function duePriority(review) {
    return review.urgency * curriculumReviewWeight(review.skillId);
}
export function planSession(input) {
    const normalBudget = input.normalReviewBudget ?? 6;
    const backlogBudget = input.backlogReviewBudget ?? 10;
    const repairSkillIds = [...input.evidenceBySkill.entries()]
        .filter(([skillId, evidence]) => CURRENT_SKILL_IDS.has(skillId) && evidence.fragile)
        .map(([skillId]) => skillId)
        .sort((a, b) => curriculumReviewWeight(b) - curriculumReviewWeight(a));
    const sortedDue = [...input.dueReviews]
        .filter((review) => CURRENT_SKILL_IDS.has(review.skillId))
        .sort((a, b) => duePriority(b) - duePriority(a) || Date.parse(a.dueAt) - Date.parse(b.dueAt));
    const budget = sortedDue.length > normalBudget * 2 ? backlogBudget : normalBudget;
    const reviewSkillIds = sortedDue.slice(0, budget).map((review) => review.skillId);
    const nowMs = Date.parse(input.nowIso ?? new Date().toISOString());
    const longBreakMs = (input.longBreakDays ?? 14) * 86_400_000;
    const recoveringFromLongBreak = sortedDue.some((review) => nowMs - Date.parse(review.dueAt) >= longBreakMs);
    const acquiringSkillId = input.acquiringSkillIds?.find((id) => CURRENT_SKILL_IDS.has(id) && input.evidenceBySkill.get(id)?.state === "acquiring");
    let newSkillId;
    let reasonNoNewSkill;
    if (repairSkillIds.length)
        reasonNoNewSkill = "repair-prerequisite";
    else if (recoveringFromLongBreak)
        reasonNoNewSkill = "long-break-recovery";
    else if (sortedDue.length > backlogBudget)
        reasonNoNewSkill = "review-backlog";
    else if (acquiringSkillId)
        reasonNoNewSkill = "finish-current-acquisition";
    else {
        const preferredPhase = input.preferredNewPhase ?? (input.validatedEntryPhases?.length ? Math.max(...input.validatedEntryPhases) : undefined);
        const preferredSkills = preferredPhase ? SKILLS.filter((skill) => skill.phase === preferredPhase) : SKILLS;
        newSkillId = nextUnlockable(input.evidenceBySkill, preferredSkills, input.allowOptionalNew ?? false, input.guidedPhaseAccess, input.validatedEntryPhases)?.id;
        if (!newSkillId && preferredPhase)
            newSkillId = nextUnlockable(input.evidenceBySkill, SKILLS, input.allowOptionalNew ?? false, input.guidedPhaseAccess, input.validatedEntryPhases)?.id;
        if (!newSkillId)
            reasonNoNewSkill = "nothing-unlocked";
    }
    const planned = new Set([...repairSkillIds, ...reviewSkillIds, acquiringSkillId, newSkillId].filter((id) => Boolean(id)));
    const interleaveSkillIds = repairSkillIds.length || recoveringFromLongBreak || sortedDue.length > backlogBudget
        ? []
        : interleavingTargets(input.evidenceBySkill).filter((id) => CURRENT_SKILL_IDS.has(id) && !planned.has(id)).slice(0, 2);
    return { repairSkillIds, reviewSkillIds, acquiringSkillId, newSkillId, interleaveSkillIds, reasonNoNewSkill };
}
