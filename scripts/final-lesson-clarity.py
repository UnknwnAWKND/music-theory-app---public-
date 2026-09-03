from pathlib import Path

# This pass runs after apply-lesson-clarity.py and makes the teaching language even simpler.
app = Path("web/app.js")
s = app.read_text()

# Break dense lesson summaries into separate tiny cards, one sentence at a time.
old = '  pages.push({ eyebrow: "One idea", title: lesson.title, body: lesson.summary });\n'
new = '''  const summaryParts = String(lesson.summary ?? "").split(/(?<=[.!?])\\s+/).filter(Boolean);\n  summaryParts.forEach((body, i) => pages.push({ eyebrow: "One idea", title: i === 0 ? lesson.title : "One more piece", body }));\n'''
if old in s:
    s = s.replace(old, new, 1)

# Add simple definitions before technical words first appear.
needle = '  "minor.relative": [["Relative major/minor", "A major key and minor key that use the same notes but have different home notes.", "C major and A minor use the same notes."]],\n});'
replacement = '''  "minor.relative": [["Relative major/minor", "A major key and minor key that use the same notes but have different home notes.", "C major and A minor use the same notes."]],\n  "progression.transpose": [["Transpose", "Move the same musical relationships into a different key.", "I–V–vi–IV in C major can be moved to G major while keeping the same chord-number pattern."]],\n  "function.basic-flow": [["Function", "The job a chord tends to do in a key.", "Some chords feel like home. Others create movement or tension."]],\n  "minor.parallel": [["Parallel major/minor", "Major and minor keys that share the same home note.", "C major and C minor are parallel keys."]],\n  "minor.raised7": [["Leading tone", "A note one half step below the home note that strongly pulls upward to it.", "In C, B is the leading tone because B wants to move to C."]],\n  "seventh.members": [["Seventh chord", "A four-note chord made by adding a 7th above the root to a triad.", "C–E–G–B is C major 7."]],\n  "inversion.triad": [["Inversion", "A chord with a note other than the root in the bass.", "C/E is a C chord with E as the lowest note."]],\n  "voicing.distinction": [["Voicing", "The way a chord's notes are spread out or arranged.", "C–E–G and C–G–E are different voicings of the same chord."]],\n  "voice.common-tones": [["Voice leading", "How individual notes move from one chord to the next.", "Keeping a shared note while the other notes move can make chord changes smoother."]],\n  "keys.signatures": [["Key signature", "The sharps or flats that normally belong to a key.", "G major has one sharp: F♯."]],\n  "circle.major": [["Circle of Fifths", "A map that organizes keys by fifths.", "Moving clockwise from C takes you to G, then D, then A."]],\n  "extension.compound-intervals": [["Compound interval", "An interval larger than an octave.", "A 9th is an octave plus a 2nd."]],\n  "color.sus": [["Suspended chord", "A chord where the 3rd is replaced by the 2nd or 4th.", "Csus4 uses C–F–G instead of C–E–G."]],\n  "secondary.V": [["Secondary dominant", "A dominant chord that temporarily points toward a chord other than the main tonic.", "In C major, D7 can point strongly to G."]],\n  "mixture.parallel": [["Modal mixture", "Borrowing a chord from the parallel major or minor key.", "In C major, F minor can be borrowed from C minor."]],\n  "mode.tonic-center": [["Mode", "A scale pattern heard around its own home note.", "D Dorian uses D as home; it is not just C major starting on D."]],\n  "modulation.tonicization-vs-keychange": [["Modulation", "A real change of musical home to a new key.", "The music leaves C major and establishes G major as the new home."]],\n  "modulation.tonicization-vs-keychange": [["Tonicization", "Briefly making another chord feel like home without fully changing key.", "D7→G inside C major can briefly make G feel like home."], ["Modulation", "A stronger change where a new key becomes the musical home.", "The music leaves C major and establishes G major."]],\n  "melody.chord-tones": [["Chord tone", "A note that belongs to the chord playing right now.", "Over C major, C, E, and G are chord tones."]],\n  "melody.nonchord": [["Non-chord tone", "A note that is not part of the chord playing right now.", "Over C major, D can be a non-chord tone even though D belongs to the key of C major."]],\n});'''
if needle in s:
    s = s.replace(needle, replacement, 1)

app.write_text(s)

catalog = Path("src/exercises/catalog.ts")
c = catalog.read_text()
# Make the first questions use plain language instead of technical vocabulary.
c = c.replace('`Give the common enharmonic spelling of ${pair[0]} using a flat.`', '`What is another name for ${pair[0]}?`')
c = c.replace('"Ignoring quality, C up to E is what generic interval number?"', '"C to E is what interval number?"')
c = c.replace('"Which interval-number families normally use major/minor qualities?"', '"Which interval numbers can be major or minor?"')
c = c.replace('"In a root-position tertian triad, what are the three chord members called?"', '"A basic triad has which three note roles?"')
c = c.replace('"How many distinct scale degrees are in a diatonic seven-note scale before the octave repeats the tonic?"', '"How many scale degrees are there before the octave repeats?"')
catalog.write_text(c)
