import { CURRICULUM_VERSION as BLOCK8_VERSION, SKILLS as BLOCK8_SKILLS } from "./skills-block8.js";

/**
 * Focused correction pass: only Phase 1 Lesson 1 gets a shorter acquisition
 * round. Curriculum order, prerequisites, priorities, and all other lesson
 * round sizes remain unchanged.
 */
export const CURRICULUM_VERSION = BLOCK8_VERSION;

export const SKILLS = BLOCK8_SKILLS.map((skill) =>
  skill.id === "intervals.lesson-1-unison-octave"
    ? Object.freeze({ ...skill, acquisitionRoundSize: 10 })
    : skill,
);

export const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]));
