import { SKILLS, SKILL_BY_ID } from "../curriculum/index.js";
const PHASE1_CHECKPOINT = Object.freeze({
    phase: 1,
    minItems: 14,
    maxItems: 24,
    competencies: Object.freeze([
        {
            id: "perfect-construction",
            label: "Construct perfect unisons, octaves, 5ths, and 4ths",
            skillIds: ["intervals.lesson-1-unison-octave", "intervals.lesson-2-perfect-fifth", "intervals.lesson-3-perfect-fourth"],
            critical: true,
        },
        {
            id: "major-minor-construction",
            label: "Construct major and minor 2nds, 3rds, 6ths, and 7ths",
            skillIds: ["intervals.lesson-4-thirds", "intervals.lesson-5-sixths", "intervals.lesson-6-seconds", "intervals.lesson-7-sevenths"],
            critical: true,
        },
        {
            id: "interval-identification",
            label: "Identify exact interval number and quality from two notes",
            skillIds: SKILLS.filter((skill) => skill.phase === 1).map((skill) => skill.id),
            critical: true,
        },
        {
            id: "interval-inversion",
            label: "Invert interval numbers and qualities accurately",
            skillIds: ["intervals.lesson-3-perfect-fourth", "intervals.lesson-5-sixths", "intervals.lesson-7-sevenths", "intervals.lesson-9-inversion-capstone"],
            critical: true,
        },
        {
            id: "quality-discrimination",
            label: "Discriminate perfect, major, minor, augmented, and diminished qualities",
            skillIds: ["intervals.lesson-4-thirds", "intervals.lesson-5-sixths", "intervals.lesson-6-seconds", "intervals.lesson-7-sevenths", "intervals.lesson-8-tritone"],
            critical: true,
        },
        {
            id: "tritone-spelling",
            label: "Distinguish and construct A4 versus d5 by spelling",
            skillIds: ["intervals.lesson-8-tritone", "intervals.lesson-10-cumulative"],
            critical: true,
        },
        {
            id: "varied-root-spelling",
            label: "Construct intervals above natural, sharp, and flat roots",
            skillIds: ["intervals.lesson-8-tritone", "intervals.lesson-10-cumulative"],
            critical: true,
        },
    ]),
});
export function checkpointDefinition(phase) {
    return phase === 1 ? PHASE1_CHECKPOINT : undefined;
}
export function allCheckpointDefinitions() {
    return [PHASE1_CHECKPOINT];
}
function isStrong(result) {
    return result.correct && result.firstSubmission && result.independent && !result.guidanceUsed && !result.solutionSeen
        && ["constructed", "discrimination", "application"].includes(result.responseMode);
}
function isModerate(result) {
    return result.correct && result.firstSubmission && result.independent && !result.guidanceUsed && !result.solutionSeen
        && result.responseMode === "recognition";
}
export function evaluateCheckpoint(definition, results) {
    const competencies = definition.competencies.map((competency) => {
        const rows = results.filter((result) => result.competencyId === competency.id);
        const strong = rows.filter(isStrong);
        const moderate = rows.filter(isModerate);
        const failures = rows.filter((result) => result.firstSubmission && result.independent && !result.correct).length;
        const distinctSkills = new Set([...strong, ...moderate].map((result) => result.skillId)).size;
        const distinctExamples = new Set([...strong, ...moderate].map((result) => result.exampleSignature)).size;
        const demonstrated = failures === 0 && (strong.length >= 1 || (moderate.length >= 2 && distinctExamples >= 2));
        return { competencyId: competency.id, label: competency.label, demonstrated, strongEvidence: strong.length, moderateEvidence: moderate.length, failures, distinctSkills, distinctExamples };
    });
    const hasContent = competencies.length > 0;
    const passed = hasContent && competencies.every((competency) => competency.demonstrated) && results.length >= definition.minItems;
    const complete = passed || (hasContent && results.length >= definition.maxItems);
    return {
        passed,
        complete,
        strong: competencies.filter((competency) => competency.demonstrated).map((competency) => competency.label),
        review: competencies.filter((competency) => !competency.demonstrated).map((competency) => competency.label),
        competencies,
    };
}
export function nextCheckpointCompetency(definition, results) {
    if (!definition.competencies.length)
        return undefined;
    const evaluation = evaluateCheckpoint(definition, results);
    if (evaluation.complete)
        return undefined;
    const unresolved = definition.competencies.filter((competency) => !evaluation.competencies.find((row) => row.competencyId === competency.id)?.demonstrated);
    const candidates = unresolved.length ? unresolved : definition.competencies;
    const counts = new Map();
    for (const result of results)
        counts.set(result.competencyId, (counts.get(result.competencyId) ?? 0) + 1);
    return [...candidates].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
}
/** Placement prerequisites remain graph-derived; no Phase 2+ placement content is authored in Block 2. */
export function placementPrerequisitePhases(targetPhase) {
    const required = new Set();
    const seen = new Set();
    const visit = (skillId) => {
        if (seen.has(skillId))
            return;
        seen.add(skillId);
        const skill = SKILL_BY_ID.get(skillId);
        if (!skill)
            return;
        for (const dependencyId of skill.prerequisites) {
            const dependency = SKILL_BY_ID.get(dependencyId);
            if (!dependency)
                continue;
            if (dependency.phase < targetPhase)
                required.add(dependency.phase);
            visit(dependencyId);
        }
    };
    SKILLS.filter((skill) => skill.phase === targetPhase && !skill.optional).forEach((skill) => visit(skill.id));
    return [...required].sort((a, b) => a - b);
}
export function placementDefinition(targetPhase) {
    return { phase: targetPhase, competencies: [], minItems: 1, maxItems: 1 };
}
export function recommendStartingPhase(targetPhase, evaluation) {
    return evaluation.recommendedPhase ?? targetPhase;
}
export function phaseCoreReady(phase, readySkillIds) {
    const required = SKILLS.filter((skill) => skill.phase === phase && !skill.optional && skill.assessed && skill.blocksPhaseCompletion);
    return required.length > 0 && required.every((skill) => readySkillIds.has(skill.id));
}
