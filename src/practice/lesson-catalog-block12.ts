import {
  phase1Lessons as priorPhase1Lessons,
  phase2Lessons as priorPhase2Lessons,
  phase3Lessons as priorPhase3Lessons,
  phase4Lessons as priorPhase4Lessons,
  phase5Lessons as priorPhase5Lessons,
  phase6Lessons as priorPhase6Lessons,
} from "./lesson-catalog-block11.js";
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

/* Final learner-eye pass after the broader audit in block11. */
const phase1 = patchSteps(priorPhase1Lessons(), [
  {
    skillId: "intervals.lesson-1-unison-octave",
    stepId: "interval-name-parts",
    patch: {
      title: "Intervals",
      body: "An interval is the distance in pitch between two notes.\n\nAn interval name has two parts. Size tells you how many note names are spanned, counted by letter. Quality tells you the exact version of that size, measured by its half-step (semitone) distance.",
    },
  },
]);

const phase2 = patchSteps(priorPhase2Lessons(), [
  {
    skillId: "major-scales.lesson-3-build-all-roots",
    stepId: "twelve-pitch-classes",
    patch: {
      title: "All 12 pitch classes",
      body: "A pitch class groups pitches that are the same modulo octave. On piano, notes an octave apart belong to the same pitch class, and enharmonic names such as C♯ and D♭ can represent the same pitch class. Twelve pitch classes occur before the keyboard pattern repeats.",
      workedExample: "The balanced roots are C, C♯, D, E♭, E, F, F♯, G, G♯, A, B♭, and B.",
      visual: { kind: "piano", data: { highlighted: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"], displayLabels: { "C#": "C♯", "D#": "E♭", "F#": "F♯", "G#": "G♯", "A#": "B♭" } } },
    },
  },
]);

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
