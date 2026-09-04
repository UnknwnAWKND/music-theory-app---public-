from pathlib import Path

path = Path("web/app.js")
text = path.read_text()
old = '''  const kind = manualStudyKind(evidence);\n  state.manualStudy = {'''
new = '''  const kind = manualStudyKind(evidence);\n  const dueReviews = await repo.dueReviews(USER_ID, new Date().toISOString());\n  const isActuallyDue = dueReviews.some((review) => review.skillId === skillId);\n  state.manualStudy = {'''
if new not in text:
    if old not in text:
        raise RuntimeError("Could not locate manual study kind")
    text = text.replace(old, new, 1)
old = '''  state.queue = [{ skillId, kind, firstProbe: kind === "review" || kind === "repair" }];'''
new = '''  state.queue = [{ skillId, kind, firstProbe: isActuallyDue && (kind === "review" || kind === "repair") }];'''
if new not in text:
    if old not in text:
        raise RuntimeError("Could not locate manual firstProbe assignment")
    text = text.replace(old, new, 1)
path.write_text(text)
print("Manual review cold-probe guard applied")
