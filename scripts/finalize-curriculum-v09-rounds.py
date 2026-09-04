from pathlib import Path
import re

# Keep the curriculum metadata honest too: the runtime already enforces the floor,
# but no skill definition should still advertise tiny 5/6/8/10-question rounds.
skills_path = Path("src/curriculum/skills.ts")
skills = skills_path.read_text()
skills = re.sub(r"acquisitionRoundSize:\s*\d+", "acquisitionRoundSize: 30", skills)

# Moving 2nds/6ths/7ths to Phase 3 must not leave a Phase 1 octave depending on a
# future Phase 3 minor-6th skill. Octaves belong after the early perfect-interval work.
skills = skills.replace(
    's("interval.P8", 1, "Construct perfect octaves", ["interval.m6"],',
    's("interval.P8", 1, "Construct perfect octaves", ["interval.P5"],',
)
skills_path.write_text(skills)

# A 30-question follow-up is not a "short" round. Keep the learner-facing copy accurate.
app_path = Path("web/app.js")
app = app_path.read_text()
app = app.replace('const title = followUp ? "One more short round" : "Round complete";',
                  'const title = followUp ? "One more round" : "Round complete";')
app = app.replace('"The evidence shows this relationship needs a little more work. The next round is short and targeted."',
                  '"The evidence shows this relationship needs more work. The next round stays focused and varied."')

# apply-curriculum-v09.py can run against either the pre-v0.9 browser source or an
# already-generated v0.9 browser source. Normalize this helper section to one canonical
# copy so repeated builds never create duplicate function declarations.
guided_helpers = '''function checkpointAccessValid(phase, row, readyIds) {
  if (!row?.checkpointPassedAt) return false;
  if (row?.checkpointSummary?.curriculumVersion === "v0.9") return true;
  return phaseCoreReady(phase, readyIds);
}

function placementAccessValid(phase, row, readyIds) {
  if (!row?.validatedEntryAt) return false;
  if (row?.placementSummary?.curriculumVersion === "v0.9") return true;
  const phaseSkills = SKILLS.filter((skill) => skill.phase === phase && !skill.optional);
  return phaseSkills.every((skill) => skill.prerequisites.every((id) => {
    const dependency = SKILL_BY_ID.get(id);
    return !dependency || dependency.phase >= phase || readyIds.has(id);
  }));
}

function guidedPhaseAllowed(phase, phaseProgress, readyIds = new Set()) {
  if (userSettings?.requirePreviousLessons === false) return true;
  if (phase === 1) return true;
  if (placementAccessValid(phase, phaseProgress.get(phase), readyIds)) return true;
  return checkpointAccessValid(phase - 1, phaseProgress.get(phase - 1), readyIds);
}

'''
helper_start = app.find("function checkpointAccessValid(")
helper_end = app.find("function curriculumAccessAllowed(", helper_start)
if helper_start < 0 or helper_end < 0:
    raise RuntimeError("Could not locate v0.9 checkpoint access helper section")
app = app[:helper_start] + guided_helpers + app[helper_end:]

# The normalized source must contain exactly one copy of each helper after any number
# of transform passes.
for helper_name in ("checkpointAccessValid", "placementAccessValid", "guidedPhaseAllowed"):
    if app.count(f"function {helper_name}(") != 1:
        raise RuntimeError(f"v0.9 helper {helper_name} is not idempotent")

app_path.write_text(app)

# redesign-ui.py still regenerates an old UI assertion that counts session skills instead
# of questions in the current round. Correct that generated contract after the legacy
# generator runs so CI tests the actual v0.9 behavior instead of the pre-round UI.
ui_test_path = Path("tests/ui-redesign.test.mjs")
ui_test = ui_test_path.read_text()
old_counter_assertion = r'assert.match(app, /Question \$\{state\.itemIndex \+ 1\} of/);'
new_counter_assertion = r'assert.match(app, /Question \$\{questionNumber\} of \$\{round\.size\}/);'
ui_test = ui_test.replace(old_counter_assertion, new_counter_assertion)
if old_counter_assertion in ui_test or new_counter_assertion not in ui_test:
    raise RuntimeError("Could not finalize the v0.9 round-based UI counter assertion")
ui_test_path.write_text(ui_test)

# Guard the actual runtime policy, not only the wording.
rounds = Path("src/practice/rounds.ts").read_text()
if "MINIMUM_PRACTICE_ROUND_SIZE = 30" not in rounds:
    raise RuntimeError("v0.9 practice round minimum must remain 30 questions")

print("Curriculum v0.9 30-question round policy, idempotent helpers, UI counter, and prerequisite ordering finalized")
