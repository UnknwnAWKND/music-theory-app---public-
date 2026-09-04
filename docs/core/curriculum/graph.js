import { CURRICULUM_PHASES, PHASE_BY_NUMBER } from "./phases.js";
import { SKILLS, SKILL_BY_ID } from "./skills.js";
export function skillsForPhase(phase) {
    return SKILLS.filter((skill) => skill.phase === phase);
}
export function validateCurriculumGraph(skills = SKILLS) {
    const errors = [];
    const byId = new Map();
    for (const skill of skills) {
        if (byId.has(skill.id))
            errors.push(`Duplicate skill id: ${skill.id}`);
        byId.set(skill.id, skill);
        if (!PHASE_BY_NUMBER.has(skill.phase))
            errors.push(`Skill ${skill.id} uses an unknown phase`);
        if (skill.contentKind === "reference" && (skill.assessed || skill.blocksPhaseCompletion)) {
            errors.push(`Reference content ${skill.id} cannot be assessed or block phase completion`);
        }
    }
    for (const skill of skills) {
        for (const dependency of skill.prerequisites) {
            if (!byId.has(dependency))
                errors.push(`Skill ${skill.id} depends on missing skill ${dependency}`);
        }
    }
    const visiting = new Set();
    const visited = new Set();
    const visit = (id) => {
        if (visiting.has(id)) {
            errors.push(`Curriculum cycle detected at ${id}`);
            return;
        }
        if (visited.has(id))
            return;
        visiting.add(id);
        for (const dependency of byId.get(id)?.prerequisites ?? [])
            visit(dependency);
        visiting.delete(id);
        visited.add(id);
    };
    for (const skill of skills)
        visit(skill.id);
    return { valid: errors.length === 0, errors };
}
export function topologicalSkillIds(skills = SKILLS) {
    const byId = new Map(skills.map((skill) => [skill.id, skill]));
    const visited = new Set();
    const order = [];
    const visit = (id) => {
        if (visited.has(id))
            return;
        visited.add(id);
        for (const dependency of byId.get(id)?.prerequisites ?? [])
            visit(dependency);
        if (byId.has(id))
            order.push(id);
    };
    for (const skill of skills)
        visit(skill.id);
    return order;
}
export function downstreamSkillIds(skillId) {
    if (!SKILL_BY_ID.has(skillId))
        return [];
    const found = new Set();
    const queue = [skillId];
    while (queue.length) {
        const current = queue.shift();
        for (const skill of SKILLS) {
            if (skill.prerequisites.includes(current) && !found.has(skill.id)) {
                found.add(skill.id);
                queue.push(skill.id);
            }
        }
    }
    return [...found];
}
export function phaseNumbers() {
    return CURRICULUM_PHASES.map((phase) => phase.phase);
}
