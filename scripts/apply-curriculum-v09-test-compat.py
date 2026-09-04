from pathlib import Path

path = Path("tests/curriculum.test.mjs")
text = path.read_text()
text = text.replace(
    '  assert.deepEqual(unlocked.map((x) => x.id), ["interval.generic-number"]);\n  assert.equal(SKILLS[0].phase, 1);\n  assert.equal(SKILLS[0].id, "interval.generic-number");',
    '  assert.deepEqual(unlocked.map((x) => x.id), ["interval.number-3-8"]);\n  assert.equal(SKILLS[0].phase, 1);\n  assert.equal(SKILLS[0].id, "interval.number-3-8");',
)
path.write_text(text)
