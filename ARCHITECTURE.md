# Personal Music Theory Tutor — Technical Architecture v1

## Stack
- Frontend: React + TypeScript + Vite
- Persistence/Auth: Supabase
- Hosting: Netlify
- Core theory + learning logic: framework-independent TypeScript modules
- Scheduler: adapter around an FSRS implementation; FSRS schedules reviews only

## Architectural rules
1. Theory engine is the source of truth for generated musical answers.
2. Curriculum definitions live in versioned code/data, not an admin CMS.
3. Attempt history is append-only and is the source of truth for learner evidence.
4. Skill-state rows are derived snapshots and can be rebuilt from attempt history.
5. Scheduler, learning engine, and curriculum/prerequisite graph are separate modules.
6. A scheduler may choose *when* to review; it may not choose curriculum progression.

## Core modules
- `theory/`: notes, intervals, scales, chords, harmony, Roman-numeral helpers, later guitar mapping.
- `curriculum/`: SkillDefinition objects, prerequisite graph, lessons, exercise generators, misconceptions.
- `assessment/`: answer validators and diagnostic error codes.
- `learning/`: READY/RETAINED/FRAGILE transitions, prerequisite gating, interleaving, repair logic.
- `scheduler/`: FSRS adapter and memory-item state.
- `session/`: daily prioritization and stopping rules.
- `db/`: Supabase persistence adapters.
- `ui/`: learner-facing Today/practice/progress screens.

## Persistent data model
### `skill_state`
One row per user + micro-skill.
- user_id
- skill_id
- state: new | acquiring | ready | consolidating | retained | fragile
- ready_at
- retained_at
- last_direct_success_at
- delayed_success_sessions
- recent_direct_failures
- current_support_level
- updated_at

### `memory_item`
One schedulable review target per user + micro-skill primary memory target.
- user_id
- memory_item_id
- skill_id
- due_at
- scheduler_state
- stability
- difficulty
- retrievability_at_last_review
- reps
- lapses
- last_review_at

### `attempt_event`
Immutable event log.
- id
- user_id
- session_id
- skill_id
- exercise_type
- prompt_signature
- answer_payload
- outcome: correct | incorrect | hinted | revealed
- independent
- direct_evidence
- response_ms
- diagnostic_error_code
- created_at

### `study_session`
- id
- user_id
- started_at
- completed_at
- new_skill_id nullable
- completion_reason

## Evidence hierarchy
- Independent constructed response: strongest direct evidence.
- Identification among plausible alternatives: weaker.
- Binary recognition: weaker still.
- Hinted/revealed response: learning event, not positive mastery evidence.
- Transfer/application can strengthen evidence but cannot silently replace direct testing.

## Safety against inference errors
A compound exercise can emit weighted evidence for multiple skills, but only its declared target skill receives full direct evidence. Suspected prerequisite failures trigger a direct diagnostic probe before a prerequisite is marked fragile.

## Initial build order
1. Theory engine and invariants.
2. Curriculum schema and graph integrity tests.
3. Assessment/diagnostic engine.
4. Learning-state engine.
5. Scheduler adapter.
6. Session planner.
7. Supabase schema + RLS.
8. Minimal Today/practice UI.
9. End-to-end tests.
10. Netlify deployment.

## Implemented after v1 design
- Curriculum graph now contains concrete micro-skill nodes spanning all 12 phases plus entry diagnostics.
- Graph integrity checks enforce unique IDs, valid prerequisites, and acyclicity.
- Assessment validators distinguish wrong note/piano-key selection from enharmonic spelling errors; no ear-training semantics are used.
- Deterministic exercise generators exist for interval, triad, major-scale, and scale-degree tasks.
- Learning evidence reducer implements READY/RETAINED/FRAGILE evidence rules from append-only attempts.
- Acquisition repair policy escalates from corrective feedback to scaffolding and then stopping the unit for later relearning.
- Session planner prioritizes fragile repairs, due review batches, unfinished acquisition, then one unlockable new skill.

## Current engineering defaults (not scientific constants)
- FRAGILE: at least 2 failed cold direct review probes among the latest 3 review sessions.
- Normal due-review batch: 6 micro-skills; recovery/backlog cap: 10.
These are explicit policy values and can be changed without altering curriculum or theory logic.

## v0.3 curriculum-audit decisions

- No ear-training/audio-recognition exercises are part of this application. External ear training remains separate.
- Optional/enrichment curriculum nodes are not automatically introduced by the daily planner.
- Named pop progressions are examples/schemas; arbitrary transposition is a general skill and is not gated behind memorizing every named schema.
- Minor tonality models variable scale degrees 6 and 7 and multiple derived scale forms rather than one fixed minor-chord table.
- Chord-tone thinking begins before advanced harmony as a recurring application thread.
- Extension study explicitly introduces compound intervals and distinguishes add9 from 9.

## Scheduler boundary

The pedagogical learning-state engine and the memory scheduler are separate. READY/RETAINED/FRAGILE control progression and prerequisite stability. An FSRS-v6 adapter will control only the next review date for an already introduced skill.

The learner will not self-rate Again/Hard/Good/Easy. v1 maps an independent direct correct response to Good and an incorrect/hinted/revealed response to Again. Response latency is recorded for future diagnostics but does not affect scheduling or mastery in v1.

## Persistence

`supabase/schema.sql` defines:
- append-only `learning_attempts`
- cached `skill_state`
- independent `scheduler_cards`
- append-only `scheduler_reviews`
- `study_sessions`
- per-user learning/scheduler settings

RLS restricts rows to the authenticated user. The curriculum and theory rules remain versioned application code rather than database-authored educational truth.

## v0.4 persistence/service layer

The core now exposes a `TutorRepository` port. `TutorService` depends on that port and the scheduler boundary rather than Supabase directly. This keeps learning logic replayable/testable and allows the append-only attempt log to remain the source of truth.

Two repository implementations currently exist:
- `InMemoryTutorRepository` for deterministic tests/local development.
- `SupabaseRestTutorRepository`, a dependency-free PostgREST adapter using native `fetch`; the caller supplies a valid Supabase access token.

`TutorService`:
1. loads cached skill evidence + due cards,
2. creates the daily session plan,
3. appends attempts,
4. re-derives the target skill from its immutable attempt history,
5. updates the derived cache,
6. seeds scheduling exactly when a skill transitions to READY,
7. advances scheduling only from a cold independent direct review probe,
8. leaves repair attempts out of the scheduler so relearning after feedback cannot masquerade as delayed retention.

The schema now persists the session plan snapshot/completion reason and marks scheduler transitions as `initial-seed` vs `review`.


## v0.5 full-curriculum exercise layer

Every one of the 130 curriculum nodes now resolves through `exerciseForSkill(skillId, index)` to a deterministic exercise plan. The theory engine generates the expected musical answer for objective tasks rather than storing hand-authored answer tables wherever a rule can be derived.

The exercise layer deliberately distinguishes:
- `objective`: answer can be graded from theory/notation rules.
- `self-check`: physical piano/guitar or open creative transfer where the browser cannot honestly verify the learner's real instrument without MIDI or other instrumentation.

At this checkpoint, 116 curriculum nodes have an objective exercise path and 14 physical/creative transfer nodes use self-check. `gradeExercise` provides a common grading boundary for generated objective tasks.

Generated prompts are automatically scanned to prevent ear-training/audio-recognition content from entering the curriculum.

## v0.6 learner-facing web flow

The first actual UI is intentionally dependency-light static HTML/CSS/ES modules. `npm run build:site` compiles the core and copies it beside the web shell into `site/`, which is directly publishable by Netlify.

Acquisition flow:
1. Show the concise lesson separately from the question.
2. Hide the lesson before an independent retrieval attempt so visible rules cannot masquerade as independent evidence.
3. Grade objective answers or record explicitly labeled self-report for physical/creative tasks.
4. Give concise corrective feedback.
5. After repeated independent failures, show a scaffolded lesson/retry once, then stop the unit for later rather than looping supported attempts.

Review flow:
1. Never show a refresher before the cold delayed probe.
2. The first independent direct probe is the only same-session event allowed to advance FSRS and delayed-retention evidence.
3. If the cold probe fails, schedule contracts and a corrective repair can be appended later in the same session. That repair is not cold evidence and cannot erase the lapse.

Known-material fast path:
A skill completed with at least three distinct independent direct successes and no direct failures in the current session can trigger an immediate re-plan. If there is no due review, repair, or unfinished acquisition, the next unlocked skill may be appended. v0.6 caps this at four extra fast-pass skills per session as an engineering safeguard, so an experienced musician does not spend one day per trivial prerequisite.

Physical task evidence:
Without MIDI/audio instrumentation, piano/guitar application tasks are not objectively observable. The app records those attempts with `evidence_source = self-report`. Repeated varied self-report may establish operational readiness for physical-transfer prerequisites, while `evidence_basis` preserves that the evidence was not browser-verified.
