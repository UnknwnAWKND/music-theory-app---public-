import type { SkillDefinition } from "./types.js";
/**
 * Block 1 deliberately ships with no curriculum skills. Future blocks will add
 * new lesson/reference definitions to this registry from scratch.
 */
export declare const CURRICULUM_VERSION: "rebuild-block1";
export declare const SKILLS: readonly SkillDefinition[];
export declare const SKILL_BY_ID: Map<string, SkillDefinition>;
