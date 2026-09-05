import { phase1Lessons as priorPhase1Lessons, phase2Lessons as priorPhase2Lessons, phase3Lessons as priorPhase3Lessons, phase4Lessons as priorPhase4Lessons, phase5Lessons as priorPhase5Lessons, phase6Lessons as priorPhase6Lessons, } from "./lesson-catalog-block8.js";
function cloneStep(step) {
    return {
        ...step,
        visual: step.visual ? { ...step.visual, data: { ...(step.visual.data ?? {}) } } : undefined,
    };
}
function cloneLesson(lesson) {
    return { ...lesson, teachingSteps: lesson.teachingSteps.map(cloneStep) };
}
function patchSteps(lessons, patches) {
    const byKey = new Map(patches.map((item) => [`${item.skillId}::${item.stepId}`, item.patch]));
    return lessons.map((source) => {
        const lesson = cloneLesson(source);
        return {
            ...lesson,
            teachingSteps: lesson.teachingSteps.map((step) => ({
                ...step,
                ...(byKey.get(`${lesson.skillId}::${step.id}`) ?? {}),
            })),
        };
    });
}
/*
 * Dependency-aware teaching correction.
 *
 * Phase 1 deliberately reveals interval naming in stages:
 *   L1: interval number from letter names + the names P1/P8
 *   L2: build/recognize P5 without making semitone arithmetic the reason for “5th”
 *   L3: P4 + inversion
 *   L4: Major/Minor quality + half-step comparison becomes explicit
 *   L8: Augmented/Diminished are formally introduced
 *
 * Later phases already consume concepts introduced by earlier phases/lessons;
 * their content is cloned unchanged here after the dependency audit.
 */
const phase1 = patchSteps(priorPhase1Lessons(), [
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "interval-means-distance",
        patch: {
            body: "An interval is the distance between two notes. The interval number comes from counting letter names, including both the starting note and the ending note. For now, focus on that number and the interval names introduced in this lesson.",
            workedExample: "C→G covers C–D–E–F–G: five letter names. That is why its interval number is a 5th.",
            visual: { kind: "piano", data: { highlighted: ["C", "G"] } },
        },
    },
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "perfect-family",
        patch: {
            title: "The names to learn now",
            body: "The same note at the same pitch is called a Perfect Unison. The same letter name one octave higher or lower is called a Perfect Octave. You can use the names P1 and P8 now without learning the full interval-quality system yet.",
            workedExample: "C→C at the same pitch = P1. C→the next C = P8.",
        },
    },
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "p1",
        patch: {
            body: "A Perfect Unison is the same written note at the same pitch.",
            workedExample: "C to C at the same register = P1.",
        },
    },
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "p8",
        patch: {
            body: "A Perfect Octave uses the same letter name one octave higher or lower.",
            workedExample: "C up to the next C = P8.",
            visual: { kind: "interval", data: { root: "C", target: "C", label: "P8 · C to the next C" } },
        },
    },
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "simple-term",
        patch: {
            title: "Stay within one octave for now",
            body: "Phase 1 starts with intervals from a unison through an octave. Larger intervals exist, but you do not need their naming rules for these lessons.",
            workedExample: "For now, treat C→the next C as the upper edge of the interval range you are practicing.",
        },
    },
    {
        skillId: "intervals.lesson-2-perfect-fifth",
        stepId: "p5-definition",
        patch: {
            body: "A 5th gets its number from the letter-name span. Count the starting note as 1. This particular interval is called a Perfect 5th, written P5. For now, focus on recognizing and building that named interval; the full quality system comes later.",
            workedExample: "C–D–E–F–G is five letter names, so C→G is a 5th. The familiar C→G interval is called a Perfect 5th.",
            visual: { kind: "piano", data: { highlighted: ["C", "G"] } },
        },
    },
    {
        skillId: "intervals.lesson-2-perfect-fifth",
        stepId: "p5-spelling",
        patch: {
            body: "Choose the fifth-letter target before choosing its accidental. Then match the same Perfect-5th keyboard distance you learned from C→G. The written letter still has to be a 5th.",
            workedExample: "Above B, count B–C–D–E–F. The P5 target is F♯. G♭ lands on the same piano key, but G is the wrong target letter for a 5th above B.",
        },
    },
    {
        skillId: "intervals.lesson-3-perfect-fourth",
        stepId: "p4-definition",
        patch: {
            body: "A 4th gets its number from spanning four letter names. This lesson introduces the Perfect 4th, written P4.",
            workedExample: "C–D–E–F is four letter names, so C→F is a 4th. This C→F interval is called a Perfect 4th.",
            visual: { kind: "piano", data: { highlighted: ["C", "F"] } },
        },
    },
    {
        skillId: "intervals.lesson-4-thirds",
        stepId: "major-minor-family",
        patch: {
            body: "Now the lesson adds exact quality. The interval number still comes from the written letter span. Half steps help distinguish the exact Major or Minor version within that number. For the same number, Minor is one half step smaller than Major.",
            workedExample: "C–D–E makes both examples 3rds by letter name. C→E is 4 half steps, so it is M3. C→E♭ is 3 half steps, so it is m3.",
        },
    },
]);
const phase2 = priorPhase2Lessons().map(cloneLesson);
const phase3 = priorPhase3Lessons().map(cloneLesson);
const phase4 = priorPhase4Lessons().map(cloneLesson);
const phase5 = priorPhase5Lessons().map(cloneLesson);
const phase6 = priorPhase6Lessons().map(cloneLesson);
const ALL_LESSONS = [...phase1, ...phase2, ...phase3, ...phase4, ...phase5, ...phase6];
const BY_ID = new Map(ALL_LESSONS.map((lesson) => [lesson.skillId, lesson]));
export function registerLesson(content) { BY_ID.set(content.skillId, content); }
export function lessonForSkill(skillId) { return BY_ID.get(skillId); }
export function activeLessonSkillIds() { return ALL_LESSONS.map((lesson) => lesson.skillId); }
export function phase1Lessons() { return phase1; }
export function phase2Lessons() { return phase2; }
export function phase3Lessons() { return phase3; }
export function phase4Lessons() { return phase4; }
export function phase5Lessons() { return phase5; }
export function phase6Lessons() { return phase6; }
