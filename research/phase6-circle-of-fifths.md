# Phase 6 research — Circle of Fifths

Research completed before implementation for Block 7. The curriculum uses the circle as a relationship map and transposition tool, not as a poster to memorize.

## Sources cross-checked

1. **Open Music Theory — Major Scales, Scale Degrees, and Key Signatures**  
   https://pressbooks.nebraska.edu/openmusictheory/chapter/major-scales/  
   Confirms the circle orders major key signatures by fifths; clockwise adds sharps and counterclockwise adds flats; the bottom region contains enharmonically equivalent written keys.

2. **Open Music Theory — Minor Scales, Scale Degrees, and Key Signatures**  
   https://pressbooks.nebraska.edu/openmusictheory/chapter/minor-scales/  
   Confirms relative major/minor share a key signature and can be displayed together on the circle; relative-minor tonics are three half steps below the relative major.

3. **Open Music Theory — Extended Tonicization and Modulation to Closely Related Keys**  
   https://pressbooks.nebraska.edu/openmusictheory/chapter/extended-tonicization-and-modulation-to-closely-related-keys/  
   Defines closely related keys using signatures one accidental sharper/flatter and their relatives; explains that these keys share substantial chord material.

4. **University of Puget Sound, Music Theory for the 21st-Century Classroom — Major Key Signatures**  
   https://musictheory.pugetsound.edu/mt21c/MajorKeySignatures.html  
   Confirms ascending fifths clockwise make signatures progressively sharper, descending fifths/counterclockwise progressively flatter, and explicitly identifies the enharmonic pairs B/C-flat, F-sharp/G-flat, and C-sharp/D-flat.

5. **University of Puget Sound — Key Relationships**  
   https://musictheory.pugetsound.edu/mt21c/KeyRelationships.html  
   Defines five closely related keys for a major/minor home key and distinguishes foreign/distantly related key signatures.

6. **Open Music Theory — Chord Symbols**  
   https://pressbooks.nebraska.edu/openmusictheory/chapter/chord-symbols/  
   Confirms Roman numerals are relative labels tied to a key rather than absolute chord names. This is the basis for preserving a Roman-numeral progression while changing target key.

## Accuracy decisions

### Circle construction and direction

- The practical clockwise major-key order is C → G → D → A → E → B → F#/Gb → C#/Db → Ab → Eb → Bb → F → C.
- Every clockwise step changes the tonic by the pitch-class distance of an ascending perfect 5th (7 semitones).
- Counterclockwise is the inverse path: a descending perfect 5th, equivalent in pitch class to an ascending perfect 4th. Phase 6 explicitly ties both directions to Phase 1 P5/P4 knowledge.
- Around the enharmonic seam, the same pitch-class movement may be respelled to keep key signatures conventional rather than inventing keys with 8+ accidentals.

### Adjacent major keys share 6 of 7 notes

An adjacent major key differs by exactly one key-signature accidental. The implementation verifies the consequence algorithmically for every adjacent pair on the 12-position circle: the two major scales share exactly six pitch classes. Example: C major = C D E F G A B; G major = G A B C D E F#. The only changed pitch class is F → F#.

### Closely related vs distant

For a major home key, the traditional five closely related keys are:

- the clockwise adjacent major,
- the counterclockwise adjacent major,
- the home key's relative minor,
- and the relative minors of those two adjacent majors.

The lessons use **distant** in plain language for keys outside that immediate family, without teaching advanced modulation. For the deliberate "escape your usual key" drill, a target must be **4–6 major-circle steps away** so the exercise creates a substantial transfer rather than a tiny one-step change.

### Enharmonic labels

The visual keeps both conventional labels at the three seam positions where useful:

- B / C-flat
- F-sharp / G-flat
- C-sharp / D-flat

Relative minors are paired with the matching written major spelling (for example F-sharp major ↔ D-sharp minor, G-flat major ↔ E-flat minor). The circle does not silently treat enharmonic spellings as interchangeable key signatures.

### Relative keys

Relative minors sit with their major-key signature position. This phase reuses the Phase 5 relationship rather than reteaching it as new material.

### Practical transposition

Roman numerals remain the portable relationship. The learner keeps a pattern such as I–V–vi–IV and derives new chord roots in a far-side target major key. If a valid major-key progression saved from Phase 4 Lesson 10 exists, Phase 6 can reuse it; otherwise the lesson falls back to I–V–vi–IV and never breaks.

### Piano / production application

The theory sources establish the key, interval, signature, relative-key, and Roman-numeral relationships. The app's production workflow is a practical implementation inference: use the circle to pick an unfamiliar target, rebuild the target scale/chords, and then play or program the same Roman-numeral pattern on piano/MIDI in the new key.
