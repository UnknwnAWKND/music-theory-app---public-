import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  CURRICULUM_PHASES, INTERVALS, PHASE1_INTERVAL_NAMES, SKILLS,
  activeExerciseSkillIds, activeLessonSkillIds, checkpointDefinition, deriveSkillEvidence,
  exerciseForSkill, formatNote, gradeExercise, intervalAbove, invertPhase1Interval,
  invertSimpleIntervalNumber, inversionQuality, interleavingTargets, lessonForSkill,
  longTermPracticeWeight, parseNote, phase1Lessons, phase1RootNames, practiceRoundPlan,
  simpleToCompoundIntervalNumber,
} from "../dist/index.js";
import { renderPracticeRoundCounter, renderTeachingLesson } from "../web/lesson-ui.js";

const TITLES = [
  "Perfect Unison & Perfect Octave", "Perfect 5th", "Perfect 4th", "Major 3rd & Minor 3rd",
  "Major 6th & Minor 6th", "Major 2nd & Minor 2nd", "Major 7th & Minor 7th",
  "Tritone: Augmented 4th / Diminished 5th", "Inversion Rule Capstone", "Cumulative Drilling",
];
const IDS = [
  "intervals.lesson-1-unison-octave", "intervals.lesson-2-perfect-fifth", "intervals.lesson-3-perfect-fourth",
  "intervals.lesson-4-thirds", "intervals.lesson-5-sixths", "intervals.lesson-6-seconds",
  "intervals.lesson-7-sevenths", "intervals.lesson-8-tritone", "intervals.lesson-9-inversion-capstone",
  "intervals.lesson-10-cumulative",
];
const generated = (id, count=120) => Array.from({length:count}, (_,i)=>exerciseForSkill(id,i)).filter(Boolean);
const evidence = (overrides={}) => ({...deriveSkillEvidence([]), ...overrides});

test("exact Phase 1 lesson order with no Phase 2 content", () => {
  assert.deepEqual(SKILLS.map(x=>x.title), TITLES);
  assert.deepEqual(SKILLS.map(x=>x.id), IDS);
  assert.deepEqual(activeLessonSkillIds(), IDS);
  assert.deepEqual(activeExerciseSkillIds(), IDS);
  assert.deepEqual(phase1Lessons().map(x=>x.title), TITLES);
  assert.equal(SKILLS.every(x=>x.phase===1), true);
  assert.equal(SKILLS.some(x=>x.phase>=2), false);
  assert.deepEqual(CURRICULUM_PHASES.map(x=>x.phase), [1,2,3,4,5,6]);
});

test("each Phase 1 lesson has teaching and exercises", () => {
  for (const id of IDS) {
    assert.ok(lessonForSkill(id)?.teachingSteps.length >= 4, id);
    assert.ok(exerciseForSkill(id,0), id);
  }
});

test("Phase 1 teaches 14 distinct simple written interval types", () => {
  assert.deepEqual(PHASE1_INTERVAL_NAMES,["P1","P8","P5","P4","M3","m3","M6","m6","M2","m2","M7","m7","A4","d5"]);
  assert.equal(new Set(PHASE1_INTERVAL_NAMES).size,14);
});

test("simple/compound terminology helpers are correct", () => {
  assert.equal(simpleToCompoundIntervalNumber(1),8);
  assert.equal(simpleToCompoundIntervalNumber(3),10);
  assert.equal(simpleToCompoundIntervalNumber(8),15);
  assert.throws(()=>simpleToCompoundIntervalNumber(9));
});

test("exact interval spelling works over natural sharp and flat roots including double accidentals", () => {
  const cases = [
    ["C","P5","G"],["B","P5","F♯"],["F","M3","A"],["F","m3","A♭"],
    ["C","A4","F♯"],["C","d5","G♭"],["G#","A4","C♯♯"],["Db","M3","F"],
    ["Gb","m3","B♭♭"],["Cb","M7","B♭"],
  ];
  for (const [root,interval,expected] of cases) assert.equal(formatNote(intervalAbove(parseNote(root),INTERVALS[interval])),expected,`${interval} above ${root}`);
});

test("A4 and d5 are enharmonic on piano but distinct written intervals", () => {
  assert.equal(formatNote(intervalAbove(parseNote("C"),INTERVALS.A4)),"F♯");
  assert.equal(formatNote(intervalAbove(parseNote("C"),INTERVALS.d5)),"G♭");
  const d5 = generated("intervals.lesson-8-tritone",400).find(x=>x.metadata?.interval==="d5"&&x.metadata?.root==="C"&&x.metadata?.direction==="construct");
  if (d5) {
    assert.equal(gradeExercise(d5,"Gb").correct,true);
    const wrong=gradeExercise(d5,"F#");
    assert.equal(wrong.correct,false);
    assert.equal(wrong.code,"enharmonic-spelling-error");
  }
});

test("inversion number and quality rules are exact", () => {
  assert.deepEqual([1,2,3,4,5,6,7,8].map(invertSimpleIntervalNumber),[8,7,6,5,4,3,2,1]);
  assert.equal(inversionQuality("perfect"),"perfect");
  assert.equal(inversionQuality("major"),"minor");
  assert.equal(inversionQuality("minor"),"major");
  assert.equal(inversionQuality("augmented"),"diminished");
  assert.equal(inversionQuality("diminished"),"augmented");
});

test("all requested inversion partners are exact", () => {
  const pairs={P1:"P8",P8:"P1",P5:"P4",P4:"P5",M3:"m6",m6:"M3",m3:"M6",M6:"m3",M2:"m7",m7:"M2",m2:"M7",M7:"m2",A4:"d5",d5:"A4"};
  for (const [a,b] of Object.entries(pairs)) assert.equal(invertPhase1Interval(a),b,a);
});

test("later lesson generators cumulatively revisit earlier intervals", () => {
  const cases=[
    ["intervals.lesson-2-perfect-fifth",["P1","P8","P5"]],
    ["intervals.lesson-3-perfect-fourth",["P1","P8","P5","P4"]],
    ["intervals.lesson-5-sixths",["M3","m3","M6","m6","P5"]],
    ["intervals.lesson-7-sevenths",["M2","m2","M7","m7","M3","P5"]],
    ["intervals.lesson-8-tritone",["A4","d5","M7","m7","M2","m2","M3","m3","P5","P4"]],
  ];
  for (const [id,expected] of cases) {
    const seen=new Set(generated(id,180).map(x=>x.metadata?.interval).filter(Boolean));
    for (const interval of expected) assert.ok(seen.has(interval),`${id} should recur ${interval}`);
  }
});

test("cumulative lesson covers all taught intervals and both directions", () => {
  const items=generated("intervals.lesson-10-cumulative",260);
  const seen=new Set(items.map(x=>x.metadata?.interval).filter(Boolean));
  for (const interval of PHASE1_INTERVAL_NAMES) assert.ok(seen.has(interval),interval);
  assert.ok(items.some(x=>x.metadata?.direction==="construct"));
  assert.ok(items.some(x=>x.metadata?.direction==="identify"));
  assert.ok(items.some(x=>x.metadata?.family==="interval-inversion"));
  assert.ok(items.some(x=>x.metadata?.family==="tritone-spelling"));
});

test("roots vary across naturals sharps and flats", () => {
  assert.ok(phase1RootNames().some(x=>!/[#b]/.test(x)));
  assert.ok(phase1RootNames().some(x=>x.includes("#")));
  assert.ok(phase1RootNames().some(x=>x.includes("b")));
  const roots=new Set(generated("intervals.lesson-10-cumulative",240).map(x=>String(x.metadata?.root??"")));
  assert.ok([...roots].some(x=>/♯/.test(x)));
  assert.ok([...roots].some(x=>/♭/.test(x)));
  assert.ok([...roots].some(x=>x&&!/[♯♭]/.test(x)));
});

test("construct questions show the root but do not reveal the target before retrieval", () => {
  const item=generated("intervals.lesson-10-cumulative",100).find(x=>x.metadata?.direction==="construct");
  assert.ok(item);
  assert.equal(item.metadata.pianoHighlighted.length,1);
  assert.ok(item.metadata.revealPianoTarget);
});

test("recent question generation has meaningful variety", () => {
  for (const id of IDS) {
    const items=generated(id,30);
    const unique=new Set(items.map(x=>x.exampleSignature));
    assert.ok(unique.size>=Math.min(12,items.length),`${id} only produced ${unique.size} unique examples`);
  }
});

test("teaching marks automatic recall vs understanding and examples accompany rule-heavy content", () => {
  for (const lesson of phase1Lessons()) {
    const expectations=new Set(lesson.teachingSteps.map(x=>x.expectation));
    assert.ok(expectations.has("know-instantly"),`${lesson.title} automatic target`);
    assert.ok(expectations.has("understand"),`${lesson.title} conceptual target`);
    assert.ok(lesson.teachingSteps.filter(x=>x.workedExample).length>=lesson.teachingSteps.length-1,`${lesson.title} needs examples around its rules`);
  }
  const ui=fs.readFileSync("web/lesson-ui.js","utf8");
  assert.match(ui,/KNOW THIS INSTANTLY/);
  assert.match(ui,/UNDERSTAND THIS/);
});

test("READY remains reviewable and RETAINED lowers but does not erase recurrence", () => {
  const ready=evidence({state:"ready",ready:true,retained:false,fragile:false});
  const retained=evidence({state:"retained",ready:true,retained:true,fragile:false,everRetained:true});
  const id=IDS[0];
  assert.ok(longTermPracticeWeight(id,ready)>longTermPracticeWeight(id,retained));
  assert.ok(longTermPracticeWeight(id,retained)>0);
  assert.ok(interleavingTargets(new Map([[id,ready]])).includes(id));
  assert.ok(interleavingTargets(new Map([[id,retained]])).includes(id));
});

test("Phase 1 priorities are maximal and practice rounds are never under 30", () => {
  assert.ok(SKILLS.every(x=>x.foundationality===5&&x.reviewPriority===5&&x.longTermRecurrence===5));
  for (const skill of SKILLS) {
    assert.ok(practiceRoundPlan(skill.id,"new").size>=30);
    assert.ok(practiceRoundPlan(skill.id,"review").size>=30);
  }
  assert.match(renderPracticeRoundCounter(2,30,1),/Question 3 of 30/);
});

test("checkpoint represents all required Phase 1 competencies and Phase 2 is absent", () => {
  const checkpoint=checkpointDefinition(1);
  assert.ok(checkpoint&&checkpoint.minItems>=14);
  const ids=new Set(checkpoint.competencies.map(x=>x.id));
  for (const id of ["perfect-construction","major-minor-construction","interval-identification","interval-inversion","quality-discrimination","tritone-spelling","varied-root-spelling"]) assert.ok(ids.has(id),id);
  assert.ok(checkpoint.competencies.every(x=>x.critical));
  assert.equal(checkpointDefinition(2),undefined);
});

test("lesson replay starts at teaching and Skip to Review appears only after completed teaching", () => {
  const lesson=lessonForSkill(IDS[0]);
  const first={stage:"teaching",teachingStepIndex:0,canSkipToReview:false,skipPlacement:null};
  const replay={stage:"teaching",teachingStepIndex:0,canSkipToReview:true,skipPlacement:"teaching-bottom"};
  assert.doesNotMatch(renderTeachingLesson({lesson,openingState:first}),/Skip to Review/);
  const html=renderTeachingLesson({lesson,openingState:replay});
  assert.ok(html.indexOf("Skip to Review")>html.indexOf(lesson.teachingSteps.at(-1).body));
});

test("no Phase 1 user-facing hint controls were reintroduced", () => {
  for (const path of ["web/app.js","web/lesson-ui.js","src/practice/lessons.ts","src/exercises/phase1-intervals.ts"]) assert.doesNotMatch(fs.readFileSync(path,"utf8"),/show\s+hint|need\s+a\s+hint|hintbutton|hintbtn/i,path);
});
