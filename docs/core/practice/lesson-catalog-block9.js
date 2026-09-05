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
 * Each patch below removes a term/rule that was arriving before its formal
 * introduction or defines exactly enough at first use. Lesson order and the
 * six-phase curriculum remain unchanged.
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
    {
        skillId: "intervals.lesson-4-thirds",
        stepId: "third-payoff",
        patch: {
            body: "Major and Minor 3rds are common building blocks inside chords. For now, make the interval itself fast to recognize and build.",
            payoff: "Later chord lessons can reuse that interval knowledge without making you recount every 3rd from scratch.",
            expectation: "understand",
        },
    },
    {
        skillId: "intervals.lesson-5-sixths",
        stepId: "sixths-payoff",
        patch: {
            payoff: "Fast inversion partners make later interval and harmony work easier to reason through.",
        },
    },
]);
const phase2 = patchSteps(priorPhase2Lessons(), [
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "scale-tonic-definition",
        patch: {
            title: "Scale and tonic",
            body: "A scale is an ordered set of notes organized around a home note. That home note is the tonic. In this curriculum, tonic is the word for the home note of a scale or key; root is used mainly for the note a chord is built from. The next lesson will give the notes their numbered scale positions.",
            workedExample: "In D major, D is the tonic.",
        },
    },
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "major-formula",
        patch: {
            body: "Every ascending major scale follows the same step pattern: W-W-H-W-W-W-H. The half steps occur between the 3rd and 4th notes of the scale and between the 7th note and the octave.",
        },
    },
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "interval-connection",
        patch: {
            body: "The formula is not a random code. Measured from the tonic, the notes of the major scale make the Phase 1 intervals P1, M2, M3, P4, P5, M6, M7, then P8 at the octave.",
            workedExample: "In C major: C→E is M3, C→G is P5, and C→B is M7. Those are the same interval relationships you already learned.",
        },
    },
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "formula-payoff",
        patch: {
            payoff: "Major scales become the note pool for later chord building, moving musical ideas between keys, and improvising.",
            expectation: "understand",
        },
    },
    {
        skillId: "major-scales.lesson-2-degree-names",
        stepId: "degree-priority",
        patch: {
            body: "Know the degree numbers 1–7 instantly and become fluent with all seven names. Tonic (1), Subdominant (4), Dominant (5), and Leading Tone (7) are especially important because later chord lessons refer to them often.",
        },
    },
    {
        skillId: "major-scales.lesson-3-build-all-roots",
        stepId: "build-payoff",
        patch: {
            payoff: "Correct spelling matters because later chord lessons depend on knowing which scale degree a note actually belongs to.",
            expectation: "understand",
        },
    },
    {
        skillId: "major-scales.lesson-4-instant-recall",
        stepId: "recall-payoff",
        patch: {
            body: "When the notes of a key are automatic, later theory stops spending mental bandwidth on basic lookup. You can focus on chord building and musical choices instead.",
            workedExample: "If E major is instantly E-F♯-G♯-A-B-C♯-D♯, building its chords later becomes much faster.",
            expectation: "understand",
        },
    },
]);
const phase3 = patchSteps(priorPhase3Lessons(), [
    {
        skillId: "minor-scales.lesson-1-natural-formula",
        stepId: "natural-minor-payoff",
        patch: {
            body: "Natural minor gives the basic minor note collection. Keep this version solid because later lessons will change only specific notes instead of replacing the whole scale.",
            workedExample: "A natural minor = A B C D E F G. Treat that as the base minor collection for now.",
            payoff: "Later chord lessons build directly from this collection.",
            expectation: "understand",
        },
    },
    {
        skillId: "minor-scales.lesson-3-harmonic-minor",
        stepId: "harmonic-why",
        patch: {
            body: "In tonal minor music, degree 7 is often raised because putting it one half step below the tonic creates a stronger pull upward to home. That note is the leading tone you just learned.",
            workedExample: "In A minor, G♯ sits one half step below A. The motion G♯→A gives the direct leading-tone pull back to the tonic.",
        },
    },
    {
        skillId: "minor-scales.lesson-3-harmonic-minor",
        stepId: "harmonic-payoff",
        patch: {
            body: "Think of harmonic minor as one targeted change to natural minor: raise 7 to create the leading tone. The augmented 2nd between degrees 6 and 7 is the melodic side effect of that change.",
            payoff: "Later chord lessons will reuse this raised 7, but you do not need those chord rules yet.",
            expectation: "understand",
        },
    },
]);
const phase4 = patchSteps(priorPhase4Lessons(), [
    {
        skillId: "diatonic-chords.lesson-10-own-progressions",
        stepId: "outside",
        patch: {
            body: "If one of your chords is outside the current scale, the app labels it outside the current diatonic set and explains the closest in-key result. It does not invent an explanation using theory you have not learned in this curriculum yet.",
            workedExample: "In C major, D major is outside the current diatonic set while D minor is ii. D major can still be musically useful; this lesson simply marks it as outside the current set.",
        },
    },
]);
const phase5 = patchSteps(priorPhase5Lessons(), [
    {
        skillId: "relatives.lesson-1-relative-major-minor",
        stepId: "tonic-interpretation",
        patch: {
            body: "Sharing notes does not make two keys sound or function the same. Melodies, chord emphasis, phrase endings, and repetition can make one tonic feel like the point of rest.",
        },
    },
]);
const phase6 = patchSteps(priorPhase6Lessons(), [
    {
        skillId: "circle-of-fifths.lesson-2-close-vs-distant",
        stepId: "no-modulation-course",
        patch: {
            title: "Stay focused on the map",
            body: "For this phase, use the relationships you already know: neighbors share a lot, far keys share less, relatives share a signature, and Roman numerals let you rebuild musical relationships elsewhere.",
            workedExample: "You can choose A♭ major from C major and rebuild a progression there with Roman numerals without adding extra key-change techniques to this lesson.",
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
