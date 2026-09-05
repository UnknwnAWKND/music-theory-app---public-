# Lesson unlock regression — root cause and completion contract

## Root cause

The adaptive evidence engine and lesson progression are intentionally separate, but the final Block 8 curriculum UI accidentally used adaptive `READY` evidence as the prerequisite for unlocking the next lesson.

`TutorService.submitAttempt()` recomputes and persists skill evidence after every submitted answer. A skill can therefore become `READY` during an unfinished practice round, especially when earlier partial evidence already exists. The old `lessonUnlocked()` function read `evidence.ready && !evidence.fragile`, so a learner could answer the response that crossed the READY threshold, leave before the practice round completed, and find the successor lesson unlocked.

The persisted lesson completion source (`lesson_progress.completion_count`) was already separate and was only written by the round-completion path. The Back button only closed the study session as `learner-stopped`; it did not write lesson completion. The bug was therefore not Back itself and not a database trigger. It was the prerequisite/unlock calculation reading the wrong source of truth.

## Correct contract

- Attempts/evidence are saved immediately and survive partial sessions.
- `READY` remains an adaptive learning state and can exist before lesson completion.
- A lesson is complete only when persisted `lesson_progress.completion_count > 0`.
- The existing legitimate completion event remains: the practice round finishes and the adaptive evidence at that point is READY and not fragile.
- Guided successor lessons use persisted lesson completion, never `READY`, `has attempts`, or session completion.
- Turning guided gating off allows manual access but does not create completion records. Turning it back on therefore restores locks for unfinished lessons.
- A phase checkpoint is offered only when its assessed lessons have persisted completion and the existing phase READY criteria are also satisfied.
- Checkpoint/placement phase progress is still written only after a passed assessment; starting or leaving one does not grant phase progression.

No Supabase schema migration is required. The existing `lesson_progress` table is the correct source of truth; the app now reads it in bulk for Home/Learn/Profile progression calculations.
