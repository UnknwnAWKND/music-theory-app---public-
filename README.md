# Music Theory Tutor

## Block 1 rebuild state

The previous curriculum has been intentionally removed. The application currently contains **zero active lessons, zero active question pools, zero checkpoint competency maps, and zero placement competency maps** while the curriculum is rebuilt from scratch.

Reusable infrastructure remains: Supabase Auth, profiles/settings, READY/RETAINED evidence, FSRS-6 scheduling, adaptive practice machinery, honest practice rounds, checkpoint/placement machinery, reusable lesson/replay rules, theory utilities, and reusable theory visuals.

### Future curriculum shell

The architecture reserves exactly six phase descriptors, without lesson content yet:

1. Intervals
2. Major Scales
3. Minor Scales
4. Diatonic Chords / Roman Numerals
5. Relatives
6. Circle of Fifths

Phase 0 does not exist. There is no Phase 7.

### Block 1 behavior

- Every learner-visible practice round has a 30-question minimum. A round is only a UX container and never grants READY or RETAINED by itself.
- First-time lesson access begins at teaching and cannot skip directly to review.
- Completed lessons still reopen at the start of teaching; only completed replays may expose **Skip to Review**, and only after the teaching content at the bottom.
- The active lesson/question schema contains no assistance-button content. Corrective feedback, worked examples, reteaching, and later related retrieval remain supported.
- Reference-only curriculum items are supported structurally and can be non-assessed/non-blocking.

Run `npm test` for the Block 1 baseline and `npm run build:site` for the static site.
