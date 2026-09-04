import { SKILLS as BASE_SKILLS } from "./skills.js";
import type { SkillDefinition } from "./types.js";

const mixedAll: SkillDefinition = {
  id: "interval.number-mixed-all",
  phase: 1,
  title: "Mixed interval numbers from any root",
  prerequisites: ["interval.number-6"],
  evidence: ["construct", "identify", "diagnose"],
  tags: ["interval", "number"],
  optional: false,
  priority: "foundation",
  recurrenceWeight: 5,
  acquisitionRoundSize: 10,
  thread: "interval",
};

export const SKILLS: readonly SkillDefinition[] = BASE_SKILLS.flatMap((skill): SkillDefinition[] => {
  if (skill.id === "interval.generic-number") {
    // Preserve the old stable ID and its historical evidence, but do not let it
    // falsely prove the new all-number construction competency. It is now a
    // supplemental reverse-identification skill after the new mixed-all skill.
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
        acquisitionRoundSize: 5,
      },
    ];
  }
  if (skill.id === "interval.quality-system") {
    return [{ ...skill, prerequisites: [mixedAll.id] }];
  }
  return [skill];
});

export const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill] as const));
