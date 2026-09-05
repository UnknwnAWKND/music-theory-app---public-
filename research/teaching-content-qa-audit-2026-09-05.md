# Teaching Content QA Audit — 2026-09-05

## Scope

Reviewed every active teaching page in the rebuilt six-phase curriculum: **37 lessons / 176 teaching pages**.

- Phase 1 — Intervals: 10 lessons / 48 pages
- Phase 2 — Major Scales: 4 lessons / 25 pages
- Phase 3 — Minor Scales: 5 lessons / 29 pages
- Phase 4 — Diatonic Chords / Roman Numerals: 10 lessons / 31 pages
- Phase 5 — Relatives: 4 lessons / 22 pages
- Phase 6 — Circle of Fifths: 4 lessons / 21 pages

The audit changed **51 active teaching pages**. Curriculum phase count, lesson count, ordering, adaptive evidence, READY/RETAINED, checkpoints, replay, practice rounds, and the no-hint rule are unchanged.

## Phase 1 Lesson 1 correction

The old introduction said that C→G was “some kind of 5th” and used “quality” and “exact size” without enough explanation.

The active teaching now says, in sequence:

1. An interval is the distance between two notes.
2. An interval name has a **number** and a **quality**.
3. The number tells how many letter names the interval covers.
4. Quality is the word that tells the exact version of that interval.
5. On piano, exact distance can be counted in half steps / semitones, and one half step is one move to the next piano key.
6. C→G covers C–D–E–F–G, so its number is a 5th.
7. C→G is seven half steps, and that version of a 5th is called Perfect.
8. Therefore C→G is a **Perfect 5th (P5)**.
9. The learner is told that later lessons will show how changing a note can keep the interval number while changing quality.

The next page now defines **Perfect** only to the depth needed at that point: it is the quality name used for the normal unison, 4th, 5th, and octave sizes; Lesson 1 only requires P1 and P8, with P5/P4 coming next.

## First-use / undefined-term issues corrected

Eighteen term or sequencing problems were corrected rather than solved by dumping future theory early:

- quality
- half step / semitone
- Perfect as an interval quality
- accidental
- chord / triad references before chord study
- pitch class
- Major / Minor as interval qualities
- Augmented / Diminished before their lesson
- tonic versus chord root
- premature use of diatonic in the major-scale spelling explanation
- chord quality
- A5 (augmented 5th)
- Roman numeral case / quality symbols
- seventh-chord quality names and symbols
- d7 (diminished 7th)
- key signature
- cadence terminology before cadence study
- “chromatic harmony” as an unexplained future-topic label

Where a term was not needed yet, it was removed or deferred instead of being over-explained.

## Misleading or vague wording corrected

Notable rewrites include:

- Removed every active use of “some kind of” for definite interval facts.
- Replaced “seven piano keys away” with “seven half steps.”
- Rewrote interval-number explanations to state the exact letter span first, then quality.
- Removed premature “augmented 2nd” and “diminished 3rd” detours from earlier 3rd/2nd lessons.
- Replaced scale “root = tonic” wording with a consistent distinction: tonic is the scale/key home note; root is mainly the note a chord is built from.
- Changed “Supertonic is directly above tonic” to “the next scale degree above tonic,” avoiding the impression that it must be an adjacent piano key.
- Changed “14 interval spellings” to “14 distinct simple written interval types.”
- Qualified classical melodic-minor descent as the convention taught here, not a universal law for every minor melody.
- Replaced vague Circle-of-Fifths “closest signature relationship” wording with the precise fact that neighboring major key signatures differ by one sharp or one flat.
- Simplified unexplained future terms such as “voice-leading,” “cadence,” and “chromatic harmony” when they were not needed for the current lesson.

## Factual / notation accuracy findings

The deep check did **not** uncover a wrong core major-scale formula, natural/harmonic/melodic-minor formula, diatonic triad pattern, seventh-chord pattern, relative-key relationship, or Circle-of-Fifths order in the active curriculum. Existing algorithmic theory tests already cover many of those relationships.

The audit did correct precision/notation problems that could misteach a beginner:

- “seven piano keys away” was ambiguous and replaced with seven half steps.
- “14 interval spellings” was corrected to 14 written interval types.
- C→F♯ and C→G♭ are now explicitly protected as A4 and d5 respectively; semitone distance alone never determines the written interval number.
- The descending classical melodic-minor explanation no longer overstates a pedagogical convention as a universal musical rule.
- Seventh-chord rare-quality labels are now defined before being used as compressed symbols.

## Worked examples

**25 worked examples were rewritten or clarified** in the active QA overlay. Examples now explicitly connect rule → construction → answer rather than assuming the learner can infer the missing step.

High-value corrections include:

- C→G = P5 with both letter count and half-step meaning.
- B→F♯ as P5 with target-letter-first spelling logic.
- C→E♭ versus C→D♯ without prematurely naming an augmented 2nd.
- A4 / d5 spelling from C.
- inversion number + quality as two separate rules.
- tonic wording in D major.
- full classical melodic-minor ascending/descending examples.
- Roman numeral case/symbol examples.
- seventh-chord construction and rare seventh-chord quality examples.
- relative key-signature examples.
- far-side Circle-of-Fifths distance examples.

## Piano-visual audit

Four teaching pages needed visual correction or spelling-specific clarification:

1. Phase 1 Lesson 4 m3: the active visual tried to highlight `Ab` even though the keyboard renderer uses physical pitch-class IDs such as `G#`. It now highlights the physical G♯/A♭ key and displays **A♭** in context.
2. Phase 3 Lesson 1 natural minor: E♭/A♭/B♭ had been passed as flat-name physical IDs, so the black keys could fail to activate. It now uses D#/G#/A# physical IDs with E♭/A♭/B♭ display labels.
3. Phase 1 Lesson 8 A4: the shared black key now displays **F♯** specifically.
4. Phase 1 Lesson 8 d5: the same physical black key now displays **G♭** specifically.

This keeps the physical piano key correct while preserving the theoretical spelling the lesson is teaching.

## Terminology consistency decisions

The active curriculum now consistently uses these distinctions:

- interval **number** = letter-name span; interval **quality** = specific version/size
- half step = semitone
- **tonic** = home note of a scale/key; **root** = construction note of a chord (and “starting note” for generic interval construction)
- physical piano pitch ≠ written theoretical spelling
- chord **quality/type** ≠ chord **function/role**
- relative major and **natural** minor share the exact seven-note collection; harmonic/melodic alterations do not
- key signature identity and enharmonic pitch-class identity are related but not interchangeable

## Automatic vs Understand audit

Twelve pages that explain methods, reasons, coverage, or application goals were changed from `KNOW THIS INSTANTLY` to `UNDERSTAND THIS`. Automatic labels remain on the facts the learner should retrieve quickly (for example P5 targets, scale formulas/notes, inversion partner facts, Roman-numeral vocabulary, and relative-key pairs). Conceptual explanations are no longer presented as if every sentence must be memorized verbatim.

## Accuracy references

Questionable or subtle statements were checked against multiple established teaching references, including:

- Open Music Theory — “Intervals”
  https://viva.pressbooks.pub/openmusictheory/chapter/intervals/
- Open Music Theory — “Major Scales, Scale Degrees, and Key Signatures”
  https://viva.pressbooks.pub/openmusictheory/chapter/major-scales/
- Open Music Theory — “Minor Scales, Scale Degrees, and Key Signatures”
  https://viva.pressbooks.pub/openmusictheory/chapter/minor-scales/
- musictheory.net — “Generic Intervals,” “Specific Intervals,” and “Writing Intervals”
  https://www.musictheory.net/lessons/30
  https://www.musictheory.net/lessons/31
  https://www.musictheory.net/lessons/32
- musictheory.net — “The Minor Scales”
  https://www.musictheory.net/lessons/22
- musictheory.net — “Roman Numeral Analysis: Triads”
  https://www.musictheory.net/lessons/44
- musictheory.net — “Diatonic Seventh Chords”
  https://www.musictheory.net/lessons/46
- Berklee Online — “Circle of Fifths: The Key to Unlocking Harmonic Understanding”
  https://online.berklee.edu/takenote/circle-of-fifths-the-key-to-unlocking-harmonic-understanding/

The sources agree on the core facts used by the curriculum: interval number/quality distinction, written interval spelling, major/minor/augmented/diminished size relationships, W/H scale formulas, minor-form alterations, Roman-numeral conventions, seventh-chord construction, relative key signatures, and Circle-of-Fifths direction/key-signature relationships.

## Regression coverage

A dedicated teaching-content QA suite now verifies:

- 37 lessons / 176 teaching pages remain exact.
- C→G=P5, F→C=P5, C→F=P4, C→E=M3, C→E♭=m3, C→F♯=A4, C→G♭=d5.
- All Phase 1 intervals construct correctly across varied natural, sharp, and flat roots by both target-letter distance and pitch-class distance.
- no active “some kind of” interval wording remains.
- Augmented/Diminished are not introduced before their intended tritone lesson.
- first-use definitions exist for pitch class, chord quality, Roman numerals, and key signature.
- tonic/root terminology stays separated.
- piano visuals use valid physical pitch-class IDs with correct context-specific written labels.
- A4/d5 spelling remains distinct despite equal-tempered enharmonic equivalence.
- seventh-chord types are defined before compressed pattern symbols.
- classical melodic-minor descent is accurately qualified.
- conceptual pages are not mislabeled as automatic-memory requirements.
- early examples do not create premature augmented/diminished detours.

CI result after the audit changes: **167 tests passed, 0 failed**, and the static Block 8 site build succeeded.
