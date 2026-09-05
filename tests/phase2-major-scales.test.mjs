import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  LETTERS,
  MAJOR_PITCH_CLASS_ROOTS,
  MAJOR_SCALE_DEGREE_INTERVALS,
  MAJOR_SCALE_STEP_PATTERN,
  SCALE_DEGREE_NAMES,
  SKILLS,
  SUPPORTED_MAJOR_KEY_NAMES,
  activeExerciseSkillIds,
  activeLessonSkillIds,
  checkpointDefinition,
  deriveSkillEvidence,
  exerciseForSkill,
  gradeExercise,
  interleavingTargets,
  lessonForSkill,
  longTermPracticeWeight,
  majorScaleDegreeForNote,
  majorScaleDegreeNote,
  majorScaleNames,
  parseNote,
  phase1Lessons,
  phase2BalancedRootNames,
  phase2Lessons,
  pitchClass,
  practiceRoundPlan,
  scaleDegreeName,
} from "../dist/index.js";
import { renderPracticeRoundCounter, renderTeachingLesson } from "../web/lesson-ui.js";

const IDS = [
  "major-scales.lesson-1-formula",
  "major-scales.lesson-2-degree-names",
  "major-scales.lesson-3-build-all-roots",
  "major-scales.lesson-4-instant-recall",
];
const TITLES = [
  "Major Scale Formula",
  "Scale Degree Names",
  "Building the Major Scale From Every Root",
  "Major Scale Instant Recall Drill",
];
const generated = (id, count=120) => Array.from({length:count}, (_,i)=>exerciseForSkill(id,i)).filter(Boolean);
const directPhase2 = (id, count=120) => generated(id,count).filter((item)=>item.skillId===id && !item.metadata?.crossPhaseReview);
const evidence = (overrides={}) => ({...deriveSkillEvidence([]), ...overrides});

const CANONICAL = new Map([
  ["C",  ["C","D","E","F","G","A","B"]],
  ["Db", ["D♭","E♭","F","G♭","A♭","B♭","C"]],
  ["D",  ["D","E","F♯","G","A","B","C♯"]],
  ["Eb", ["E♭","F","G","A♭","B♭","C","D"]],
  ["E",  ["E","F♯","G♯","A","B","C♯","D♯"]],
  ["F",  ["F","G","A","B♭","C","D","E"]],
  ["F#", ["F♯","G♯","A♯","B","C♯","D♯","E♯"]],
  ["G",  ["G","A","B","C","D","E","F♯"]],
  ["Ab", ["A♭","B♭","C","D♭","E♭","F","G"]],
  ["A",  ["A","B","C♯","D","E","F♯","G♯"]],
  ["Bb", ["B♭","C","D","E♭","F","G","A"]],
  ["B",  ["B","C♯","D♯","E","F♯","G♯","A♯"]],
]);

test("Phase 2 remains exactly the requested four lessons while Phase 3 is added afterward", () => {
  const phase2 = SKILLS.filter((skill)=>skill.phase===2);
  assert.deepEqual(phase2.map((skill)=>skill.id), IDS);
  assert.deepEqual(phase2.map((skill)=>skill.title), TITLES);
  assert.deepEqual(phase2Lessons().map((lesson)=>lesson.skillId), IDS);
  assert.deepEqual(activeLessonSkillIds().slice(10,14), IDS);
  assert.deepEqual(activeExerciseSkillIds().slice(10,14), IDS);
  assert.equal(phase1Lessons().length,10);
  assert.equal(SKILLS.filter((skill)=>skill.phase===3).length,5);
  assert.ok(checkpointDefinition(3));
  assert.equal(SKILLS.filter((skill)=>skill.phase===4).length,0);
});

test("major-scale formula, scale-degree intervals, and degree names are exact", () => {
  assert.deepEqual([...MAJOR_SCALE_STEP_PATTERN],["W","W","H","W","W","W","H"]);
  assert.deepEqual([...MAJOR_SCALE_DEGREE_INTERVALS],["P1","M2","M3","P4","P5","M6","M7","P8"]);
  assert.deepEqual([...SCALE_DEGREE_NAMES],["Tonic","Supertonic","Mediant","Subdominant","Dominant","Submediant","Leading Tone"]);
  for (let degree=1; degree<=7; degree++) assert.equal(scaleDegreeName(degree),SCALE_DEGREE_NAMES[degree-1]);
});

test("all 12 balanced pitch-class roots generate theoretically correct major scales", () => {
  assert.deepEqual([...MAJOR_PITCH_CLASS_ROOTS],["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"]);
  assert.equal(CANONICAL.size,12);
  for (const [root, expected] of CANONICAL) {
    assert.deepEqual(majorScaleNames(root),expected,root);
    const pcs = majorScaleNames(root).map((name)=>pitchClass(parseNote(name)));
    const tonicPc = pitchClass(parseNote(root));
    assert.deepEqual(pcs.map((pc)=>((pc-tonicPc+12)%12)),[0,2,4,5,7,9,11],root);
  }
});

test("conventional enharmonic major-key spellings are supported without confusing 12 pitch classes with 15 written keys", () => {
  assert.equal(SUPPORTED_MAJOR_KEY_NAMES.length,15);
  assert.deepEqual(majorScaleNames("C#"),["C♯","D♯","E♯","F♯","G♯","A♯","B♯"]);
  assert.deepEqual(majorScaleNames("Gb"),["G♭","A♭","B♭","C♭","D♭","E♭","F"]);
  assert.deepEqual(majorScaleNames("Cb"),["C♭","D♭","E♭","F♭","G♭","A♭","B♭"]);
  assert.deepEqual(majorScaleNames("F#"),["F♯","G♯","A♯","B","C♯","D♯","E♯"]);
  assert.notDeepEqual(majorScaleNames("F#"),majorScaleNames("Gb"));
  assert.deepEqual(majorScaleNames("F#").map((x)=>pitchClass(parseNote(x))),majorScaleNames("Gb").map((x)=>pitchClass(parseNote(x))));
});

test("every generated major scale uses each letter name exactly once in order", () => {
  for (const root of SUPPORTED_MAJOR_KEY_NAMES) {
    const scale=majorScaleNames(root);
    const letters=scale.map((name)=>parseNote(name).letter);
    assert.equal(new Set(letters).size,7,root);
    const start=LETTERS.indexOf(parseNote(root).letter);
    assert.deepEqual(letters,Array.from({length:7},(_,i)=>LETTERS[(start+i)%7]),root);
  }
});

test("exact scale spelling rejects enharmonic substitutes", () => {
  const item=directPhase2(IDS[2],40).find((x)=>x.metadata?.root==="F#"&&x.answerSpec.kind==="note-sequence");
  assert.ok(item,"expected F# major full-scale construction item");
  assert.equal(gradeExercise(item,["F#","G#","A#","B","C#","D#","E#"]).correct,true);
  const wrong=gradeExercise(item,["Gb","Ab","Bb","Cb","Db","Eb","F"]);
  assert.equal(wrong.correct,false);
  assert.equal(wrong.code,"enharmonic-spelling-error");
});

test("scale-degree number, name, and note relationships work in varied keys", () => {
  assert.equal(majorScaleDegreeNote("D",3),"F♯");
  assert.equal(majorScaleDegreeNote("F#",7),"E♯");
  assert.equal(majorScaleDegreeNote("Gb",4),"C♭");
  assert.equal(majorScaleDegreeForNote("Eb","Bb"),5);
  assert.equal(majorScaleDegreeForNote("A","G#"),7);
  assert.equal(majorScaleDegreeForNote("Db","F"),3);
});

test("Lesson 3 distributes construction across all 12 pitch classes and later includes conventional aliases", () => {
  const first48=directPhase2(IDS[2],48);
  const pcs=new Set(first48.map((x)=>x.metadata?.pitchClassRoot).filter((x)=>Number.isInteger(x)));
  assert.deepEqual([...pcs].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8,9,10,11]);
  const roots=new Set(directPhase2(IDS[2],96).map((x)=>x.metadata?.root).filter(Boolean));
  for (const root of MAJOR_PITCH_CLASS_ROOTS) assert.ok(roots.has(root),root);
  for (const alias of ["C#","Gb","Cb"]) assert.ok(roots.has(alias),`missing alias ${alias}`);
});

test("Lesson 4 recall rotates all 12 pitch classes and does not overfit easy keys", () => {
  const items=directPhase2(IDS[3],72);
  const firstBlock=items.slice(0,12);
  const pcs=new Set(firstBlock.map((x)=>x.metadata?.pitchClassRoot));
  assert.equal(pcs.size,12);
  const roots=new Set(items.map((x)=>x.metadata?.root));
  for (const root of ["Db","Eb","F#","Ab","Bb","B"]) assert.ok(roots.has(root),root);
  assert.ok(items.some((x)=>x.metadata?.automaticRecall===true));
  assert.ok(items.some((x)=>x.answerSpec.kind==="note-sequence"));
  assert.ok(items.some((x)=>x.metadata?.direction==="degree-to-note"));
  assert.ok(items.some((x)=>x.metadata?.direction==="fill-missing"));
  assert.ok(items.some((x)=>x.metadata?.direction==="note-to-degree"));
});

test("Phase 2 question design mixes task types instead of repeating one template", () => {
  for (const id of IDS) {
    const items=generated(id,60);
    const unique=new Set(items.map((x)=>x.exampleSignature));
    assert.ok(unique.size>=18,`${id} only produced ${unique.size} semantic examples`);
  }
  const build=directPhase2(IDS[2],80);
  const directions=new Set(build.map((x)=>x.metadata?.direction));
  for (const direction of ["construct","fill-missing","degree-to-note","note-to-degree"]) assert.ok(directions.has(direction),direction);
});

test("Phase 2 deliberately includes Phase 1 interval review without crediting it as a scale exercise", () => {
  for (const id of IDS) {
    const items=generated(id,120);
    const cross=items.filter((x)=>x.metadata?.crossPhaseReview);
    assert.ok(cross.length>0,`${id} missing Phase 1 review`);
    assert.ok(cross.every((x)=>x.skillId.startsWith("intervals.")),`${id} cross-review should retain Phase 1 skill identity`);
  }
  const app=fs.readFileSync("web/app-block3.js","utf8");
  assert.match(app,/crossPhaseReview/);
  assert.match(app,/attemptSkillId = exercise\.skillId/);
  assert.match(app,/if \(attemptSkillId === practice\.skillId\) practice\.evidence = evidence/);
});

test("Phase 2 is high-priority long-term material and RETAINED lowers rather than erases recurrence", () => {
  const ready=evidence({state:"ready",ready:true,retained:false,fragile:false});
  const retained=evidence({state:"retained",ready:true,retained:true,fragile:false,everRetained:true});
  for (const skill of SKILLS.filter((x)=>x.phase===2)) {
    assert.equal(skill.foundationality,5);
    assert.equal(skill.automaticRecall,5);
    assert.equal(skill.reviewPriority,5);
    assert.equal(skill.longTermRecurrence,5);
    assert.ok(longTermPracticeWeight(skill.id,ready)>longTermPracticeWeight(skill.id,retained));
    assert.ok(longTermPracticeWeight(skill.id,retained)>0);
    assert.ok(interleavingTargets(new Map([[skill.id,ready]])).includes(skill.id));
  }
});

test("Phase 2 teaching is short-screen, example-driven, piano-aware, and flags automatic vs conceptual knowledge", () => {
  for (const lesson of phase2Lessons()) {
    assert.ok(lesson.teachingSteps.length>=5 && lesson.teachingSteps.length<=8,lesson.title);
    const expectations=new Set(lesson.teachingSteps.map((x)=>x.expectation));
    assert.ok(expectations.has("know-instantly"),`${lesson.title} automatic`);
    assert.ok(expectations.has("understand"),`${lesson.title} conceptual`);
    assert.ok(lesson.teachingSteps.filter((x)=>x.workedExample).length>=lesson.teachingSteps.length-1,`${lesson.title} examples`);
    assert.ok(lesson.teachingSteps.some((x)=>["piano","scale","interval"].includes(x.visual?.kind)),`${lesson.title} visual`);
  }
  const combined=phase2Lessons().flatMap((x)=>x.teachingSteps).map((x)=>`${x.title} ${x.body} ${x.workedExample??""}`).join(" ");
  for (const term of ["whole step","half step","tonic","Supertonic","Mediant","Subdominant","Dominant","Submediant","Leading Tone","enharmonic"]) assert.match(combined,new RegExp(term,"i"),term);
});

test("completed Phase 2 lessons replay teaching first and only offer Skip to Review at the bottom", () => {
  const lesson=lessonForSkill(IDS[1]);
  const fresh={stage:"teaching",teachingStepIndex:0,canSkipToReview:false,skipPlacement:null};
  const replay={stage:"teaching",teachingStepIndex:0,canSkipToReview:true,skipPlacement:"teaching-bottom"};
  assert.doesNotMatch(renderTeachingLesson({lesson,openingState:fresh}),/Skip to Review/);
  const html=renderTeachingLesson({lesson,openingState:replay});
  assert.ok(html.indexOf("Skip to Review")>html.indexOf(lesson.teachingSteps.at(-1).body));
});

test("real Phase 2 round counts are 30+ and the UI never fakes 1 of 1", () => {
  const expected=[36,42,48,60];
  SKILLS.filter((x)=>x.phase===2).forEach((skill,index)=>{
    assert.equal(practiceRoundPlan(skill.id,"new").size,expected[index]);
    assert.ok(practiceRoundPlan(skill.id,"review").size>=30);
  });
  assert.match(renderPracticeRoundCounter(3,48,1),/Question 4 of 48/);
  const app=fs.readFileSync("web/app-block3.js","utf8");
  assert.doesNotMatch(app,/Question 1 of 1/);
});

test("Phase 2 checkpoint reflects formula, construction, spelling, degrees, key variety, and instant recall", () => {
  const checkpoint=checkpointDefinition(2);
  assert.ok(checkpoint);
  assert.ok(checkpoint.minItems>=14);
  assert.ok(checkpoint.maxItems>=checkpoint.minItems);
  const ids=new Map(checkpoint.competencies.map((x)=>[x.id,x]));
  for (const id of ["formula-understanding","scale-construction","correct-spelling","scale-degrees","key-variety","instant-recall"]) assert.ok(ids.has(id),id);
  assert.ok(ids.get("key-variety").minStrongEvidence>=3);
  assert.ok(ids.get("key-variety").minDistinctExamples>=3);
  assert.ok(ids.get("instant-recall").minStrongEvidence>=2);
  assert.ok(checkpoint.competencies.every((x)=>x.critical));
  const app=fs.readFileSync("web/app-block3.js","utf8");
  assert.match(app,/startCheckpoint\(Number\(button\.dataset\.checkpointPhase\)\)/);
  assert.match(app,/checkpointCompetencies/);
});

test("Phase 2 accepts sequence entry, reveals piano answers only after grading, and has no hint controls", () => {
  const app=fs.readFileSync("web/app-block3.js","utf8");
  assert.match(app,/spec\.kind === "note-sequence"/);
  assert.match(app,/parseSubmittedAnswer/);
  assert.match(app,/revealPianoNotes/);
  assert.doesNotMatch(app,/show\s+hint|need\s+a\s+hint|hintbutton|hintbtn/i);
  for (const path of ["src/practice/phase2-major-scales.ts","src/exercises/phase2-major-scales.ts"]) assert.doesNotMatch(fs.readFileSync(path,"utf8"),/show\s+hint|need\s+a\s+hint|hintbutton|hintbtn/i,path);
});
