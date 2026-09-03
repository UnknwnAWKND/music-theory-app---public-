# Curriculum accuracy audit — v0.3

This audit checks the 12-phase practical music-theory curriculum against current open academic theory references and keeps the app intentionally free of ear-training/audio-recognition exercises.

## Primary reference set

- Open Music Theory — Intervals: https://viva.pressbooks.pub/openmusictheory/chapter/intervals/
- Open Music Theory — Chord Symbols: https://viva.pressbooks.pub/openmusictheory/chapter/chord-symbols/
- Open Music Theory — Introduction to Harmony/Cadences: https://viva.pressbooks.pub/openmusictheorycopy/chapter/intro-to-harmony/
- Open Music Theory — Tonicization: https://viva.pressbooks.pub/openmusictheory/chapter/tonicization/
- Open Music Theory — Modal Mixture: https://viva.pressbooks.pub/openmusictheory/chapter/modal-mixture/
- Open Music Theory — Diatonic Modes: https://viva.pressbooks.pub/openmusictheory/chapter/diatonic-modes/
- Open Music Theory — Modulation: https://viva.pressbooks.pub/openmusictheorycopy/chapter/extended-tonicization-and-modulation-to-closely-related-keys/
- University of Puget Sound — Minor Scales: https://musictheory.pugetsound.edu/mt21c/MinorScales.html
- University of Puget Sound — Minor Key Signatures: https://musictheory.pugetsound.edu/mt21c/MinorKeySignatures.html
- University of Puget Sound — Diatonic Chords in Minor: https://musictheory.pugetsound.edu/mt21c/DiatonicChordsInMinor.html
- University of Puget Sound — Cadences: https://musictheory.pugetsound.edu/mt21c/cadences.html

## Corrections/clarifications made in v0.3

1. Added perfect unison (P1) so the simple-interval system is complete.
2. Removed all ear-training/audio-recognition wording and nodes. The app assesses theory/keyboard mapping, not listening identification.
3. Kept interval spelling separate from sounding piano key, including A4 vs d5 and enharmonic spellings.
4. Major-scale generation continues to support all 15 conventional written major key signatures while treating enharmonic pairs as the same sounding pitch-class collections in equal temperament.
5. General transposition is no longer gated behind memorizing a list of named pop progressions. Named progressions are application/schema examples.
6. Harmonic function is explicitly contextual/style-dependent rather than a universal permanent label for every chord.
7. Cadence wording now acknowledges a terminology difference: some curricula call IV-I and V-not-I "plagal/deceptive cadences," while stricter common-practice models reserve primary cadence categories for authentic/half and describe plagal motion/deceptive resolution separately.
8. Minor tonality is not taught as three unrelated fixed keys. Scale degrees 6 and 7 are treated as variable; natural/harmonic/classical melodic forms are derived from that behavior.
9. Added the jazz melodic-minor convention as optional clarification so "melodic minor" terminology does not become misleading later.
10. Minor harmony is not represented by one fake seven-chord invariant. The engine now verifies natural, harmonic, and ascending melodic-minor triad sets separately; the curriculum teaches the common practical palette.
11. Added minor key signatures explicitly through relative-major relationships.
12. Added compound-interval logic before 9th/11th/13th chord extensions.
13. Corrected extension prerequisites so 9th-chord study includes major-, minor-, and dominant-family structures, not only dominant 9ths.
14. Corrected sus/add logic: sus replaces the third; add9 does not imply a seventh; 9 normally does.
15. Moved chord-tone thinking earlier as a continuous practical thread rather than waiting until advanced harmony.
16. Optional/enrichment nodes no longer auto-block or auto-enter the normal daily curriculum unless explicitly enabled.
17. Guitar transfer retains the user's theory-to-neck goal but contains no ear-training/audio recognition assessment.

## Invariants covered by automated tests

- Correct major-third and tritone spelling.
- P1 spelling preservation.
- Major-scale spelling including F# major (E#), Gb major (Cb), C# major (B#), and Db major.
- Enharmonic sounding equivalence while preserving written spelling.
- Major/minor/diminished/augmented triad construction.
- Fully diminished seventh spelling (e.g. C-Eb-Gb-Bbb).
- Major-key diatonic triad pattern across all 15 conventional written major keys.
- Major-key diatonic seventh-chord pattern across all 15 conventional written major keys.
- Natural, harmonic, classical melodic, and jazz melodic-minor scale behavior.
- Relative major/minor tonic spelling.
- Natural/harmonic/ascending melodic-minor triad quality patterns.
- Curriculum graph uniqueness, prerequisites, and acyclicity.
- No ear/hearing/audio/listening curriculum nodes.

## v0.4 follow-up audit corrections

A second code-level audit tightened several distinctions that are easy to teach inaccurately:

- User-facing assessment language now says **wrong note selection** or **enharmonic spelling error**, not “wrong pitch.” This application contains no ear-training/audio-recognition curriculum.
- Suspended chords are modeled as chords in which the third is replaced by scale degree 2 or 4; they are not modeled as “major triad + extra note.”
- add2/add9 study covers both major and minor triad bases and remains distinct from 9th-chord extension logic.
- 6-chord study explicitly includes major/minor 6 vocabulary and practical 6/9 usage.
- The classical melodic-minor node is named as a **scale form** so the curriculum does not imply that real minor-key melodies mechanically change notes according to direction at all times.
- Modes now have an explicit prerequisite concept: **modal identity depends on the perceived tonic/center, not merely on which note a shared pitch collection starts on**.

These are curriculum-structure corrections; they do not add ear training or change the external-ear-training boundary.


## v0.5 exercise-content audit

The curriculum audit was extended from node structure into generated exercise content.

- Every curriculum node now has a deterministic exercise plan.
- Generated objective answers are derived from theory functions for intervals, scales, triads, seventh chords, diatonic harmony, modes, chord colors/extensions, key signatures, progressions, and guitar pitch-class mapping.
- Generated suspended/add9/9th exercises preserve the distinctions established in the curriculum audit.
- Modal-scale generation uses tonic-relative modal formulas; modal teaching still requires the separate tonal-center concept and does not reduce modes to “start a major scale on another note.”
- Physical piano/guitar and open creative-transfer tasks are marked self-check rather than being falsely treated as machine-verified.
- A test samples generated prompts across all 130 nodes and rejects ear/hearing/aural/audio/listening curriculum language.
- A grading round-trip test verifies that every objectively gradable generated exercise accepts its theory-generated correct answer.
