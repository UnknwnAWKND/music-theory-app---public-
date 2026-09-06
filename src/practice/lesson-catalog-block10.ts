import {
  phase1Lessons as priorPhase1Lessons,
  phase2Lessons,
  phase3Lessons,
  phase4Lessons,
  phase5Lessons,
  phase6Lessons,
} from "./lesson-catalog-block9.js";
import type { LessonContent } from "./types.js";

const LESSON1_ID = "intervals.lesson-1-unison-octave";

const LESSON1: LessonContent = {
  skillId: LESSON1_ID,
  title: "Perfect Unison & Perfect Octave",
  teachingSteps: [
    {
      id: "interval-name-parts",
      title: "What an interval name tells you",
      body: "An interval is the distance in pitch between two notes.\n\nIntervals are defined by their size — the number of letter names spanned — and their quality — the exact size of that interval, determined by its number of half-steps or semitones.",
      expectation: "understand",
    },
    {
      id: "p1",
      title: "Perfect Unison (P1)",
      body: "A Perfect Unison happens when both notes are the same pitch.\n\nC to C at the same octave.\n\nIts interval size is 1 because only the letter C is spanned.\n\nIts name is Perfect Unison, written P1. Both notes occupy the same piano key.",
      expectation: "understand",
      visual: { kind: "piano", data: { highlightedKeys: ["C4"] } },
    },
    {
      id: "p8",
      title: "Perfect Octave (P8)",
      body: "A Perfect Octave happens when the second note is the same letter name at the next octave.\n\nC to the next C above.\n\nC–D–E–F–G–A–B–C spans eight letter names, so its interval size is 8.\n\nIts name is Perfect Octave, written P8.",
      expectation: "understand",
      visual: { kind: "piano", data: { highlightedKeys: ["C4", "C5"] } },
    },
  ],
};

const phase1 = priorPhase1Lessons().map((lesson) => lesson.skillId === LESSON1_ID ? LESSON1 : lesson);
const ALL_LESSONS = [...phase1, ...phase2Lessons(), ...phase3Lessons(), ...phase4Lessons(), ...phase5Lessons(), ...phase6Lessons()];
const BY_ID = new Map(ALL_LESSONS.map((lesson) => [lesson.skillId, lesson]));

export function registerLesson(content: LessonContent): void { BY_ID.set(content.skillId, content); }
export function lessonForSkill(skillId: string): LessonContent | undefined { return BY_ID.get(skillId); }
export function activeLessonSkillIds(): string[] { return ALL_LESSONS.map((lesson) => lesson.skillId); }
export function phase1Lessons(): readonly LessonContent[] { return phase1; }
export { phase2Lessons, phase3Lessons, phase4Lessons, phase5Lessons, phase6Lessons };
