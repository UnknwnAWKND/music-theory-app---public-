export type ExerciseType =
  | "note-identify"
  | "concept-check"
  | "interval-build-note"
  | "interval-identify"
  | "interval-inversion"
  | "triad-build-notes"
  | "triad-identify"
  | "major-scale-build"
  | "major-degree-note"
  | "major-note-degree"
  | "scale-membership"
  | "diatonic-chord-build"
  | "major-chord-roman"
  | "progression-build"
  | "minor-scale-build"
  | "seventh-build-notes"
  | "inversion-build"
  | "key-signature"
  | "chord-color-build"
  | "mode-scale-build"
  | "guitar-fret-note"
  | "self-check-application";

export type AssessmentMode = "objective" | "self-check" | "instructional";

export interface Exercise<TPayload = Record<string, unknown>> {
  id: string;
  skillId: string;
  type: ExerciseType;
  prompt: string;
  payload: TPayload;
  assessmentMode?: AssessmentMode;
}
