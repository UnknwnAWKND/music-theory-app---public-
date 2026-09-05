import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

import {
  LETTERS,
  HARMONIC_MINOR_DEGREE_INTERVALS,
  HARMONIC_MINOR_SEMITONE_STEPS,
  MELODIC_MINOR_ASC_DEGREE_INTERVALS,
  MELODIC_MINOR_ASC_STEP_PATTERN,
  MINOR_PITCH_CLASS_ROOTS,
  NATURAL_MINOR_DEGREE_INTERVALS,
  NATURAL_MINOR_STEP_PATTERN,
  SKILLS,
  SUPPORTED_MINOR_KEY_NAMES,
  activeExerciseSkillIds,
  activeLessonSkillIds,
  checkpointDefinition,
  classicalMelodicMinorNames,
  deriveSkillEvidence,
  exerciseForSkill,
  gradeExercise,
  harmonicMinorAugmentedSecond,
  harmonicMinorScaleNames,
  interleavingTargets,
  lessonForSkill,
  longTermPracticeWeight,
  melodicMinorAscendingScaleNames,
  minorLeadingToneName,
  naturalMinorScaleNames,
  parseNote,
  phase3BalancedRootNames,
  phase3Lessons,
  pitchClass,
  practiceRoundPlan,
} from "../dist/index.js";
import { renderPracticeRoundCounter, renderTeachingLesson } from "../web/lesson-ui.js";
import { transformBlock4App, transformBlock4Index } from "../scripts/block4-app-transform.mjs";

const IDS = [
  "minor-scales.lesson-1-natural-formula",
  "minor-scales.lesson-2-natural-all-roots",
  "minor-scales.lesson-3-harmonic-minor",
  "minor-scales.lesson-4-melodic-minor",
  "minor-scales.lesson-5-instant-recall",
];
const TITLES = [
  "Natural Minor Formula",
  "Natural Minor From Every Root",
  "Harmonic Minor",
  "Melodic Minor",
  "Minor Scale Instant Recall Drill",
];
const generated = (id, count=160) => Array.from({length:count}, (_,i)=>exerciseForSkill(id,i)).filter(Boolean);
const directPhase3 = (id, count=160) => generated(id,count).filter((item)=>item.skillId===id && !item.metadata?.crossPhaseReview);
const evidence = (overrides={}) => ({...deriveSkillEvidence([]), ...overrides});
const pc = (note) => pitchClass(parseNote(note));
const semitoneDistance = (from,to) => ((pc(to)-pc(from)+12)%12);

const NATURAL_CANONICAL = new Map([
  ["C",  ["C","D","E♭","F","G","A♭","B♭"]],
  ["C#", ["C♯","D♯","E","F♯","G♯","A","B"]],
  ["D",  ["D","E","F","G","A","B♭","C"]],
  ["Eb", ["E♭","F","G♭","A♭","B♭","C♭","D♭"]],
  ["E",  ["E","F♯","G","A","B","C","D"]],
  ["F",  ["F","G","A♭","B♭","C","D♭","E♭"]],
  ["F#", ["F♯","G♯","A","B","C♯","D","E"]],
  ["G",  ["G","A","B♭","C","D","E♭","F"]],
  ["G#", ["G♯","A♯","B","C♯","D♯","E","F♯"]],
  ["A",  ["A","B","C","D","E","F","G"]],
  ["Bb", ["B♭","C","D♭","E♭","F","G♭","A♭"]],
  ["B",  ["B","C♯","D","E","F♯","G","A"]],
]);

test("Phase 3 remains exactly the requested five lessons in order while Phase 4 is added afterward", () => {
  const phase3=SKILLS.filter((skill)=>skill.phase===3);
  assert.deepEqual(phase3.map((skill)=>skill.id),IDS);
  assert.deepEqual(phase3.map((skill)=>skill.title),TITLES);
  assert.deepEqual(phase3Lessons().map((lesson)=>lesson.skillId),IDS);
  assert.deepEqual(activeLessonSkillIds().slice(14,19),IDS);
  assert.deepEqual(activeExerciseSkillIds().slice(14,19),IDS);
  assert.equal(SKILLS.filter((skill)=>skill.phase===1).length,10);
  assert.equal(SKILLS.filter((skill)=>skill.phase===2).length,4);
  assert.equal(SKILLS.filter((skill)=>skill.phase===4).length,10);
  assert.ok(checkpointDefinition(4));
  assert.ok(checkpointDefinition(5));
  assert.equal(checkpointDefinition(6),undefined);
});

test("minor-scale formulas and tonic-based interval formulas are exact", () => {
  assert.deepEqual([...NATURAL_MINOR_STEP_PATTERN],["W","H","W","W","H","W","W"]);
  assert.deepEqual([...HARMONIC_MINOR_SEMITONE_STEPS],[2,1,2,2,1,3,1]);
  assert.deepEqual([...MELODIC_MINOR_ASC_STEP_PATTERN],["W","H","W","W","W","W","H"]);
  assert.deepEqual([...NATURAL_MINOR_DEGREE_INTERVALS],["P1","M2","m3","P4","P5","m6","m7","P8"]);
  assert.deepEqual([...HARMONIC_MINOR_DEGREE_INTERVALS],["P1","M2","m3","P4","P5","m6","M7","P8"]);
  assert.deepEqual([...MELODIC_MINOR_ASC_DEGREE_INTERVALS],["P1","M2","m3","P4","P5","M6","M7","P8"]);
});

test("all 12 balanced pitch-class roots spell natural minor correctly", () => {
  assert.deepEqual([...MINOR_PITCH_CLASS_ROOTS],["C","C#","D","Eb","E","F","F#","G","G#","A","Bb","B"]);
  assert.equal(NATURAL_CANONICAL.size,12);
  for (const [root,expected] of NATURAL_CANONICAL) {
    assert.deepEqual(naturalMinorScaleNames(root),expected,root);
    const tonic=pc(root);
    assert.deepEqual(expected.map((note)=>((pc(note)-tonic+12)%12)),[0,2,3,5,7,8,10],root);
  }
});

test("all supported written minor keys keep one correct letter per ascending degree", () => {
  assert.equal(SUPPORTED_MINOR_KEY_NAMES.length,15);
  for (const root of SUPPORTED_MINOR_KEY_NAMES) {
    for (const scale of [naturalMinorScaleNames(root),harmonicMinorScaleNames(root),melodicMinorAscendingScaleNames(root)]) {
      const letters=scale.map((note)=>parseNote(note).letter);
      const start=LETTERS.indexOf(parseNote(root).letter);
      assert.equal(new Set(letters).size,7,`${root}: ${scale.join(" ")}`);
      assert.deepEqual(letters,Array.from({length:7},(_,i)=>LETTERS[(start+i)%7]),root);
    }
  }
});

test("conventional enharmonic minor-key names share piano pitches but retain different theoretical spellings", () => {
  const pairs=[["G#","Ab"],["D#","Eb"],["A#","Bb"]];
  for (const [sharp,flat] of pairs) {
    const left=naturalMinorScaleNames(sharp);
    const right=naturalMinorScaleNames(flat);
    assert.notDeepEqual(left,right,`${sharp}/${flat} should spell differently`);
    assert.deepEqual(left.map(pc),right.map(pc),`${sharp}/${flat} should sound on the same piano pitches`);
  }
  assert.deepEqual(harmonicMinorScaleNames("C#"),["C♯","D♯","E","F♯","G♯","A","B♯"]);
  assert.deepEqual(melodicMinorAscendingScaleNames("C#"),["C♯","D♯","E","F♯","G♯","A♯","B♯"]);
  assert.deepEqual(harmonicMinorScaleNames("D#"),["D♯","E♯","F♯","G♯","A♯","B","C♯♯"]);
});

test("exact minor-scale spelling rejects enharmonic piano-key substitutes", () => {
  const item=directPhase3(IDS[1],80).find((x)=>x.metadata?.root==="C#"&&x.answerSpec.kind==="note-sequence");
  assert.ok(item,"expected C# natural-minor construction item");
  assert.equal(gradeExercise(item,["C#","D#","E","F#","G#","A","B"]).correct,true);
  const wrong=gradeExercise(item,["Db","Eb","E","Gb","Ab","A","B"]);
  assert.equal(wrong.correct,false);
  assert.equal(wrong.code,"enharmonic-spelling-error");
});

test("harmonic minor raises only degree 7 and computes a true leading tone", () => {
  for (const root of SUPPORTED_MINOR_KEY_NAMES) {
    const natural=naturalMinorScaleNames(root);
    const harmonic=harmonicMinorScaleNames(root);
    assert.deepEqual(harmonic.slice(0,6),natural.slice(0,6),root);
    assert.equal(semitoneDistance(natural[6],harmonic[6]),1,`${root} raised 7`);
    assert.equal(harmonic[6],minorLeadingToneName(root),root);
    assert.equal(semitoneDistance(harmonic[6],root),1,`${root} leading tone must be one half step below tonic`);
  }
});

test("harmonic-minor degrees 6 and 7 form an augmented 2nd", () => {
  for (const root of SUPPORTED_MINOR_KEY_NAMES) {
    const pair=harmonicMinorAugmentedSecond(root);
    assert.equal(pair.interval,"A2");
    assert.equal(pair.semitones,3);
    assert.equal(semitoneDistance(pair.degree6,pair.degree7),3,root);
    const first=LETTERS.indexOf(parseNote(pair.degree6).letter);
    const second=LETTERS.indexOf(parseNote(pair.degree7).letter);
    assert.equal((second-first+7)%7,1,`${root}: degree 6→7 must be a written 2nd`);
  }
});

test("classical melodic minor raises 6 and 7 ascending and returns to natural minor descending", () => {
  for (const root of SUPPORTED_MINOR_KEY_NAMES) {
    const natural=naturalMinorScaleNames(root);
    const melodic=melodicMinorAscendingScaleNames(root);
    assert.deepEqual(melodic.slice(0,5),natural.slice(0,5),root);
    assert.equal(semitoneDistance(natural[5],melodic[5]),1,`${root} raised 6`);
    assert.equal(semitoneDistance(natural[6],melodic[6]),1,`${root} raised 7`);
    const classical=classicalMelodicMinorNames(root);
    assert.deepEqual(classical.ascending,melodic,root);
    assert.deepEqual(classical.descending,[natural[0],natural[6],natural[5],natural[4],natural[3],natural[2],natural[1]],root);
  }
});

test("natural-minor construction and final recall distribute across all 12 pitch classes", () => {
  const construction=directPhase3(IDS[1],64);
  const constructionPcs=new Set(construction.map((x)=>x.metadata?.pitchClassRoot).filter(Number.isInteger));
  assert.deepEqual([...constructionPcs].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8,9,10,11]);

  assert.deepEqual(phase3BalancedRootNames(12).map((root)=>pc(root)),[0,1,2,3,4,5,6,7,8,9,10,11]);
  const recall=directPhase3(IDS[4],96);
  const recallPcs=new Set(recall.map((x)=>x.metadata?.pitchClassRoot).filter(Number.isInteger));
  assert.equal(recallPcs.size,12);
  const forms=new Set(recall.map((x)=>x.metadata?.form).filter(Boolean));
  for (const form of ["natural","harmonic","melodic-ascending","melodic-descending"]) assert.ok(forms.has(form),form);
  assert.ok(recall.some((x)=>x.metadata?.unfamiliarKey===true));
});

test("Phase 3 mixes task types and avoids duplicate-question spam", () => {
  for (const id of IDS) {
    const items=generated(id,120);
    const unique=new Set(items.map((x)=>x.exampleSignature));
    assert.ok(unique.size>=18,`${id} only produced ${unique.size} semantic examples`);
  }
  const directions=new Set(IDS.flatMap((id)=>directPhase3(id,160)).map((x)=>x.metadata?.direction));
  for (const direction of ["construct","fill-missing","degree-to-note","note-to-degree","identify-alteration","leading-tone","augmented-second-location","form-discrimination","descending-convention"]) assert.ok(directions.has(direction),direction);
});

test("Phase 3 continues both Phase 1 interval and Phase 2 major-scale retrieval with original skill credit", () => {
  const all=IDS.flatMap((id)=>generated(id,220));
  const cross=all.filter((x)=>x.metadata?.crossPhaseReview);
  assert.ok(cross.some((x)=>x.metadata?.reviewPhase===1&&x.skillId.startsWith("intervals.")),"missing Phase 1 retrieval");
  assert.ok(cross.some((x)=>x.metadata?.reviewPhase===2&&x.skillId.startsWith("major-scales.")),"missing Phase 2 retrieval");
  assert.ok(cross.every((x)=>!x.skillId.startsWith("minor-scales.")),"cross-phase retrieval must not masquerade as Phase 3 evidence");
  const app=fs.readFileSync("web/app-block3.js","utf8");
  assert.match(app,/attemptSkillId = exercise\.skillId/);
  assert.match(app,/if \(attemptSkillId === practice\.skillId\) practice\.evidence = evidence/);
});

test("Phase 3 is foundational long-term material and RETAINED lowers rather than erases recurrence", () => {
  const ready=evidence({state:"ready",ready:true,retained:false,fragile:false});
  const retained=evidence({state:"retained",ready:true,retained:true,fragile:false,everRetained:true});
  for (const skill of SKILLS.filter((x)=>x.phase===3)) {
    assert.equal(skill.foundationality,5);
    assert.equal(skill.automaticRecall,5);
    assert.equal(skill.reviewPriority,5);
    assert.equal(skill.longTermRecurrence,5);
    assert.ok(longTermPracticeWeight(skill.id,ready)>longTermPracticeWeight(skill.id,retained));
    assert.ok(longTermPracticeWeight(skill.id,retained)>0);
    assert.ok(interleavingTargets(new Map([[skill.id,ready]])).includes(skill.id));
  }
});

test("Phase 3 teaching is short-screen, example-driven, piano-aware, and separates automatic from conceptual knowledge", () => {
  for (const lesson of phase3Lessons()) {
    assert.ok(lesson.teachingSteps.length>=5&&lesson.teachingSteps.length<=8,lesson.title);
    const expectations=new Set(lesson.teachingSteps.map((x)=>x.expectation));
    assert.ok(expectations.has("know-instantly"),`${lesson.title} automatic`);
    assert.ok(expectations.has("understand"),`${lesson.title} conceptual`);
    assert.ok(lesson.teachingSteps.every((x)=>x.workedExample),`${lesson.title} needs immediate examples`);
    assert.ok(lesson.teachingSteps.some((x)=>["piano","scale","interval"].includes(x.visual?.kind)),`${lesson.title} visual`);
  }
  const learnerText=phase3Lessons().flatMap((x)=>x.teachingSteps).map((x)=>`${x.title} ${x.body} ${x.workedExample??""}`).join(" ");
  for (const term of ["W-H-W-W-H-W-W","leading tone","augmented 2nd","raised 7 creates a leading tone","raise degrees 6 and 7","natural-minor form","dominant"] ) assert.match(learnerText,new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i"),term);
  assert.doesNotMatch(learnerText,/jazz/i,"alternate melodic-minor terminology should not enter this learner lesson");
});

test("completed Phase 3 lessons replay teaching first and only offer Skip to Review at the bottom", () => {
  const lesson=lessonForSkill(IDS[3]);
  const fresh={stage:"teaching",teachingStepIndex:0,canSkipToReview:false,skipPlacement:null};
  const replay={stage:"teaching",teachingStepIndex:0,canSkipToReview:true,skipPlacement:"teaching-bottom"};
  assert.doesNotMatch(renderTeachingLesson({lesson,openingState:fresh}),/Skip to Review/);
  const html=renderTeachingLesson({lesson,openingState:replay});
  assert.ok(html.indexOf("Skip to Review")>html.indexOf(lesson.teachingSteps.at(-1).body));
});

test("real Phase 3 round counts are used and never fake 1 of 1", () => {
  const expected=[36,48,48,48,60];
  SKILLS.filter((x)=>x.phase===3).forEach((skill,index)=>{
    assert.equal(practiceRoundPlan(skill.id,"new").size,expected[index]);
    assert.ok(practiceRoundPlan(skill.id,"review").size>=30);
  });
  assert.match(renderPracticeRoundCounter(3,48,1),/Question 4 of 48/);
  assert.doesNotMatch(fs.readFileSync("scripts/block4-app-transform.mjs","utf8"),/Question 1 of 1/);
});

test("Phase 3 checkpoint covers formulas, forms, spelling, leading tone, A2, and multiple keys", () => {
  const checkpoint=checkpointDefinition(3);
  assert.ok(checkpoint);
  assert.ok(checkpoint.minItems>=18);
  assert.ok(checkpoint.maxItems>=checkpoint.minItems);
  const ids=new Map(checkpoint.competencies.map((x)=>[x.id,x]));
  for (const id of ["natural-formula","all-root-construction","harmonic-alteration","melodic-alteration","correct-spelling","form-discrimination","leading-tone","augmented-second","key-variety"]) assert.ok(ids.has(id),id);
  assert.ok(ids.get("all-root-construction").minStrongEvidence>=3);
  assert.ok(ids.get("correct-spelling").minStrongEvidence>=3);
  assert.ok(ids.get("key-variety").minStrongEvidence>=3);
  assert.ok(checkpoint.competencies.every((x)=>x.critical));
});

test("Block 4 production transform activates Phase 3, keeps Phase 4 future, and preserves no-hint behavior", () => {
  const source=fs.readFileSync("web/app-block3.js","utf8");
  const transformed=transformBlock4App(source);
  assert.match(transformed,/const activeSections = \[1, 2, 3\]/);
  assert.match(transformed,/phase\.phase >= 4/);
  assert.match(transformed,/Representative minor-scale check/);
  assert.match(transformed,/PHASE 2 MAJOR-SCALE REVIEW/);
  assert.match(transformed,/definition\.phase >= 2/);
  assert.match(transformed,/Phases 1–3 active/);
  assert.doesNotMatch(transformed,/show\s+hint|need\s+a\s+hint|hintbutton|hintbtn/i);
  assert.match(transformBlock4Index(fs.readFileSync("web/index.html","utf8")),/app-block4\.js/);
  const temp="/tmp/music-theory-block4-app.js";
  fs.writeFileSync(temp,transformed);
  execFileSync(process.execPath,["--check",temp]);
});
