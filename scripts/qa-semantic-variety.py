from pathlib import Path

# A semantic signature must include the visible context as well as structured attributes.
# Otherwise a progression in C and the same progression in F collapse to one example merely
# because both payloads contain the same Roman numerals.
p = Path("src/practice/adaptive.ts")
t = p.read_text()
old = '''  const names = Object.keys(attributes).sort();
  if (!names.length) return `${exercise.type}:${exercise.prompt.trim().toLowerCase()}`;
  return `${exercise.type}:${JSON.stringify(Object.fromEntries(names.map((key) => [key, attributes[key]])))}`;'''
new = '''  const names = Object.keys(attributes).sort();
  const prompt = exercise.prompt.trim().toLowerCase();
  if (!names.length) return `${exercise.type}:${prompt}`;
  return `${exercise.type}:${JSON.stringify(Object.fromEntries(names.map((key) => [key, attributes[key]])))}:${prompt}`;'''
if new not in t:
    if old not in t:
        raise SystemExit("semantic signature anchor missing")
    t = t.replace(old, new, 1)
p.write_text(t)

# Concept facts that have no key/root context still need more than one legitimate retrieval form.
p = Path("src/exercises/catalog.ts")
t = p.read_text()
replacements = {
'''  if (skillId === "interval.quality-system") return text(skillId, index, "Which interval numbers can be major or minor?", "2nds, 3rds, 6ths, and 7ths", ["1sts, 4ths, 5ths, and octaves", "2nds, 3rds, 6ths, and 7ths"]);''':
'''  if (skillId === "interval.quality-system") {
    const cases = [
      ["Which interval numbers can be major or minor?", "2nds, 3rds, 6ths, and 7ths", ["1sts, 4ths, 5ths, and octaves", "2nds, 3rds, 6ths, and 7ths"]],
      ["Which interval numbers belong to the perfect family?", "1sts, 4ths, 5ths, and octaves", ["1sts, 4ths, 5ths, and octaves", "2nds, 3rds, 6ths, and 7ths"]],
      ["If a major interval is lowered by one semitone without changing its interval number, what quality does it become?", "minor", ["minor", "perfect", "augmented"]],
    ] as const;
    const [prompt, expected, choices] = pick(cases, index);
    return text(skillId, index, prompt, expected, choices);
  }''',
'''  if (skillId === "triad.root-vs-bass") return text(skillId, index, "In E–G–C, if the chord is C major, which note is the root?", "C", ["C", "E", "G"], "The root determines chord identity; the lowest note is the bass.");''':
'''  if (skillId === "triad.root-vs-bass") {
    const cases = [
      ["In E–G–C, if the chord is C major, which note is the root?", "C", ["C", "E", "G"]],
      ["In A–D–F♯, if the chord is D major, which note is the bass?", "A", ["D", "F♯", "A"]],
      ["In B♭–E♭–G, if the chord is E♭ major, which note determines the chord name?", "E♭", ["B♭", "E♭", "G"]],
    ] as const;
    const [prompt, expected, choices] = pick(cases, index);
    return text(skillId, index, prompt, expected, choices, "The root determines chord identity; the lowest note is the bass.");
  }''',
'''  if (skillId === "major.formula") return text(skillId, index, "What is the whole/half-step formula for a major scale?", "W-W-H-W-W-W-H");''':
'''  if (skillId === "major.formula") {
    const cases = [
      ["What is the whole/half-step formula for a major scale?", "W-W-H-W-W-W-H"],
      ["In the major-scale step pattern, where are the two half steps?", "3-4 and 7-8"],
      ["After W-W-H in the major-scale formula, what comes next?", "W-W-W-H"],
    ] as const;
    const [prompt, expected] = pick(cases, index);
    return text(skillId, index, prompt, expected);
  }''',
'''  if (skillId === "scale.degree-numbers") return text(skillId, index, "How many scale degrees are there before the octave repeats?", "7", ["6", "7", "8"]);''':
'''  if (skillId === "scale.degree-numbers") {
    const cases = [
      ["How many scale degrees are there before the octave repeats?", "7", ["6", "7", "8"]],
      ["When the tonic repeats one octave higher, which scale-degree number repeats?", "1", ["1", "7", "8"]],
      ["In a seven-note scale, what number labels the note immediately before the tonic repeats?", "7", ["6", "7", "8"]],
    ] as const;
    const [prompt, expected, choices] = pick(cases, index);
    return text(skillId, index, prompt, expected, choices);
  }''',
'''  if (skillId === "diatonic.definition") return text(skillId, index, "In C major, is D–F♯–A fully diatonic?", "no", ["yes", "no"], "F♯ is outside the C-major scale.");''':
'''  if (skillId === "diatonic.definition") {
    const cases = [
      ["In C major, is D–F♯–A fully diatonic?", "no", "F♯ is outside the C-major scale."],
      ["In G major, is A–C–E fully diatonic?", "yes", "A, C, and E all belong to G major."],
      ["In F major, is B–D–F fully diatonic?", "no", "F major uses B♭, not B natural."],
    ] as const;
    const [prompt, expected, detail] = pick(cases, index);
    return text(skillId, index, prompt, expected, ["yes", "no"], detail);
  }''',
'''  if (skillId === "diatonic.major-pattern") return text(skillId, index, "What is the diatonic triad-quality pattern in a major key?", "major-minor-minor-major-major-minor-diminished");''':
'''  if (skillId === "diatonic.major-pattern") {
    const cases = [
      ["What is the diatonic triad-quality pattern in a major key?", "major-minor-minor-major-major-minor-diminished"],
      ["Which scale degrees have major diatonic triads in a major key?", "1, 4, and 5"],
      ["Which scale degree has the diminished diatonic triad in a major key?", "7"],
    ] as const;
    const [prompt, expected] = pick(cases, index);
    return text(skillId, index, prompt, expected);
  }''',
'''  if (skillId === "progression.absolute-relative") return text(skillId, index, "Which label is relative to the current key rather than an absolute chord name?", "V", ["G major", "V"]);''':
'''  if (skillId === "progression.absolute-relative") {
    const cases = [
      ["Which label is relative to the current key rather than an absolute chord name?", "V", ["G major", "V"]],
      ["Which label names a specific chord regardless of key?", "D minor", ["ii", "D minor"]],
      ["If the key changes, which kind of label keeps describing the same harmonic role: Roman numeral or absolute chord name?", "Roman numeral", ["Roman numeral", "absolute chord name"]],
    ] as const;
    const [prompt, expected, choices] = pick(cases, index);
    return text(skillId, index, prompt, expected, choices);
  }''',
'''  if (skillId === "progression.scale-degree-vs-chord") return text(skillId, index, "In C major, scale degree 5 is one note. What does Roman numeral V represent?", "the chord built on scale degree 5");''':
'''  if (skillId === "progression.scale-degree-vs-chord") {
    const cases = [
      ["In C major, scale degree 5 is one note. What does Roman numeral V represent?", "the chord built on scale degree 5"],
      ["In G major, scale degree 2 names A. What does Roman numeral ii represent?", "the chord built on scale degree 2"],
      ["Does the number 4 name one scale note or the IV chord when it is written as a Roman numeral?", "the IV chord"],
    ] as const;
    const [prompt, expected] = pick(cases, index);
    return text(skillId, index, prompt, expected);
  }''',
'''  if(skillId==="minor.variable6-7") return text(skillId,index,"Which scale degrees are especially variable in tonal minor?","6 and 7",["2 and 3","4 and 5","6 and 7"]);''':
'''  if(skillId==="minor.variable6-7") {
    const cases=[
      ["Which scale degrees are especially variable in tonal minor?","6 and 7",["2 and 3","4 and 5","6 and 7"]],
      ["Which scale degree is commonly raised to create the leading tone in minor?","7",["6","7"]],
      ["Classical melodic minor commonly raises which two degrees while ascending?","6 and 7",["3 and 6","6 and 7"]],
    ] as const;
    const [prompt,expected,choices]=pick(cases,index);
    return text(skillId,index,prompt,expected,choices);
  }''',
'''  if(skillId==="voicing.distinction") return text(skillId,index,"What determines a chord's inversion?","which chord member is in the bass",["the total number of notes","which chord member is in the bass","the top note only"]);''':
'''  if(skillId==="voicing.distinction") {
    const cases=[
      ["What determines a chord's inversion?","which chord member is in the bass",["the total number of notes","which chord member is in the bass","the top note only"]],
      ["If the bass note stays the root but upper chord tones are rearranged, did the inversion change?","no",["yes","no"]],
      ["Two C-major shapes both have E in the bass but different top-note spacing. Do they share the same inversion?","yes",["yes","no"]],
    ] as const;
    const [prompt,expected,choices]=pick(cases,index);
    return text(skillId,index,prompt,expected,choices);
  }''',
'''  if(skillId==="voice.guide-tones") return text(skillId,index,"In seventh-chord voice leading, which chord members are especially informative guide tones?","thirds and sevenths",["roots and fifths","thirds and sevenths"]);''':
'''  if(skillId==="voice.guide-tones") {
    const cases=[
      ["In seventh-chord voice leading, which chord members are especially informative guide tones?","thirds and sevenths",["roots and fifths","thirds and sevenths"]],
      ["In G7, which two chord tones most clearly define dominant quality?","B and F"],
      ["Why are 3rds and 7ths useful guide tones?","they strongly define chord quality and function"],
    ] as const;
    const [prompt,expected,choices]=pick(cases,index);
    return text(skillId,index,prompt,expected,choices);
  }''',
'''  if(skillId==="melody.nonchord") return text(skillId,index,"In C major over a C-major triad, D is best classified at the most basic level as what?","a non-chord tone",["a chord tone","a non-chord tone"]);''':
'''  if(skillId==="melody.nonchord") {
    const cases=[
      ["In C major over a C-major triad, D is best classified at the most basic level as what?","a non-chord tone"],
      ["Over an F-major triad, is G a chord tone or a non-chord tone?","a non-chord tone"],
      ["Over an A-minor triad, is C a chord tone or a non-chord tone?","a chord tone"],
    ] as const;
    const [prompt,expected]=pick(cases,index);
    return text(skillId,index,prompt,expected,["a chord tone","a non-chord tone"]);
  }''',
'''  if(skillId==="mode.tonic-center") return text(skillId,index,"Why are D Dorian and C major not the same tonal statement even though they can share the same pitch collection?","they have different tonal centers",["they always use different notes","they have different tonal centers"]);''':
'''  if(skillId==="mode.tonic-center") {
    const cases=[
      ["Why are D Dorian and C major not the same tonal statement even though they can share the same pitch collection?","they have different tonal centers"],
      ["A melody uses only C-major notes but repeatedly resolves to D. What matters most for hearing D Dorian instead of C major?","D is the tonal center"],
      ["Can two modes share the same notes but sound different because a different pitch acts as home?","yes"],
    ] as const;
    const [prompt,expected]=pick(cases,index);
    return text(skillId,index,prompt,expected);
  }''',
'''  if(skillId==="modulation.tonicization-vs-keychange") return text(skillId,index,"Which term means a brief emphasis of a non-tonic chord without establishing a lasting new key?","tonicization",["tonicization","modulation"]);''':
'''  if(skillId==="modulation.tonicization-vs-keychange") {
    const cases=[
      ["Which term means a brief emphasis of a non-tonic chord without establishing a lasting new key?","tonicization"],
      ["If music establishes a new tonic for an extended passage, is that tonicization or modulation?","modulation"],
      ["A secondary dominant briefly points to ii, then the music immediately returns to the original key. What is that brief emphasis called?","tonicization"],
    ] as const;
    const [prompt,expected]=pick(cases,index);
    return text(skillId,index,prompt,expected,["tonicization","modulation"]);
  }''',
'''  if(skillId==="modulation.direct") return text(skillId,index,"A modulation that changes to a new key without a pivot chord is commonly called what?","direct modulation");''':
'''  if(skillId==="modulation.direct") {
    const cases=[
      ["A modulation that changes to a new key without a pivot chord is commonly called what?","direct modulation"],
      ["If one phrase ends in C major and the next immediately establishes E major with no shared pivot chord, what broad modulation type is this?","direct modulation"],
    ] as const;
    const [prompt,expected]=pick(cases,index);
    return text(skillId,index,prompt,expected);
  }''',
'''  if(skillId==="modulation.pivot") return text(skillId,index,"What is the central idea of a common-chord (pivot-chord) modulation?","a chord is reinterpreted as belonging to both the old and new keys");''':
'''  if(skillId==="modulation.pivot") {
    const cases=[
      ["What is the central idea of a common-chord (pivot-chord) modulation?","a chord is reinterpreted as belonging to both the old and new keys"],
      ["In a pivot-chord modulation, what makes the pivot useful?","it belongs to both the old and new keys"],
      ["A chord functions as vi in the old key and ii in the new key. What role can that shared chord serve?","a pivot chord"],
    ] as const;
    const [prompt,expected]=pick(cases,index);
    return text(skillId,index,prompt,expected);
  }''',
'''  if(skillId==="analysis.integrated") return text(skillId,index,"In C major, the progression C – A7 – Dm – G7 – C contains A7 most naturally as what Roman-numeral function?","V7/ii");''':
'''  if(skillId==="analysis.integrated") {
    const cases=[
      ["In C major, C – A7 – Dm – G7 – C contains A7 most naturally as what Roman-numeral function?","V7/ii"],
      ["In C major, C – D7 – G – C contains D7 most naturally as what Roman-numeral function?","V7/V"],
      ["In G major, G – E7 – Am – D7 – G contains E7 most naturally as what Roman-numeral function?","V7/ii"],
    ] as const;
    const [prompt,expected]=pick(cases,index);
    return text(skillId,index,prompt,expected);
  }''',
'''  if(skillId==="guitar.alternate-tunings") return selfCheck(skillId,index,"Define an alternate tuning by its six open-string notes, then remap one chosen interval and one major triad from a selected root using note relationships, not standard-tuning shape memory.");''':
'''  if(skillId==="guitar.alternate-tunings") {
    const roots=["C","D","E","G"] as const;
    return selfCheck(skillId,index,`Define your alternate tuning by its six open-string notes, then remap a major 3rd and a major triad from ${pick(roots,index)} using note relationships rather than standard-tuning shape memory.`);
  }''',
'''  if(skillId==="guitar.idea-to-neck") return selfCheck(skillId,index,"Choose a short musical idea you can already imagine clearly. Identify its interval/scale-degree relationships first, then locate more than one playable version on the neck.");''':
'''  if(skillId==="guitar.idea-to-neck") {
    const tasks=[
      "Choose a three-note melodic idea you can imagine clearly. Identify its interval/scale-degree relationships, then locate two playable versions on the neck.",
      "Choose a four-note melodic idea you can imagine clearly. Name its scale-degree motion first, then locate it in two neck regions.",
      "Take a short piano idea you know. Describe its interval relationships, then transfer it to two guitar positions without relying on a memorized box.",
    ];
    return selfCheck(skillId,index,pick(tasks,index));
  }''',
}

for old, new in replacements.items():
    if new in t:
        continue
    if old not in t:
        raise SystemExit(f"semantic variety anchor missing: {old[:80]}")
    t = t.replace(old, new, 1)
p.write_text(t)

print("Semantic question variety hardened")
