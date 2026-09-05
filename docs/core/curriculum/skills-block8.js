import { SKILLS as BLOCK7_SKILLS } from "./skills-block7.js";
export const CURRICULUM_VERSION = "rebuild-block8-final";
// Block 8 is a QA / presentation pass only. Curriculum content remains exactly the
// six-phase set authored in Blocks 2–7.
export const SKILLS = BLOCK7_SKILLS;
export const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]));
