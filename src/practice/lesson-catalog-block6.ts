import {
  activeLessonSkillIds as priorActiveLessonSkillIds,
  lessonForSkill as priorLessonForSkill,
  phase1Lessons,
  phase2Lessons,
  phase3Lessons,
  phase4Lessons,
  registerLesson as priorRegisterLesson,
} from "./lesson-catalog.js";
import { PHASE5_RELATIVE_LESSONS } from "./phase5-relatives.js";
import type { LessonContent } from "./types.js";

const PHASE5_BY_ID = new Map(PHASE5_RELATIVE_LESSONS.map((lesson) => [lesson.skillId, lesson]));

export function registerLesson(content: LessonContent): void {
  if (content.skillId.startsWith("relatives.")) PHASE5_BY_ID.set(content.skillId, content);
  else priorRegisterLesson(content);
}

export function lessonForSkill(skillId: string): LessonContent | undefined {
  return PHASE5_BY_ID.get(skillId) ?? priorLessonForSkill(skillId);
}

export function activeLessonSkillIds(): string[] {
  return [...priorActiveLessonSkillIds(), ...PHASE5_RELATIVE_LESSONS.map((lesson) => lesson.skillId)];
}

export { phase1Lessons, phase2Lessons, phase3Lessons, phase4Lessons };
export function phase5Lessons(): readonly LessonContent[] { return PHASE5_RELATIVE_LESSONS; }
