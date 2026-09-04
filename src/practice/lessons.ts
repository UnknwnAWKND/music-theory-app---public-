import type { LessonContent } from "./types.js";

/** Empty by design in Block 1. */
const LESSONS = new Map<string, LessonContent>();

export function registerLesson(content: LessonContent): void {
  LESSONS.set(content.skillId, content);
}

export function lessonForSkill(skillId: string): LessonContent | undefined {
  return LESSONS.get(skillId);
}

export function activeLessonSkillIds(): string[] {
  return [...LESSONS.keys()];
}
