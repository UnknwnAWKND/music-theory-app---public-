import { phase1Lessons as priorPhase1Lessons, phase2Lessons as priorPhase2Lessons, phase3Lessons as priorPhase3Lessons, phase4Lessons as priorPhase4Lessons, phase5Lessons as priorPhase5Lessons, phase6Lessons as priorPhase6Lessons, } from "./lesson-catalog-block11.js";
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
/* Final learner-eye pass after the broader audit in block11. */
const phase1 = patchSteps(priorPhase1Lessons(), [
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "interval-name-parts",
        patch: {
            title: "Intervals",
            body: "An interval is the distance in pitch between two notes.\n\nAn interval name has two parts. Size tells you how many note names are spanned, counted by letter. Quality tells you the exact version of that size, measured by its half-step (semitone) distance.",
        },
    },
    {
        skillId: "intervals.lesson-2-perfect-fifth",
        stepId: "p5-definition",
        patch: {
            title: "Perfect 5th (P5)",
            body: "Count the note letters first. A 5th spans five note names, counted by letter, including the starting note. The quality name here is Perfect; the full quality system comes later.",
            workedExample: "C–D–E–F–G spans five note names. Use C→G as the reference Perfect 5th for this lesson.",
            visual: { kind: "piano", data: { highlighted: ["C", "G"] } },
        },
    },
    {
        skillId: "intervals.lesson-4-thirds",
        stepId: "major-minor-family",
        patch: {
            title: "Major and Minor describe the exact 3rd",
            body: "The interval number still comes from the written note-letter span. Now half steps distinguish the exact quality. For the same interval number, Minor is one half step smaller than Major.",
            workedExample: "C–D–E makes both examples 3rds. C→E is 4 half steps, so it is M3. C→E♭ is 3 half steps, so it is m3.",
        },
    },
]);
const phase2 = patchSteps(priorPhase2Lessons(), [
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "scale-tonic-definition",
        patch: {
            title: "Scale and tonic",
            body: "A scale is an ordered set of notes organized around a home note. That home note is the tonic. In this curriculum, root is used mainly for the note a chord is built from.",
            workedExample: "In D major, D is the tonic.",
        },
    },
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "formula-payoff",
        patch: {
            title: "Use the formula as a reliable backup",
            body: "The goal is eventually to recall familiar major scales quickly, but W-W-H-W-W-W-H lets you rebuild one accurately whenever memory fails.",
            workedExample: "If E♭ major is not instant yet, the formula lets you reconstruct E♭ F G A♭ B♭ C D instead of guessing.",
            payoff: "That same note collection will support later chord building and music-making in different keys.",
            expectation: "understand",
        },
    },
    {
        skillId: "major-scales.lesson-3-build-all-roots",
        stepId: "twelve-pitch-classes",
        patch: {
            title: "All 12 pitch classes",
            body: "A pitch class groups pitches that are the same modulo octave. On piano, notes an octave apart belong to the same pitch class, and enharmonic names such as C♯ and D♭ can represent the same pitch class. Twelve pitch classes occur before the keyboard pattern repeats.",
            workedExample: "The balanced roots are C, C♯, D, E♭, E, F, F♯, G, G♯, A, B♭, and B.",
            visual: { kind: "piano", data: { highlighted: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"], displayLabels: { "C#": "C♯", "D#": "E♭", "F#": "F♯", "G#": "G♯", "A#": "B♭" } } },
        },
    },
]);
const phase3 = patchSteps(priorPhase3Lessons(), [
    {
        skillId: "minor-scales.lesson-4-melodic-minor",
        stepId: "melodic-curriculum-form",
        patch: {
            title: "Classical melodic minor changes with direction",
            body: "In the classical form taught here, start from natural minor and raise degrees 6 and 7 by one half step when ascending. Descending, return to the natural-minor pitches.",
            workedExample: "A ascending: A B C D E F♯ G♯ A. Descending: A G F E D C B A.",
        },
    },
]);
const phase4 = patchSteps(priorPhase4Lessons(), [
    {
        skillId: "diatonic-chords.lesson-7-reference",
        stepId: "other7",
        patch: {
            title: "Less-common seventh-chord lookup",
            body: "Diminished 7: m3 d5 d7 · 1–♭3–♭5–𝄫7. Here d7 is one half step smaller than m7. Minor-major 7: m3 P5 M7 · 1–♭3–5–7. Augmented-major 7: M3 A5 M7 · 1–3–♯5–7.",
            payoff: "Use this page as a lookup when a symbol is unfamiliar. There is no mastery quiz for this reference page, so you do not need to memorize the whole table at once.",
            expectation: "understand",
        },
    },
]);
const phase5 = priorPhase5Lessons().map(cloneLesson);
const phase6 = patchSteps(priorPhase6Lessons(), [
    {
        skillId: "circle-of-fifths.lesson-1-what-it-represents",
        stepId: "counterclockwise-inverse",
        patch: {
            title: "Counterclockwise gives the P4/P5 partner direction",
            body: "From one tonic, moving counterclockwise reaches a note a Perfect 4th (P4) above. The same destination can also be described as a Perfect 5th (P5) below, so the Phase 1 P4↔P5 relationship explains both directions.",
            workedExample: "C→F counterclockwise is C up a P4, or equivalently C down a P5 to F.",
        },
    },
]);
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
