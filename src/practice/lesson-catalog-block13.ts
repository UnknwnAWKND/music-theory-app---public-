import {
  phase1Lessons as priorPhase1Lessons,
  phase2Lessons as priorPhase2Lessons,
  phase3Lessons as priorPhase3Lessons,
  phase4Lessons as priorPhase4Lessons,
  phase5Lessons as priorPhase5Lessons,
  phase6Lessons as priorPhase6Lessons,
} from "./lesson-catalog-block12.js";
import type { LessonContent, LessonTeachingStep } from "./types.js";

type TeachingPatch = {
  skillId: string;
  stepId: string;
  patch: Partial<LessonTeachingStep>;
};

function cloneStep(step: LessonTeachingStep): LessonTeachingStep {
  return {
    ...step,
    visual: step.visual ? { ...step.visual, data: { ...(step.visual.data ?? {}) } } : undefined,
  };
}

function cloneLesson(lesson: LessonContent): LessonContent {
  return { ...lesson, teachingSteps: lesson.teachingSteps.map(cloneStep) };
}

function patchSteps(lessons: readonly LessonContent[], patches: readonly TeachingPatch[]): LessonContent[] {
  const byKey = new Map(patches.map((item) => [`${item.skillId}::${item.stepId}`, item.patch]));
  return lessons.map((source) => {
    const lesson = cloneLesson(source);
    return {
      ...lesson,
      teachingSteps: lesson.teachingSteps.map((step) => ({
        ...step,
        ...(byKey.get(`${lesson.skillId}::${step.id}`) ?? {}),
      })),
    };
  });
}

/*
 * Phase 1 semitone-fluency correction.
 *
 * This does not use semitone count to determine the interval number. The number
 * still comes from the written note-letter span. Once a quality has actually
 * been introduced, its exact semitone distance is taught as a second fact so
 * practice can build quality <-> semitone automaticity without future leakage.
 */
const phase1 = patchSteps(priorPhase1Lessons(), [
  {
    skillId: "intervals.lesson-1-unison-octave",
    stepId: "p1",
    patch: {
      title: "Perfect Unison (P1)",
      body: "A Perfect Unison happens when both notes are the same pitch.\n\nExample: C to C at the same octave.\n\nThe interval size is 1 because only C is spanned. Because the pitches are identical, the distance is 0 semitones, and both notes occupy the same piano key.",
      expectation: "understand",
      visual: { kind: "piano", data: { highlightedKeys: ["C4"] } },
    },
  },
  {
    skillId: "intervals.lesson-1-unison-octave",
    stepId: "p8",
    patch: {
      title: "Perfect Octave (P8)",
      body: "A Perfect Octave reaches the same note name in the next octave.\n\nExample: C to the next C above.\n\nC–D–E–F–G–A–B–C spans eight note names, so the interval size is 8. The two Cs are different piano keys, 12 semitones apart on an equal-tempered piano.",
      expectation: "understand",
      visual: { kind: "piano", data: { highlightedKeys: ["C4", "C5"] } },
    },
  },
  {
    skillId: "intervals.lesson-2-perfect-fifth",
    stepId: "p5-definition",
    patch: {
      title: "Perfect 5th (P5)",
      body: "Count the note letters first. A 5th spans five note names, counted by letter, including the starting note. The quality name here is Perfect. For a Perfect 5th, the exact distance is 7 semitones.",
      workedExample: "C–D–E–F–G makes the interval a 5th. C→G spans 7 semitones, which is the exact distance for the Perfect 5th.",
      visual: { kind: "piano", data: { highlighted: ["C", "G"] } },
    },
  },
  {
    skillId: "intervals.lesson-3-perfect-fourth",
    stepId: "p4-definition",
    patch: {
      title: "Perfect 4th (P4)",
      body: "Count the note letters first. A 4th spans four note letters, including the starting note. For a Perfect 4th, the exact distance is 5 semitones.",
      workedExample: "C–D–E–F makes C→F a 4th. C→F spans 5 semitones, so this 4th has the Perfect quality.",
      visual: { kind: "piano", data: { highlighted: ["C", "F"] } },
    },
  },
]);

const phase2 = priorPhase2Lessons().map(cloneLesson);
const phase3 = priorPhase3Lessons().map(cloneLesson);
const phase4 = priorPhase4Lessons().map(cloneLesson);
const phase5 = priorPhase5Lessons().map(cloneLesson);
const phase6 = priorPhase6Lessons().map(cloneLesson);

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
