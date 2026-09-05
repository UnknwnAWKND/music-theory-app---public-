import { phase1Lessons } from "./lessons.js";
import { PHASE2_MAJOR_SCALE_LESSONS } from "./phase2-major-scales.js";
import type { LessonContent } from "./types.js";

const PHASE2_LESSONS: readonly LessonContent[] = PHASE2_MAJOR_SCALE_LESSONS.map((lesson) => {
  if (lesson.skillId !== "major-scales.lesson-4-instant-recall") return lesson;
  return {
    ...lesson,
    teachingSteps: lesson.teachingSteps.map((step, index) => index === 0 ? {
      ...step,
      visual: { kind: "scale", data: { notes: ["A", "B", "C♯", "D", "E", "F♯", "G♯"] } },
    } : step),
  };
});

const LESSONS = new Map<string, LessonContent>([
  ...phase1Lessons().map((lesson) => [lesson.skillId, lesson] as const),
  ...PHASE2_LESSONS.map((lesson) => [lesson.skillId, lesson] as const),
]);

export function registerLesson(content: LessonContent): void {
  LESSONS.set(content.skillId, content);
}

export function lessonForSkill(skillId: string): LessonContent | undefined {
  return LESSONS.get(skillId);
}

export function activeLessonSkillIds(): string[] {
  return [...LESSONS.keys()];
}

export { phase1Lessons };

export function phase2Lessons(): readonly LessonContent[] {
  return PHASE2_LESSONS;
}
