from pathlib import Path

p = Path("scripts/apply-phase-checkpoints.py")
t = p.read_text()
old = '''# Back routing understands phase:n\nold = \'\'\'  document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => {\\n    const target = button.dataset.back;\\n    if (target === "profile") return renderProfile().catch(showFatal);\\n    if (target === "learn") return renderCurriculum().catch(showFatal);\\n    return renderToday().catch(showFatal);\\n  }));\'\'\'\nnew = \'\'\'  document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => {\\n    const target = button.dataset.back;\\n    if (target === "profile") return renderProfile().catch(showFatal);\\n    if (target === "learn") return renderCurriculum().catch(showFatal);\\n    if (target?.startsWith("phase:")) return renderPhase(Number(target.split(":")[1])).catch(showFatal);\\n    return renderToday().catch(showFatal);\\n  }));\'\'\'\nt = replace_once(t, old, new, "phase back routing")\np.write_text(t)\n'''
new = '''# Back routing understands phase:n in the app-wide delegated navigation handler.\nold = \'\'\'    if (target === "profile") return renderProfile().catch(showFatal);\\n    if (target === "session") return leaveStudyToPrevious().catch(showFatal);\'\'\'\nnew = \'\'\'    if (target === "profile") return renderProfile().catch(showFatal);\\n    if (target?.startsWith("phase:")) return renderPhase(Number(target.split(":")[1])).catch(showFatal);\\n    if (target === "session") return leaveStudyToPrevious().catch(showFatal);\'\'\'\nt = replace_once(t, old, new, "phase back routing")\np.write_text(t)\n'''
if old in t:
    p.write_text(t.replace(old, new, 1))
print("Checkpoint transform navigation anchor prepared")
