# Build status — v0.7

Implemented foundation:
- Theory source-of-truth engine with spelling-aware interval/chord/scale generation
- 12-phase prerequisite graph with 130 curriculum nodes
- Full deterministic exercise coverage across the curriculum
- READY / RETAINED / FRAGILE learning-state engine
- FSRS-6 long-term review scheduler boundary
- Zero ear-training/audio-recognition curriculum, enforced by automated scans
- Supabase Auth-capable web UI with Today -> lesson/review -> corrective feedback -> done flow
- Production Supabase persistence repository and RLS-protected schema
- Dedicated `music-theory-tutor` Supabase project created and schema applied
- Security advisor currently reports no security lints
- Production browser configuration now points at the dedicated Supabase project using a publishable client key
- Old unrelated Supabase project returned to paused state

Verification at this checkpoint:
- 130/130 curriculum nodes have exercise plans.
- 81/81 automated tests pass.
- Supabase migration applied successfully to the dedicated project.
- RLS is enabled on all learner-owned tables.
- Append-only attempts/review logs remain client-immutable.

Remaining deployment work:
1. Create a dedicated GitHub repository (preferred) or use Netlify as fallback.
2. Upload the project and enable static hosting.
3. Create the first personal account and verify authenticated writes from phone + desktop.
4. After initial account creation, optionally disable public sign-ups for the personal app.
5. Run end-to-end usage checks and only fix learning/UX bugs.
