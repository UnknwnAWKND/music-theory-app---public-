import test from 'node:test';
import assert from 'node:assert/strict';
import { SKILLS } from '../dist/curriculum/index.js';
import { lessonForSkill } from '../dist/practice/index.js';

test('every curriculum skill has concise teaching content before retrieval', () => {
  for (const skill of SKILLS) {
    const lesson = lessonForSkill(skill.id);
    assert.equal(lesson.skillId, skill.id);
    assert.ok(lesson.summary.length >= 20, `${skill.id} has meaningful summary`);
  }
});

test('lesson layer contains no ear-training exercises', () => {
  const banned = /ear[- ]?train|audio recognition|identify by (?:ear|sound)|listen and identify/i;
  for (const skill of SKILLS) assert.equal(banned.test(lessonForSkill(skill.id).summary), false, skill.id);
});
