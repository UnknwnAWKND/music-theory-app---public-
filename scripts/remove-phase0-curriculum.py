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
# Clean the simple comma artifacts created by removing an array element.
text = text.replace('[, ', '[').replace(', ,', ',').replace('[,]', '[]')

if 'pitch.accidentals' in text or 'pitch.half-whole' in text:
    raise RuntimeError("Retired Phase 0 skill IDs remain in active curriculum")
if re.search(r'\bs\([^\n]*,\s*0\s*,', text):
    raise RuntimeError("A genuine phase-0 curriculum node remains")

path.write_text(text)
print("Phase 0 curriculum nodes and prerequisite edges removed")
