import type { SkillDefinition } from "./types.js";

/**
 * Block 1 deliberately ships with no curriculum skills. Future blocks will add
 * new lesson/reference definitions to this registry from scratch.
 */
export const CURRICULUM_VERSION = "rebuild-block1" as const;
export const SKILLS: readonly SkillDefinition[] = Object.freeze([]);
export const SKILL_BY_ID = new Map<string, SkillDefinition>();
