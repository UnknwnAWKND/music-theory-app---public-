import assert from "node:assert/strict";
import test from "node:test";

import { exerciseForSkill, selectAdaptiveExercise } from "../dist/index.js";

function simulate(skillId, questions, startIndex=0) {
  let generatorIndex=startIndex;
  let recent=[];
  const selected=[];
  for (let answered=0; answered<questions; answered++) {
    const candidates=Array.from({length:30},(_,offset)=>exerciseForSkill(skillId,generatorIndex+offset)).filter(Boolean);
    const item=selectAdaptiveExercise(candidates,recent,answered);
    assert.ok(item);
    generatorIndex += 1;
    recent=[...recent,item.exampleSignature].slice(-12);
    selected.push(item);
  }
  return selected;
}

test("live Lesson 3 selection reaches every major-scale pitch class within its 48-question acquisition round",()=>{
  for (const start of [0,7,31,116]) {
    const items=simulate("major-scales.lesson-3-build-all-roots",48,start).filter((x)=>!x.metadata?.crossPhaseReview);
    const pcs=new Set(items.map((x)=>x.metadata?.pitchClassRoot).filter(Number.isInteger));
    assert.equal(pcs.size,12,`start ${start} covered ${[...pcs].sort((a,b)=>a-b).join(",")}`);
  }
});

test("live Lesson 4 selection reaches every major-scale pitch class within its 60-question acquisition round",()=>{
  for (const start of [0,8,47,211]) {
    const items=simulate("major-scales.lesson-4-instant-recall",60,start).filter((x)=>!x.metadata?.crossPhaseReview);
    const pcs=new Set(items.map((x)=>x.metadata?.pitchClassRoot).filter(Number.isInteger));
    assert.equal(pcs.size,12,`start ${start} covered ${[...pcs].sort((a,b)=>a-b).join(",")}`);
  }
});

test("live major-scale selection still includes occasional Phase 1 interval retrieval",()=>{
  const items=simulate("major-scales.lesson-4-instant-recall",60,0);
  assert.ok(items.some((x)=>x.metadata?.crossPhaseReview));
  assert.ok(items.some((x)=>x.skillId.startsWith("major-scales.")));
});
