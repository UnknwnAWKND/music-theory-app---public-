# Block 4 research — Phase 3: Minor Scales

Research was completed before the Phase 3 implementation. This note records the theory, historical framing, spelling rules, piano-teaching choices, and learning decisions used by the code and tests.

## Reliable references cross-checked

- musictheory.net — **The Minor Scales**: natural minor, harmonic minor as natural minor with raised degree 7, and melodic minor with raised degrees 6 and 7. https://www.musictheory.net/lessons/22
- musictheory.net — **Scale Degrees**: in natural minor, degree 7 is a whole step below tonic and is a subtonic; a degree 7 one half step below tonic is a leading tone, as in harmonic and melodic minor. https://www.musictheory.net/lessons/23
- musictheory.net — **Composing with Minor Scales**: the raised seventh strengthens the dominant because the dominant chord contains the leading tone. https://www.musictheory.net/lessons/50
- Open Music Theory — **Scales and scale degrees**: natural-minor formula W-H-W-W-H-W-W; raised 7 creates the harmonic-minor leading tone; raising 6 in melodic minor avoids the melodic augmented 2nd; descending classical melodic minor returns to natural-minor scale degrees. https://openmusictheory.github.io/scales.html
- University / OER music-theory texts hosted by LibreTexts — **Learning Major and Minor Scales** and **Harmonic Minor / Melodic Minor**: harmonic minor contains an augmented 2nd between degrees 6 and 7; melodic minor raises 6 to smooth that gap; the classical descending form returns to natural minor. https://human.libretexts.org/Bookshelves/Music/Music_Theory/Music_Fundamentals_(Ewell_and_Schmidt-Jones)/03%3A_Minor_Scales_and_Keys/3.02%3A_Learning_Major_and_Minor_Scales
- Open Music Theory 1e on LibreTexts — **Scales and Scale Degrees**: historical/practical discussion of the raised leading tone in minor and the melodic-minor response to the augmented second. https://human.libretexts.org/Bookshelves/Music/Music_Theory/Open_Music_Theory_1e_(Wharton_and_Shaffer_Eds)/01%3A_Fundamentals/1.09%3A_Scales_and_Scale_Degrees
- Berklee Online — **Music Theory 101**, **Keyboard for the Electronic Musician**, and **Piano Scales 101**: minor scales are taught as keyboard/theory material with harmonic and melodic minor, descending melodic minor, and repeated scale application on piano. https://online.berklee.edu/courses/music-theory-101 ; https://online.berklee.edu/courses/keyboard-for-the-electronic-musician ; https://online.berklee.edu/courses/piano-scales-101

## Accuracy decisions

### Natural minor

Ascending natural minor uses:

`W-H-W-W-H-W-W`

Measured from the tonic, its scale degrees form:

`P1, M2, m3, P4, P5, m6, m7, P8`

This directly connects Phase 3 to the interval knowledge from Phase 1 and the construction/spelling method from Phase 2.

### Harmonic minor

Harmonic minor is natural minor with **degree 7 raised by one half step**.

The raised 7 sits one half step below tonic, so it is a **leading tone**. In tonal minor practice, this raised degree strengthens motion toward tonic and strengthens dominant-to-tonic harmony. The curriculum explains that historical/practical function without pretending the scale is simply an arbitrary alternate list.

The step distances are 2, 1, 2, 2, 1, 3, 1 semitones. The three-semitone gap is between degrees 6 and 7. Because those degrees use adjacent scale letters, the written interval is an **augmented 2nd (A2)**, not a minor 3rd.

Example:

- A natural minor: `A B C D E F G`
- A harmonic minor: `A B C D E F G#`
- degrees 6→7: `F→G#` = augmented 2nd

### Classical melodic minor convention used in this curriculum

Ascending:

- start from natural minor
- raise degree 6 by one half step
- raise degree 7 by one half step

The ascending step pattern is:

`W-H-W-W-W-W-H`

Descending:

- return to the **natural-minor pitches**

This is the requested classical pedagogical convention. The lesson does not introduce jazz melodic-minor terminology because the block explicitly asks to avoid unnecessary alternate terminology.

Why raise 6 ascending? Harmonic minor's natural 6 → raised 7 produces an augmented 2nd (three half steps). Raising 6 reduces that gap to a whole step while retaining the raised leading tone on the way to tonic. On descent, this curriculum returns to natural-minor 7 and 6 because the upward leading-tone motion is no longer the melodic goal.

### Exact spelling

Every seven-note minor scale keeps one letter name for each scale degree before tonic repeats, just as in Phase 2. The algorithm chooses the required scale letter first and then computes the accidental needed for the form.

Examples:

- C# natural minor: `C# D# E F# G# A B`
- C# harmonic minor: `C# D# E F# G# A B#`
- C# melodic minor ascending: `C# D# E F# G# A# B#`
- Eb natural minor: `Eb F Gb Ab Bb Cb Db`
- Eb harmonic minor: `Eb F Gb Ab Bb Cb D`
- Eb melodic minor ascending: `Eb F Gb Ab Bb C D`

Enharmonically equivalent piano keys are not accepted as substitutes when exact scale spelling is being assessed.

### 12 pitch classes versus written minor-key names

Balanced default practice covers 12 underlying pitch classes with these practical spellings:

`C, C#, D, Eb, E, F, F#, G, G#, A, Bb, B`

The theory engine also supports the conventional written minor keys through seven accidentals, including the enharmonic pairs:

- G# / Ab
- D# / Eb
- A# / Bb

Those pairs can share piano pitches but have different theoretical spellings.

## Common beginner misconceptions guarded against

- Treating natural, harmonic, and melodic minor as three unrelated seven-note lists.
- Thinking harmonic minor changes more than degree 7.
- Calling natural-minor degree 7 a leading tone even though it is normally a whole step below tonic.
- Missing the augmented 2nd between harmonic-minor degrees 6 and 7.
- Calling the augmented 2nd a minor 3rd just because both span three piano half steps; written letter distance matters.
- Raising degree 6 in harmonic minor by mistake.
- Keeping raised 6 and 7 while descending in the classical convention required by this curriculum.
- Replacing correct spellings such as B# or Cb with easier enharmonic piano names.
- Over-practicing A minor while avoiding sharp/flat roots.

## Practice / learning design

- Phase 3 has exactly five lessons and no Phase 4 content.
- Every learner-visible practice round remains at least 30 questions; initial Phase 3 rounds are 36, 48, 48, 48, and 60 questions.
- Natural-minor construction and final recall distribute practice across all 12 pitch classes.
- Recall practice includes natural, harmonic, melodic ascending, and melodic descending forms, plus scale-degree, missing-note, transformation, and form-discrimination tasks.
- READY permits progression but does not remove minor scales from long-term review.
- RETAINED lowers extra recurrence pressure without erasing review eligibility for this foundational material.
- Phase 3 generators deliberately inject real Phase 1 interval review and Phase 2 major-scale review; those attempts keep their original skill identity rather than being falsely credited as minor-scale evidence.
- Piano metadata highlights roots during retrieval and reveals answer pitches only after grading.
- No hints are used. Errors receive corrective teaching after submission.

## Phase boundary

Block 4 implements only **Phase 3 — Minor Scales**. Phases 1–2 remain intact. No Phase 4 skill, lesson, exercise generator, checkpoint, or placement competency is authored here.
