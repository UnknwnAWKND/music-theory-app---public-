import { phase1Lessons, phase2Lessons, phase3Lessons, phase4Lessons, phase5Lessons } from "./lesson-catalog-block6.js";
import type { LessonContent } from "./types.js";
export declare function registerLesson(content: LessonContent): void;
export declare function lessonForSkill(skillId: string): LessonContent | undefined;
export declare function activeLessonSkillIds(): string[];
export { phase1Lessons, phase2Lessons, phase3Lessons, phase4Lessons, phase5Lessons };
export declare function phase6Lessons(): readonly LessonContent[];
