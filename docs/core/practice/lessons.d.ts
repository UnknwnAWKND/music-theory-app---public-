import type { LessonContent } from "./types.js";
export declare function registerLesson(content: LessonContent): void;
export declare function lessonForSkill(skillId: string): LessonContent | undefined;
export declare function activeLessonSkillIds(): string[];
export declare function phase1Lessons(): readonly LessonContent[];
