# Architecture — Curriculum Rebuild Block 1

## Boundary

Block 1 removes all old curriculum content while retaining the learning platform underneath it. Content registries are intentionally empty until later rebuild blocks add new material.

## Curriculum registry

`src/curriculum/phases.ts` defines exactly six future phase descriptors. `src/curriculum/skills.ts` is the canonical active skill registry and is empty in this block. `graph.ts` is content-agnostic and validates prerequisites, cycles, phase membership, and non-blocking reference content.

Each future skill can independently encode foundationality, automatic-recall demand, conceptual-understanding demand, review priority, long-term recurrence, and prerequisite importance. These are curriculum priorities, not fixed lifetime question quotas.

## Learning state

The existing evidence model remains authoritative for READY and RETAINED. READY is progression evidence; RETAINED is delayed durability evidence. Practice-round completion is not a state transition. FSRS-6 remains separate from curriculum content and schedules delayed reviews.

## Practice rounds

`src/practice/rounds.ts` owns learner-visible round sizing. The current minimum is 30 questions. The engine may end meaningful work, add a later/follow-up round, or route to repair after a round based on evidence.

## Lesson replay

`src/practice/lesson-replay.ts` centralizes replay rules. Every open begins at teaching step 0. First-time access cannot skip. Only a lesson with at least one recorded completion may expose Skip to Review, and the reusable browser renderer places that control after teaching content at the bottom. Abandoning an incomplete lesson does not increment completion.

## Assessment and progression

Checkpoint/placement evaluation code remains, but all old competency maps are gone. Checkpoint definitions are empty until rebuilt content supplies them. Placement prerequisites are graph-derived rather than hand-maintained.

## Exercises

The old curriculum question catalog has been removed. `src/exercises` now contains generic answer specifications, deterministic factory utilities, an empty registry, and generic corrective grading. Future phases provide their own musical content without changing the grading engine.

## Reference content

A skill can use `contentKind: "reference"` with `assessed: false` and `blocksPhaseCompletion: false`. Graph validation prevents a reference item from accidentally becoming a mastery gate.

## Persistence and reset

Supabase Auth is not reset. The Block 1 migration intentionally deletes existing application-level rows and introduces `lesson_progress` for future replay completion state. `phase_progress` is constrained to phases 1–6. The normal per-user progress reset RPC also clears lesson progress while preserving account/profile/settings behavior for ordinary future resets.

## Build

The historical source-mutating curriculum/UI build scripts are removed. CI now compiles and tests immutable source, builds the static site, and syncs the tested output to `docs` only on `main`.
