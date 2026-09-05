import { phase1Lessons as priorPhase1Lessons, phase2Lessons as priorPhase2Lessons, phase3Lessons as priorPhase3Lessons, phase4Lessons as priorPhase4Lessons, phase5Lessons as priorPhase5Lessons, phase6Lessons as priorPhase6Lessons, } from "./lesson-catalog-block7.js";
function cloneStep(step) {
    return {
        ...step,
        visual: step.visual ? { ...step.visual, data: { ...(step.visual.data ?? {}) } } : undefined,
    };
}
function cloneLesson(lesson) {
    return { ...lesson, teachingSteps: lesson.teachingSteps.map(cloneStep) };
}
function patchStep(lessons, skillId, stepId, patch) {
    return lessons.map((source) => {
        const lesson = cloneLesson(source);
        if (lesson.skillId !== skillId)
            return lesson;
        return {
            ...lesson,
            teachingSteps: lesson.teachingSteps.map((step) => step.id === stepId ? { ...step, ...patch } : step),
        };
    });
}
let phase1 = priorPhase1Lessons().map(cloneLesson);
phase1 = patchStep(phase1, "intervals.lesson-4-thirds", "minor3", {
    visual: { kind: "piano", data: { highlighted: ["F", "Ab"] } },
});
const phase2 = priorPhase2Lessons().map(cloneLesson);
let phase3 = priorPhase3Lessons().map(cloneLesson);
phase3 = patchStep(phase3, "minor-scales.lesson-1-natural-formula", "natural-minor-formula", {
    visual: { kind: "piano", data: { highlighted: ["C", "D", "Eb", "F", "G", "Ab", "Bb"] } },
});
let phase4 = priorPhase4Lessons().map(cloneLesson);
phase4 = patchStep(phase4, "diatonic-chords.lesson-6-seventh-chords", "major", {
    workedExample: "C major: Imaj7 C–E–G–B; ii7 D–F–A–C; V7 G–B–D–F; viiø7 B–D–F–A.",
});
phase4 = patchStep(phase4, "diatonic-chords.lesson-6-seventh-chords", "natural", {
    workedExample: "A natural minor: i7 A–C–E–G; iiø7 B–D–F–A; IIImaj7 C–E–G–B; VII7 G–B–D–F.",
});
phase4 = patchStep(phase4, "diatonic-chords.lesson-6-seventh-chords", "melodic", {
    workedExample: "A melodic minor ascending: i(maj7) A–C–E–G♯; IV7 D–F♯–A–C; viø7 F♯–A–C–E.",
});
phase4 = patchStep(phase4, "diatonic-chords.lesson-9-progressions", "major", {
    workedExample: "In C major: I–V–vi–IV = C–G–Am–F; ii–V–I = Dm–G–C. Move the same numerals to another major key to transpose the relationship.",
});
const phase5 = priorPhase5Lessons().map(cloneLesson);
let phase6 = priorPhase6Lessons().map(cloneLesson);
phase6 = patchStep(phase6, "circle-of-fifths.lesson-4-far-side-transposition", "far-side-rule", {
    workedExample: "From C, E major is 4 circle steps away; B major and C♯/D♭ major are 5; F♯/G♭ major is 6.",
});
const ALL_LESSONS = [...phase1, ...phase2, ...phase3, ...phase4, ...phase5, ...phase6];
const BY_ID = new Map(ALL_LESSONS.map((lesson) => [lesson.skillId, lesson]));
export function registerLesson(content) {
    BY_ID.set(content.skillId, content);
}
export function lessonForSkill(skillId) {
    return BY_ID.get(skillId);
}
export function activeLessonSkillIds() {
    return ALL_LESSONS.map((lesson) => lesson.skillId);
}
export function phase1Lessons() { return phase1; }
export function phase2Lessons() { return phase2; }
export function phase3Lessons() { return phase3; }
export function phase4Lessons() { return phase4; }
export function phase5Lessons() { return phase5; }
export function phase6Lessons() { return phase6; }
