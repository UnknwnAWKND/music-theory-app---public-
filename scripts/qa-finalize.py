from pathlib import Path


def replace_once(path, old, new, label):
    p = Path(path)
    text = p.read_text()
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"QA finalization anchor missing for {label} in {path}")
    p.write_text(text.replace(old, new, 1))

# A semantic example must reflect what the learner actually sees, not only whichever
# payload fields happen to be whitelisted. This preserves true duplicate detection
# while allowing root/key/context variation expressed in the prompt to count.
replace_once(
    "src/practice/adaptive.ts",
    '''  if (!names.length) return `${exercise.type}:${exercise.prompt.trim().toLowerCase()}`;\n  return `${exercise.type}:${JSON.stringify(Object.fromEntries(names.map((key) => [key, attributes[key]])))}`;''',
    '''  const prompt = exercise.prompt.trim().toLowerCase();\n  if (!names.length) return `${exercise.type}:${prompt}`;\n  return `${exercise.type}:${prompt}:${JSON.stringify(Object.fromEntries(names.map((key) => [key, attributes[key]])))}`;''',
    "core semantic signature",
)

p = Path("web/app.js")
t = p.read_text()

# Prompt 4's historical transform can run again in CI after the generated source has
# already been committed. If its exact routing template no longer matches because QA
# extended renderRoute, it can insert a second routing block. Keep only the first one.
marker = 'let replayingHistory = false;'
while t.count(marker) > 1:
    second = t.find(marker, t.find(marker) + len(marker))
    footer = t.find('function footerHtml() { return ""; }', second)
    if second < 0 or footer < 0:
        raise SystemExit("Could not safely de-duplicate history routing block")
    t = t[:second] + t[footer:]

old = '''function exampleSignatureForExercise(exercise) {\n  const attributes = evidenceAttributesForExercise(exercise);\n  const keys = Object.keys(attributes).sort();\n  if (!keys.length) return `${exercise.type}:${String(exercise.prompt).trim().toLowerCase()}`;\n  const stable = Object.fromEntries(keys.map((key) => [key, attributes[key]]));\n  return `${exercise.type}:${JSON.stringify(stable)}`;\n}'''
new = '''function exampleSignatureForExercise(exercise) {\n  const attributes = evidenceAttributesForExercise(exercise);\n  const keys = Object.keys(attributes).sort();\n  const prompt = String(exercise.prompt).trim().toLowerCase();\n  if (!keys.length) return `${exercise.type}:${prompt}`;\n  const stable = Object.fromEntries(keys.map((key) => [key, attributes[key]]));\n  return `${exercise.type}:${prompt}:${JSON.stringify(stable)}`;\n}'''
if new not in t:
    if old not in t:
        raise SystemExit("Browser semantic signature anchor missing")
    t = t.replace(old, new, 1)

p.write_text(t)
print("Final QA idempotency and semantic-signature fixes applied")
