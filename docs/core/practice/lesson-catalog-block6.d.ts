import { phase1Lessons, phase2Lessons, phase3Lessons, phase4Lessons } from "./lesson-catalog.js";
import type { LessonContent } from "./types.js";
export declare function registerLesson(content: LessonContent): void;
export declare function lessonForSkill(skillId: string): LessonContent | undefined;
export declare function activeLessonSkillIds(): string[];
export { phase1Lessons, phase2Lessons, phase3Lessons, phase4Lessons };
export declare function phase5Lessons(): readonly LessonContent[];
