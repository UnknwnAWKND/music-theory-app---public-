from pathlib import Path

path = Path("web/styles.css")
css = path.read_text()
old = '.ghost-button { min-height: 42px;'
new = '.ghost-button { min-height: 48px;'
if old in css:
    css = css.replace(old, new, 1)
elif new not in css:
    raise RuntimeError("Could not find ghost-button tap-target rule")
path.write_text(css)
print("UI polish applied")
