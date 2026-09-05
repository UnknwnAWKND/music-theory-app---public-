import { CHORD_TYPE_REFERENCE } from "./harmony.js";

/**
 * Learner-facing lookup rows. The concrete examples are all rooted on C so the
 * root column is explicit rather than making the learner infer it from the
 * first note of the example.
 */
export const PHASE4_CHORD_REFERENCE = Object.freeze(
  CHORD_TYPE_REFERENCE.map((row) => Object.freeze({ ...row, root: "C" })),
);
