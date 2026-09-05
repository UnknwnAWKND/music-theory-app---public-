# Block 5 research — Phase 4: Diatonic Chords / Roman Numerals

Research was completed before Phase 4 implementation. The goal was to verify the chord-generation rules, Roman-numeral nomenclature, seventh-chord edge cases, functional terminology, and safe progression-analysis boundaries before writing the learner content.

## Authoritative sources cross-checked

### Open Music Theory

- **Triads** — Open Music Theory, maintained open textbook. It defines a triad as a three-note chord that can be arranged in thirds; identifies root, third, and fifth; gives the major/minor/diminished/augmented triad formulas; explains Roman-numeral case and diminished/augmented symbols; and derives diatonic triads and seventh chords from scales. Source repository: `openmusictheory/openmusictheory.github.io`, `triads.md`.
- **Harmonic Functions** — Open Music Theory. It defines harmonic function as the role a chord plays in a larger progression and describes the common-practice tonic, subdominant/predominant, and dominant families while warning that function is contextual. Source repository: `openmusictheory/openmusictheory.github.io`, `harmonicFunctions.md`.

### Music Theory for the 21st-Century Classroom — Robert Hutchinson, University of Puget Sound

- **Diatonic Chords in Major** — derives major-key diatonic harmony and Roman numerals from the scale rather than treating the pattern as arbitrary trivia.
- **Diatonic Chords in Minor** — explicitly notes that minor has multiple scale forms, so minor-key diatonic harmony contains more possibilities than a single seven-chord list. Source material is mirrored in `joshpetit/music-theory/musictheory.pugetsound.edu/mt21c/`.

The two sources were cross-checked against each other, then the exact Phase 4 patterns below were independently regenerated from the existing tested scale-spelling engine by stacking scale degrees 1–3–5 and 1–3–5–7. No chord-pattern database is used as the source of truth.

## Generative method

For a seven-note scale, a diatonic triad on degree `n` uses:

- root: `n`
- third: `n + 2 scale degrees`
- fifth: `n + 4 scale degrees`

A diatonic seventh chord adds `n + 6 scale degrees`.

Scale-degree numbers wrap after 7. The notes retain the exact theoretical spelling already produced by the Phase 2/3 scale engine. Chord quality is identified from the root-to-third, root-to-fifth, and (for seventh chords) root-to-seventh intervals.

This is **tertian harmony**: harmony constructed by stacking thirds. It directly applies the interval work from Phase 1.

## Verified triad patterns

### Major

`I  ii  iii  IV  V  vi  vii°`

Qualities:

`major, minor, minor, major, major, minor, diminished`

### Natural minor

`i  ii°  III  iv  v  VI  VII`

Qualities:

`minor, diminished, major, minor, minor, major, major`

### Harmonic minor

`i  ii°  III+  iv  V  VI  vii°`

Qualities:

`minor, diminished, augmented, minor, major, major, diminished`

The raised degree 7 is the third of V, changing natural minor's minor v into major V. It is also the fifth of III, producing the augmented `III+` triad.

### Ascending melodic minor

`i  ii  III+  IV  V  vi°  vii°`

Qualities:

`minor, minor, augmented, major, major, diminished, diminished`

This lesson uses only the **ascending** melodic-minor collection defined in Phase 3. It is deliberately lower automaticity than the major and natural-minor patterns.

## Verified seventh-chord patterns

### Major

`Imaj7  ii7  iii7  IVmaj7  V7  vi7  viiø7`

Qualities:

`major 7, minor 7, minor 7, major 7, dominant 7, minor 7, half-diminished 7`

### Natural minor

`i7  iiø7  IIImaj7  iv7  v7  VImaj7  VII7`

Qualities:

`minor 7, half-diminished 7, major 7, minor 7, minor 7, major 7, dominant-7 quality`

Important nomenclature correction: `VII7` has **dominant-seventh chord quality** (major triad + minor seventh), but the quality name does not automatically make it the dominant-function chord of the key. Chord quality and harmonic function are separate ideas.

### Harmonic minor

`i(maj7)  iiø7  III+maj7  iv7  V7  VImaj7  vii°7`

Qualities:

`minor-major 7, half-diminished 7, augmented-major 7, minor 7, dominant 7, major 7, diminished 7`

### Ascending melodic minor

`i(maj7)  ii7  III+maj7  IV7  V7  viø7  viiø7`

Qualities:

`minor-major 7, minor 7, augmented-major 7, dominant 7, dominant 7, half-diminished 7, half-diminished 7`

## Half-diminished versus diminished seventh

Both contain a diminished triad:

- half-diminished seventh: `1–♭3–♭5–♭7` = m3, d5, m7 from root
- diminished seventh: `1–♭3–♭5–𝄫7` = m3, d5, d7 from root

The seventh is the difference. This distinction matters in harmonic minor, where `vii°7` is fully diminished.

## Chord types required by this phase

Only these types are required by the four scale collections and therefore appear in the reference card:

- major triad — `1–3–5`
- minor triad — `1–♭3–5`
- diminished triad — `1–♭3–♭5`
- augmented triad — `1–3–♯5`
- major seventh — `1–3–5–7`
- minor seventh — `1–♭3–5–♭7`
- dominant seventh — `1–3–5–♭7`
- half-diminished seventh — `1–♭3–♭5–♭7`
- diminished seventh — `1–♭3–♭5–𝄫7`
- minor-major seventh — `1–♭3–5–7`
- augmented-major seventh — `1–3–♯5–7`

No unrelated advanced chord types are added.

## Roman numeral decisions

Triads use the conventional case/quality notation taught by the sources:

- uppercase = major
- lowercase = minor
- `°` = diminished
- `+` = augmented

Seventh chords add an explicit seventh suffix where it improves beginner clarity: `Imaj7`, `ii7`, `V7`, `viiø7`, `vii°7`, `i(maj7)`, `III+maj7`.

Roman numerals are **derived**, not looked up: determine the scale degree of the chord root, stack the diatonic thirds, identify the resulting quality, then format the numeral.

## Function terminology correction

The prompt listed `subdominant / predominant`. Research supports teaching **predominant** as the broader functional family while preserving **subdominant** as the traditional name for IV and, in some pedagogies, for the broader family.

For this beginner phase:

- tonic: strongest sense of home/rest; I/i is the clearest example
- predominant: moves away from tonic and often prepares dominant; ii and IV are clearest examples
- dominant: forward pull toward tonic; V and vii° are clearest examples
- iii and vi are treated as context-dependent instead of assigning them an inflexible permanent function

This avoids confusing chord **quality** with harmonic **function**, and avoids presenting stylistic tendencies as universal laws.

## Progression vocabulary and transposition

The curriculum uses these as portable vocabulary, not as an exhaustive list:

- `I–V–vi–IV`
- `vi–IV–I–V`
- `ii–V–I`
- `I–vi–ii–V`
- `i–VI–III–VII`

Transposition is generated by mapping each numeral's scale degree into a newly generated target scale, then stacking the appropriate diatonic chord from that degree.

## Safe user-progression analysis

Arbitrary free-text chord parsing is intentionally not faked. The learner chooses:

1. key/root
2. scale form
3. each chord root
4. each chord quality

The analyzer compares those structured chords with the generated diatonic set. If a chord matches, it returns the Roman numeral. If it does not match, it says the chord is **outside the current diatonic set**, shows the in-scale chord when useful, and explicitly avoids claiming the user's music is wrong. Chromatic-harmony explanation is deferred to a later phase rather than improvised prematurely.

## Learning priority

High automaticity:

- major-key triad-quality pattern
- natural-minor triad-quality pattern
- common triad construction
- Roman numeral translation
- I/IV/V/vi/ii relationships
- basic tonic/predominant/dominant tendencies
- building chords from scale degrees

Moderate / understand accurately:

- ascending melodic-minor triad pattern
- unusual seventh-chord qualities
- why harmonic minor's raised 7 changes V, III, and vii° structures

The implementation encodes these priorities rather than drilling every fact equally.

## Phase boundary

Block 5 implements only **Phase 4 — Diatonic Chords / Roman Numerals**. Phases 1–3 remain intact. Phase 5 — Relatives is still future content; no Phase 5 skill, lesson, exercise generator, checkpoint, or placement competency is authored here.
