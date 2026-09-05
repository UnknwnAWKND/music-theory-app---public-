# Phase 1 — Intervals research notes

Block 2 builds only Phase 1. These notes capture the factual and pedagogical decisions used by the implementation.

## Sources cross-checked

- Open Music Theory — Intervals: generic/specific interval naming, simple vs compound intervals, inversion rules, enharmonic equivalence, augmented/diminished intervals.
  - https://viva.pressbooks.pub/openmusictheory/chapter/intervals/
- musictheory.net — Generic Intervals, Specific Intervals, Writing Intervals, Interval Inversion.
  - https://www.musictheory.net/lessons
- Berklee Online — Music Theory 101 / interval topic sequence.
  - https://online.berklee.edu/courses/music-theory-101
- Music Theory for the 21st-Century Classroom (University of Puget Sound) — augmented/diminished intervals and interval inversion.
  - https://musictheory.pugetsound.edu/mt21c/AugmentedAndDiminishedIntervals.html
  - https://musictheory.pugetsound.edu/mt21c/InversionOfIntervals.html
- Retrieval/spacing/interleaving literature used for the practice design: spacing + retrieval practice reviews and controlled studies on interleaved retrieval. These support distributed cumulative retrieval and discrimination practice rather than a small one-time quiz.

## Accuracy decisions

1. **Interval number comes from written letter distance.** Accidentals do not change whether something is a 2nd, 3rd, 4th, etc.; they change the quality.
2. **Exact spelling is part of the answer.** Six semitones above C can be F♯ (A4) or G♭ (d5), depending on the requested written interval. Enharmonic piano equivalence is not enough for an exact-spelling construction question.
3. **The target letter is chosen first, then its accidental.** This prevents semitone-only answer generation from emitting theoretically wrong spellings.
4. **Double accidentals are legitimate when required.** Example: A4 above G♯ is C𝄪/C♯♯, because the target must remain a 4th by letter name.
5. **Simple intervals include P1 through P8.** Intervals larger than an octave are compound; a compound interval number is the corresponding simple number + 7 for each octave displacement in the ordinary one-octave case (e.g. 3rd → 10th).
6. **Inverted simple interval numbers add to 9:** 1↔8, 2↔7, 3↔6, 4↔5.
7. **Inversion quality behavior:** Perfect↔Perfect, Major↔Minor, Augmented↔Diminished.
8. **Phase 1 teaches 14 distinct simple interval spellings/types:** P1, P8, P5, P4, M3, m3, M6, m6, M2, m2, M7, m7, A4, d5. The app therefore does not describe the capstone as “all 12 intervals.”

## Teaching / automaticity decisions

- Teach the smallest useful family first, then progressively interleave already-learned intervals with each new pair.
- Keep the requested lesson order exactly.
- Mark fast retrieval targets as **KNOW THIS INSTANTLY** and explanatory rules as **UNDERSTAND THIS**.
- Use short teaching screens with worked examples immediately after each rule.
- Anchor examples to piano, but independent construction prompts highlight only the root; the target is revealed only after grading.
- Use real learner-visible practice rounds with the app-wide minimum of 30 questions. A round is evidence collection, not mastery.
- READY permits progression but does not remove interval skills from future mixed retrieval. RETAINED lowers extra recurrence pressure while keeping high-priority interval skills eligible for later review/application.
