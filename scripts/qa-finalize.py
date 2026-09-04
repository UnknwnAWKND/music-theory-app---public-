from pathlib import Path


def replace_once(path, old, new, label):
    p = Path(path)
    text = p.read_text()
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"QA finalization anchor missing for {label} in {path}")
    p.write_text(text.replace(old, new, 1))

# A semantic example must reflect what the learner actually sees, not only whichever
# payload fields happen to be whitelisted. This preserves true duplicate detection
# while allowing root/key/context variation expressed in the prompt to count.
replace_once(
    "src/practice/adaptive.ts",
    '''  if (!names.length) return `${exercise.type}:${exercise.prompt.trim().toLowerCase()}`;\n  return `${exercise.type}:${JSON.stringify(Object.fromEntries(names.map((key) => [key, attributes[key]])))}`;''',
    '''  const prompt = exercise.prompt.trim().toLowerCase();\n  if (!names.length) return `${exercise.type}:${prompt}`;\n  return `${exercise.type}:${prompt}:${JSON.stringify(Object.fromEntries(names.map((key) => [key, attributes[key]])))}`;''',
    "core semantic signature",
)

# A handful of conceptual/application skills originally had exactly one generated
# example forever. Under v2 varied/application READY rules that made them impossible
# to finish without weakening the evidence model. Add small representative variants
# of the SAME existing competencies; no curriculum IDs or prerequisite structure change.
p = Path("src/exercises/catalog.ts")
t = p.read_text()
helper = r'''function qaVariedConceptExercise(skillId: string, index: number): Exercise | undefined {
  const odd = Math.abs(index) % 2 === 1;
  if (skillId === "interval.quality-system") return odd
    ? text(skillId, index, "Which interval numbers belong to the perfect family?", "1sts, 4ths, 5ths, and octaves")
    : text(skillId, index, "Which interval numbers can be major or minor?", "2nds, 3rds, 6ths, and 7ths", ["1sts, 4ths, 5ths, and octaves", "2nds, 3rds, 6ths, and 7ths"]);
  if (skillId === "triad.root-vs-bass") return odd
    ? text(skillId, index, "In E–A–C, if the chord is A minor, which note is the root?", "A", ["A", "C", "E"])
    : text(skillId, index, "In E–G–C, if the chord is C major, which note is the root?", "C", ["C", "E", "G"]);
  if (skillId === "major.formula") return odd
    ? text(skillId, index, "In the major-scale step pattern, where do the two half steps occur?", "3-4 and 7-1")
    : text(skillId, index, "What is the whole/half-step formula for a major scale?", "W-W-H-W-W-W-H");
  if (skillId === "scale.degree-numbers") return odd
    ? text(skillId, index, "After scale degree 7, which scale degree repeats at the octave?", "1")
    : text(skillId, index, "How many scale degrees are there before the octave repeats?", "7", ["6", "7", "8"]);
  if (skillId === "diatonic.definition") return odd
    ? text(skillId, index, "In G major, is C–E–G fully diatonic?", "yes", ["yes", "no"])
    : text(skillId, index, "In C major, is D–F♯–A fully diatonic?", "no", ["yes", "no"]);
  if (skillId === "diatonic.major-pattern") return odd
    ? text(skillId, index, "What triad quality belongs on scale degree 7 in a major key?", "diminished")
    : text(skillId, index, "What is the diatonic triad-quality pattern in a major key?", "major-minor-minor-major-major-minor-diminished");
  if (skillId === "progression.absolute-relative") return odd
    ? text(skillId, index, "Write the relative chord label for the dominant chord of any major key.", "V")
    : text(skillId, index, "Which label is relative to the current key rather than an absolute chord name?", "V", ["G major", "V"]);
  if (skillId === "progression.scale-degree-vs-chord") return odd
    ? text(skillId, index, "In a major key, what does Roman numeral iii represent?", "the chord built on scale degree 3")
    : text(skillId, index, "In C major, scale degree 5 is one note. What does Roman numeral V represent?", "the chord built on scale degree 5");
  if (skillId === "function.tonic") return odd
    ? text(skillId, index, "What functional role does I most strongly represent in conventional major-key harmony?", "tonic")
    : text(skillId, index, "In functional major-key harmony, which core chord most strongly represents tonic/home?", "I", ["I", "IV", "V"]);
  if (skillId === "function.dominant") return odd
    ? text(skillId, index, "What functional role does V most strongly represent in conventional major-key harmony?", "dominant")
    : text(skillId, index, "In functional major-key harmony, which core chord most strongly has dominant tendency?", "V", ["I", "IV", "V"]);
  if (skillId === "function.V-I") return odd
    ? text(skillId, index, "V resolving to I moves from which function to which function?", "dominant to tonic")
    : text(skillId, index, "Which motion is the foundational dominant-to-tonic resolution in major?", "V→I", ["IV→I", "V→I", "I→V"]);
  if (skillId === "function.predominant") return odd
    ? text(skillId, index, "In the basic functional flow, what function normally comes before dominant?", "predominant")
    : text(skillId, index, "Which pair are core predominant chords in conventional functional major harmony?", "ii and IV", ["I and vi", "ii and IV", "V and vii°"]);
  if (skillId === "function.basic-flow") return odd
    ? text(skillId, index, "Complete the functional path: tonic → predominant → ___ → tonic.", "dominant")
    : text(skillId, index, "What is the basic functional flow taught as a conventional tonal model?", "tonic→predominant→dominant→tonic");
  if (skillId === "function.context") return odd
    ? text(skillId, index, "Can the same chord have different harmonic functions in different musical contexts?", "yes", ["yes", "no"])
    : text(skillId, index, "True or false: every chord has one permanent harmonic function in every musical style and context.", "false", ["true", "false"]);
  if (skillId === "minor.variable6-7") return odd
    ? text(skillId, index, "In tonal minor, which two scale degrees can change depending on melodic and harmonic context?", "6 and 7")
    : text(skillId, index, "Which scale degrees are especially variable in tonal minor?", "6 and 7", ["2 and 3", "4 and 5", "6 and 7"]);
  if (skillId === "voicing.distinction") return odd
    ? text(skillId, index, "If the bass note stays the same chord member but upper notes are rearranged, did the inversion necessarily change?", "no", ["yes", "no"])
    : text(skillId, index, "What determines a chord's inversion?", "which chord member is in the bass", ["the total number of notes", "which chord member is in the bass", "the top note only"]);
  if (skillId === "voice.guide-tones") return odd
    ? text(skillId, index, "In a seventh chord, name the two chord-member types most useful as guide tones.", "thirds and sevenths")
    : text(skillId, index, "In seventh-chord voice leading, which chord members are especially informative guide tones?", "thirds and sevenths", ["roots and fifths", "thirds and sevenths"]);
  if (skillId === "melody.nonchord") return odd
    ? text(skillId, index, "In G major over a G-major triad, A is a chord tone or a non-chord tone?", "a non-chord tone", ["a chord tone", "a non-chord tone"])
    : text(skillId, index, "In C major over a C-major triad, D is best classified at the most basic level as what?", "a non-chord tone", ["a chord tone", "a non-chord tone"]);
  if (skillId === "mode.tonic-center") return odd
    ? text(skillId, index, "A Dorian and G major can share a pitch collection. What makes them different modal/tonal statements?", "they have different tonal centers", ["they always use different notes", "they have different tonal centers"])
    : text(skillId, index, "Why are D Dorian and C major not the same tonal statement even though they can share the same pitch collection?", "they have different tonal centers", ["they always use different notes", "they have different tonal centers"]);
  if (skillId === "modulation.tonicization-vs-keychange") return odd
    ? text(skillId, index, "Which term means a new key becomes established as the musical home rather than being emphasized only briefly?", "modulation", ["tonicization", "modulation"])
    : text(skillId, index, "Which term means a brief emphasis of a non-tonic chord without establishing a lasting new key?", "tonicization", ["tonicization", "modulation"]);
  if (skillId === "modulation.direct") return odd
    ? text(skillId, index, "If music moves straight into a new key without using a shared pivot chord, what kind of modulation is that?", "direct modulation")
    : text(skillId, index, "A modulation that changes to a new key without a pivot chord is commonly called what?", "direct modulation");
  if (skillId === "modulation.pivot") return odd
    ? text(skillId, index, "In pivot-chord modulation, how is the pivot chord heard across the key change?", "as belonging to both the old and new keys")
    : text(skillId, index, "What is the central idea of a common-chord (pivot-chord) modulation?", "a chord is reinterpreted as belonging to both the old and new keys");
  if (skillId === "analysis.integrated") return odd
    ? text(skillId, index, "In G major, G – E7 – Am – D7 – G contains E7 most naturally as what Roman-numeral function?", "V7/ii")
    : text(skillId, index, "In C major, C – A7 – Dm – G7 – C contains A7 most naturally as what Roman-numeral function?", "V7/ii");
  if (skillId === "guitar.alternate-tunings") return selfCheck(skillId, index, odd
    ? "In Drop D, choose one root and rebuild a major triad by note/interval relationships instead of copying its standard-tuning shape."
    : "In DADGAD, choose one root and locate a perfect 5th in two places using the tuning's actual open-string notes.");
  if (skillId === "guitar.idea-to-neck") return selfCheck(skillId, index, odd
    ? "Imagine a short 1–♭3–5 melodic idea. Find more than one playable version on the neck from interval relationships."
    : "Imagine a short 1–3–5 melodic idea. Find more than one playable version on the neck from interval relationships.");
  return undefined;
}

'''
anchor = 'export function exerciseForSkill(skillId: string, index = 0): Exercise {\n  if (!SKILL_BY_ID.has(skillId)) throw new Error(`Unknown skill: ${skillId}`);\n'
replacement = 'export function exerciseForSkill(skillId: string, index = 0): Exercise {\n  if (!SKILL_BY_ID.has(skillId)) throw new Error(`Unknown skill: ${skillId}`);\n  const qaVariant = qaVariedConceptExercise(skillId, index);\n  if (qaVariant) return qaVariant;\n'
if helper not in t:
    if anchor not in t:
        raise SystemExit("Exercise dispatch anchor missing")
    t = t.replace(anchor, helper + replacement, 1)
p.write_text(t)

p = Path("web/app.js")
t = p.read_text()

# Prompt 4's historical transform can run again in CI after generated source has
# already been committed. QA extended parts of its routing/visual blocks, so an exact
# string-idempotency check can otherwise insert a second copy on the next run.
marker = 'let replayingHistory = false;'
while t.count(marker) > 1:
    second = t.find(marker, t.find(marker) + len(marker))
    footer = t.find('function footerHtml() { return ""; }', second)
    if second < 0 or footer < 0:
        raise SystemExit("Could not safely de-duplicate history routing block")
    t = t[:second] + t[footer:]

visual_marker = 'function notePitchClass(note) {'
while t.count(visual_marker) > 1:
    second = t.find(visual_marker, t.find(visual_marker) + len(visual_marker))
    lesson_pages = t.find('function lessonPagesFor(item) {', second)
    if second < 0 or lesson_pages < 0:
        raise SystemExit("Could not safely de-duplicate teaching visual block")
    t = t[:second] + t[lesson_pages:]

old = '''function exampleSignatureForExercise(exercise) {\n  const attributes = evidenceAttributesForExercise(exercise);\n  const keys = Object.keys(attributes).sort();\n  if (!keys.length) return `${exercise.type}:${String(exercise.prompt).trim().toLowerCase()}`;\n  const stable = Object.fromEntries(keys.map((key) => [key, attributes[key]]));\n  return `${exercise.type}:${JSON.stringify(stable)}`;\n}'''
new = '''function exampleSignatureForExercise(exercise) {\n  const attributes = evidenceAttributesForExercise(exercise);\n  const keys = Object.keys(attributes).sort();\n  const prompt = String(exercise.prompt).trim().toLowerCase();\n  if (!keys.length) return `${exercise.type}:${prompt}`;\n  const stable = Object.fromEntries(keys.map((key) => [key, attributes[key]]));\n  return `${exercise.type}:${prompt}:${JSON.stringify(stable)}`;\n}'''
if new not in t:
    if old not in t:
        raise SystemExit("Browser semantic signature anchor missing")
    t = t.replace(old, new, 1)

p.write_text(t)
print("Final QA idempotency, variety, and semantic-signature fixes applied")
