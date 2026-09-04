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
app_path.write_text(app)

# Guard the actual runtime policy, not only the wording.
rounds = Path("src/practice/rounds.ts").read_text()
if "MINIMUM_PRACTICE_ROUND_SIZE = 30" not in rounds:
    raise RuntimeError("v0.9 practice round minimum must remain 30 questions")

print("Curriculum v0.9 30-question round policy and prerequisite ordering finalized")
