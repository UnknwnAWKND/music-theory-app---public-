import { phase2Lessons, phase3Lessons, phase4Lessons, phase5Lessons, phase6Lessons } from "./lesson-catalog-block9.js";
import type { LessonContent } from "./types.js";
export declare function registerLesson(content: LessonContent): void;
export declare function lessonForSkill(skillId: string): LessonContent | undefined;
export declare function activeLessonSkillIds(): string[];
export declare function phase1Lessons(): readonly LessonContent[];
export { phase2Lessons, phase3Lessons, phase4Lessons, phase5Lessons, phase6Lessons };
