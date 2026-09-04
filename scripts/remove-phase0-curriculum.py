from pathlib import Path
import re

path = Path("src/curriculum/skills.ts")
text = path.read_text()

# Remove only the two genuine retired curriculum-node definitions. Do not touch numeric zeroes generally.
text = re.sub(r'^\s*// Entry / foundations\s*\n', '', text, flags=re.MULTILINE)
text = re.sub(r'^\s*s\("pitch\.accidentals",\s*0,.*?\),\s*\n', '', text, flags=re.MULTILINE)
text = re.sub(r'^\s*s\("pitch\.half-whole",\s*0,.*?\),\s*\n', '', text, flags=re.MULTILINE)

# Remove only those retired IDs from prerequisite arrays. A trailing comma in a TS array is valid.
text = text.replace('"pitch.accidentals"', '')
text = text.replace('"pitch.half-whole"', '')
text = text.replace('[, ', '[').replace(', ,', ',').replace('[,]', '[]')

# Phase 0 used to be the only prerequisite for the major-scale formula. Half/whole-step
# vocabulary now lives with interval quality in Phase 1, so preserve the intended learning order
# by attaching major.formula to that existing prerequisite instead of leaving Phase 3 unlocked at entry.
text = re.sub(
    r'(s\("major\.formula",\s*3,\s*"Major scale formula",\s*)\[\s*\](,)',
    r'\1["interval.quality-system"]\2',
    text,
    count=1,
)

if 'pitch.accidentals' in text or 'pitch.half-whole' in text:
    raise RuntimeError("Retired Phase 0 skill IDs remain in active curriculum")
if re.search(r'\bs\([^\n]*,\s*0\s*,', text):
    raise RuntimeError("A genuine phase-0 curriculum node remains")
if not re.search(r's\("major\.formula",\s*3,\s*"Major scale formula",\s*\["interval\.quality-system"\]', text):
    raise RuntimeError("major.formula lost its replacement prerequisite after Phase 0 removal")

path.write_text(text)
print("Phase 0 curriculum nodes and prerequisite edges removed")
