import { SKILLS } from "../curriculum/index.js";
const ASSUMED_KNOWN_SKILLS = new Set(["pitch.note-names"]);
function isReadyForPrerequisites(evidence, skillId) {
    if (ASSUMED_KNOWN_SKILLS.has(skillId))
        return true;
    return Boolean(evidence?.ready && !evidence.fragile);
}
function nextUnlockable(evidenceBySkill, skills = SKILLS, allowOptional = false) {
    return skills.find((skill) => {
        if (ASSUMED_KNOWN_SKILLS.has(skill.id))
            return false;
        if (skill.optional && !allowOptional)
            return false;
        const current = evidenceBySkill.get(skill.id);
        if (current && current.state !== "new")
            return false;
        return skill.prerequisites.every((dep) => isReadyForPrerequisites(evidenceBySkill.get(dep), dep));
    });
}
export function planSession(input) {
    const normalBudget = input.normalReviewBudget ?? 6;
    const backlogBudget = input.backlogReviewBudget ?? 10;
    const repairSkillIds = [...input.evidenceBySkill.entries()]
        .filter(([skillId, evidence]) => !ASSUMED_KNOWN_SKILLS.has(skillId) && evidence.fragile)
        .map(([skillId]) => skillId);
    const sortedDue = [...input.dueReviews]
        .filter((review) => !ASSUMED_KNOWN_SKILLS.has(review.skillId))
        .sort((a, b) => {
        if (b.urgency !== a.urgency)
            return b.urgency - a.urgency;
        return Date.parse(a.dueAt) - Date.parse(b.dueAt);
    });
    const budget = sortedDue.length > normalBudget * 2 ? backlogBudget : normalBudget;
    const reviewSkillIds = sortedDue.slice(0, budget).map((x) => x.skillId);
    const acquiringSkillId = input.acquiringSkillIds?.find((id) => !ASSUMED_KNOWN_SKILLS.has(id) && input.evidenceBySkill.get(id)?.state === "acquiring");
    let newSkillId;
    let reasonNoNewSkill;
    if (repairSkillIds.length > 0) {
        reasonNoNewSkill = "repair-prerequisite";
    }
    else if (sortedDue.length > backlogBudget) {
        reasonNoNewSkill = "review-backlog";
    }
    else if (acquiringSkillId) {
        reasonNoNewSkill = "finish-current-acquisition";
    }
    else {
        newSkillId = nextUnlockable(input.evidenceBySkill, SKILLS, input.allowOptionalNew ?? false)?.id;
        if (!newSkillId)
            reasonNoNewSkill = "nothing-unlocked";
    }
    return { repairSkillIds, reviewSkillIds, acquiringSkillId, newSkillId, reasonNoNewSkill };
}
