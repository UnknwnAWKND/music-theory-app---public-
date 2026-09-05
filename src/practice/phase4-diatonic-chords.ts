import type { LessonContent, LessonTeachingStep } from "./types.js";

function lesson(skillId: string, title: string, teachingSteps: readonly LessonTeachingStep[]): LessonContent {
  return { skillId, title, teachingSteps };
}

export const PHASE4_DIATONIC_CHORD_LESSONS: readonly LessonContent[] = Object.freeze([
  lesson("diatonic-chords.lesson-1-stacking-thirds", "Stacking 3rds", [
    { id: "method", title: "Build from every other scale note", body: "Tertian harmony means harmony built by stacking 3rds. Inside one scale, start on a scale degree and take every other note: root, 3rd, 5th.", workedExample: "C major: C–E–G, D–F–A, E–G–B.", expectation: "understand", visual: { kind: "scale", data: { notes: ["C", "D", "E", "F", "G", "A", "B"] } } },
    { id: "terms", title: "Four words you need", body: "A triad is a three-note chord built in stacked 3rds. The root names the chord. The 3rd is a third above the root. The 5th is a fifth above the root. Diatonic means the notes come from the scale currently being used.", workedExample: "In D–F–A, D is root, F is the 3rd, A is the 5th.", expectation: "understand", visual: { kind: "chord", data: { notes: ["D", "F", "A"] } } },
    { id: "phase1", title: "Phase 1 is doing real work now", body: "The interval qualities from Phase 1 tell you the chord quality. Major triad = M3 + P5 from the root. Minor = m3 + P5. Diminished = m3 + d5. Augmented = M3 + A5.", payoff: "You are no longer memorizing isolated interval facts; those intervals now generate harmony.", expectation: "know-instantly", visual: { kind: "chord", data: { notes: ["C", "E", "G"] } } },
  ]),
  lesson("diatonic-chords.lesson-2-major-triads", "Major Key Triads", [
    { id: "derive", title: "Derive the pattern before memorizing it", body: "Use the major scale from Phase 2. Start on each scale degree and stack every other scale note. A Roman numeral shows the scale degree of the chord root and, in this curriculum, its quality.", workedExample: "C major: I C–E–G, ii D–F–A, iii E–G–B, IV F–A–C, V G–B–D, vi A–C–E, vii° B–D–F.", expectation: "understand", visual: { kind: "scale", data: { notes: ["C", "D", "E", "F", "G", "A", "B"] } } },
    { id: "pattern", title: "The major-key pattern", body: "I major · ii minor · iii minor · IV major · V major · vi minor · vii° diminished. Uppercase means major, lowercase means minor, and ° means diminished.", workedExample: "In E♭ major, degree 2 is F, so ii is F minor: F–A♭–C.", expectation: "know-instantly" },
    { id: "payoff", title: "Why this becomes automatic", body: "Once the pattern is fast, a Roman numeral tells you what chord to build in any major key. The scale still generates the notes, so you can always reconstruct the answer when memory slips.", payoff: "This is the bridge from knowing scales to actually knowing the chords in a key.", expectation: "know-instantly" },
  ]),
  lesson("diatonic-chords.lesson-3-natural-minor-triads", "Natural Minor Triads", [
    { id: "derive", title: "Use the natural-minor collection", body: "Start with the correctly spelled natural minor scale from Phase 3, then stack every other scale note on each degree.", workedExample: "A natural minor gives: i Am, ii° B°, III C, iv Dm, v Em, VI F, VII G.", expectation: "understand", visual: { kind: "scale", data: { notes: ["A", "B", "C", "D", "E", "F", "G"] } } },
    { id: "pattern", title: "Natural-minor triad pattern", body: "i minor · ii° diminished · III major · iv minor · v minor · VI major · VII major.", workedExample: "In C minor: i C–E♭–G; iv F–A♭–C; VII B♭–D–F.", expectation: "know-instantly" },
  ]),
  lesson("diatonic-chords.lesson-4-harmonic-minor-triads", "Harmonic Minor Triads", [
    { id: "raised7", title: "One changed scale note changes several chords", body: "Harmonic minor raises scale degree 7. Rebuild the triads from that scale instead of trying to edit a memorized chord list.", workedExample: "A harmonic minor: A B C D E F G♯. Stack thirds from every degree.", expectation: "understand", visual: { kind: "scale", data: { notes: ["A", "B", "C", "D", "E", "F", "G♯"] } } },
    { id: "dominant", title: "The practical payoff: V becomes major", body: "The raised 7 becomes the 3rd of the V chord. In A minor, E–G–B is minor; raising G to G♯ makes E–G♯–B a major V chord. That leading tone strengthens the pull back to i.", workedExample: "A harmonic minor: V = E–G♯–B → Am.", payoff: "This is a major reason tonal minor uses the raised 7.", expectation: "understand", visual: { kind: "chord", data: { notes: ["E", "G♯", "B"] } } },
    { id: "pattern", title: "Harmonic-minor triads", body: "i · ii° · III+ · iv · V · VI · vii°. The + means augmented.", workedExample: "III+ in A harmonic minor is C–E–G♯. The raised G♯ is an augmented 5th above C.", expectation: "know-instantly" },
  ]),
  lesson("diatonic-chords.lesson-5-melodic-minor-triads", "Melodic Minor Triads", [
    { id: "ascending", title: "Use ascending melodic minor here", body: "For this lesson, use the ascending form from Phase 3: raise 6 and 7 relative to natural minor, then stack thirds inside that collection.", workedExample: "A melodic minor ascending: A B C D E F♯ G♯.", expectation: "understand", visual: { kind: "scale", data: { notes: ["A", "B", "C", "D", "E", "F♯", "G♯"] } } },
    { id: "pattern", title: "Ascending melodic-minor triads", body: "i · ii · III+ · IV · V · vi° · vii°. Notice ii and IV change compared with natural minor because degree 6 is raised.", workedExample: "In A: ii = B–D–F♯ (minor), IV = D–F♯–A (major).", expectation: "understand" },
    { id: "priority", title: "Know the method more than the list", body: "This pattern matters, but it is lower automaticity than the basic major and natural-minor patterns. Be able to derive it accurately from the ascending scale.", expectation: "understand" },
  ]),
  lesson("diatonic-chords.lesson-6-seventh-chords", "Diatonic 7th Chords", [
    { id: "method", title: "Stack one more 3rd", body: "A seventh chord extends a triad by adding the next every-other scale note: root, 3rd, 5th, 7th.", workedExample: "C major Imaj7 = C–E–G–B. V7 = G–B–D–F.", expectation: "understand", visual: { kind: "chord", data: { notes: ["G", "B", "D", "F"] } } },
    { id: "major", title: "Major-key seventh pattern", body: "Imaj7 · ii7 · iii7 · IVmaj7 · V7 · vi7 · viiø7. ø means half-diminished: diminished triad + minor 7th.", expectation: "know-instantly" },
    { id: "natural", title: "Natural-minor seventh pattern", body: "i7 · iiø7 · IIImaj7 · iv7 · v7 · VImaj7 · VII7. VII7 has dominant-seventh chord quality, but that quality name does not automatically mean dominant function in the key.", expectation: "understand" },
    { id: "harmonic", title: "Harmonic-minor seventh pattern", body: "i(maj7) · iiø7 · III+maj7 · iv7 · V7 · VImaj7 · vii°7. This is where minor-major 7, augmented-major 7, and fully diminished 7 appear.", workedExample: "A harmonic minor: i(maj7) = A–C–E–G♯; vii°7 = G♯–B–D–F.", expectation: "understand" },
    { id: "melodic", title: "Ascending melodic-minor seventh pattern", body: "i(maj7) · ii7 · III+maj7 · IV7 · V7 · viø7 · viiø7. Derive this from the raised 6 and 7 rather than drilling it as heavily as the major pattern.", expectation: "understand" },
  ]),
  lesson("diatonic-chords.lesson-7-reference", "Chord-Type Reference Table", [
    { id: "triads", title: "Triad lookup", body: "Major: M3, P5 · 1–3–5 · C–E–G. Minor: m3, P5 · 1–♭3–5 · C–E♭–G. Diminished: m3, d5 · 1–♭3–♭5 · C–E♭–G♭. Augmented: M3, A5 · 1–3–♯5 · C–E–G♯.", expectation: "understand" },
    { id: "common7", title: "Common seventh-chord lookup", body: "Major 7: M3 P5 M7 · 1–3–5–7. Minor 7: m3 P5 m7 · 1–♭3–5–♭7. Dominant 7: M3 P5 m7 · 1–3–5–♭7. Half-diminished 7: m3 d5 m7 · 1–♭3–♭5–♭7.", expectation: "understand" },
    { id: "other7", title: "Minor-form seventh lookup", body: "Diminished 7: m3 d5 d7 · 1–♭3–♭5–𝄫7. Minor-major 7: m3 P5 M7 · 1–♭3–5–7. Augmented-major 7: M3 A5 M7 · 1–3–♯5–7.", payoff: "This card is a lookup tool. It has no mastery quiz and creates no READY evidence.", expectation: "understand" },
  ]),
  lesson("diatonic-chords.lesson-8-function", "Chord Function", [
    { id: "meaning", title: "Function means a chord's role", body: "Chord function is what role a chord tends to play in a progression and where it tends to move. It is not the same thing as chord quality.", workedExample: "A dominant-seventh quality chord is a chord type; dominant function is a role in a key.", expectation: "understand" },
    { id: "three", title: "Three useful functional families", body: "Tonic = home/rest. Predominant = moves away from tonic and often prepares dominant. Dominant = creates pull toward tonic. IV is traditionally called the subdominant chord; here, predominant is the broader functional category that includes ii and IV.", workedExample: "C major: I (tonic) → ii or IV (predominant) → V (dominant) → I (tonic).", expectation: "know-instantly" },
    { id: "context", title: "Function depends on context", body: "Do not stamp every chord with one eternal function. I is the clearest tonic, ii/IV are the clearest predominants, and V/vii° are the clearest dominants. iii and vi can behave differently depending on the progression and style.", payoff: "You are learning tendencies you can hear and use, not another arbitrary label list.", expectation: "understand" },
  ]),
  lesson("diatonic-chords.lesson-9-progressions", "Common Progression Vocabulary", [
    { id: "vocab", title: "Roman numerals are portable", body: "A Roman-numeral progression describes relationships, not one fixed set of chord names. Move the same degrees to another key and the musical relationship survives.", workedExample: "I–V–vi–IV in C: C–G–Am–F. In E♭: E♭–B♭–Cm–A♭.", expectation: "know-instantly" },
    { id: "major", title: "Common major-key vocabulary", body: "Practice I–V–vi–IV, vi–IV–I–V, ii–V–I, and I–vi–ii–V. These are examples and useful vocabulary, not the only progressions that matter.", expectation: "know-instantly" },
    { id: "minor", title: "A minor-key vocabulary example", body: "i–VI–III–VII uses natural-minor diatonic triads. Build each chord from the key instead of memorizing one key's chord names.", workedExample: "A minor: Am–F–C–G. C minor: Cm–A♭–E♭–B♭.", expectation: "understand" },
  ]),
  lesson("diatonic-chords.lesson-10-own-progressions", "Analyze Your Own Progressions", [
    { id: "safe", title: "Bring your own chords in safely", body: "Use structured input: choose the key and scale form, then choose each chord root and quality. The app compares your chord with the diatonic chords generated from that scale and gives the Roman numeral when it matches.", expectation: "understand" },
    { id: "outside", title: "Non-diatonic does not mean bad", body: "If one of your chords is outside the current scale, the app labels it outside the current diatonic set and explains the closest in-key result. It does not pretend to parse advanced chromatic harmony that has not been taught yet.", workedExample: "In C major, D major is not the diatonic ii chord; D minor is. D major can still be musically useful, but explaining why belongs to later chromatic harmony.", expectation: "understand" },
    { id: "goal", title: "Analyze 2–3 real progressions", body: "Use this tool on two or three progressions you actually play or produce. The goal is to connect Roman numerals to your own musical decisions, not just textbook examples.", payoff: "When you can see your own music as scale-degree relationships, transposition becomes much easier.", expectation: "know-instantly" },
  ]),
]);
