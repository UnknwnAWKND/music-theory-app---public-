# Block 3 research — Phase 2: Major Scales

Research was completed before the Phase 2 implementation. This note records the theory and learning decisions used by the code and tests.

## Reliable references cross-checked

- musictheory.net — **The Major Scale**: defines the major-scale whole/half-step construction and works C, E-flat, and D major examples. https://www.musictheory.net/lessons/21
- musictheory.net — **Scale Degrees**: tonic, supertonic, mediant, subdominant, dominant, submediant, and leading tone; in major, degree 7 is a half step below the tonic. https://www.musictheory.net/lessons/23
- Open Music Theory — scale/scale-degree materials: cross-checks whole steps, half steps, tonic, major-scale construction, and numbered scale degrees. https://openmusictheory.github.io/
- University of Puget Sound, *Music Theory for the 21st-Century Classroom*, **The Major Scale**: W-W-H / W / W-W-H construction and the spelling rule that major scales use the musical alphabet in order, with no skipped or duplicated letter names. https://musictheory.pugetsound.edu/mt21c/TheMajorScale.html
- Berklee Online, **Circle of Fifths: The Key to Unlocking Harmonic Understanding**: cross-checks the 12 chromatic pitches, enharmonic equivalence, sharp/flat major keys through seven accidentals, F-sharp and C-sharp major, G-flat and C-flat major, and the fact that the familiar circle represents 15 written major keys because three pairs are enharmonic. https://online.berklee.edu/takenote/circle-of-fifths-the-key-to-unlocking-harmonic-understanding/
- Berklee Online, **Piano Scales 101**: supports keyboard-first teaching, building scales across multiple keys, practice techniques, and repeated major-scale work rather than a single exposure. https://online.berklee.edu/courses/piano-scales-101
- Carpenter, Pan & Butler (2022), *Nature Reviews Psychology*, **The science of effective learning with spacing and retrieval practice**: supports distributed retrieval, spacing, and successive relearning for durable recall. https://www.nature.com/articles/s44159-022-00089-1

## Accuracy decisions

### Major-scale construction

Ascending major scales use:

`W-W-H-W-W-W-H`

A half step is the distance to the adjacent piano key. A whole step equals two half steps. E-F and B-C are half steps despite both endpoints being white keys.

Measured from the tonic, the major-scale degrees correspond to Phase 1 intervals:

`P1, M2, M3, P4, P5, M6, M7, P8`

This is taught explicitly so the formula is connected to existing interval knowledge instead of presented as an unrelated code.

### Scale-degree names

1. Tonic
2. Supertonic
3. Mediant
4. Subdominant
5. Dominant
6. Submediant
7. Leading Tone

The app requires the names/numbers to become fluent, but does not require memorizing word origins. Tonic, Subdominant, Dominant, and Leading Tone receive particular practical emphasis because later harmony repeatedly uses those roles.

### Correct spelling

A seven-note diatonic major scale uses each musical letter once before the tonic repeats. The algorithm therefore chooses the required letter for each degree first and only then chooses the accidental needed for the correct pitch.

Example:

- D major: `D E F# G A B C#`
- not `D E Gb G A B C#`

The second spelling wrongly skips F and duplicates G even though F-sharp and G-flat share a piano key.

### 12 pitch classes versus written enharmonic keys

The phase balances practice across **12 underlying pitch classes**, using these practical default roots:

`C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B`

It also supports the conventional enharmonic written major-key spellings through seven accidentals:

`C, G, D, A, E, B, F#, C#, F, Bb, Eb, Ab, Db, Gb, Cb`

That creates three useful enharmonic pairs:

- C-sharp / D-flat
- F-sharp / G-flat
- B / C-flat

The app does **not** treat these pairs as different piano pitch classes, but it does treat their written scales as different theoretical spellings. For example:

- F-sharp major: `F# G# A# B C# D# E#`
- G-flat major: `Gb Ab Bb Cb Db Eb F`

More remote theoretical roots such as G-sharp major can be derived by the generic scale algorithm, but are not separate default memorization targets in this phase because conventional key-signature practice normally prefers the enharmonic spelling with no more than seven accidentals.

## Common beginner errors guarded against

- Treating every adjacent pair of white keys as a whole step; E-F and B-C are half steps.
- Counting only physical piano-key distance while ignoring note spelling.
- Replacing a required scale letter with an enharmonic note and accidentally skipping one letter / duplicating another.
- Over-learning C, G, and D while avoiding black-key roots.
- Memorizing `W-W-H-W-W-W-H` without connecting it to tonic-based interval relationships.
- Treating one successful practice round as permanent mastery.

## Practice / learning design

- All learner-visible rounds remain at least 30 questions.
- Phase 2 lesson sizes are 36, 42, 48, and 60 questions for initial acquisition.
- Lesson 3 distributes construction across all 12 pitch classes.
- Lesson 4 rotates roots across all 12 pitch classes and mixes full-scale spelling, missing-note retrieval, degree-to-note, and note-to-degree tasks.
- READY allows progression but does not remove major scales from review.
- RETAINED reduces extra recurrence pressure without reducing foundational review weight to zero.
- Phase 2 generators occasionally inject real Phase 1 interval exercises, keeping interval retrieval alive and linking scale degrees back to Phase 1.
- No hints are used; errors receive corrective teaching after the answer.

## Phase boundary

Block 3 implements only Phase 2 — Major Scales. Phase 1 remains intact. No Phase 3 skill, lesson, exercise generator, checkpoint, or placement competency is authored here.
