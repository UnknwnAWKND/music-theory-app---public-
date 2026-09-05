import { activeLessonSkillIds as priorActiveLessonSkillIds, lessonForSkill as priorLessonForSkill, phase1Lessons, phase2Lessons, phase3Lessons, phase4Lessons, registerLesson as priorRegisterLesson, } from "./lesson-catalog.js";
import { PHASE5_RELATIVE_LESSONS } from "./phase5-relatives.js";
const PHASE5_BY_ID = new Map(PHASE5_RELATIVE_LESSONS.map((lesson) => [lesson.skillId, lesson]));
export function registerLesson(content) {
    if (content.skillId.startsWith("relatives."))
        PHASE5_BY_ID.set(content.skillId, content);
    else
        priorRegisterLesson(content);
}
export function lessonForSkill(skillId) {
    return PHASE5_BY_ID.get(skillId) ?? priorLessonForSkill(skillId);
}
export function activeLessonSkillIds() {
    return [...priorActiveLessonSkillIds(), ...PHASE5_RELATIVE_LESSONS.map((lesson) => lesson.skillId)];
}
export { phase1Lessons, phase2Lessons, phase3Lessons, phase4Lessons };
export function phase5Lessons() { return PHASE5_RELATIVE_LESSONS; }
