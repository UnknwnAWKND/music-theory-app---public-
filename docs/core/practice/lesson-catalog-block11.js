import { phase1Lessons as priorPhase1Lessons, phase2Lessons as priorPhase2Lessons, phase3Lessons as priorPhase3Lessons, phase4Lessons as priorPhase4Lessons, phase5Lessons as priorPhase5Lessons, phase6Lessons as priorPhase6Lessons, } from "./lesson-catalog-block10.js";
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
 * Human-readability / sequencing audit.
 *
 * This layer deliberately changes teaching copy and teaching visuals only.
 * Lesson order, skills, exercise generation, READY/RETAINED, review scheduling,
 * checkpoints, and progression behavior remain untouched.
 *
 * Standard used for every screen:
 * - the body must add information beyond its heading;
 * - terminology must already be known or be defined at first use;
 * - examples must match the written rule;
 * - piano labels must reflect the theoretical spelling being taught;
 * - future concepts may be previewed only as a destination, never used as a
 *   prerequisite for understanding the current lesson.
 */
const phase1 = patchSteps(priorPhase1Lessons(), [
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "interval-name-parts",
        patch: {
            title: "Intervals",
            body: "An interval is the distance in pitch between two notes.\n\nAn interval name has two parts. Size tells you how many note letters are spanned. Quality tells you the exact version of that size, measured by its half-step (semitone) distance.",
            expectation: "understand",
        },
    },
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "p1",
        patch: {
            title: "Perfect Unison (P1)",
            body: "A Perfect Unison happens when both notes are the same pitch.\n\nExample: C to C at the same octave.\n\nThe interval size is 1 because only C is spanned. Both notes occupy the same piano key.",
            expectation: "understand",
            visual: { kind: "piano", data: { highlightedKeys: ["C4"] } },
        },
    },
    {
        skillId: "intervals.lesson-1-unison-octave",
        stepId: "p8",
        patch: {
            title: "Perfect Octave (P8)",
            body: "A Perfect Octave reaches the same note name in the next octave.\n\nExample: C to the next C above.\n\nC–D–E–F–G–A–B–C spans eight note names, so the interval size is 8. The two Cs are different piano keys.",
            expectation: "understand",
            visual: { kind: "piano", data: { highlightedKeys: ["C4", "C5"] } },
        },
    },
    {
        skillId: "intervals.lesson-2-perfect-fifth",
        stepId: "p5-definition",
        patch: {
            title: "Perfect 5th (P5)",
            body: "Count the note letters first. A 5th spans five note letters, including the starting note. The quality name here is Perfect; the full quality system comes later.",
            workedExample: "C–D–E–F–G spans five note letters. Use C→G as the reference Perfect 5th for this lesson.",
            visual: { kind: "piano", data: { highlighted: ["C", "G"] } },
        },
    },
    {
        skillId: "intervals.lesson-2-perfect-fifth",
        stepId: "p5-spelling",
        patch: {
            title: "Choose the target letter before the accidental",
            body: "An accidental is a sharp, flat, or natural sign that changes a written note's pitch. For a 5th, find the fifth note letter first. Then use an accidental if needed to match the same Perfect-5th keyboard distance as C→G.",
            workedExample: "Above B, count B–C–D–E–F. The target letter must be F, and the Perfect 5th is F♯. G♭ is the same piano key, but G is the wrong letter for a 5th above B.",
        },
    },
    {
        skillId: "intervals.lesson-2-perfect-fifth",
        stepId: "p5-payoff",
        patch: {
            title: "Make the target note fast",
            body: "Perfect 5ths appear inside many common chords. If the target note becomes quick now, later chord building takes less mental work.",
            workedExample: "F→C should eventually arrive as quickly as C→G.",
            payoff: undefined,
            expectation: "understand",
        },
    },
    {
        skillId: "intervals.lesson-2-perfect-fifth",
        stepId: "p5-cumulative",
        patch: {
            title: "Mix the new interval with the old ones",
            body: "P5 is added to P1 and P8 instead of replacing them. Mixed examples make you identify the relationship before answering rather than relying on one repeated pattern.",
            workedExample: "A sequence might move from C→G to A→A at the same pitch, then D→the next D.",
        },
    },
    {
        skillId: "intervals.lesson-3-perfect-fourth",
        stepId: "p4-definition",
        patch: {
            title: "Perfect 4th (P4)",
            body: "A 4th spans four note letters, including the starting note. Use the C→F relationship as the reference Perfect 4th.",
            workedExample: "C–D–E–F spans four note letters, so C→F has the interval number 4.",
            visual: { kind: "piano", data: { highlighted: ["C", "F"] } },
        },
    },
    {
        skillId: "intervals.lesson-3-perfect-fourth",
        stepId: "inversion-definition",
        patch: {
            title: "Interval inversion flips which note is lower",
            body: "To invert an interval, move the lower note up an octave (or the upper note down an octave). The two note names stay the same, but their order changes, so the measured interval changes.",
            workedExample: "C→G is P5. Move the lower C above G and the new upward interval is G→C, a P4.",
        },
    },
    {
        skillId: "intervals.lesson-3-perfect-fourth",
        stepId: "p5-p4-inversion",
        patch: {
            title: "P5 ↔ P4",
            body: "The inversion numbers fill the octave together: 5 + 4 = 9. Once you know one number, this rule gives you its partner.",
            workedExample: "D→A is P5. Invert the notes and A→D is P4.",
        },
    },
    {
        skillId: "intervals.lesson-3-perfect-fourth",
        stepId: "perfect-stays-perfect",
        patch: {
            title: "The quality stays Perfect",
            body: "In these Perfect-family inversion pairs, the number changes but the Perfect quality does not.",
            workedExample: "P5 ↔ P4 and P1 ↔ P8.",
        },
    },
    {
        skillId: "intervals.lesson-3-perfect-fourth",
        stepId: "p4-payoff",
        patch: {
            title: "Treat P4 and P5 as one connected relationship",
            body: "If one member of the pair is familiar, inversion gives you another way to recover the other instead of memorizing two unrelated facts.",
            payoff: "That connection will remain useful when later harmony reuses 4ths and 5ths.",
            expectation: "understand",
        },
    },
    {
        skillId: "intervals.lesson-4-thirds",
        stepId: "major-minor-family",
        patch: {
            title: "Major and Minor describe the exact 3rd",
            body: "The interval number still comes from the note-letter span. Now half steps distinguish the exact quality. For the same interval number, Minor is one half step smaller than Major.",
            workedExample: "C–D–E makes both examples 3rds. C→E is 4 half steps, so it is M3. C→E♭ is 3 half steps, so it is m3.",
        },
    },
    {
        skillId: "intervals.lesson-4-thirds",
        stepId: "third-spelling",
        patch: {
            title: "The written letters still decide the number",
            body: "Two spellings can land on the same piano key without naming the same interval. Count the note letters first; then use the half-step distance to identify the quality.",
            workedExample: "C→E♭ is a 3rd because C–D–E spans three letters. C→D♯ reaches the same piano key, but C–D spans only two letters, so it is not a 3rd.",
        },
    },
    {
        skillId: "intervals.lesson-4-thirds",
        stepId: "third-payoff",
        patch: {
            title: "3rds become chord ingredients later",
            body: "Major and Minor 3rds are used constantly when chords are built. For now, make the interval itself quick to recognize and construct.",
            payoff: undefined,
            expectation: "understand",
        },
    },
    {
        skillId: "intervals.lesson-5-sixths",
        stepId: "major-minor-flip",
        patch: {
            title: "Use the inversion quality rule",
            body: "For Major/Minor intervals, inversion flips the quality: Major becomes Minor, and Minor becomes Major. Combine that with the 3↔6 number pair.",
            workedExample: "M3 ↔ m6. m3 ↔ M6.",
        },
    },
    {
        skillId: "intervals.lesson-5-sixths",
        stepId: "m3-m6",
        patch: {
            title: "M3 ↔ m6",
            body: "Start with C→E (M3). Move the lower C above E: E→C is m6. The number changes 3→6 and the quality changes Major→Minor.",
            workedExample: "C→E = M3; E→the next C = m6.",
        },
    },
    {
        skillId: "intervals.lesson-5-sixths",
        stepId: "minor3-major6",
        patch: {
            title: "m3 ↔ M6",
            body: "Start with C→E♭ (m3). Move the lower C above E♭: E♭→C is M6. The number changes 3→6 and the quality changes Minor→Major.",
            workedExample: "C→E♭ = m3; E♭→the next C = M6.",
        },
    },
    {
        skillId: "intervals.lesson-5-sixths",
        stepId: "sixths-payoff",
        patch: {
            title: "Use one interval to recover its partner",
            body: "Thinking in inversion pairs gives you a second route to an answer when a 6th is not yet instant.",
            payoff: undefined,
            expectation: "understand",
        },
    },
    {
        skillId: "intervals.lesson-6-seconds",
        stepId: "half-whole",
        patch: {
            title: "Half step and whole step are keyboard distances",
            body: "On piano, m2 is one adjacent-key half step. M2 is two half steps, which is also called a whole step. The written letters still have to form a 2nd.",
            workedExample: "E→F = m2. E→F♯ = M2.",
        },
    },
    {
        skillId: "intervals.lesson-6-seconds",
        stepId: "seconds-spelling",
        patch: {
            title: "Same piano key, different written interval number",
            body: "The note letters decide the interval number before the keyboard distance decides its quality. An enharmonic spelling can therefore change the written interval number even when the piano key stays the same.",
            workedExample: "E→F♯ is M2 because E–F spans two letters. The same black key can be written G♭, but E→G♭ spans E–F–G, so it is not a 2nd.",
        },
    },
    {
        skillId: "intervals.lesson-7-sevenths",
        stepId: "seventh-discrimination",
        patch: {
            title: "Keep 2nds and 7ths distinct",
            body: "A small 2nd and its wide 7th inversion partner can use the same two note names in opposite order. Use the number-and-quality rules rather than guessing from how far apart the notes look.",
            workedExample: "M2 ↔ m7 and m2 ↔ M7.",
        },
    },
    {
        skillId: "intervals.lesson-8-tritone",
        stepId: "tritone",
        patch: {
            title: "A tritone spans six half steps",
            body: "This lesson adds two quality words. For Perfect-family intervals, Augmented means one half step larger than Perfect, and Diminished means one half step smaller. A4 and d5 can land on the same piano-key distance, but their written spellings are different.",
            workedExample: "C→F♯ is A4. C→G♭ is d5. Both span six half steps.",
        },
    },
    {
        skillId: "intervals.lesson-8-tritone",
        stepId: "spelling-decides-name",
        patch: {
            title: "Count letters before naming the tritone",
            body: "Do not name a tritone from the piano key alone. First count the written note letters to decide whether it is a 4th or a 5th; then apply Augmented or Diminished.",
            workedExample: "C–D–E–F makes C→F♯ an A4. C–D–E–F–G makes C→G♭ a d5.",
        },
    },
    {
        skillId: "intervals.lesson-8-tritone",
        stepId: "double-accidentals",
        patch: {
            title: "Exact spelling can require a double accidental",
            body: "A double sharp or double flat changes a note by two half steps. Keep the required target letter, then use the accidental that produces the requested interval instead of renaming the note to an easier-looking letter.",
            workedExample: "A4 above G♯ must use the fourth letter C. C𝄪 gives the correct pitch; writing D would change the interval number.",
        },
    },
    {
        skillId: "intervals.lesson-9-inversion-capstone",
        stepId: "numbers-add-nine",
        patch: {
            title: "Simple-interval inversion numbers add to 9",
            body: "For intervals from a unison through an octave, the original number plus the inverted number equals 9.",
            workedExample: "3 + 6 = 9, so a 3rd inverts to a 6th. Quality is handled by the separate quality rule.",
        },
    },
    {
        skillId: "intervals.lesson-10-cumulative",
        stepId: "coverage",
        patch: {
            title: "The complete Phase 1 interval set",
            body: "You now have 14 written simple interval types to distinguish: P1, P8, P5, P4, M3, m3, M6, m6, M2, m2, M7, m7, A4, and d5. A4 and d5 share a six-half-step piano distance but remain different written intervals.",
            workedExample: "C→F♯ = A4; C→G♭ = d5.",
        },
    },
    {
        skillId: "intervals.lesson-10-cumulative",
        stepId: "automaticity",
        patch: {
            title: "Keep intervals in long-term practice",
            body: "Finishing Phase 1 does not make intervals one-and-done. Later scale and chord work will reuse them, and review will bring them back so recall stays fast.",
            workedExample: "A P5 can reappear later as the fifth of a scale or as part of a chord-building problem.",
            expectation: "understand",
        },
    },
]);
const phase2 = patchSteps(priorPhase2Lessons(), [
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "scale-tonic-definition",
        patch: {
            title: "Scale and tonic",
            body: "A scale is an ordered set of notes organized around a home note. That home note is the tonic. In this curriculum, root is used mainly for the note a chord is built from. Numbered scale degrees are introduced in the next lesson.",
            workedExample: "In D major, D is the tonic.",
        },
    },
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "whole-half-definition",
        patch: {
            title: "Whole steps and half steps on piano",
            body: "You already used half steps to distinguish interval quality. A half step moves to the next piano key; a whole step moves two piano keys. E→F and B→C are half steps even though both notes are white keys.",
            workedExample: "C→C♯ = half step. C→D = whole step. E→F = half step.",
        },
    },
    {
        skillId: "major-scales.lesson-1-formula",
        stepId: "formula-payoff",
        patch: {
            title: "Use the formula as a reliable backup",
            body: "The goal is eventually to recall familiar major scales quickly, but W-W-H-W-W-W-H lets you rebuild one accurately whenever memory fails.",
            workedExample: "If E♭ major is not instant yet, the formula lets you reconstruct E♭ F G A♭ B♭ C D instead of guessing.",
            payoff: "That same note collection will support later chord building, transposition, and improvisation.",
            expectation: "understand",
        },
    },
    {
        skillId: "major-scales.lesson-2-degree-names",
        stepId: "tonic-supertonic",
        patch: {
            title: "1 Tonic · 2 Supertonic",
            body: "Tonic is the home note. Supertonic is the next scale degree above it. These names move with the key; they are not fixed note letters.",
            workedExample: "In D major, D is Tonic (1) and E is Supertonic (2).",
        },
    },
    {
        skillId: "major-scales.lesson-2-degree-names",
        stepId: "mediant-subdominant",
        patch: {
            title: "3 Mediant · 4 Subdominant",
            body: "These are names for positions inside the key, not specific notes. In a major scale, degree 3 is an M3 above the tonic and degree 4 is a P4 above it.",
            workedExample: "In D major, F♯ is Mediant (3) and G is Subdominant (4).",
        },
    },
    {
        skillId: "major-scales.lesson-2-degree-names",
        stepId: "dominant-submediant",
        patch: {
            title: "5 Dominant · 6 Submediant",
            body: "In a major scale, degree 5 is a P5 above the tonic and degree 6 is an M6 above it. The names stay attached to those scale positions when the key changes.",
            workedExample: "In D major, A is Dominant (5) and B is Submediant (6).",
        },
    },
    {
        skillId: "major-scales.lesson-2-degree-names",
        stepId: "degree-priority",
        patch: {
            title: "Translate name → number → note",
            body: "The useful skill is not reciting the seven names in order. Hear or read a degree name, convert it to its number, then find that note in the current key.",
            workedExample: "Dominant of A major → degree 5 → E.",
            payoff: "Later harmony can then use scale-degree language without forcing you to stop and decode it.",
        },
    },
    {
        skillId: "major-scales.lesson-3-build-all-roots",
        stepId: "twelve-pitch-classes",
        patch: {
            title: "All 12 pitch classes",
            body: "A pitch class groups notes with the same name and piano position pattern across octaves. Twelve pitch classes occur before the keyboard pattern repeats. Practice uses all 12 so familiar white-key tonics do not crowd out the others.",
            workedExample: "The balanced roots are C, C♯, D, E♭, E, F, F♯, G, G♯, A, B♭, and B.",
            visual: { kind: "piano", data: { highlighted: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"], displayLabels: { "C#": "C♯", "D#": "E♭", "F#": "F♯", "G#": "G♯", "A#": "B♭" } } },
        },
    },
    {
        skillId: "major-scales.lesson-3-build-all-roots",
        stepId: "enharmonic-definition",
        patch: {
            title: "Enharmonic notes can share a key without sharing a spelling",
            body: "Enharmonic notes sound at the same piano pitch in equal temperament but have different written names. The chosen tonic spelling determines the letter spelling of the rest of the scale.",
            workedExample: "F♯ major and G♭ major use the same piano pitches but different written note names.",
        },
    },
    {
        skillId: "major-scales.lesson-3-build-all-roots",
        stepId: "build-payoff",
        patch: {
            title: "Use construction to check recall",
            body: "When a key is not automatic, rebuild it with the step pattern and one-letter-per-degree rule. When it is familiar, answer a requested degree directly without rebuilding the whole scale every time.",
            workedExample: "In E♭ major, degree 6 is C. If that is not instant, reconstruct E♭ F G A♭ B♭ C D to verify it.",
            payoff: undefined,
            expectation: "understand",
        },
    },
    {
        skillId: "major-scales.lesson-4-instant-recall",
        stepId: "distributed-retrieval",
        patch: {
            title: "Recall needs to survive time",
            body: "One correct session does not prove a key will still be available later. Major scales return across later sessions so recall is tested after time has passed and while other keys are mixed in.",
            workedExample: "You might recall B major today, see several other keys in between, and meet B major again in a later review.",
        },
    },
    {
        skillId: "major-scales.lesson-4-instant-recall",
        stepId: "balanced-roots",
        patch: {
            title: "Do not let easy keys dominate recall",
            body: "The drill rotates all 12 pitch classes and changes the task: full scale, one degree, missing note, or note-to-degree. That forces the scale itself to be known rather than one repeated prompt format.",
            workedExample: "A sequence can move from D♭ major to A major to F♯ major, then ask only for a single degree.",
            expectation: "understand",
        },
    },
]);
const phase3 = patchSteps(priorPhase3Lessons(), [
    {
        skillId: "minor-scales.lesson-1-natural-formula",
        stepId: "natural-minor-start",
        patch: {
            title: "Natural minor is the base minor scale",
            body: "Natural minor is a seven-note scale built from a tonic. It uses a different whole-step/half-step pattern from the major scale on the same tonic.",
            workedExample: "C natural minor = C D E♭ F G A♭ B♭.",
        },
    },
    {
        skillId: "minor-scales.lesson-2-natural-all-roots",
        stepId: "minor-all-roots",
        patch: {
            title: "Use the same formula from every tonic",
            body: "W-H-W-W-H-W-W does not change when the tonic changes. Rotate across all 12 pitch classes so A minor does not become the only minor scale that feels familiar.",
            workedExample: "Balanced roots include C, C♯, D, E♭, E, F, F♯, G, G♯, A, B♭, and B.",
            visual: { kind: "piano", data: { highlighted: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"], displayLabels: { "C#": "C♯", "D#": "E♭", "F#": "F♯", "G#": "G♯", "A#": "B♭" } } },
        },
    },
    {
        skillId: "minor-scales.lesson-3-harmonic-minor",
        stepId: "harmonic-definition",
        patch: {
            title: "Change only scale degree 7",
            body: "To build harmonic minor, start with the correctly spelled natural-minor scale and raise degree 7 by one half step. Every other degree stays unchanged.",
            workedExample: "A natural minor = A B C D E F G. Raise G to G♯: A harmonic minor = A B C D E F G♯.",
        },
    },
    {
        skillId: "minor-scales.lesson-3-harmonic-minor",
        stepId: "harmonic-why",
        patch: {
            title: "Raised 7 strengthens the pull to tonic",
            body: "Putting degree 7 one half step below the tonic creates a leading tone. That half-step motion gives a stronger upward pull to the tonic than natural minor's whole-step distance from 7 to 1.",
            workedExample: "In A harmonic minor, G♯→A is a half step back to the tonic.",
        },
    },
    {
        skillId: "minor-scales.lesson-3-harmonic-minor",
        stepId: "harmonic-payoff",
        patch: {
            title: "Use natural minor as the reference",
            body: "Do not memorize harmonic minor as an unrelated seven-note list. If natural minor is known, recover harmonic minor by changing only degree 7; the larger 6→7 gap follows from that one alteration.",
            workedExample: "C natural minor = C D E♭ F G A♭ B♭. C harmonic minor changes only B♭→B.",
            payoff: undefined,
            expectation: "understand",
        },
    },
    {
        skillId: "minor-scales.lesson-4-melodic-minor",
        stepId: "melodic-curriculum-form",
        patch: {
            title: "Classical melodic minor changes with direction",
            body: "In the classical form taught here, ascending melodic minor raises natural-minor degrees 6 and 7 by one half step. Descending, it returns to the natural-minor pitches.",
            workedExample: "A ascending: A B C D E F♯ G♯ A. Descending: A G F E D C B A.",
        },
    },
    {
        skillId: "minor-scales.lesson-4-melodic-minor",
        stepId: "melodic-descending-why",
        patch: {
            title: "Descending uses the natural-minor pitches in this classical form",
            body: "Treat this as the classical scale form being practiced here, not as a rule that every real minor melody must use. On the way down, degrees 7 and 6 return to their natural-minor versions.",
            workedExample: "C melodic minor descending = C B♭ A♭ G F E♭ D C.",
        },
    },
    {
        skillId: "minor-scales.lesson-5-instant-recall",
        stepId: "minor-balanced-roots",
        patch: {
            title: "Mix roots and minor forms",
            body: "Recall practice rotates all 12 pitch classes and all forms taught here. Changing both tonic and form prevents one easy key or one repeated prompt from carrying the session.",
            workedExample: "A sequence can move from E♭ natural minor to C♯ harmonic minor to B♭ melodic minor ascending.",
            visual: { kind: "piano", data: { highlighted: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"], displayLabels: { "C#": "C♯", "D#": "E♭", "F#": "F♯", "G#": "G♯", "A#": "B♭" } } },
            expectation: "understand",
        },
    },
    {
        skillId: "minor-scales.lesson-5-instant-recall",
        stepId: "minor-recall-payoff",
        patch: {
            title: "Free attention for the next layer",
            body: "When minor-scale notes and alterations are automatic, the next phase can use those notes without making you stop to reconstruct the scale first.",
            workedExample: "If A harmonic minor is already A B C D E F G♯, you can work with that collection immediately instead of recalculating it.",
            payoff: undefined,
            expectation: "understand",
        },
    },
]);
const phase4 = patchSteps(priorPhase4Lessons(), [
    {
        skillId: "diatonic-chords.lesson-1-stacking-thirds",
        stepId: "method",
        patch: {
            title: "Build a triad by taking every other scale note",
            body: "Start on one note of the scale, skip the next scale note, take the following note, then repeat once more. The three selected notes are separated by 3rds.",
            workedExample: "In C major: C–E–G, D–F–A, E–G–B.",
            visual: { kind: "scale", data: { notes: ["C", "D", "E", "F", "G", "A", "B"] } },
        },
    },
    {
        skillId: "diatonic-chords.lesson-1-stacking-thirds",
        stepId: "terms",
        patch: {
            title: "Triad vocabulary",
            body: "A chord is a group of notes sounding together. A triad is a three-note chord that can be arranged in stacked 3rds. In that arrangement, the notes are called root, 3rd, and 5th. Diatonic means the notes come from the scale currently being used.",
            workedExample: "In D–F–A, D is the root, F the 3rd, and A the 5th. All three notes are diatonic to C major.",
            visual: { kind: "chord", data: { notes: ["D", "F", "A"] } },
        },
    },
    {
        skillId: "diatonic-chords.lesson-1-stacking-thirds",
        stepId: "phase1",
        patch: {
            title: "Intervals identify the triad quality",
            body: "Chord quality means the chord's type. Measure from the root: Major = M3 + P5; Minor = m3 + P5; Diminished = m3 + d5; Augmented = M3 + A5. A5 is an augmented 5th, one half step larger than P5.",
            workedExample: "C–E–G is major because C→E is M3 and C→G is P5. C–E–G♯ is augmented because C→G♯ is A5.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-2-major-triads",
        stepId: "derive",
        patch: {
            title: "Build all seven triads before memorizing the pattern",
            body: "Use the major scale and stack every other scale note from each degree. A Roman numeral labels the scale degree of the chord root: I means degree 1, II degree 2, and so on. The next screen adds quality to those numerals.",
            workedExample: "C major roots by degree: 1 C–E–G; 2 D–F–A; 3 E–G–B; 4 F–A–C; 5 G–B–D; 6 A–C–E; 7 B–D–F.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-2-major-triads",
        stepId: "pattern",
        patch: {
            title: "Major-key triad pattern",
            body: "I major · ii minor · iii minor · IV major · V major · vi minor · vii° diminished. Uppercase numerals mean major triads, lowercase mean minor triads, and ° marks diminished.",
            workedExample: "In E♭ major, degree 2 is F, so ii is F minor: F–A♭–C.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-6-seventh-chords",
        stepId: "natural",
        patch: {
            title: "Natural-minor seventh-chord pattern",
            body: "i7 · iiø7 · IIImaj7 · iv7 · v7 · VImaj7 · VII7. VII7 has dominant-seventh chord quality: a major triad plus m7. Here the word dominant names the chord type; chord function is taught in Lesson 8.",
            workedExample: "A natural minor: i7 A–C–E–G; iiø7 B–D–F–A; IIImaj7 C–E–G–B; VII7 G–B–D–F.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-7-reference",
        stepId: "other7",
        patch: {
            title: "Less-common seventh-chord lookup",
            body: "Diminished 7: m3 d5 d7 · 1–♭3–♭5–𝄫7. Here d7 is one half step smaller than m7. Minor-major 7: m3 P5 M7 · 1–♭3–5–7. Augmented-major 7: M3 A5 M7 · 1–3–♯5–7.",
            payoff: "Use this page as a reference when a symbol is unfamiliar; the table itself is not a separate concept you need to memorize all at once.",
            expectation: "understand",
        },
    },
    {
        skillId: "diatonic-chords.lesson-8-function",
        stepId: "meaning",
        patch: {
            title: "Chord function means a chord's role",
            body: "Function describes the role a chord tends to play in a progression and where it tends to move. It is different from chord quality, which describes how the chord itself is built.",
            workedExample: "Dominant-seventh is a chord quality. Dominant function is a role a chord can play in a key.",
        },
    },
    {
        skillId: "diatonic-chords.lesson-8-function",
        stepId: "three",
        patch: {
            title: "Three useful chord-function families",
            body: "Here tonic, predominant, and dominant describe chord roles. Tonic feels like home/rest. Predominant often moves away from tonic and prepares dominant. Dominant creates a strong pull toward tonic. These role names are related to, but not identical with, the scale-degree names from Phase 2.",
            workedExample: "C major: I (tonic) → ii or IV (predominant) → V (dominant) → I (tonic).",
        },
    },
    {
        skillId: "diatonic-chords.lesson-10-own-progressions",
        stepId: "safe",
        patch: {
            title: "Analyze against a defined key and scale",
            body: "Choose the key and scale form first, then enter each chord root and quality. The app compares each chord with the diatonic chords generated from that scale and gives a Roman numeral when it matches.",
            expectation: "understand",
        },
    },
]);
const phase5 = patchSteps(priorPhase5Lessons(), [
    {
        skillId: "relatives.lesson-1-relative-major-minor",
        stepId: "relative-definition",
        patch: {
            title: "Relative major and minor share a key signature",
            body: "A key signature is the set of sharps or flats associated with a key. A major key and its relative natural minor use the same seven pitch classes and the same key signature, but a different note is tonic — the musical home.",
            workedExample: "C major = C D E F G A B. A natural minor = A B C D E F G. Both use no sharps or flats, but their tonics are C and A.",
        },
    },
    {
        skillId: "relatives.lesson-1-relative-major-minor",
        stepId: "c-major-piano",
        patch: {
            title: "First, notice the physical keys in C major",
            body: "C major uses the seven white-key pitch classes. Keep that physical set in view; the next screen will change the tonic without changing which piano keys belong to the scale.",
            workedExample: "C major: C D E F G A B.",
        },
    },
    {
        skillId: "relatives.lesson-1-relative-major-minor",
        stepId: "a-minor-piano",
        patch: {
            title: "Now start from A without changing the key set",
            body: "A natural minor uses the same seven physical piano keys. What changes is the tonic: A, not C, is now treated as home.",
            workedExample: "A natural minor: A B C D E F G.",
        },
    },
    {
        skillId: "relatives.lesson-3-fast-identification",
        stepId: "major-to-minor",
        patch: {
            title: "Major → relative minor: down m3",
            body: "The relative minor tonic sits a minor 3rd below the major tonic. Use the Phase 1 m3 distance, then check the written key spelling against the shared key signature.",
            workedExample: "C major down m3 = A minor.",
        },
    },
    {
        skillId: "relatives.lesson-3-fast-identification",
        stepId: "minor-to-major",
        patch: {
            title: "Minor → relative major: up m3",
            body: "Reverse the direction: the relative major tonic sits a minor 3rd above the minor tonic. The shared key signature still decides the correct enharmonic spelling.",
            workedExample: "C minor up m3 = E♭ major.",
        },
    },
    {
        skillId: "relatives.lesson-3-fast-identification",
        stepId: "phase1-link",
        patch: {
            title: "The distance is old; the key relationship is new",
            body: "You already know how far a minor 3rd is. The new skill is using that distance to locate a relative key, then choosing the spelling that shares the original key signature.",
            workedExample: "F♯ major down m3 lands on D♯, giving D♯ minor. F♯ minor up m3 lands on A, giving A major.",
        },
    },
]);
const phase6 = patchSteps(priorPhase6Lessons(), [
    {
        skillId: "circle-of-fifths.lesson-1-what-it-represents",
        stepId: "relationship-map",
        patch: {
            title: "The circle maps neighboring key signatures",
            body: "Around the Circle of Fifths, neighboring major-key positions differ by one sharp or one flat. The point of the map is to see relationships between keys, not to memorize a wheel without knowing what its positions mean.",
            workedExample: "From C major, the immediate neighbors are G major and F major.",
        },
    },
    {
        skillId: "circle-of-fifths.lesson-1-what-it-represents",
        stepId: "counterclockwise-inverse",
        patch: {
            title: "Counterclockwise gives the P4/P5 partner direction",
            body: "From one tonic, moving counterclockwise reaches a note a P4 above. The same destination can also be described as a P5 below, so the Phase 1 P4↔P5 relationship explains both directions.",
            workedExample: "C→F counterclockwise is C up a P4, or equivalently C down a P5 to F.",
        },
    },
    {
        skillId: "circle-of-fifths.lesson-2-close-vs-distant",
        stepId: "close-definition",
        patch: {
            title: "Closely related keys share a lot of material",
            body: "For a major home key, a useful closely related family includes the two neighboring major keys plus the relative minors of the home key and those two neighbors. Their key signatures differ little, so they share many diatonic notes and chords.",
            workedExample: "For C major: F major, G major, D minor, A minor, and E minor are closely related keys.",
        },
    },
    {
        skillId: "circle-of-fifths.lesson-4-far-side-transposition",
        stepId: "far-side-rule",
        patch: {
            title: "Use a target 4–6 circle steps away",
            body: "This drill deliberately chooses a major key far enough away to force real transfer instead of another neighboring-key repetition.",
            workedExample: "From C, E major and A♭ major are 4 steps away; B major and D♭/C♯ major are 5; F♯/G♭ major is 6.",
        },
    },
    {
        skillId: "circle-of-fifths.lesson-4-far-side-transposition",
        stepId: "practical-loop",
        patch: {
            title: "Finish by making the transposition musical",
            body: "After the lab gives you the correctly spelled target chords, play them on piano or program them in MIDI. The exercise is complete when the progression works in the new key, not when you can merely point to the key on the circle.",
            workedExample: "Transpose a familiar I–V–vi–IV loop into F♯ major, then actually play or program F♯–C♯–D♯m–B.",
            payoff: "This combines the interval, scale, chord, Roman-numeral, relative-key, and circle skills from the full curriculum.",
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
