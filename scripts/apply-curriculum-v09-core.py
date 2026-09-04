from pathlib import Path
import re


def replace_required(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing v0.9 anchor: {label}")
    return text.replace(old, new, 1)


skills_path = Path("src/curriculum/skills.ts")
skills = skills_path.read_text()

# Interval-number rounds get the most concentrated first exposure. Individual
# interval-quality micro-skills stay shorter because they continue spiraling later.
skills = skills.replace(
    '  if (tags.includes("interval")) return { priority: "foundation", recurrenceWeight: 5, acquisitionRoundSize: 10, thread: "interval" };',
    '  if (tags.includes("number")) return { priority: "foundation", recurrenceWeight: 5, acquisitionRoundSize: 8, thread: "interval" };\n  if (tags.includes("interval")) return { priority: "foundation", recurrenceWeight: 5, acquisitionRoundSize: 6, thread: "interval" };',
)
skills = skills.replace(
    's("interval.number-3-8", 1, "Interval numbers: 3rds and octaves", [], ["construct", "identify"], ["interval", "number"]),',
    's("interval.number-3-8", 1, "Interval numbers: 3rds and octaves", [], ["construct", "identify"], ["interval", "number"], false, { acquisitionRoundSize: 10 }),',
)
skills = skills.replace(
    's("interval.number-6", 1, "Interval numbers: 6ths", ["interval.number-mix-2-3-4-5-7-8"], ["construct", "identify"], ["interval", "number"]),',
    's("interval.number-6", 1, "Interval numbers: 6ths", ["interval.number-mix-2-3-4-5-7-8"], ["construct", "identify"], ["interval", "number"], false, { acquisitionRoundSize: 6 }),',
)
skills = skills.replace(
    's("interval.generic-number", 1, "Mixed interval numbers", ["interval.number-6"], ["construct", "identify", "diagnose"], ["interval", "number"]),',
    's("interval.generic-number", 1, "Mixed interval numbers", ["interval.number-6"], ["construct", "identify", "diagnose"], ["interval", "number"], false, { acquisitionRoundSize: 10 }),',
)

# Spiral the less immediately necessary major/minor quality pairs into Phase 3.
for skill_id in ["interval.M2", "interval.m2", "interval.M6", "interval.m6", "interval.M7", "interval.m7", "interval.mixed-core"]:
    skills = re.sub(rf's\("{re.escape(skill_id)}", 1,', f's("{skill_id}", 3,', skills, count=1)

# Practical spelling is needed to build triads, but it should not require every
# simple interval quality before the learner is allowed to reach chords.
skills = re.sub(
    r's\("interval\.spelling", 1, "Correctly spell practical simple intervals", \["interval\.mixed-core"\],',
    's("interval.spelling", 2, "Correctly spell practical chord-building intervals", ["interval.M3", "interval.m3", "interval.P4", "interval.P5", "interval.P8"],',
    skills,
    count=1,
)
skills_path.write_text(skills)

# Checkpoints follow the redesigned competency map rather than old phase pools.
checkpoints_path = Path("src/progression/checkpoints.ts")
checkpoints = checkpoints_path.read_text()

phase1 = '''  1: [
    group("interval-number-core", "Interval-number construction", [
      "interval.number-3-8", "interval.number-4-5", "interval.number-mix-3-4-5-8",
      "interval.number-2-7", "interval.number-mix-2-3-4-5-7-8", "interval.number-6", "interval.generic-number",
    ]),
    group("interval-core-quality", "Core 3rds, 4ths, 5ths & octave", ["interval.quality-system", "interval.M3", "interval.m3", "interval.P4", "interval.P5", "interval.P8"]),
  ],
  2:'''
checkpoints, n = re.subn(r'  1: \[.*?\n  \],\n  2:', phase1, checkpoints, count=1, flags=re.S)
if n != 1:
    raise RuntimeError("Could not replace Phase 1 checkpoint map")

phase2 = '''  2: [
    group("triad-members-spelling", "Interval spelling, chord members & chord tones", ["interval.spelling", "triad.members", "melody.chord-tones", "triad.root-vs-bass"]),
    group("triad-major-minor", "Major & minor triads", ["triad.major", "triad.minor"]),
    group("triad-dim-aug", "Diminished & augmented triads", ["interval.A4-d5", "triad.diminished", "triad.augmented"]),
    group("triad-mixed-symbols", "Mixed triads & symbols", ["triad.mixed", "triad.symbols"]),
  ],
  3:'''
checkpoints, n = re.subn(r'  2: \[.*?\n  \],\n  3:', phase2, checkpoints, count=1, flags=re.S)
if n != 1:
    raise RuntimeError("Could not replace Phase 2 checkpoint map")

phase3 = '''  3: [
    group("interval-quality-expansion", "2nd, 6th & 7th interval fluency", ["interval.M2", "interval.m2", "interval.M6", "interval.m6", "interval.M7", "interval.m7", "interval.mixed-core"]),
    group("major-formula-degrees", "Major-scale formula & degrees", ["major.formula", "scale.degree-numbers", "major.degree-intervals"]),
    group("major-spelling", "Major-scale construction & spelling", ["major.spelling", "major.construct"]),
    group("major-degree-retrieval", "Key/degree retrieval", ["major.degree-to-note", "major.note-to-degree"]),
    group("major-membership", "Diatonic membership", ["major.membership"]),
  ],
  4:'''
checkpoints, n = re.subn(r'  3: \[.*?\n  \],\n  4:', phase3, checkpoints, count=1, flags=re.S)
if n != 1:
    raise RuntimeError("Could not replace Phase 3 checkpoint map")

checkpoints_path.write_text(checkpoints)
