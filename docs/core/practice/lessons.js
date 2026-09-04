/** Empty by design in Block 1. */
const LESSONS = new Map();
export function registerLesson(content) {
    LESSONS.set(content.skillId, content);
}
export function lessonForSkill(skillId) {
    return LESSONS.get(skillId);
}
export function activeLessonSkillIds() {
    return [...LESSONS.keys()];
}
