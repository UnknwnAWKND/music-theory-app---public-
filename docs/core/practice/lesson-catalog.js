import { phase1Lessons } from "./lessons.js";
import { PHASE2_MAJOR_SCALE_LESSONS } from "./phase2-major-scales.js";
import { PHASE3_MINOR_SCALE_LESSONS } from "./phase3-minor-scales.js";
import { PHASE4_DIATONIC_CHORD_LESSONS } from "./phase4-diatonic-chords.js";
const PHASE2_LESSONS = PHASE2_MAJOR_SCALE_LESSONS.map((lesson) => {
    if (lesson.skillId !== "major-scales.lesson-4-instant-recall")
        return lesson;
    return {
        ...lesson,
        teachingSteps: lesson.teachingSteps.map((step, index) => index === 0 ? {
            ...step,
            visual: { kind: "scale", data: { notes: ["A", "B", "C♯", "D", "E", "F♯", "G♯"] } },
        } : step),
    };
});
const LESSONS = new Map([
    ...phase1Lessons().map((lesson) => [lesson.skillId, lesson]),
    ...PHASE2_LESSONS.map((lesson) => [lesson.skillId, lesson]),
    ...PHASE3_MINOR_SCALE_LESSONS.map((lesson) => [lesson.skillId, lesson]),
    ...PHASE4_DIATONIC_CHORD_LESSONS.map((lesson) => [lesson.skillId, lesson]),
]);
export function registerLesson(content) { LESSONS.set(content.skillId, content); }
export function lessonForSkill(skillId) { return LESSONS.get(skillId); }
export function activeLessonSkillIds() { return [...LESSONS.keys()]; }
export { phase1Lessons };
export function phase2Lessons() { return PHASE2_LESSONS; }
export function phase3Lessons() { return PHASE3_MINOR_SCALE_LESSONS; }
export function phase4Lessons() { return PHASE4_DIATONIC_CHORD_LESSONS; }
