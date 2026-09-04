import { SKILL_BY_ID } from "../curriculum/index.js";
import {
  FLAT_ORDER,
  INTERVALS,
  MAJOR_ROMANS,
  SHARP_ORDER,
  buildColorChord,
  buildDominantExtension,
  buildNinth,
  buildSeventh,
  buildTriad,
  canonicalGuitarNoteName,
  classicalMelodicMinor,
  formatNote,
  guitarPitchClass,
  harmonicMinorScale,
  intervalAbove,
  jazzMelodicMinorScale,
  majorDiatonicSevenths,
  majorDiatonicTriads,
  majorKeySignature,
  majorProgression,
  majorRomanForDegree,
  majorScale,
  majorTriadForDegree,
  melodicMinorAscendingScale,
  modeScale,
  naturalMinorDiatonicTriads,
  naturalMinorScale,
  parallelNaturalMinorAlterations,
  parseNote,
  pitchClass,
  relativeMajorName,
  relativeMinorName,
  type ColorChordQuality,
  type IntervalName,
  type ModeName,
  type NinthQuality,
  type SeventhQuality,
  type TriadQuality,
} from "../theory/index.js";
import { CONVENTIONAL_MAJOR_TONICS, PRACTICAL_ROOTS, intervalBuildExercise, majorDegreeExercise, majorScaleExercise, triadBuildExercise } from "./generators.js";
import type { Exercise } from "./types.js";

const CORE_INTERVALS: readonly IntervalName[] = ["P1", "m2", "M2", "m3", "M3", "P4", "A4", "d5", "P5", "m6", "M6", "m7", "M7", "P8"];
const TRIADS: readonly TriadQuality[] = ["major", "minor", "diminished", "augmented"];
const SEVENTHS: readonly SeventhQuality[] = ["major7", "minor7", "dominant7", "halfDiminished7", "diminished7"];
const MODES: readonly ModeName[] = ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"];
const MINOR_TONICS = ["A", "E", "B", "F#", "C#", "G#", "D", "G", "C", "F", "Bb", "Eb"] as const;

function pick<T>(items: readonly T[], index: number): T {
  if (!items.length) throw new Error("Cannot pick from empty list");
  return items[((index % items.length) + items.length) % items.length];
}
function noteNames(notes: readonly { letter: string; accidental: number }[]) { return notes.map((n) => formatNote(n as any)); }
function text(skillId: string, index: number, prompt: string, expected: string | string[], choices?: readonly string[], detail?: string): Exercise {
  return { id: `${skillId}:${index}`, skillId, type: "concept-check", prompt, assessmentMode: "objective", payload: { expected, choices: choices ? [...choices] : undefined, detail } };
}
function selfCheck(skillId: string, index: number, prompt: string, reveal?: unknown): Exercise {
  return { id: `${skillId}:${index}`, skillId, type: "self-check-application", prompt, assessmentMode: "self-check", payload: { reveal } };
}
function rootAt(index: number) { return pick(PRACTICAL_ROOTS, index * 5 + 1); }
function tonicAt(index: number) { return pick(CONVENTIONAL_MAJOR_TONICS, index * 7 + 2); }
function minorTonicAt(index: number) { return pick(MINOR_TONICS, index * 5 + 2); }
function qualityLabel(q: TriadQuality) { return q === "diminished" ? "diminished" : q; }
function seventhLabel(q: SeventhQuality) {
  return ({ major7: "major 7", minor7: "minor 7", dominant7: "dominant 7", halfDiminished7: "half-diminished 7", diminished7: "fully diminished 7" } as const)[q];
}

function intervalExercise(skillId: string, index: number): Exercise {
  if (skillId === "interval.generic-number") {
    const examples = [
      ["C", "E", "3rd", ["2nd", "3rd", "4th"]],
      ["F", "B", "4th", ["3rd", "4th", "5th"]],
      ["D", "A", "5th", ["4th", "5th", "6th"]],
      ["A", "D", "4th", ["3rd", "4th", "5th"]],
    ] as const;
    const [from, to, expected, choices] = pick(examples, index);
    return text(skillId, index, `${from} to ${to} is what interval number?`, expected, choices);
  }
  if (skillId === "interval.quality-system") return text(skillId, index, "Which interval numbers can be major or minor?", "2nds, 3rds, 6ths, and 7ths", ["1sts, 4ths, 5ths, and octaves", "2nds, 3rds, 6ths, and 7ths"]);
  if (skillId === "interval.mixed-core" || skillId === "interval.spelling") { const e = intervalBuildExercise(pick(CORE_INTERVALS, index), index); return { ...e, id: `${skillId}:${index}`, skillId }; }
  if (skillId === "interval.inversion") {
    const pairs = [["m2", "M7"], ["M2", "m7"], ["m3", "M6"], ["M3", "m6"], ["P4", "P5"], ["A4", "d5"]] as const;
    const [given, expected] = pick(pairs, index);
    return { id: `${skillId}:${index}`, skillId, type: "interval-inversion", prompt: `What is the inversion of ${given}?`, assessmentMode: "objective", payload: { expected } };
  }
  if (skillId === "interval.A4-d5") {
    const interval: IntervalName = index % 2 ? "d5" : "A4";
    return intervalBuildExercise(interval, index);
  }
  const name = skillId.split(".")[1] as IntervalName;
  if (name in INTERVALS) return intervalBuildExercise(name, index);
  throw new Error(`No interval exercise for ${skillId}`);
}

function triadExercise(skillId: string, index: number): Exercise {
  if (skillId === "triad.members") {
    const prompts = [
      "A basic triad has which three note roles?",
      "Name the three stacked chord-member roles in a basic triad.",
      "From the root upward, which chord members define a basic triad?",
    ];
    return text(skillId, index, pick(prompts, index), ["root", "third", "fifth"]);
  }
  if (skillId === "triad.symbols") {
    const examples = [["Cm", "C minor"], ["F♯", "F♯ major"], ["B°", "B diminished"], ["D+", "D augmented"]] as const;
    const [symbol, expected] = pick(examples, index);
    return text(skillId, index, `What does the chord symbol ${symbol} mean?`, expected);
  }
  if (skillId === "triad.root-vs-bass") return text(skillId, index, "In E–G–C, if the chord is C major, which note is the root?", "C", ["C", "E", "G"], "The root determines chord identity; the lowest note is the bass.");
  if (skillId === "triad.mixed") { const e = triadBuildExercise(pick(TRIADS, index), index); return { ...e, id: `${skillId}:${index}`, skillId }; }
  const q = skillId.split(".")[1] as TriadQuality;
  if (TRIADS.includes(q)) return triadBuildExercise(q, index);
  throw new Error(`No triad exercise for ${skillId}`);
}

function majorExercise(skillId: string, index: number): Exercise {
  if (skillId === "major.formula") return text(skillId, index, "What is the whole/half-step formula for a major scale?", "W-W-H-W-W-W-H");
  if (skillId === "scale.degree-numbers") return text(skillId, index, "How many scale degrees are there before the octave repeats?", "7", ["6", "7", "8"]);
  if (skillId === "major.degree-intervals") {
    const map = ["P1", "M2", "M3", "P4", "P5", "M6", "M7"];
    const degree = index % 7 + 1;
    return text(skillId, index, `In a major scale, scale degree ${degree} is what simple interval above tonic?`, map[degree - 1]);
  }
  if (skillId === "major.spelling" || skillId === "major.construct") { const e = majorScaleExercise(index); return { ...e, id: `${skillId}:${index}`, skillId }; }
  if (skillId === "major.degree-to-note") return majorDegreeExercise(index);
  if (skillId === "major.note-to-degree") {
    const tonic = tonicAt(index); const scale = majorScale(parseNote(tonic)); const degree = index % 7 + 1; const note = formatNote(scale[degree - 1]);
    return { id: `${skillId}:${index}`, skillId, type: "major-note-degree", prompt: `In ${tonic} major, what scale degree is ${note}?`, assessmentMode: "objective", payload: { tonic, note, expected: degree } };
  }
  if (skillId === "major.membership") {
    const tonic = tonicAt(index); const tonicNote = parseNote(tonic); const scale = majorScale(tonicNote); const inScale = index % 2 === 0;
    const chromaticIntervals = [INTERVALS.m2, INTERVALS.A4, INTERVALS.m7] as const;
    const note = inScale ? scale[(index + 2) % 7] : intervalAbove(tonicNote, pick(chromaticIntervals, index));
    return { id: `${skillId}:${index}`, skillId, type: "scale-membership", prompt: `Is ${formatNote(note)} diatonic to ${tonic} major?`, assessmentMode: "objective", payload: { expected: inScale ? "yes" : "no", tonic, note: formatNote(note) } };
  }
  if (skillId === "major.degree-names") {
    const names = ["tonic", "supertonic", "mediant", "subdominant", "dominant", "submediant", "leading tone"];
    const d = index % 7 + 1; return text(skillId, index, `What is the conventional name for scale degree ${d} in major?`, names[d - 1]);
  }
  if (skillId === "major.piano-application") { const tonic = rootAt(index); return selfCheck(skillId, index, `On your piano, play ${tonic} major ascending, then play scale degrees 1–3–5–7.`, noteNames(majorScale(parseNote(tonic)))); }
  throw new Error(`No major exercise for ${skillId}`);
}

function diatonicExercise(skillId: string, index: number): Exercise {
  const tonic = rootAt(index); const tonicNote = parseNote(tonic); const degree = index % 7 + 1; const chord = majorTriadForDegree(tonicNote, degree);
  if (skillId === "diatonic.definition") return text(skillId, index, "In C major, is D–F♯–A fully diatonic?", "no", ["yes", "no"], "F♯ is outside the C-major scale.");
  if (skillId === "diatonic.stack-thirds") return { id: `${skillId}:${index}`, skillId, type: "diatonic-chord-build", prompt: `Using only ${tonic} major, stack scale tones 1–3–5 above degree ${degree}.`, assessmentMode: "objective", payload: { expected: noteNames(chord.notes) } };
  if (skillId === "diatonic.major-pattern") return text(skillId, index, "What is the diatonic triad-quality pattern in a major key?", "major-minor-minor-major-major-minor-diminished");
  if (skillId === "roman.major-basic") return text(skillId, index, `What Roman numeral labels degree ${degree} in a major key?`, majorRomanForDegree(degree));
  if (skillId === "diatonic.degree-to-chord") return { id: `${skillId}:${index}`, skillId, type: "diatonic-chord-build", prompt: `Build ${majorRomanForDegree(degree)} in ${tonic} major.`, assessmentMode: "objective", payload: { expectedRoot: formatNote(chord.root), expectedQuality: chord.quality, expectedNotes: noteNames(chord.notes) } };
  if (skillId === "diatonic.chord-to-degree") return { id: `${skillId}:${index}`, skillId, type: "major-chord-roman", prompt: `In ${tonic} major, what Roman numeral is ${formatNote(chord.root)} ${qualityLabel(chord.quality)}?`, assessmentMode: "objective", payload: { expected: chord.roman } };
  if (skillId === "diatonic.harmonize-key") return { id: `${skillId}:${index}`, skillId, type: "diatonic-chord-build", prompt: `Harmonize ${tonic} major with all seven diatonic triads in order.`, assessmentMode: "objective", payload: { expected: majorDiatonicTriads(tonicNote).map((x) => ({ root: formatNote(x.notes[0]), quality: x.quality, notes: noteNames(x.notes) })) } };
  if (skillId === "diatonic.check-chord") {
    const isDiatonic = index % 2 === 0; const q = isDiatonic ? chord.quality : (chord.quality === "major" ? "minor" : "major");
    return text(skillId, index, `Is ${formatNote(chord.root)} ${q} a diatonic triad in ${tonic} major?`, isDiatonic ? "yes" : "no", ["yes", "no"]);
  }
  if (skillId === "diatonic.piano-application") return selfCheck(skillId, index, `On your piano, play all seven diatonic triads of ${tonic} major in ascending root order.`, majorDiatonicTriads(tonicNote).map((x) => `${formatNote(x.notes[0])} ${x.quality}`));
  throw new Error(`No diatonic exercise for ${skillId}`);
}

const PROGRESSION_BY_SKILL: Record<string, readonly string[]> = {
  "progression.I-IV-V": ["I", "IV", "V"],
  "progression.ii-V-I": ["ii", "V", "I"],
  "progression.I-V-vi-IV": ["I", "V", "vi", "IV"],
  "progression.vi-IV-I-V": ["vi", "IV", "I", "V"],
  "progression.I-vi-IV-V": ["I", "vi", "IV", "V"],
};
function progressionExercise(skillId: string, index: number): Exercise {
  const tonic = rootAt(index); const t = parseNote(tonic);
  if (skillId === "progression.absolute-relative") return text(skillId, index, "Which label is relative to the current key rather than an absolute chord name?", "V", ["G major", "V"]);
  if (skillId === "progression.scale-degree-vs-chord") return text(skillId, index, "In C major, scale degree 5 is one note. What does Roman numeral V represent?", "the chord built on scale degree 5");
  if (skillId in PROGRESSION_BY_SKILL) {
    const romans = PROGRESSION_BY_SKILL[skillId]; const chords = majorProgression(t, romans);
    return { id: `${skillId}:${index}`, skillId, type: "progression-build", prompt: `Build ${romans.join("–")} in ${tonic} major.`, assessmentMode: "objective", payload: { romans: [...romans], expected: chords.map((c) => ({ root: formatNote(c.root), quality: c.quality })) } };
  }
  if (skillId === "progression.transpose") {
    const source = pick(PRACTICAL_ROOTS, index); const target = pick(PRACTICAL_ROOTS, index + 4); const romans = pick([["I","V","vi","IV"],["I","vi","IV","V"],["ii","V","I"]] as const, index);
    const sourceChords = majorProgression(parseNote(source), romans); const targetChords = majorProgression(parseNote(target), romans);
    return { id: `${skillId}:${index}`, skillId, type: "progression-build", prompt: `Transpose ${sourceChords.map((c)=>`${formatNote(c.root)} ${c.quality}`).join(" – ")} from ${source} major to ${target} major.`, assessmentMode: "objective", payload: { expected: targetChords.map((c)=>({ root: formatNote(c.root), quality:c.quality })), romans:[...romans] } };
  }
  if (skillId === "progression.extract") {
    const romans = pick([["I","IV","V"],["I","V","vi","IV"],["vi","IV","I","V"]] as const,index); const chords=majorProgression(t,romans);
    return text(skillId,index,`In ${tonic} major, convert ${chords.map((c)=>`${formatNote(c.root)} ${c.quality}`).join(" – ")} to Roman numerals.`, romans.join("–"));
  }
  if (skillId === "progression.nashville") {
    const roman = pick(MAJOR_ROMANS,index); const map: Record<string,string>={I:"1",ii:"2m",iii:"3m",IV:"4",V:"5",vi:"6m","vii°":"7°"};
    return text(skillId,index,`Translate ${roman} from our simple major-key Roman-numeral vocabulary into Nashville-style number shorthand.`,map[roman]);
  }
  throw new Error(`No progression exercise for ${skillId}`);
}

function functionExercise(skillId: string, index: number): Exercise {
  const cases: Record<string, { prompt: string; expected: string; choices?: readonly string[]; detail?: string }> = {
    "function.tonic": { prompt: "In functional major-key harmony, which core chord most strongly represents tonic/home?", expected: "I", choices: ["I","IV","V"] },
    "function.dominant": { prompt: "In functional major-key harmony, which core chord most strongly has dominant tendency?", expected: "V", choices: ["I","IV","V"] },
    "function.V-I": { prompt: "Which motion is the foundational dominant-to-tonic resolution in major?", expected: "V→I", choices: ["IV→I","V→I","I→V"] },
    "function.predominant": { prompt: "Which pair are core predominant chords in conventional functional major harmony?", expected: "ii and IV", choices: ["I and vi","ii and IV","V and vii°"] },
    "function.basic-flow": { prompt: "What is the basic functional flow taught as a conventional tonal model?", expected: "tonic→predominant→dominant→tonic" },
    "cadence.basic": index % 2
      ? { prompt: "A phrase that ends on V is conventionally called what?", expected: "half cadence" }
      : { prompt: "V→I at a phrase ending is what broad cadence family?", expected: "authentic cadence" },
    "function.context": { prompt: "True or false: every chord has one permanent harmonic function in every musical style and context.", expected: "false", choices: ["true","false"], detail: "Function is contextual; the app teaches conventional functional tendencies without turning them into universal laws." },
  };
  const c = cases[skillId];
  if (!c) throw new Error(`No function exercise for ${skillId}`);
  return text(skillId, index, c.prompt, c.expected, c.choices, c.detail);
}

function minorExercise(skillId: string, index: number): Exercise {
  const tonic = minorTonicAt(index); const t=parseNote(tonic);
  if(skillId==="minor.parallel-alterations") { const changes=parallelNaturalMinorAlterations(t); return text(skillId,index,`Compared with ${tonic} major, which scale degrees are lowered to form ${tonic} natural minor?`,"3, 6, and 7",undefined,changes.map(x=>`${x.degree}: ${formatNote(x.major)}→${formatNote(x.minor)}`).join(", ")); }
  if(skillId==="minor.natural-construct") return {id:`${skillId}:${index}`,skillId,type:"minor-scale-build",prompt:`Build ${tonic} natural minor.`,assessmentMode:"objective",payload:{expected:noteNames(naturalMinorScale(t))}};
  if(skillId==="minor.relative") { const major=relativeMajorName(tonic); return text(skillId,index,`What is the relative major of ${tonic} minor?`,major); }
  if(skillId==="minor.parallel") return text(skillId,index,`What is the parallel major of ${tonic} minor?`,`${tonic} major`);
  if(skillId==="minor.variable6-7") return text(skillId,index,"Which scale degrees are especially variable in tonal minor?","6 and 7",["2 and 3","4 and 5","6 and 7"]);
  if(skillId==="minor.raised7") { const natural=naturalMinorScale(t), harmonic=harmonicMinorScale(t); return text(skillId,index,`In ${tonic} minor, raising scale degree 7 changes ${formatNote(natural[6])} to what note?`,formatNote(harmonic[6])); }
  if(skillId==="minor.harmonic") return {id:`${skillId}:${index}`,skillId,type:"minor-scale-build",prompt:`Build ${tonic} harmonic minor.`,assessmentMode:"objective",payload:{expected:noteNames(harmonicMinorScale(t))}};
  if(skillId==="minor.V-v") { const nat=naturalMinorDiatonicTriads(t)[4]; const harmRoot=harmonicMinorScale(t)[4]; const majorV=buildTriad(harmRoot,"major"); return text(skillId,index,`In ${tonic} minor, raising degree 7 commonly changes the diatonic v (${formatNote(nat.notes[0])} minor) into what stronger dominant triad?`,`${formatNote(majorV[0])} major`); }
  if(skillId==="minor.melodic") { const mm=classicalMelodicMinor(t); return {id:`${skillId}:${index}`,skillId,type:"minor-scale-build",prompt:`Give the classical melodic-minor scale form for ${tonic}: ascending, then descending.`,assessmentMode:"objective",payload:{expectedAscending:noteNames(mm.ascending),expectedDescending:noteNames(mm.descending)}}; }
  if(skillId==="minor.melodic-jazz") return {id:`${skillId}:${index}`,skillId,type:"minor-scale-build",prompt:`Using the common jazz convention, build ${tonic} melodic minor.`,assessmentMode:"objective",payload:{expected:noteNames(jazzMelodicMinorScale(t))}};
  if(skillId==="minor.harmony") { const degree=index%7+1; const nat=naturalMinorDiatonicTriads(t)[degree-1]; return {id:`${skillId}:${index}`,skillId,type:"diatonic-chord-build",prompt:`Using the natural-minor collection, build the triad on degree ${degree} of ${tonic} minor.`,assessmentMode:"objective",payload:{expectedRoot:formatNote(nat.notes[0]),expectedQuality:nat.quality,expectedNotes:noteNames(nat.notes)}}; }
  throw new Error(`No minor exercise for ${skillId}`);
}

function seventhExercise(skillId:string,index:number):Exercise{
  const root=rootAt(index); const r=parseNote(root);
  if(skillId==="seventh.members") {
    const prompts=[
      "What chord members make a tertian seventh chord?",
      "Name the four stacked chord-member roles in a basic seventh chord.",
      "From the root upward, which chord members define a tertian seventh chord?",
    ];
    return text(skillId,index,pick(prompts,index),["root","third","fifth","seventh"]);
  }
  const bySkill:Record<string,SeventhQuality>={"seventh.major7":"major7","seventh.minor7":"minor7","seventh.dominant7":"dominant7","seventh.halfdim7":"halfDiminished7","seventh.dim7":"diminished7"};
  if(skillId in bySkill){const q=bySkill[skillId];return {id:`${skillId}:${index}`,skillId,type:"seventh-build-notes",prompt:`Build ${root} ${seventhLabel(q)}.`,assessmentMode:"objective",payload:{root,quality:q,expected:noteNames(buildSeventh(r,q))}};}
  if(skillId==="seventh.mixed"){const q=pick(SEVENTHS,index);return {id:`${skillId}:${index}`,skillId,type:"seventh-build-notes",prompt:`Build ${root} ${seventhLabel(q)}.`,assessmentMode:"objective",payload:{root,quality:q,expected:noteNames(buildSeventh(r,q))}};}
  if(skillId==="seventh.major-diatonic"){const tonic=root;const sevenths=majorDiatonicSevenths(r);const d=index%7;const x=sevenths[d];return {id:`${skillId}:${index}`,skillId,type:"seventh-build-notes",prompt:`Build the diatonic seventh chord on degree ${d+1} of ${tonic} major.`,assessmentMode:"objective",payload:{expectedRoot:formatNote(x.notes[0]),expectedQuality:x.quality,expected:noteNames(x.notes)}};}
  if(skillId==="seventh.minor-context"){const natural=naturalMinorScale(r);const vRoot=natural[4];return {id:`${skillId}:${index}`,skillId,type:"seventh-build-notes",prompt:`In ${root} minor, build the common V7 that uses the raised leading tone.`,assessmentMode:"objective",payload:{expected:noteNames(buildSeventh(vRoot,"dominant7")),expectedQuality:"dominant7"}};}
  throw new Error(`No seventh exercise for ${skillId}`);
}

function inversionExercise(skillId:string,index:number):Exercise{
  const root=rootAt(index), q=pick(["major","minor"] as const,index), triad=buildTriad(parseNote(root),q);
  if(skillId==="inversion.triad"){const inv=index%3;const ordered=inv===0?triad:inv===1?[triad[1],triad[2],triad[0]]:[triad[2],triad[0],triad[1]];const name=["root position","first inversion","second inversion"][inv];return {id:`${skillId}:${index}`,skillId,type:"inversion-build",prompt:`Arrange ${root} ${q} in ${name}, low to high by chord member.`,assessmentMode:"objective",payload:{expected:noteNames(ordered)}};}
  if(skillId==="inversion.slash"){const bass=triad[(index%2)+1];return text(skillId,index,`What slash-chord symbol describes ${root} ${q} with ${formatNote(bass)} in the bass?`,`${root}/${formatNote(bass)}`);}
  if(skillId==="voicing.distinction") return text(skillId,index,"What determines a chord's inversion?","which chord member is in the bass",["the total number of notes","which chord member is in the bass","the top note only"]);
  if(skillId==="inversion.seventh"){const chord=buildSeventh(parseNote(root),"dominant7");const inv=index%4;const ordered=[...chord.slice(inv),...chord.slice(0,inv)];return {id:`${skillId}:${index}`,skillId,type:"inversion-build",prompt:`Arrange ${root}7 in inversion ${inv===0?"root position":inv===1?"first":inv===2?"second":"third"}, listing chord members from bass upward.`,assessmentMode:"objective",payload:{expected:noteNames(ordered)}};}
  if(skillId==="voice.common-tones"){const tonic=parseNote(root);const I=buildTriad(tonic,"major");const IV=majorTriadForDegree(tonic,4).notes;const common=I.filter(a=>IV.some(b=>pitchClass(a)===pitchClass(b))).map(formatNote);return text(skillId,index,`Between I and IV in ${root} major, which pitch is a common chord tone?`,common[0]??"none");}
  if(skillId==="voice.economical") return selfCheck(skillId,index,`On piano, move from I to IV to V to I in ${root} major while keeping common tones when useful and minimizing unnecessary jumps.`);
  if(skillId==="voice.guide-tones") return text(skillId,index,"In seventh-chord voice leading, which chord members are especially informative guide tones?","thirds and sevenths",["roots and fifths","thirds and sevenths"]);
  throw new Error(`No inversion/voice exercise for ${skillId}`);
}

function keyExercise(skillId:string,index:number):Exercise{
  const tonic=tonicAt(index); const info=majorKeySignature(parseNote(tonic));
  if(skillId==="keys.signatures") return {id:`${skillId}:${index}`,skillId,type:"key-signature",prompt:`How many sharps or flats are in ${tonic} major?`,assessmentMode:"objective",payload:{expectedCount:info.count,expectedType:info.accidentalType,alteredNotes:info.alteredNotes}};
  if(skillId==="keys.accidental-order"){const sharp=index%2===0;return text(skillId,index,`Give the order of ${sharp?"sharps":"flats"} used in key signatures.`,(sharp?SHARP_ORDER:FLAT_ORDER).join(" "));}
  if(skillId==="circle.major"){
    const clockwise = index % 2 === 0;
    const chain = clockwise ? ["C","G","D","A","E","B","F♯","C♯"] : ["C","F","B♭","E♭","A♭","D♭","G♭","C♭"];
    const i = Math.abs(index) % (chain.length - 1);
    return text(skillId,index,`On the major-key Circle of Fifths, move one step ${clockwise?"clockwise":"counterclockwise"} from ${chain[i]}. Which key comes next?`,chain[i+1]);
  }
  if(skillId==="keys.minor-signatures"){const minor=minorTonicAt(index), major=relativeMajorName(minor);const sig=majorKeySignature(parseNote(major));return text(skillId,index,`${minor} minor shares its key signature with which relative major?`,major,undefined,`${sig.count} ${sig.accidentalType}${sig.count===1?"":"s"}`);}
  if(skillId==="circle.relative-minor") return text(skillId,index,`What is the relative minor of ${tonic} major?`,relativeMinorName(tonic));
  if(skillId==="keys.closely-related"){
    const dominant = `${formatNote(majorScale(parseNote(tonic))[4])} major`;
    const distant = `${formatNote(intervalAbove(parseNote(tonic), INTERVALS.A4))} major`;
    return text(skillId,index,`Which of these is closely related to ${tonic} major by differing by only one key-signature accidental?`,dominant,[dominant,distant]);
  }
  if(skillId==="keys.enharmonic"){const pairs=[["F♯ major","G♭ major"],["C♯ major","D♭ major"],["B major","C♭ major"]] as const;const [a,b]=pick(pairs,index);return text(skillId,index,`Which conventional major key is enharmonically equivalent in sounding pitch classes to ${a}?`,b);}
  throw new Error(`No key exercise for ${skillId}`);
}

function advancedExercise(skillId:string,index:number):Exercise{
  const root=rootAt(index), r=parseNote(root);
  if(skillId==="extension.compound-intervals"){const map=[["M2","M9"],["P4","P11"],["M6","M13"]] as const;const [simple,compound]=pick(map,index);return text(skillId,index,`What compound interval corresponds to ${simple} plus one octave?`,compound);}
  if(skillId==="color.sus"){const q=pick(["sus2","sus4"] as const,index);return {id:`${skillId}:${index}`,skillId,type:"chord-color-build",prompt:`Build ${root}${q}.`,assessmentMode:"objective",payload:{quality:q,expected:noteNames(buildColorChord(r,q))}};}
  if(skillId==="color.add"){const q=pick(["majorAdd9","minorAdd9"] as const,index);return {id:`${skillId}:${index}`,skillId,type:"chord-color-build",prompt:`Build ${root} ${q==="majorAdd9"?"add9":"minor add9"}.`,assessmentMode:"objective",payload:{quality:q,expected:noteNames(buildColorChord(r,q))}};}
  if(skillId==="color.six"){const q=pick(["major6","minor6","major69","minor69"] as const,index);return {id:`${skillId}:${index}`,skillId,type:"chord-color-build",prompt:`Build ${root} ${q}.`,assessmentMode:"objective",payload:{quality:q,expected:noteNames(buildColorChord(r,q))}};}
  if(skillId==="extension.9"){const q=pick(["major9","minor9","dominant9"] as const,index) as NinthQuality;return {id:`${skillId}:${index}`,skillId,type:"chord-color-build",prompt:`Build the full theoretical spelling of ${root} ${q}.`,assessmentMode:"objective",payload:{quality:q,expected:noteNames(buildNinth(r,q))}};}
  if(skillId==="extension.11-13"){const ext=index%2?13:11;return {id:`${skillId}:${index}`,skillId,type:"chord-color-build",prompt:`Build the full theoretical tertian stack for ${root} dominant ${ext}. (Real voicings may omit members.)`,assessmentMode:"objective",payload:{expected:noteNames(buildDominantExtension(r,ext as 11|13))}};}
  if(skillId==="melody.chord-tones"){const q=pick(["major","minor"] as const,index), chord=buildTriad(r,q), candidate=index%2===0?chord[1]:intervalAbove(r,INTERVALS.M2);return text(skillId,index,`Against ${root} ${q}, is ${formatNote(candidate)} a chord tone?`,index%2===0?"yes":"no",["yes","no"]);}
  if(skillId==="melody.nonchord") return text(skillId,index,"In C major over a C-major triad, D is best classified at the most basic level as what?","a non-chord tone",["a chord tone","a non-chord tone"]);
  if(skillId==="secondary.V"){const tonic=root, scale=majorScale(r), targetDegree=pick([2,5,6] as const,index), target=scale[targetDegree-1], domRoot=intervalAbove(target,INTERVALS.P5), chord=buildSeventh(domRoot,"dominant7");return {id:`${skillId}:${index}`,skillId,type:"seventh-build-notes",prompt:`In ${tonic} major, build V7/${majorRomanForDegree(targetDegree)} (the dominant seventh that tonicizes ${formatNote(target)}).`,assessmentMode:"objective",payload:{expectedRoot:formatNote(domRoot),expected:noteNames(chord)}};}
  if(skillId==="mixture.parallel"){const scale=majorScale(r), ivRoot=scale[3], chord=buildTriad(ivRoot,"minor");return {id:`${skillId}:${index}`,skillId,type:"diatonic-chord-build",prompt:`In ${root} major, build the commonly borrowed minor iv from the parallel minor.`,assessmentMode:"objective",payload:{expectedRoot:formatNote(ivRoot),expectedQuality:"minor",expectedNotes:noteNames(chord)}};}
  if(skillId==="mode.tonic-center") return text(skillId,index,"Why are D Dorian and C major not the same tonal statement even though they can share the same pitch collection?","they have different tonal centers",["they always use different notes","they have different tonal centers"]);
  if(skillId==="mode.major-family"){const mode=pick(["lydian","mixolydian"] as const,index);return {id:`${skillId}:${index}`,skillId,type:"mode-scale-build",prompt:`Build ${root} ${mode}.`,assessmentMode:"objective",payload:{mode,expected:noteNames(modeScale(r,mode))}};}
  if(skillId==="mode.minor-family"){const mode=pick(["dorian","phrygian"] as const,index);return {id:`${skillId}:${index}`,skillId,type:"mode-scale-build",prompt:`Build ${root} ${mode}.`,assessmentMode:"objective",payload:{mode,expected:noteNames(modeScale(r,mode))}};}
  if(skillId==="mode.locrian") return {id:`${skillId}:${index}`,skillId,type:"mode-scale-build",prompt:`Build ${root} Locrian.`,assessmentMode:"objective",payload:{mode:"locrian",expected:noteNames(modeScale(r,"locrian"))}};
  if(skillId==="modulation.tonicization-vs-keychange") return text(skillId,index,"Which term means a brief emphasis of a non-tonic chord without establishing a lasting new key?","tonicization",["tonicization","modulation"]);
  if(skillId==="modulation.direct") return text(skillId,index,"A modulation that changes to a new key without a pivot chord is commonly called what?","direct modulation");
  if(skillId==="modulation.pivot") return text(skillId,index,"What is the central idea of a common-chord (pivot-chord) modulation?","a chord is reinterpreted as belonging to both the old and new keys");
  if(skillId==="analysis.integrated") return text(skillId,index,"In C major, the progression C – A7 – Dm – G7 – C contains A7 most naturally as what Roman-numeral function?","V7/ii");
  throw new Error(`No advanced exercise for ${skillId}`);
}

function guitarExercise(skillId:string,index:number):Exercise{
  if(skillId==="guitar.open-strings"){const string=(6-(index%6)) as 1|2|3|4|5|6;const names:{[k:number]:string}={6:"E",5:"A",4:"D",3:"G",2:"B",1:"E"};return text(skillId,index,`In standard tuning, what is open string ${string}?`,names[string]);}
  if(skillId==="guitar.fret-notes"){const string=((index%6)+1) as 1|2|3|4|5|6,fret=(index*3)%13,pc=guitarPitchClass(string,fret);return {id:`${skillId}:${index}`,skillId,type:"guitar-fret-note",prompt:`In standard tuning, name the pitch class at string ${string}, fret ${fret}. Either common enharmonic spelling is acceptable where applicable.`,assessmentMode:"objective",payload:{string,fret,expectedPitchClass:pc,canonical:canonicalGuitarNoteName(string,fret)}};}
  if(skillId==="guitar.intervals"){const string=((index%6)+1) as 1|2|3|4|5|6,fret=(index*2)%8,int=pick(["m3","M3","P4","P5","m7"] as const,index),targetFret=fret+INTERVALS[int].semitones;return selfCheck(skillId,index,`On guitar, start at string ${string}, fret ${fret}. Find a ${INTERVALS[int].name} above it on at least two neck locations. As a simple horizontal check, the same-string target is fret ${targetFret}.`);}
  if(skillId==="guitar.triads") return selfCheck(skillId,index,`On guitar, build ${rootAt(index)} ${pick(TRIADS,index)} on two different three-string sets. Label root, third, and fifth.`);
  if(skillId==="guitar.inversions") return selfCheck(skillId,index,`On guitar, play root position, first inversion, and second inversion of ${rootAt(index)} major on one three-string set.`);
  if(skillId==="guitar.scale-degrees") return selfCheck(skillId,index,`Choose ${rootAt(index)} as tonic on the fretboard. Locate scale degrees 1, 3, 5, and 7 in at least two nearby positions.`);
  if(skillId==="guitar.scales") return selfCheck(skillId,index,`Map ${rootAt(index)} major across a practical fretboard region by scale degree rather than only by memorized box shape.`);
  if(skillId==="guitar.diatonic-harmony") return selfCheck(skillId,index,`In ${rootAt(index)} major, locate playable triads for I, ii, IV, V, and vi in one connected neck region.`);
  if(skillId==="guitar.sevenths") return selfCheck(skillId,index,`On guitar, build ${rootAt(index)} dominant 7 and identify root, 3rd, 5th, and 7th.`);
  if(skillId==="guitar.chord-tones") return selfCheck(skillId,index,`Over I–V–vi–IV in ${rootAt(index)} major, locate the nearest root/3rd/5th of each chord around one neck position.`);
  if(skillId==="guitar.voice-leading") return selfCheck(skillId,index,`Voice-lead I–V–vi–IV in ${rootAt(index)} major using nearby triad inversions rather than jumping to distant root-position shapes.`);
  if(skillId==="guitar.alternate-tunings") return selfCheck(skillId,index,"Define an alternate tuning by its six open-string notes, then remap one chosen interval and one major triad from a selected root using note relationships, not standard-tuning shape memory.");
  if(skillId==="guitar.idea-to-neck") return selfCheck(skillId,index,"Choose a short musical idea you can already imagine clearly. Identify its interval/scale-degree relationships first, then locate more than one playable version on the neck.");
  throw new Error(`No guitar exercise for ${skillId}`);
}

function qaVariedConceptExercise(skillId: string, index: number): Exercise | undefined {
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

export function exerciseForSkill(skillId: string, index = 0): Exercise {
  if (!SKILL_BY_ID.has(skillId)) throw new Error(`Unknown skill: ${skillId}`);
  const qaVariant = qaVariedConceptExercise(skillId, index);
  if (qaVariant) return qaVariant;
  if (skillId.startsWith("interval.")) return intervalExercise(skillId,index);
  if (skillId.startsWith("triad.")) return triadExercise(skillId,index);
  if (skillId.startsWith("major.") || skillId==="scale.degree-numbers") return majorExercise(skillId,index);
  if (skillId.startsWith("diatonic.") || skillId==="roman.major-basic") return diatonicExercise(skillId,index);
  if (skillId.startsWith("progression.")) return progressionExercise(skillId,index);
  if (skillId.startsWith("function.") || skillId.startsWith("cadence.")) return functionExercise(skillId,index);
  if (skillId.startsWith("minor.")) return minorExercise(skillId,index);
  if (skillId.startsWith("seventh.")) return seventhExercise(skillId,index);
  if (skillId.startsWith("inversion.") || skillId.startsWith("voicing.") || skillId.startsWith("voice.")) return inversionExercise(skillId,index);
  if (skillId.startsWith("keys.") || skillId.startsWith("circle.")) return keyExercise(skillId,index);
  if (["extension.","color.","melody.","secondary.","mixture.","mode.","modulation.","analysis."].some((p)=>skillId.startsWith(p))) return advancedExercise(skillId,index);
  if (skillId.startsWith("guitar.")) return guitarExercise(skillId,index);
  throw new Error(`No exercise plan for ${skillId}`);
}

export function exerciseCoverage() {
  return [...SKILL_BY_ID.keys()].map((skillId) => ({ skillId, exercise: exerciseForSkill(skillId, 0) }));
}
