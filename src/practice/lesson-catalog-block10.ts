import {
  phase1Lessons as priorPhase1Lessons,
  phase2Lessons as priorPhase2Lessons,
  phase3Lessons as priorPhase3Lessons,
  phase4Lessons as priorPhase4Lessons,
  phase5Lessons as priorPhase5Lessons,
  phase6Lessons as priorPhase6Lessons,
} from "./lesson-catalog-block9.js";
import type { LessonContent } from "./types.js";

const LESSON1_ID = "intervals.lesson-1-unison-octave";

const lesson1: LessonContent = Object.freeze({
  skillId: LESSON1_ID,
  title: "Perfect Unison & Perfect Octave",
  teachingSteps: Object.freeze([
    Object.freeze({
      id: "interval-means-distance",
      title: "What an interval is",
      body: "An interval is the distance in pitch between two notes. Intervals are defined by their size — the number of letter names spanned — and their quality — the exact size of that interval, determined by its number of half-steps or semitones.",
      workedExample: "An interval name combines a size and a quality. You only need the names used in this lesson for now; later lessons will explain the rest of the quality system.",
      expectation: "understand",
    }),
    Object.freeze({
      id: "p1",
      title: "Perfect Unison",
      body: "A Perfect Unison happens when both notes are the same pitch. C to C at the same octave is a Perfect Unison. Its interval size is 1 because only the letter C is spanned. Its name is Perfect Unison, written P1.",
      workedExample: "C to C at the same octave = P1. Both notes occupy the same piano key.",
      expectation: "know-instantly",
      visual: { kind: "piano", data: { highlighted: ["C4"] } },
    }),
    Object.freeze({
      id: "p8",
      title: "Perfect Octave",
      body: "A Perfect Octave happens when the second note is the same letter name at the next octave. C to the next C above is a Perfect Octave. C–D–E–F–G–A–B–C spans eight letter names, so its interval size is 8. Its name is Perfect Octave, written P8.",
      workedExample: "C to the next C above = P8. The lower C and upper C are two different piano keys.",
      expectation: "know-instantly",
      visual: { kind: "piano", data: { highlighted: ["C4", "C5"] } },
    }),
  ]),
});

const phase1 = priorPhase1Lessons().map((lesson) => lesson.skillId === LESSON1_ID ? lesson1 : lesson);
const phase2 = priorPhase2Lessons();
const phase3 = priorPhase3Lessons();
const phase4 = priorPhase4Lessons();
const phase5 = priorPhase5Lessons();
const phase6 = priorPhase6Lessons();
const ALL_LESSONS = [...phase1, ...phase2, ...phase3, ...phase4, ...phase5, ...phase6];
const BY_ID = new Map(ALL_LESSONS.map((lesson) => [lesson.skillId, lesson]));

export function registerLesson(content: LessonContent): void { BY_ID.set(content.skillId, content); }
export function lessonForSkill(skillId: string): LessonContent | undefined { return BY_ID.get(skillId); }
export function activeLessonSkillIds(): string[] { return ALL_LESSONS.map((lesson) => lesson.skillId); }
export function phase1Lessons(): readonly LessonContent[] { return phase1; }
export function phase2Lessons(): readonly LessonContent[] { return phase2; }
export function phase3Lessons(): readonly LessonContent[] { return phase3; }
export function phase4Lessons(): readonly LessonContent[] { return phase4; }
export function phase5Lessons(): readonly LessonContent[] { return phase5; }
export function phase6Lessons(): readonly LessonContent[] { return phase6; }
