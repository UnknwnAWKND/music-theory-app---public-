import { SKILLS as BASE_SKILLS } from "./skills.js";
const mixedAll = {
    id: "interval.number-mixed-all",
    phase: 1,
    title: "Mixed interval numbers from any root",
    prerequisites: ["interval.number-6"],
    evidence: ["construct", "identify", "diagnose"],
    tags: ["interval", "number"],
    optional: false,
    priority: "foundation",
    recurrenceWeight: 5,
    acquisitionRoundSize: 30,
    thread: "interval",
};
export const SKILLS = BASE_SKILLS.flatMap((skill) => {
    if (skill.id === "interval.generic-number") {
        // Keep the legacy ID so old evidence is preserved, but do not let old broad
        // interval-number history automatically prove the redesigned all-number
        // construction competency. The new required mixed-all skill supplies that evidence.
        return [
            mixedAll,
            {
                ...skill,
                title: "Identify interval numbers from note pairs",
                prerequisites: [mixedAll.id],
                evidence: ["identify"],
                optional: true,
                priority: "support",
                recurrenceWeight: 1,
                acquisitionRoundSize: 30,
            },
        ];
    }
    if (skill.id === "interval.quality-system") {
        return [{ ...skill, prerequisites: [mixedAll.id] }];
    }
    return [skill];
});
export const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]));
