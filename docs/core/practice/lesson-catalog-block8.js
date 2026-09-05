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
function patchSteps(lessons, patches) {
    return patches.reduce((current, item) => patchStep(current, item.skillId, item.stepId, item.patch), lessons.map(cloneLesson));
}
let phase1 = patchSteps(priorPhase1Lessons(), [
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "interval-means-distance",
        patch: {
            body: "An interval is the distance between two notes. Its name has two parts: a number and a quality. The number tells you how many letter names the interval covers. Quality is the word that tells you the exact version of that interval. On piano, exact distance can also be counted in half steps, also called semitones; one half step is one move to the next piano key.",
            workedExample: "C→G covers C–D–E–F–G, so the interval number is a 5th. C to G is seven half steps; that version of a 5th is called Perfect. C→G is a Perfect 5th, written P5. Later you will see that changing a note can keep the same interval number while changing its quality.",
            visual: { kind: "piano", data: { highlighted: ["C", "G"] } },
        },
    },
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "perfect-family",
        patch: {
            title: "What Perfect means here",
            body: "Perfect is the quality name used for the normal unison, 4th, 5th, and octave sizes. In this lesson you only need Perfect unisons and octaves; Perfect 5ths and 4ths come next. Other interval numbers use other quality names later.",
            workedExample: "P1 means Perfect Unison: the same note at the same pitch. P8 means Perfect Octave: the same letter name 12 half steps away.",
        },
    },
    {
        skillId: "intervals.lesson-2-perfect-fifth",
        stepId: "p5-spelling",
        patch: {
            body: "An accidental is a sharp, flat, or natural sign that changes a written note's pitch. For a 5th, choose the target letter first, then use an accidental if needed to make the seven-half-step distance.",
            workedExample: "A P5 above B must use the letter F because B–C–D–E–F spans five letters. F♯ gives the required seven half steps. G♭ is the same piano key, but G is the wrong target letter for a 5th above B.",
        },
    },
    {
        skillId: "intervals.lesson-2-perfect-fifth",
        stepId: "p5-payoff",
        patch: {
            body: "A chord is a group of notes played together. Perfect 5ths appear inside many common chords and power-chord shapes, so the target note should become fast enough that you do not need to count every time.",
        },
    },
    {
        skillId: "intervals.lesson-3-perfect-fourth",
        stepId: "inversion-definition",
        patch: {
            body: "To invert an interval, flip which note is lower by moving one note by an octave. The note names stay the same, but their order changes, so the interval you measure changes.",
            workedExample: "C up to G is P5. Move the lower C above G: G up to C is P4.",
        },
    },
    {
        skillId: "intervals.lesson-3-perfect-fourth",
        stepId: "p4-payoff",
        patch: {
            body: "Knowing P4 and P5 as a pair lets you solve one from the other and prepares you for later chord movement, bass lines, and harmony.",
            payoff: "You are starting to memorize connected interval relationships instead of isolated facts.",
            expectation: "understand",
        },
    },
    {
        skillId: "intervals.lesson-4-thirds",
        stepId: "major-minor-family",
        patch: {
            body: "Major and Minor are quality names used with 2nds, 3rds, 6ths, and 7ths. For the same interval number, the Minor version is one half step smaller than the Major version.",
            workedExample: "A Major 3rd is 4 half steps. A Minor 3rd keeps the 3rd letter span but is 3 half steps.",
        },
    },
    {
        skillId: "intervals.lesson-4-thirds",
        stepId: "minor3",
        patch: {
            visual: { kind: "piano", data: { highlighted: ["F", "G#"], displayLabels: { "G#": "A♭" } } },
        },
    },
    {
        skillId: "intervals.lesson-4-thirds",
        stepId: "third-spelling",
        patch: {
            body: "The written note letters determine the interval number; the half-step distance then determines the quality. The same piano key can have a different interval number when its written name changes.",
            workedExample: "C→E♭ is a 3rd by the letters C–D–E and is 3 half steps, so it is m3. C→D♯ reaches the same piano key as E♭, but C–D spans only two letter names, so it is not a 3rd. You will name that spelling later.",
        },
    },
    {
        skillId: "intervals.lesson-4-thirds",
        stepId: "third-payoff",
        patch: {
            expectation: "understand",
        },
    },
    {
        skillId: "intervals.lesson-6-seconds",
        stepId: "seconds-spelling",
        patch: {
            body: "The written letters decide the interval number before the piano-key distance decides its quality. An enharmonic piano key can therefore have a different interval number when it is spelled with a different letter.",
            workedExample: "E→F♯ is M2: E–F spans two letters and the notes are two half steps apart. The same black key can be written G♭, but E→G♭ spans E–F–G, so it is not a 2nd.",
        },
    },
    {
        skillId: "intervals.lesson-8-tritone",
        stepId: "tritone",
        patch: {
            body: "A tritone spans six half steps. In this lesson you meet two written tritones: Augmented 4th (A4) and Diminished 5th (d5). For these Perfect-family intervals, Augmented means one half step larger than the Perfect form, and Diminished means one half step smaller. On an equal-tempered piano A4 and d5 reach the same physical key distance, but the spelling decides which written interval it is.",
            workedExample: "C→F♯ is A4. C→G♭ is d5. Both span six half steps, but C–D–E–F is a 4th while C–D–E–F–G is a 5th.",
        },
    },
    {
        skillId: "intervals.lesson-8-tritone",
        stepId: "a4",
        patch: {
            visual: { kind: "piano", data: { highlighted: ["C", "F#"], displayLabels: { "F#": "F♯" } } },
        },
    },
    {
        skillId: "intervals.lesson-8-tritone",
        stepId: "d5",
        patch: {
            visual: { kind: "piano", data: { highlighted: ["C", "F#"], displayLabels: { "F#": "G♭" } } },
        },
    },
    {
        skillId: "intervals.lesson-8-tritone",
        stepId: "spelling-decides-name",
        patch: {
            body: "C→F♯ is a 4th by letter name because the letters are C–D–E–F. C→G♭ is a 5th by letter name because the letters are C–D–E–F–G. The same piano key does not erase that spelling difference.",
            workedExample: "A4 above C = F♯. d5 above C = G♭.",
        },
    },
    {
        skillId: "intervals.lesson-9-inversion-capstone",
        stepId: "numbers-add-nine",
        patch: {
            workedExample: "3 + 6 = 9, so every simple 3rd inverts to a 6th. The quality is then changed by the separate inversion-quality rule.",
        },
    },
    {
        skillId: "intervals.lesson-10-cumulative",
        stepId: "coverage",
        patch: {
            body: "This phase teaches 14 distinct simple written interval types: P1, P8, P5, P4, M3, m3, M6, m6, M2, m2, M7, m7, A4, and d5. A4 and d5 share a six-half-step sound on equal-tempered piano but remain different written intervals.",
        },
    },
    {
        skillId: "intervals.lesson-10-cumulative",
        stepId: "construct-direction",
        patch: {
            body: "Given a starting note and a requested interval, produce the correctly spelled target note.",
        },
    },
]);
let phase2 = patchSteps(priorPhase2Lessons(), [
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "scale-tonic-definition",
        patch: {
            title: "Scale and tonic",
            body: "A scale is an ordered set of notes organized around a home note. That home note is the tonic, and it is scale degree 1. In this curriculum, tonic is the word for the home note of a scale or key; root is used mainly for the note a chord is built from.",
            workedExample: "In D major, D is the tonic and scale degree 1.",
        },
    },
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "formula-payoff",
        patch: { expectation: "understand" },
    },
    {
        skillId: "major-scales.lesson-2-degree-names",
        stepId: "tonic-supertonic",
        patch: {
            body: "Tonic means degree 1, the home note of the key. Supertonic means degree 2, the next scale degree above the tonic.",
        },
    },
    {
        skillId: "major-scales.lesson-3-build-all-roots",
        stepId: "twelve-pitch-classes",
        patch: {
            body: "A pitch class treats pitches an octave apart as members of the same repeating pitch category. On piano, 12 pitch classes occur before the pattern repeats at the octave. Phase 2 balances practice across all 12, so easy keys like C, G, and D cannot crowd out the black-key tonics.",
        },
    },
    {
        skillId: "major-scales.lesson-3-build-all-roots",
        stepId: "one-letter-each",
        patch: {
            body: "A seven-note major scale uses each musical letter exactly once before the tonic repeats. First choose the next letter; then choose the accidental that makes the W/H distance correct.",
        },
    },
    {
        skillId: "major-scales.lesson-3-build-all-roots",
        stepId: "build-payoff",
        patch: { expectation: "understand" },
    },
    {
        skillId: "major-scales.lesson-4-instant-recall",
        stepId: "balanced-roots",
        patch: { expectation: "understand" },
    },
    {
        skillId: "major-scales.lesson-4-instant-recall",
        stepId: "recall-payoff",
        patch: { expectation: "understand" },
    },
]);
let phase3 = patchSteps(priorPhase3Lessons(), [
    {
        skillId: "minor-scales.lesson-1-natural-formula",
        stepId: "natural-minor-formula",
        patch: {
            visual: { kind: "piano", data: { highlighted: ["C", "D", "D#", "F", "G", "G#", "A#"], displayLabels: { "D#": "E♭", "G#": "A♭", "A#": "B♭" } } },
        },
    },
    {
        skillId: "minor-scales.lesson-1-natural-formula",
        stepId: "natural-minor-payoff",
        patch: { expectation: "understand" },
    },
    {
        skillId: "minor-scales.lesson-2-natural-all-roots",
        stepId: "natural-all-roots-payoff",
        patch: { expectation: "understand" },
    },
    {
        skillId: "minor-scales.lesson-3-harmonic-minor",
        stepId: "augmented-second-definition",
        patch: { expectation: "understand" },
    },
    {
        skillId: "minor-scales.lesson-4-melodic-minor",
        stepId: "melodic-curriculum-form",
        patch: {
            workedExample: "A melodic minor ascending: A B C D E F♯ G♯ A. Descending in the classical form taught here: A G F E D C B A.",
        },
    },
    {
        skillId: "minor-scales.lesson-4-melodic-minor",
        stepId: "melodic-descending-why",
        patch: {
            body: "In the classical form taught here, descending lines return scale degrees 7 and 6 to their natural-minor pitches. This is a convention distilled from common-practice usage, not a rule that every melody in minor must always follow.",
            workedExample: "C melodic minor descending uses C B♭ A♭ G F E♭ D C, the same pitches as C natural minor in descending order.",
        },
    },
    {
        skillId: "minor-scales.lesson-5-instant-recall",
        stepId: "minor-balanced-roots",
        patch: { expectation: "understand" },
    },
    {
        skillId: "minor-scales.lesson-5-instant-recall",
        stepId: "minor-recall-payoff",
        patch: { expectation: "understand" },
    },
]);
let phase4 = patchSteps(priorPhase4Lessons(), [
    {
        skillId: "diatonic-chords.lesson-1-stacking-thirds",
        stepId: "phase1",
        patch: {
            body: "Chord quality means the chord's type. For triads here: Major = M3 + P5 from the root; Minor = m3 + P5; Diminished = m3 + d5; Augmented = M3 + A5. A5 means an augmented 5th, one half step larger than P5.",
            workedExample: "C–E–G is a major triad because C→E is M3 and C→G is P5. C–E–G♯ is augmented because C→G♯ is A5.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-2-major-triads",
        stepId: "derive",
        patch: {
            body: "Use the major scale from Phase 2 and stack every other scale note from each degree. Roman numerals label the scale degree of the chord root: I means degree 1, II degree 2, and so on. In this curriculum uppercase numerals show major triads, lowercase numerals show minor triads, and ° marks diminished triads.",
            workedExample: "C major: I C–E–G, ii D–F–A, iii E–G–B, IV F–A–C, V G–B–D, vi A–C–E, vii° B–D–F.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-6-seventh-chords",
        stepId: "method",
        patch: {
            body: "A seventh chord extends a triad by adding the next every-other scale note: root, 3rd, 5th, 7th. Its chord type comes from the triad plus the root-to-7th interval. Major 7 = major triad + M7; minor 7 = minor triad + m7; dominant 7 = major triad + m7; half-diminished 7 = diminished triad + m7.",
            workedExample: "C major Imaj7 = C–E–G–B. G–B–D–F is a dominant 7 because G–B–D is major and G→F is m7.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-6-seventh-chords",
        stepId: "major",
        patch: {
            body: "Imaj7 · ii7 · iii7 · IVmaj7 · V7 · vi7 · viiø7. maj7 marks a major-seventh chord; ii7, iii7, and vi7 are minor-seventh chords here; V7 is dominant-seventh; ø7 means half-diminished seventh.",
            workedExample: "C major: Imaj7 C–E–G–B; ii7 D–F–A–C; V7 G–B–D–F; viiø7 B–D–F–A.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-6-seventh-chords",
        stepId: "natural",
        patch: {
            body: "i7 · iiø7 · IIImaj7 · iv7 · v7 · VImaj7 · VII7. VII7 has dominant-seventh chord quality: a major triad plus m7. That chord-type name does not automatically mean the chord has the dominant role in the key; chord roles are taught in Lesson 8.",
            workedExample: "A natural minor: i7 A–C–E–G; iiø7 B–D–F–A; IIImaj7 C–E–G–B; VII7 G–B–D–F.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-6-seventh-chords",
        stepId: "harmonic",
        patch: {
            body: "i(maj7) · iiø7 · III+maj7 · iv7 · V7 · VImaj7 · vii°7. Here i(maj7) is minor-major 7: minor triad + M7. III+maj7 is augmented-major 7: augmented triad + M7. vii°7 is fully diminished 7: diminished triad + d7. d7 means a diminished 7th, one half step smaller than m7.",
            workedExample: "A harmonic minor: i(maj7) = A–C–E–G♯; III+maj7 = C–E–G♯–B; vii°7 = G♯–B–D–F.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-6-seventh-chords",
        stepId: "melodic",
        patch: {
            workedExample: "A melodic minor ascending: i(maj7) A–C–E–G♯; IV7 D–F♯–A–C; viø7 F♯–A–C–E.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-7-reference",
        stepId: "triads",
        patch: {
            body: "The interval labels and 1–3–5 formulas are measured from the chord root. Major: M3, P5 · 1–3–5 · C–E–G. Minor: m3, P5 · 1–♭3–5 · C–E♭–G. Diminished: m3, d5 · 1–♭3–♭5 · C–E♭–G♭. Augmented: M3, A5 · 1–3–♯5 · C–E–G♯.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-7-reference",
        stepId: "other7",
        patch: {
            body: "Diminished 7: m3 d5 d7 · 1–♭3–♭5–𝄫7. Here d7 means a diminished 7th, one half step smaller than m7. Minor-major 7: m3 P5 M7 · 1–♭3–5–7. Augmented-major 7: M3 A5 M7 · 1–3–♯5–7.",
            payoff: "This card is a lookup tool. It has no mastery quiz and creates no READY evidence.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-9-progressions",
        stepId: "major",
        patch: {
            workedExample: "In C major: I–V–vi–IV = C–G–Am–F; ii–V–I = Dm–G–C. Move the same numerals to another major key to transpose the relationship.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-10-own-progressions",
        stepId: "outside",
        patch: {
            body: "If one of your chords is outside the current scale, the app labels it outside the current diatonic set and explains the closest in-key result. It does not pretend to explain more advanced harmony that deliberately uses notes or chords outside the current scale, because that material has not been taught yet.",
            workedExample: "In C major, D major is not the diatonic ii chord; D minor is. D major can still be musically useful, but explaining its outside-the-scale role belongs to later harmony study.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-10-own-progressions",
        stepId: "goal",
        patch: { expectation: "understand" },
    },
]);
let phase5 = patchSteps(priorPhase5Lessons(), [
    {
        skillId: "relatives.lesson-1-relative-major-minor",
        stepId: "relative-definition",
        patch: {
            body: "Relative keys are a major key and a minor key that share the same key signature. A key signature is the set of sharps or flats associated with a key. The major scale and its relative natural-minor scale use the same seven pitch classes, but a different note is tonic — the musical home.",
            workedExample: "C major: C D E F G A B. A natural minor: A B C D E F G. Both have a key signature with no sharps or flats; C is tonic in C major and A is tonic in A minor.",
        },
    },
    {
        skillId: "relatives.lesson-1-relative-major-minor",
        stepId: "tonic-interpretation",
        patch: {
            body: "Sharing notes does not make two keys sound or function the same. Melodies, chord emphasis, musical endings, and repetition can make one tonic feel like the point of rest.",
        },
    },
    {
        skillId: "relatives.lesson-4-instant-recall",
        stepId: "all-signatures",
        patch: {
            body: "The drill covers the conventional major/minor key-signature pairs through seven sharps or flats, including different written key names that can share the same piano pitches.",
            workedExample: "F♯ major ↔ D♯ minor and G♭ major ↔ E♭ minor use different written key signatures even though F♯/G♭ and D♯/E♭ are enharmonic tonic pitch classes.",
        },
    },
]);
let phase6 = patchSteps(priorPhase6Lessons(), [
    {
        skillId: "circle-of-fifths.lesson-1-what-it-represents",
        stepId: "relationship-map",
        patch: {
            body: "The Circle of Fifths arranges major key signatures so neighboring positions differ by one sharp or one flat. Do not memorize a wheel just because it exists — use it to see how closely neighboring keys are related and what changes when you move around the circle.",
        },
    },
    {
        skillId: "circle-of-fifths.lesson-4-far-side-transposition",
        stepId: "far-side-rule",
        patch: {
            workedExample: "From C, E major is 4 circle steps away; B major and C♯/D♭ major are 5; F♯/G♭ major is 6.",
        },
    },
]);
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
