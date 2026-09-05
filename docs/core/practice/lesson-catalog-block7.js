import { activeLessonSkillIds as priorActiveLessonSkillIds, lessonForSkill as priorLessonForSkill, phase1Lessons, phase2Lessons, phase3Lessons, phase4Lessons, phase5Lessons, registerLesson as priorRegisterLesson, } from "./lesson-catalog-block6.js";
import { PHASE6_CIRCLE_LESSONS } from "./phase6-circle-of-fifths.js";
const PHASE6_BY_ID = new Map(PHASE6_CIRCLE_LESSONS.map((lesson) => [lesson.skillId, lesson]));
export function registerLesson(content) {
    if (content.skillId.startsWith("circle-of-fifths."))
        PHASE6_BY_ID.set(content.skillId, content);
    else
        priorRegisterLesson(content);
}
export function lessonForSkill(skillId) {
    return PHASE6_BY_ID.get(skillId) ?? priorLessonForSkill(skillId);
}
export function activeLessonSkillIds() {
    return [...priorActiveLessonSkillIds(), ...PHASE6_CIRCLE_LESSONS.map((lesson) => lesson.skillId)];
}
export { phase1Lessons, phase2Lessons, phase3Lessons, phase4Lessons, phase5Lessons };
export function phase6Lessons() { return PHASE6_CIRCLE_LESSONS; }
