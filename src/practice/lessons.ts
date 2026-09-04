import type { LessonContent } from "./types.js";

const PHASE1_LESSONS: readonly LessonContent[] = Object.freeze([
  {
    skillId: "intervals.lesson-1-unison-octave",
    title: "Perfect Unison & Perfect Octave",
    teachingSteps: [
      {
        id: "interval-means-distance",
        title: "What an interval is",
        body: "An interval is the distance between two notes. Its full name has a number and a quality. The number tells you the letter-name distance; the quality tells you the exact size.",
        workedExample: "C to G is some kind of 5th because C-D-E-F-G counts five letter names. Its exact quality is Perfect, so it is P5.",
        expectation: "understand",
      },
      {
        id: "perfect-family",
        title: "Why these are called Perfect",
        body: "Unisons, 4ths, 5ths, and octaves belong to the Perfect family. They use Perfect instead of Major or Minor for their normal form.",
        workedExample: "P1 means Perfect Unison. P8 means Perfect Octave.",
        expectation: "understand",
      },
      {
        id: "p1",
        title: "Perfect Unison — P1",
        body: "A Perfect Unison is the same written note at the same pitch: zero semitones apart.",
        workedExample: "C to C at the same register = P1.",
        payoff: "Instantly recognizing P1 keeps same-note questions from being confused with octaves later.",
        expectation: "know-instantly",
        visual: { kind: "piano", data: { highlighted: ["C"] } },
      },
      {
        id: "p8",
        title: "Perfect Octave — P8",
        body: "A Perfect Octave uses the same letter name one octave higher or lower. It spans 12 semitones.",
        workedExample: "C up to the next C = P8.",
        payoff: "Octaves appear constantly in voicings, bass lines, melodies, and keyboard layout.",
        expectation: "know-instantly",
        visual: { kind: "interval", data: { root: "C", target: "C", label: "P8 · 12 semitones" } },
      },
      {
        id: "simple-term",
        title: "Simple vs. compound",
        body: "Intervals from a unison through an octave are called simple intervals. An interval larger than an octave is compound. Phase 1 drills simple intervals; compound intervals can be understood later as octave-expanded versions.",
        workedExample: "A 3rd is simple. A 10th is the compound version of a 3rd.",
        expectation: "understand",
      },
    ],
  },
  {
    skillId: "intervals.lesson-2-perfect-fifth",
    title: "Perfect 5th",
    teachingSteps: [
      {
        id: "p5-definition",
        title: "Perfect 5th — P5",
        body: "A Perfect 5th spans five letter names and seven semitones. Count the starting letter as 1.",
        workedExample: "C-D-E-F-G gives five letters, and C to G is seven semitones: P5.",
        expectation: "know-instantly",
        visual: { kind: "piano", data: { highlighted: ["C", "G"] } },
      },
      {
        id: "p5-spelling",
        title: "The letters still matter",
        body: "The target must be a 5th by letter name before accidentals decide the exact pitch. Do not choose a note only because it is seven piano keys away.",
        workedExample: "A P5 above B is F♯, not G♭. B-C-D-E-F is the required 5th letter.",
        expectation: "understand",
      },
      {
        id: "p5-payoff",
        title: "Why memorize this",
        body: "The P5 is one of the main building blocks of triads and power-chord shapes. You want the target note to arrive without counting.",
        workedExample: "F → C should become immediate, just like C → G.",
        payoff: "Automatic P5 construction will make chord construction much faster later.",
        expectation: "know-instantly",
      },
      {
        id: "p5-cumulative",
        title: "Keep P1 and P8 alive",
        body: "Practice now mixes P5 with the P1 and P8 you already learned instead of isolating the new interval forever.",
        workedExample: "You may see C→G, A→A at the same pitch, then D→the next D.",
        expectation: "understand",
      },
    ],
  },
  {
    skillId: "intervals.lesson-3-perfect-fourth",
    title: "Perfect 4th",
    teachingSteps: [
      {
        id: "p4-definition",
        title: "Perfect 4th — P4",
        body: "A Perfect 4th spans four letter names and five semitones.",
        workedExample: "C-D-E-F gives four letters, and C to F is five semitones: P4.",
        expectation: "know-instantly",
        visual: { kind: "piano", data: { highlighted: ["C", "F"] } },
      },
      {
        id: "inversion-definition",
        title: "What interval inversion means",
        body: "To invert an interval, flip which note is on the bottom by moving one note by an octave. The two notes stay the same pitch classes, but the measured interval changes.",
        workedExample: "C up to G is P5. Move C above G: G up to C is P4.",
        expectation: "understand",
      },
      {
        id: "p5-p4-inversion",
        title: "P5 ↔ P4",
        body: "A 5th inverts to a 4th, and a 4th inverts to a 5th. Their numbers add to 9: 5 + 4 = 9.",
        workedExample: "D→A is P5. A→D after inversion is P4.",
        expectation: "know-instantly",
        visual: { kind: "interval", data: { root: "C", target: "G", label: "P5 ↔ P4" } },
      },
      {
        id: "perfect-stays-perfect",
        title: "Perfect stays Perfect",
        body: "When a Perfect interval is inverted, the quality remains Perfect.",
        workedExample: "P5 ↔ P4 and P1 ↔ P8.",
        expectation: "understand",
      },
      {
        id: "p4-payoff",
        title: "Why this matters",
        body: "Knowing P4 and P5 as a pair lets you solve one from the other and prepares you for chord roots, bass motion, and later voice-leading work.",
        payoff: "You are starting to memorize interval relationships instead of isolated facts.",
        expectation: "know-instantly",
      },
    ],
  },
  {
    skillId: "intervals.lesson-4-thirds",
    title: "Major 3rd & Minor 3rd",
    teachingSteps: [
      {
        id: "major-minor-family",
        title: "Major and Minor interval families",
        body: "2nds, 3rds, 6ths, and 7ths use Major and Minor qualities. For the same interval number, Minor is one semitone smaller than Major.",
        workedExample: "A Major 3rd is 4 semitones. A Minor 3rd is 3 semitones.",
        expectation: "understand",
      },
      {
        id: "m3",
        title: "Major 3rd — M3",
        body: "A Major 3rd spans three letter names and four semitones.",
        workedExample: "F-G-A is a 3rd, and F to A is four semitones: M3.",
        expectation: "know-instantly",
        visual: { kind: "piano", data: { highlighted: ["F", "A"] } },
      },
      {
        id: "minor3",
        title: "Minor 3rd — m3",
        body: "A Minor 3rd spans three letter names and three semitones.",
        workedExample: "F-G-A is still a 3rd by letters. Lower A to A♭ and the interval becomes m3.",
        expectation: "know-instantly",
        visual: { kind: "piano", data: { highlighted: ["F", "G#"] } },
      },
      {
        id: "third-spelling",
        title: "Do not ignore spelling",
        body: "The note letter determines the interval number. Accidentals then determine Major, Minor, Augmented, or Diminished quality.",
        workedExample: "C→E♭ is m3. C→D♯ sounds the same on piano, but it is an augmented 2nd, not a 3rd.",
        expectation: "understand",
      },
      {
        id: "third-payoff",
        title: "Why 3rds matter",
        body: "Major and Minor 3rds determine the basic quality of major and minor triads, so these need fast recall.",
        payoff: "When triads arrive later, you should not need to count out every 3rd from scratch.",
        expectation: "know-instantly",
      },
    ],
  },
  {
    skillId: "intervals.lesson-5-sixths",
    title: "Major 6th & Minor 6th",
    teachingSteps: [
      {
        id: "sixths",
        title: "M6 and m6",
        body: "A Major 6th spans six letters and nine semitones. A Minor 6th spans six letters and eight semitones.",
        workedExample: "C→A = M6. C→A♭ = m6.",
        expectation: "know-instantly",
        visual: { kind: "interval", data: { root: "C", target: "A", label: "M6 · 9 semitones" } },
      },
      {
        id: "major-minor-flip",
        title: "Major and Minor flip under inversion",
        body: "When a Major interval inverts, it becomes Minor. When a Minor interval inverts, it becomes Major.",
        workedExample: "M3 ↔ m6. m3 ↔ M6.",
        expectation: "understand",
      },
      {
        id: "m3-m6",
        title: "M3 ↔ m6",
        body: "A Major 3rd inverts to a Minor 6th because 3 + 6 = 9 and Major flips to Minor.",
        workedExample: "C→E is M3. E→C after inversion is m6.",
        expectation: "know-instantly",
      },
      {
        id: "minor3-major6",
        title: "m3 ↔ M6",
        body: "A Minor 3rd inverts to a Major 6th because 3 + 6 = 9 and Minor flips to Major.",
        workedExample: "C→E♭ is m3. E♭→C after inversion is M6.",
        expectation: "know-instantly",
      },
      {
        id: "sixths-payoff",
        title: "Think in pairs",
        body: "You now know 3rds and 6ths as connected families. Practice deliberately mixes these inversion partners so they stop blurring together.",
        payoff: "Fast inversion partners make later harmony and voice-leading much easier to reason through.",
        expectation: "understand",
      },
    ],
  },
  {
    skillId: "intervals.lesson-6-seconds",
    title: "Major 2nd & Minor 2nd",
    teachingSteps: [
      {
        id: "seconds",
        title: "M2 and m2",
        body: "A Major 2nd spans two letters and two semitones. A Minor 2nd spans two letters and one semitone.",
        workedExample: "C→D = M2. C→D♭ = m2.",
        expectation: "know-instantly",
        visual: { kind: "piano", data: { highlighted: ["C", "D"] } },
      },
      {
        id: "half-whole",
        title: "Keyboard anchor",
        body: "On piano, m2 is one adjacent-key half step. M2 is two half steps, often called a whole step. The letter spelling still has to be a 2nd.",
        workedExample: "E→F = m2. E→F♯ = M2.",
        expectation: "know-instantly",
      },
      {
        id: "seconds-spelling",
        title: "Same sound does not always mean same interval name",
        body: "The written letters decide the number first. Two semitones can be M2 or an enharmonically equivalent diminished 3rd depending on spelling.",
        workedExample: "C→D = M2. C→E𝄫 would be d3 even though it reaches the same piano key as D.",
        expectation: "understand",
      },
      {
        id: "seconds-cumulative",
        title: "Keep earlier intervals moving",
        body: "Practice adds M2 and m2 without dropping P1, P8, P5, P4, 3rds, or 6ths.",
        workedExample: "A round can jump from F→G to C→A♭ to B→F♯ so you must identify the relationship, not memorize a block pattern.",
        expectation: "understand",
      },
    ],
  },
  {
    skillId: "intervals.lesson-7-sevenths",
    title: "Major 7th & Minor 7th",
    teachingSteps: [
      {
        id: "sevenths",
        title: "M7 and m7",
        body: "A Major 7th spans seven letters and eleven semitones. A Minor 7th spans seven letters and ten semitones.",
        workedExample: "C→B = M7. C→B♭ = m7.",
        expectation: "know-instantly",
        visual: { kind: "interval", data: { root: "C", target: "B", label: "M7 · 11 semitones" } },
      },
      {
        id: "M2-m7",
        title: "M2 ↔ m7",
        body: "A Major 2nd inverts to a Minor 7th: 2 + 7 = 9 and Major flips to Minor.",
        workedExample: "C→D is M2. D→C after inversion is m7.",
        expectation: "know-instantly",
      },
      {
        id: "m2-M7",
        title: "m2 ↔ M7",
        body: "A Minor 2nd inverts to a Major 7th: 2 + 7 = 9 and Minor flips to Major.",
        workedExample: "C→D♭ is m2. D♭→C after inversion is M7.",
        expectation: "know-instantly",
      },
      {
        id: "seventh-discrimination",
        title: "Discriminate the partners",
        body: "Practice deliberately alternates 2nds and 7ths so you learn to choose the right relationship under pressure rather than relying on a lesson-sized block.",
        workedExample: "M2 ↔ m7 and m2 ↔ M7 should become paired facts.",
        expectation: "understand",
      },
    ],
  },
  {
    skillId: "intervals.lesson-8-tritone",
    title: "Tritone: Augmented 4th / Diminished 5th",
    teachingSteps: [
      {
        id: "tritone",
        title: "What a tritone is",
        body: "A tritone spans six semitones. In equal temperament, an Augmented 4th and a Diminished 5th land on the same piano-key distance, but their written interval names are not interchangeable.",
        workedExample: "C→F♯ and C→G♭ both span six semitones.",
        expectation: "understand",
      },
      {
        id: "a4",
        title: "Augmented 4th — A4",
        body: "Start with a 4th by letter name, then make it one semitone larger than a Perfect 4th.",
        workedExample: "C→F is P4, so C→F♯ is A4.",
        expectation: "know-instantly",
        visual: { kind: "piano", data: { highlighted: ["C", "F#"] } },
      },
      {
        id: "d5",
        title: "Diminished 5th — d5",
        body: "Start with a 5th by letter name, then make it one semitone smaller than a Perfect 5th.",
        workedExample: "C→G is P5, so C→G♭ is d5.",
        expectation: "know-instantly",
        visual: { kind: "piano", data: { highlighted: ["C", "F#"] } },
      },
      {
        id: "spelling-decides-name",
        title: "Spelling determines the name",
        body: "C→F♯ must be some kind of 4th because the letters are C-D-E-F. C→G♭ must be some kind of 5th because the letters are C-D-E-F-G. The same piano key does not erase that spelling difference.",
        workedExample: "A4 above C = F♯. d5 above C = G♭.",
        expectation: "understand",
      },
      {
        id: "double-accidentals",
        title: "Double accidentals can be correct",
        body: "Exact spelling sometimes requires a double sharp or double flat. The engine keeps the required target letter first, then chooses the accidental that produces the requested interval.",
        workedExample: "A4 above G♯ is C𝄪 (C double-sharp), not D. The interval must remain a 4th by letter name.",
        expectation: "understand",
      },
      {
        id: "tritone-inversion",
        title: "A4 ↔ d5",
        body: "Augmented intervals invert to Diminished intervals, and 4ths invert to 5ths. So A4 ↔ d5.",
        workedExample: "C→F♯ is A4. F♯→C after inversion is d5.",
        expectation: "know-instantly",
      },
    ],
  },
  {
    skillId: "intervals.lesson-9-inversion-capstone",
    title: "Inversion Rule Capstone",
    teachingSteps: [
      {
        id: "numbers-add-nine",
        title: "Inversion numbers add to 9",
        body: "For simple intervals, the original number plus the inverted number equals 9.",
        workedExample: "3 + 6 = 9, so every 3rd inverts to some kind of 6th.",
        expectation: "understand",
      },
      {
        id: "number-pairs",
        title: "Know the number pairs",
        body: "Memorize these pairs: 1↔8, 2↔7, 3↔6, 4↔5.",
        workedExample: "If you see a 7th, its inversion is a 2nd before you even think about quality.",
        expectation: "know-instantly",
      },
      {
        id: "quality-rules",
        title: "Know the quality rules",
        body: "Major ↔ Minor. Augmented ↔ Diminished. Perfect ↔ Perfect.",
        workedExample: "M3→m6, m2→M7, A4→d5, P5→P4.",
        expectation: "know-instantly",
      },
      {
        id: "why-quality-changes",
        title: "Why quality changes",
        body: "Inversion fills the remaining space inside an octave. A larger version of one interval leaves a smaller version of its partner, so Major pairs with Minor and Augmented pairs with Diminished. Perfect pairs stay Perfect.",
        workedExample: "C→E is 4 semitones (M3). E→the next C is 8 semitones (m6). Together they fill the 12-semitone octave.",
        expectation: "understand",
      },
      {
        id: "capstone-use",
        title: "Use the rule, not a guess",
        body: "First invert the number, then invert the quality. This works even when the note spelling looks unfamiliar.",
        workedExample: "m7: 7→2 and Minor→Major, so m7→M2.",
        payoff: "This turns many interval questions into a fast two-part rule instead of separate memorization.",
        expectation: "know-instantly",
      },
    ],
  },
  {
    skillId: "intervals.lesson-10-cumulative",
    title: "Cumulative Drilling",
    teachingSteps: [
      {
        id: "coverage",
        title: "Everything in Phase 1 now mixes",
        body: "This phase teaches 14 distinct simple interval spellings: P1, P8, P5, P4, M3, m3, M6, m6, M2, m2, M7, m7, A4, and d5. A4 and d5 share a six-semitone sound on equal-tempered piano but remain different written intervals.",
        workedExample: "C→F♯ = A4 while C→G♭ = d5.",
        expectation: "understand",
      },
      {
        id: "identify-direction",
        title: "Direction 1 — identify",
        body: "Given two notes, name the exact interval: number plus quality.",
        workedExample: "F→A = M3. B→F = d5.",
        expectation: "know-instantly",
      },
      {
        id: "construct-direction",
        title: "Direction 2 — construct",
        body: "Given a root and requested interval, produce the correctly spelled target note.",
        workedExample: "M3 above F = A. d5 above C = G♭.",
        expectation: "know-instantly",
      },
      {
        id: "automaticity",
        title: "READY is not the finish line",
        body: "The goal is automaticity. READY means you can move forward; it does not remove intervals from review. Later practice keeps sampling them, especially inside scales and harmony.",
        workedExample: "A learner can be READY today and still receive spaced interval retrievals next week.",
        expectation: "understand",
      },
      {
        id: "what-to-know",
        title: "What must become instant",
        body: "Interval construction, interval identification, the common inversion partners, and exact target-note spelling should become fast and accurate. The deeper reasons behind inversion and enharmonic spelling should remain understandable, not merely recited.",
        payoff: "These interval facts become the mental multiplication table for later theory.",
        expectation: "know-instantly",
      },
    ],
  },
]);

const LESSONS = new Map(PHASE1_LESSONS.map((lesson) => [lesson.skillId, lesson]));

export function registerLesson(content: LessonContent): void {
  LESSONS.set(content.skillId, content);
}

export function lessonForSkill(skillId: string): LessonContent | undefined {
  return LESSONS.get(skillId);
}

export function activeLessonSkillIds(): string[] {
  return [...LESSONS.keys()];
}

export function phase1Lessons(): readonly LessonContent[] {
  return PHASE1_LESSONS;
}
