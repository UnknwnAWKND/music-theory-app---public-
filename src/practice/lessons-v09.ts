import { SKILL_BY_ID } from "../curriculum/index.js";
import { lessonForSkill as legacyLessonForSkill } from "./lessons.js";
import type { LessonCard } from "./types.js";

const NUMBER_LESSONS: Readonly<Record<string, Omit<LessonCard, "skillId" | "title">>> = Object.freeze({
  "interval.number-3-8": {
    summary: "This is about interval NUMBER only. A 3rd is three letter names apart; an octave/8ve returns to the same letter name.",
    rule: "Count letter names including the starting note. Ignore sharps/flats for now.",
    workedExample: "D→F is a 3rd: D–E–F. D→D at the next octave is an 8ve.",
  },
  "interval.number-4-5": {
    summary: "Now add 4ths and 5ths. Keep thinking only about letter distance, not major/minor/perfect quality yet.",
    rule: "Four letters = 4th. Five letters = 5th.",
    workedExample: "C→F is a 4th. C→G is a 5th.",
  },
  "interval.number-mix-3-4-5-8": {
    summary: "Mix 3rds, 4ths, 5ths, and octaves so you must choose the relationship instead of following one repeated pattern.",
    rule: "Use the same inclusive letter-counting rule every time.",
  },
  "interval.number-2-7": {
    summary: "Add 2nds and 7ths as a contrasting pair.",
    rule: "A 2nd is the next letter name. A 7th is seven letter names including the root.",
    workedExample: "E→F is some kind of 2nd. E→D is some kind of 7th when moving upward to the next D.",
  },
  "interval.number-mix-2-3-4-5-7-8": {
    summary: "Mix the new 2nds and 7ths with the interval numbers you already know.",
    rule: "Do not calculate semitones yet. First make the letter-distance map automatic.",
  },
  "interval.number-6": {
    summary: "Add 6ths, then the full simple interval-number map is available.",
    rule: "Count six letter names including the root.",
    workedExample: "C→A is a 6th: C–D–E–F–G–A.",
  },
  "interval.number-mixed-all": {
    summary: "Now mix every simple interval number from 2nd through octave. This is where the full number map starts becoming automatic instead of something you slowly recount every time.",
    rule: "Work from the root to the target letter. Use the interval number first; quality and accidentals come afterward.",
    workedExample: "From F, a 6th must use some kind of D because F–G–A–B–C–D contains six letter names.",
  },
  "interval.generic-number": {
    summary: "Use note pairs to recognize interval numbers quickly. This keeps older interval-number evidence useful without replacing the redesigned mixed construction work.",
    rule: "Count letter names inclusively when you need to verify the number.",
  },
});

export function lessonForSkill(skillId: string): LessonCard {
  const skill = SKILL_BY_ID.get(skillId);
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  const numberLesson = NUMBER_LESSONS[skillId];
  if (numberLesson) return { skillId, title: skill.title, ...numberLesson };

  if (skillId === "interval.quality-system") {
    return {
      skillId,
      title: skill.title,
      summary: "The interval number tells you the letter distance. Quality now tells you the exact size.",
      rule: "1, 4, 5, and 8 use the perfect family. 2, 3, 6, and 7 use major/minor as their main framework.",
      workedExample: "C→E and C→E♭ are both 3rds by letter number. Their qualities are major 3rd and minor 3rd.",
    };
  }

  if (skillId === "melody.progression-targeting") {
    return {
      skillId,
      title: skill.title,
      summary: "The key gives you the available scale, but the current chord tells you which notes are chord tones right now.",
      rule: "As the progression changes, track the current chord's root, 3rd, and 5th instead of treating every scale note as equally connected to the harmony.",
      workedExample: "In C major, G is a chord tone over C major. When the chord changes to D minor, D–F–A become the chord tones.",
    };
  }

  return legacyLessonForSkill(skillId);
}
