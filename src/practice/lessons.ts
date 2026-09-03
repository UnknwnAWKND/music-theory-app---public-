import { SKILL_BY_ID } from "../curriculum/index.js";
import { INTERVALS } from "../theory/index.js";

const MODE_PARALLEL_ALTERATIONS = { lydian: "major with ♯4", mixolydian: "major with ♭7", dorian: "natural minor with raised 6", phrygian: "natural minor with ♭2", locrian: "natural minor with ♭2 and ♭5" } as const;
import type { LessonCard } from "./types.js";

const TRIAD_RULE: Record<string, string> = {
  "triad.major": "Major triad = root, major 3rd, perfect 5th (stacked M3 + m3).",
  "triad.minor": "Minor triad = root, minor 3rd, perfect 5th (stacked m3 + M3).",
  "triad.diminished": "Diminished triad = root, minor 3rd, diminished 5th (stacked m3 + m3).",
  "triad.augmented": "Augmented triad = root, major 3rd, augmented 5th (stacked M3 + M3).",
};

const SEVENTH_RULE: Record<string, string> = {
  "seventh.major7": "Major 7 = major triad + major 7th.",
  "seventh.minor7": "Minor 7 = minor triad + minor 7th.",
  "seventh.dominant7": "Dominant 7 quality = major triad + minor 7th. It often appears on V, but quality and harmonic function are not the same thing.",
  "seventh.halfdim7": "Half-diminished 7 = diminished triad + minor 7th.",
  "seventh.dim7": "Fully diminished 7 = diminished triad + diminished 7th; correct spelling can require double flats/sharps.",
};

function intervalLesson(skillId: string): LessonCard | null {
  const key = skillId.replace("interval.", "");
  if (key in INTERVALS) {
    const spec = INTERVALS[key as keyof typeof INTERVALS];
    return {
      skillId,
      title: `Construct ${spec.name}`,
      summary: `An interval has both a number (letter distance) and a quality. ${spec.name} spans ${spec.semitones} semitone${spec.semitones === 1 ? "" : "s"}.`,
      rule: `${spec.name}: interval number ${spec.number}, ${spec.semitones} semitones. Keep the target letter consistent with the interval number.`,
      workedExample: key === "M3" ? "F♯ up a major 3rd is A♯, not B♭: both sound on the same piano key, but only A♯ is a third above F." : undefined,
    };
  }
  return null;
}

export function lessonForSkill(skillId: string): LessonCard {
  const skill = SKILL_BY_ID.get(skillId);
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  const interval = intervalLesson(skillId);
  if (interval) return interval;

  const exact: Record<string, Omit<LessonCard, "skillId" | "title">> = {
    "pitch.accidentals": { summary: "You already know what sharps and flats are. The new idea here is enharmonic spelling: two note names can point to the exact same piano key while meaning different things in theory. For example, A♯ and B♭ sound the same on a modern piano, but the correct name depends on the musical relationship you are describing. This matters because scales, intervals, and chords are built from letter relationships as well as sound. So the app will sometimes require the theoretically correct name even when another name would land on the same key.", rule: "Choose the note name that preserves the correct letter structure of the scale, interval, or chord—not merely a name for the same piano key.", workedExample: "In F♯ major, the third scale degree is A♯, not B♭. F♯–G♯–A♯ uses consecutive letter names F–G–A. Writing B♭ would skip A and break the scale spelling even though A♯ and B♭ are the same piano key." },
    "pitch.half-whole": { summary: "Half steps and whole steps are the distance units we will use to construct intervals and scales. A half step moves to the immediately adjacent piano key, regardless of color; a whole step spans two half steps. The important part is not memorizing the definition—it is being able to use these distances quickly when deriving larger structures.", rule: "Half step = 1 semitone. Whole step = 2 semitones.", workedExample: "E→F is a half step even though both are white keys. F→G is a whole step because F→F♯ and F♯→G are two half steps." },
    "interval.generic-number": { summary: "An interval has two parts: a number and a quality. The number tells you how many letter names the interval spans. Count the starting and ending letters inclusively. This is why written note names matter before semitone distance does.", rule: "Count letters first: C–D = 2nd, C–E = 3rd, C–F = 4th, and so on. Accidentals do not change the interval number.", workedExample: "C→E♭ is still a 3rd because C–D–E spans three letters. C→D♯ is a 2nd because C–D spans two letters, even though D♯ and E♭ are the same piano key." },
    "interval.quality-system": { summary: "The interval number tells you the letter span; the quality tells you its exact size. There are two quality families. Unisons, 4ths, 5ths, and octaves use perfect as their normal form. 2nds, 3rds, 6ths, and 7ths use major and minor as their normal forms. Augmented means one semitone wider than the normal reference; diminished means one semitone narrower.", rule: "Perfect family: 1, 4, 5, 8. Major/minor family: 2, 3, 6, 7. Determine the letter number first, then use semitone distance to determine quality.", workedExample: "C→E is a 3rd by letters and spans 4 semitones, so it is a major 3rd. C→E♭ is still a 3rd, but spans 3 semitones, so it is a minor 3rd." },
    "interval.A4-d5": { summary: "A tritone spans six semitones. C–F♯ is an augmented 4th; C–G♭ is a diminished 5th. Same sounding distance, different spelling and interval identity." },
    "interval.mixed-core": { summary: "Now interval types are mixed so you must retrieve the requested relationship instead of following a blocked pattern." },
    "interval.spelling": { summary: "Correct interval construction is a two-step problem. First choose the target letter required by the interval number. Only then choose the accidental needed to produce the correct semitone distance. This prevents enharmonic answers that sound right but describe the wrong interval on paper.", rule: "Letter first, accidental second.", workedExample: "A major 3rd above F♯ must use some kind of A because F–G–A is a 3rd. The A must be raised to A♯ to make the distance 4 semitones. B♭ lands on the same key but is some kind of 4th from F, so it is spelled incorrectly for this task." },
    "interval.inversion": { summary: "Simple interval numbers invert to 9: 2↔7, 3↔6, 4↔5, 1↔8. Major↔minor, perfect↔perfect, augmented↔diminished." },

    "triad.members": { summary: "A basic tertian triad is organized around three chord-member roles: root, third, and fifth. Those names describe each note’s interval relationship to the chord root, not where the note happens to sit physically. This distinction becomes important once we use inversions and different voicings.", rule: "Root = identity of the chord; third = determines major/minor quality in basic triads; fifth = completes the core triad structure.", workedExample: "C–E–G and E–G–C contain the same chord members: C is still the root, E the third, and G the fifth even when C is not the lowest note." },
    "triad.symbols": { summary: "Basic chord symbols encode root and quality: C = C major, Cm = C minor, C°/Cdim = diminished, C+/Caug = augmented." },
    "triad.mixed": { summary: "Distinguish and construct all four basic triad qualities from their interval structures instead of memorizing isolated shapes." },
    "triad.root-vs-bass": { summary: "The root gives a chord its harmonic identity. The bass is whichever pitch is lowest at that moment; inversions let them differ." },

    "major.formula": { summary: "Every major scale follows W–W–H–W–W–W–H. The half steps lie between degrees 3–4 and 7–1." },
    "scale.degree-numbers": { summary: "Scale degrees label notes by relation to tonic: 1 through 7, with the octave returning to tonic." },
    "major.degree-intervals": { summary: "Major-scale degrees above tonic are P1, M2, M3, P4, P5, M6, M7. This links scales directly to interval knowledge." },
    "major.spelling": { summary: "A correctly spelled seven-note major scale uses each letter name once before the octave. Choose accidentals to satisfy the major-scale intervals." },
    "major.construct": { summary: "Construct major scales from the formula and correct spelling rather than memorizing 12 unrelated lists." },
    "major.degree-to-note": { summary: "Retrieve a specific scale degree directly from a key. Repeated use should gradually become fluent even though derivation is always available." },
    "major.note-to-degree": { summary: "Reverse the relationship: given a key and a diatonic note, identify its scale degree." },
    "major.membership": { summary: "A note is diatonic to a major key when its correctly spelled pitch belongs to that key's major scale." },
    "major.degree-names": { summary: "Traditional names are tonic, supertonic, mediant, subdominant, dominant, submediant, leading tone. Numerical fluency remains the priority." },
    "major.piano-application": { summary: "Map the scale and degree relationships onto your physical piano. This is application practice, not an objective mastery test." },

    "diatonic.definition": { summary: "Diatonic material uses notes from the current scale/key. Chromatic material uses at least one pitch outside it. Chromatic does not mean wrong." },
    "diatonic.stack-thirds": { summary: "Build diatonic triads by taking every other scale note: 1–3–5, then 2–4–6, and so on, wrapping through the scale." },
    "diatonic.major-pattern": { summary: "Stacking thirds through a major scale derives the invariant triad pattern: I major, ii minor, iii minor, IV major, V major, vi minor, vii° diminished." },
    "roman.major-basic": { summary: "Roman numerals identify a chord's root scale degree and quality in context: uppercase major, lowercase minor, ° diminished." },
    "diatonic.degree-to-chord": { summary: "Combine key + scale degree + the major-key quality pattern to derive a chord, then construct its notes." },
    "diatonic.chord-to-degree": { summary: "Given a key and a diatonic chord, identify its root degree and therefore its Roman numeral." },
    "diatonic.harmonize-key": { summary: "Harmonizing a major key means deriving all seven triads produced by stacking diatonic thirds on its seven scale degrees." },
    "diatonic.check-chord": { summary: "A chord is diatonic only when all of its chord tones belong to the current key. Non-diatonic chords can still be useful later." },
    "diatonic.piano-application": { summary: "Play the seven diatonic triads in real keys so the abstract chord family becomes a physical and musical map." },

    "progression.absolute-relative": { summary: "Chord symbols such as C, G, Am are absolute names. Roman numerals such as I, V, vi describe relationships that transpose with the key." },
    "progression.scale-degree-vs-chord": { summary: "Scale degree 5 names one note relationship; Roman numeral V names a chord rooted on scale degree 5." },
    "progression.I-IV-V": { summary: "I–IV–V is a foundational relative progression. The chord names change with the key while the relationships stay the same." },
    "progression.transpose": { summary: "Transpose by identifying the source Roman numerals and rebuilding the same numeral sequence in the destination key." },
    "progression.extract": { summary: "Analyze a progression by locating each chord root and quality relative to the established key, then labeling it with Roman numerals." },
    "progression.ii-V-I": { summary: "The triadic skeleton ii–V–I is minor–major–major in a major key. Seventh-chord versions are added later." },
    "progression.I-V-vi-IV": { summary: "I–V–vi–IV is a common pop schema used here as transposition practice, not as an exclusive songwriting formula." },
    "progression.vi-IV-I-V": { summary: "vi–IV–I–V uses the same common chord family in a different order. Starting on vi does not automatically make vi the tonic." },
    "progression.I-vi-IV-V": { summary: "I–vi–IV–V is another useful schema for practicing relative harmony and transposition." },
    "progression.nashville": { summary: "Nashville numbers are a practical charting/transposition language using Arabic numbers. Roman numerals remain the app's main analytical language." },
    "melody.chord-tones": { summary: "Chord tones are the notes currently belonging to the harmony (initially root, third, fifth). A scale note can be diatonic yet still be a non-chord tone against the current chord." },

    "function.tonic": { summary: "Tonic is the tonal center/home. In functional tonal harmony, I is the clearest tonic harmony; context can let other chords prolong tonic areas." },
    "function.dominant": { summary: "Dominant-function harmony creates strong directed tension toward tonic. V and vii° are the core dominant-function harmonies in major." },
    "function.V-I": { summary: "V→I is a central dominant-to-tonic resolution. Scale degree 7 tends upward to 1 and scale degree 2 often moves to 1 or 3." },
    "function.predominant": { summary: "ii and IV are core predominant harmonies: they commonly move away from tonic toward dominant." },
    "function.basic-flow": { summary: "A foundational functional flow is tonic → predominant → dominant → tonic. It describes tendencies, not a rule every song must obey." },
    "cadence.basic": { summary: "Authentic motion resolves V→I; a half cadence ends on V. Deceptive resolution avoids the expected tonic, commonly V→vi. IV→I is often called plagal motion/cadence depending on analytical convention." },
    "function.context": { summary: "Functional labels depend on musical context and style. Pop loops, modal harmony, and blues can organize chords differently from common-practice functional syntax." },

    "minor.parallel-alterations": { summary: "Natural minor differs from parallel major by lowered 3, 6, and 7: 1 2 ♭3 4 5 ♭6 ♭7." },
    "minor.natural-construct": { summary: "Natural minor follows W–H–W–W–H–W–W and should still be spelled with one of each letter name." },
    "minor.relative": { summary: "Relative major/minor share a key signature/pitch collection but have different tonics. The relative minor begins on degree 6 of major." },
    "minor.parallel": { summary: "Parallel major/minor share the same tonic but use different scale degrees, e.g. C major and C minor." },
    "minor.variable6-7": { summary: "In tonal minor, scale degrees 6 and 7 are variable. Natural, harmonic, and melodic minor are useful forms describing common versions of those degrees." },
    "minor.raised7": { summary: "Raising scale degree 7 creates a leading tone a semitone below tonic, strengthening dominant-to-tonic motion." },
    "minor.harmonic": { summary: "Harmonic minor is natural minor with raised 7. It is a scale form that explains common tonal-minor harmony, especially major V and vii°." },
    "minor.V-v": { summary: "Natural minor gives minor v; raising degree 7 changes its third and creates major V. Tonal minor frequently uses V for stronger dominant function." },
    "minor.melodic": { summary: "Classical melodic-minor scale form raises 6 and 7 ascending and conventionally uses natural-minor 7 and 6 descending. Real melodies are not required to mechanically obey a direction rule." },
    "minor.melodic-jazz": { summary: "In common jazz usage, 'melodic minor' normally means the raised-6/raised-7 form in both directions." },
    "minor.harmony": { summary: "Minor harmony has variable 6 and 7, so it does not reduce to one immutable seven-chord table. Learn the common natural-minor and raised-leading-tone options in context." },

    "seventh.members": { summary: "A tertian seventh chord adds a seventh above the root to root–third–fifth, creating four chord members." },
    "seventh.mixed": { summary: "Distinguish the five priority seventh qualities by the triad quality plus the interval from root to seventh." },
    "seventh.major-diatonic": { summary: "Stacking four diatonic thirds in major derives Imaj7–ii7–iii7–IVmaj7–V7–vi7–viiø7." },
    "seventh.minor-context": { summary: "Minor seventh-chord vocabulary changes with variable 6 and 7. Focus first on common tonal functions such as V7 and iiø7 rather than a single rigid table." },

    "inversion.triad": { summary: "Triad inversion is determined only by the bass: root in bass = root position, third = first inversion, fifth = second inversion." },
    "inversion.slash": { summary: "Slash notation names the chord then the bass, e.g. C/E = C major with E in the bass." },
    "voicing.distinction": { summary: "Inversion says which chord member is in the bass. Voicing describes how all chord tones are arranged, doubled, and spaced." },
    "inversion.seventh": { summary: "Seventh chords add third inversion, where the chordal seventh is in the bass." },
    "voice.common-tones": { summary: "Common tones are notes shared by consecutive chords. Holding them can create smooth voice leading." },
    "voice.economical": { summary: "Efficient voice leading often keeps common tones and moves remaining voices by small intervals, but shortest motion is a strategy rather than an absolute law." },
    "voice.guide-tones": { summary: "In seventh-chord harmony, thirds and sevenths strongly define quality/function and often form important voice-leading lines." },

    "keys.signatures": { summary: "A key signature collects the sharps/flats used by a key. Major key signatures range from seven flats through seven sharps in conventional notation." },
    "keys.accidental-order": { summary: "Order of sharps: F C G D A E B. Order of flats: B E A D G C F." },
    "circle.major": { summary: "The Circle of Fifths organizes major keys by key-signature distance and perfect-fifth relationships; clockwise generally adds sharps, counterclockwise flats." },
    "keys.minor-signatures": { summary: "A minor key uses the same key signature as its relative major; tonal minor can still raise 6/7 as accidentals within the music." },
    "circle.relative-minor": { summary: "Place each relative minor beside its major partner on the circle because they share a key signature." },
    "keys.closely-related": { summary: "Closely related keys typically differ by one accidental and/or share many diatonic chords. They are common modulation destinations, not mandatory ones." },
    "keys.enharmonic": { summary: "Enharmonic keys such as F♯ major and G♭ major can sound the same in equal temperament while using different notation and key signatures." },

    "extension.compound-intervals": { summary: "Compound intervals extend beyond the octave: 9th = octave + 2nd, 11th = octave + 4th, 13th = octave + 6th." },
    "color.sus": { summary: "sus2 replaces the chord's third with scale degree 2; sus4 replaces the third with 4. A suspended chord is not simply a major triad plus an extra note." },
    "color.add": { summary: "add9 adds a ninth to a triad without implying a seventh. Cadd9 and C9 therefore describe different structures." },
    "color.six": { summary: "A 6 chord adds a major sixth to a major or minor triad. A 6/9 chord adds both sixth and ninth without requiring a seventh." },
    "extension.9": { summary: "A 9th chord is an extended seventh chord: major9, minor9, or dominant9 include their respective seventh plus the ninth." },
    "extension.11-13": { summary: "11ths and 13ths continue the tertian stack. Real voicings often omit chord tones, so theoretical content and practical voicing are not identical." },
    "melody.nonchord": { summary: "A non-chord tone is not part of the current chord. Passing and neighbor tones can create motion; their musical role depends on approach, duration, emphasis, and resolution." },
    "secondary.V": { summary: "A secondary dominant temporarily tonicizes a non-tonic chord by preceding it with that chord's dominant, e.g. D7→G in C major is V7/V→V." },
    "mixture.parallel": { summary: "Modal mixture borrows notes/chords from the parallel mode, such as F minor (iv) in C major borrowed from C minor." },
    "mode.tonic-center": { summary: "A mode is defined by its pitch relationships around a tonal center. Sharing the same pitch collection does not make two modes the same key with a different starting note." },
    "modulation.tonicization-vs-keychange": { summary: "Tonicization briefly treats a non-tonic chord as tonic-like; modulation establishes a new tonic/key more substantially." },
    "modulation.direct": { summary: "Direct modulation changes to a new tonic without a shared pivot chord; the new key is established by subsequent musical evidence." },
    "modulation.pivot": { summary: "Pivot/common-chord modulation reinterprets a chord that belongs to both the old and new keys, using it as a bridge between tonal centers." },
    "analysis.integrated": { summary: "Integrated analysis combines key, Roman numerals, function, chromatic chords, mixture, tonicization/modulation, and melody-vs-chord relationships." },

    "guitar.open-strings": { summary: "Standard tuning from string 6 to 1 is E–A–D–G–B–E." },
    "guitar.fret-notes": { summary: "Each fret raises a string by one semitone. Learn notes relationally from the open-string pitch instead of only memorizing shapes." },
    "guitar.intervals": { summary: "Interval theory is unchanged on guitar; the task is mapping the same semitone/letter relationships onto string and fret positions." },
    "guitar.triads": { summary: "Build guitar triads from root/third/fifth locations across string sets so chord knowledge survives beyond memorized full-chord shapes." },
    "guitar.inversions": { summary: "Triad inversions let the same chord appear in nearby neck positions with different chord members in the bass, enabling smoother movement." },
    "guitar.scale-degrees": { summary: "Map scale degrees around a root so the neck becomes a relational map (1, 2, 3, etc.) rather than only disconnected fret numbers." },
    "guitar.scales": { summary: "Transfer major/minor scale formulas to the fretboard through interval and degree maps instead of treating scale boxes as the theory itself." },
    "guitar.diatonic-harmony": { summary: "Map the diatonic chord family across the neck using triads and scale degrees you already understand from piano/theory." },
    "guitar.sevenths": { summary: "Add chordal sevenths to guitar triad structures and locate the defining chord tones across nearby string sets." },
    "guitar.chord-tones": { summary: "During a progression, track each current chord's root/third/fifth/seventh so improvisation can target harmony rather than only staying inside a scale box." },
    "guitar.voice-leading": { summary: "Move between nearby inversions/chord tones with small fretboard movements to create connected harmonic lines." },
    "guitar.alternate-tunings": { summary: "Changing open-string pitches changes the physical map, not the theory. Recompute notes and intervals from the new tuning rather than relearning harmony." },
    "guitar.idea-to-neck": { summary: "Final application: use interval and chord-tone maps to locate an imagined idea on the neck. This is a self-checked fretboard transfer task." },
  };

  if (TRIAD_RULE[skillId]) return { skillId, title: skill.title, summary: TRIAD_RULE[skillId], rule: TRIAD_RULE[skillId] };
  if (SEVENTH_RULE[skillId]) return { skillId, title: skill.title, summary: SEVENTH_RULE[skillId], rule: SEVENTH_RULE[skillId] };
  if (skillId === "mode.major-family") return { skillId, title: skill.title, summary: `Parallel comparison: Lydian = ${MODE_PARALLEL_ALTERATIONS.lydian}; Mixolydian = ${MODE_PARALLEL_ALTERATIONS.mixolydian}. Keep the same tonic.` };
  if (skillId === "mode.minor-family") return { skillId, title: skill.title, summary: `Parallel comparison: Dorian = ${MODE_PARALLEL_ALTERATIONS.dorian}; Phrygian = ${MODE_PARALLEL_ALTERATIONS.phrygian}. Keep the same tonic.` };
  if (skillId === "mode.locrian") return { skillId, title: skill.title, summary: `Locrian = ${MODE_PARALLEL_ALTERATIONS.locrian}. Its tonic triad is diminished, which makes stable tonic treatment less common in tonal styles.` };

  const found = exact[skillId];
  if (!found) throw new Error(`No lesson content for skill ${skillId}`);
  return { skillId, title: skill.title, ...found };
}
