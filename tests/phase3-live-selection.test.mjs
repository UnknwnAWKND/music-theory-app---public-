import assert from "node:assert/strict";
import test from "node:test";

import { exerciseForSkill, practiceRoundPlan, selectAdaptiveExercise } from "../dist/index.js";

const LESSON2="minor-scales.lesson-2-natural-all-roots";
const LESSON5="minor-scales.lesson-5-instant-recall";

function simulate(skillId, size) {
  const picked=[];
  const recent=[];
  for (let question=0;question<size;question+=1) {
    const candidates=[];
    for (let offset=0;offset<30;offset+=1) {
      const exercise=exerciseForSkill(skillId,question+offset);
      if (exercise) candidates.push(exercise);
    }
    const selected=selectAdaptiveExercise(candidates,recent,question);
    assert.ok(selected,`missing selected exercise for ${skillId} question ${question}`);
    picked.push(selected);
    recent.push(selected.exampleSignature);
    if (recent.length>8) recent.shift();
  }
  return picked;
}

test("live Natural Minor From Every Root round reaches all 12 pitch classes",()=>{
  const size=practiceRoundPlan(LESSON2,"new").size;
  assert.equal(size,48);
  const items=simulate(LESSON2,size).filter((x)=>x.skillId===LESSON2);
  const pcs=new Set(items.map((x)=>x.metadata?.pitchClassRoot).filter(Number.isInteger));
  assert.deepEqual([...pcs].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8,9,10,11]);
});

test("live Minor Scale Instant Recall round reaches all 12 pitch classes and multiple forms",()=>{
  const size=practiceRoundPlan(LESSON5,"new").size;
  assert.equal(size,60);
  const items=simulate(LESSON5,size);
  const direct=items.filter((x)=>x.skillId===LESSON5);
  const pcs=new Set(direct.map((x)=>x.metadata?.pitchClassRoot).filter(Number.isInteger));
  assert.equal(pcs.size,12);
  const forms=new Set(direct.map((x)=>x.metadata?.form).filter(Boolean));
  assert.ok(forms.has("natural"));
  assert.ok(forms.has("harmonic"));
  assert.ok(forms.has("melodic-ascending"));
  assert.ok(forms.has("melodic-descending"));
});

test("live Phase 3 selection includes both interval and major-scale foundation review",()=>{
  const items=simulate(LESSON5,120);
  assert.ok(items.some((x)=>x.metadata?.crossPhaseReview&&x.metadata?.reviewPhase===1&&x.skillId.startsWith("intervals.")));
  assert.ok(items.some((x)=>x.metadata?.crossPhaseReview&&x.metadata?.reviewPhase===2&&x.skillId.startsWith("major-scales.")));
});
