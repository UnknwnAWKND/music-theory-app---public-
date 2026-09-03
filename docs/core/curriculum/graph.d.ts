import type { GraphValidationResult, SkillDefinition } from "./types.js";
export declare function validateSkillGraph(skills?: readonly SkillDefinition[]): GraphValidationResult;
export declare function topologicalSkillOrder(skills?: readonly SkillDefinition[]): SkillDefinition[];
export declare function prerequisitesMet(skill: SkillDefinition, readySkillIds: ReadonlySet<string>): boolean;
export declare function unlockableSkills(readySkillIds: ReadonlySet<string>, knownSkillIds?: ReadonlySet<string>, skills?: readonly SkillDefinition[]): SkillDefinition[];
export declare function descendantsOf(skillId: string, skills?: readonly SkillDefinition[]): Set<string>;
