import { phase1Lessons } from "./lessons.js";
import type { LessonContent } from "./types.js";
export declare function registerLesson(content: LessonContent): void;
export declare function lessonForSkill(skillId: string): LessonContent | undefined;
export declare function activeLessonSkillIds(): string[];
export { phase1Lessons };
export declare function phase2Lessons(): readonly LessonContent[];
