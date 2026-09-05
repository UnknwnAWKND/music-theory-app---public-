# Phase 5 — Relatives: research and accuracy decisions

## Sources checked before implementation

1. **Open Music Theory — Minor Scales, Scale Degrees, and Key Signatures**
   - https://pressbooks.nebraska.edu/openmusictheory/chapter/minor-scales/
   - Defines the relative relationship as major and minor keys sharing a key signature.
   - States that the relative minor tonic is three half steps below the major tonic and the relative major is three half steps above the minor tonic.
   - Separates natural, harmonic, and melodic minor; minor key signatures are based on natural minor.
   - Explicitly warns that enharmonic pitch equivalence is not enough: D-flat major pairs with B-flat minor, not A-sharp minor, because the shared key signature determines the spelling.

2. **University of Puget Sound — Music Theory for the 21st-Century Classroom, Minor Key Signatures**
   - https://musictheory.pugetsound.edu/mt21c/MinorKeySignatures.html
   - Defines relative minor by shared key signature and states that relative major is three half steps above relative minor.

3. **University of Puget Sound — The Best-Seller Progression**
   - https://musictheory.pugetsound.edu/mt21c/BestsellerProgression.html
   - Shows the same progression interpreted as vi–IV–I–V in major and i–VI–III–VII in relative minor.
   - Explains that major/minor hearing depends on which chord is perceived as tonic / which harmonic functions are established.

4. **University of Puget Sound — Diatonic Chords in Minor**
   - https://musictheory.pugetsound.edu/mt21c/DiatonicChordsInMinor.html
   - Distinguishes the chord resources produced by natural, harmonic, and melodic minor. Raised scale degrees create additional chord forms, so the relative-major collection cannot be treated as identical to every minor form.

5. **Berklee Online — Music Theory 101 / relative-scale materials**
   - https://online.berklee.edu/courses/music-theory-101
   - Treats the Relative Major/Minor Relationship separately from harmonic and melodic minor and reinforces the major/minor key-signature relationship.

## Accuracy rules used in the app

### Relative major / natural minor
A relative major key and its relative **natural minor**:
- share the same key signature;
- use the same seven written pitch classes, rotated around a different tonic;
- therefore generate the same seven natural-minor/major diatonic triads, but those chords receive different scale-degree numbers and Roman numerals because degree 1 changed.

Example:
- C major: C D E F G A B
- A natural minor: A B C D E F G

The pitch collection is the same. The tonic is not.

### Harmonic and melodic minor limitation
The exact shared-collection statement does **not** extend to harmonic or melodic minor.
- Harmonic minor raises natural-minor degree 7.
- Ascending melodic minor raises natural-minor degrees 6 and 7.
Those alterations change the pitch collection and can change the available diatonic chords.

Example:
- C major / A natural minor share C D E F G A B.
- A harmonic minor contains G-sharp, so it is not the same seven-note collection as C major.

### Tonic reinterpretation
Relative keys can sound and function differently even though their natural collections match because tonic changes the hierarchy of the notes and chords. The same physical chord can therefore change Roman numeral and function when the tonal center changes.

### Minor-third shortcut
- Major tonic → relative minor tonic: **down a minor 3rd (3 semitones)**.
- Minor tonic → relative major tonic: **up a minor 3rd (3 semitones)**.
This deliberately reconnects Phase 5 to Phase 1 interval knowledge.

### Enharmonic spelling
The interval shortcut identifies a pitch, but the shared key signature chooses the written key name.
- D-flat major → B-flat minor, **not A-sharp minor**.
- C-sharp major → A-sharp minor.
- G-flat major → E-flat minor.
- C-flat major → A-flat minor.

## Conventional written pairs used for practice

The existing scale engine supports major/minor key signatures through seven accidentals. Phase 5 derives these pairs algorithmically from the major scale's sixth degree:

- C major ↔ A minor
- G major ↔ E minor
- D major ↔ B minor
- A major ↔ F-sharp minor
- E major ↔ C-sharp minor
- B major ↔ G-sharp minor
- F-sharp major ↔ D-sharp minor
- C-sharp major ↔ A-sharp minor
- F major ↔ D minor
- B-flat major ↔ G minor
- E-flat major ↔ C minor
- A-flat major ↔ F minor
- D-flat major ↔ B-flat minor
- G-flat major ↔ E-flat minor
- C-flat major ↔ A-flat minor

## Roman-numeral rotation

For relative major → natural minor, the same chord roots rotate as follows:

- major degree 1 → minor degree 3
- 2 → 4
- 3 → 5
- 4 → 6
- 5 → 7
- 6 → 1
- 7 → 2

For C major / A natural minor:

- C: I → III
- Dm: ii → iv
- Em: iii → v
- F: IV → VI
- G: V → VII
- Am: vi → i
- B diminished: vii° → ii°

The implementation does not merely rotate text labels. It derives both diatonic harmony collections from the theory engine and matches each exact chord root + quality, then reads the Roman numeral under each tonic. This catches spelling or chord-quality mismatches instead of hiding them.

## Common beginner misunderstandings guarded against

- Confusing **relative** with **parallel** major/minor.
- Thinking “same notes” means the music must sound the same.
- Thinking harmonic or melodic minor has exactly the same collection as the relative major.
- Moving three semitones but choosing the wrong enharmonic key spelling.
- Memorizing only major → minor and not being able to reverse the relationship.
- Assuming a chord keeps the same Roman numeral after the tonic changes.
- Treating Roman numerals as chord names rather than tonic-relative labels.
