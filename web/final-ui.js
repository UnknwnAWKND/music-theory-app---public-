export function uiIcon(name, size = 20) {
  const paths = {
    home: '<path d="M3 10.5 10 4l7 6.5v6.2a1.3 1.3 0 0 1-1.3 1.3H4.3A1.3 1.3 0 0 1 3 16.7Z"/><path d="M7.5 18v-5h5v5"/>',
    learn: '<path d="M4 4.5h7a2 2 0 0 1 2 2V18H6a2 2 0 0 1-2-2Z"/><path d="M16 4.5h-3a2 2 0 0 0-2 2V18h5a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2Z"/>',
    user: '<circle cx="10" cy="7" r="3"/><path d="M4.5 17.5c.7-3 2.5-4.5 5.5-4.5s4.8 1.5 5.5 4.5"/>',
    settings: '<circle cx="10" cy="10" r="2.7"/><path d="M10 2.7v2M10 15.3v2M2.7 10h2M15.3 10h2M4.8 4.8l1.4 1.4M13.8 13.8l1.4 1.4M15.2 4.8l-1.4 1.4M6.2 13.8l-1.4 1.4"/>',
    back: '<path d="m12.8 4.5-5.5 5.5 5.5 5.5"/>',
    chevron: '<path d="m7.7 5 5 5-5 5"/>',
    edit: '<path d="M4 16l.7-3.3L13.6 3.8a1.6 1.6 0 0 1 2.3 0l.3.3a1.6 1.6 0 0 1 0 2.3l-8.9 8.9Z"/><path d="m12.5 5 2.5 2.5"/>',
    mail: '<rect x="3" y="5" width="14" height="10" rx="2"/><path d="m4 6 6 5 6-5"/>',
    logout: '<path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H9"/><path d="M11 6.5 14.5 10 11 13.5M14.5 10H8"/>',
    sun: '<circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4"/>',
    moon: '<path d="M16 13.8A6.5 6.5 0 0 1 6.2 4 6.5 6.5 0 1 0 16 13.8Z"/>',
    lock: '<rect x="4.5" y="8" width="11" height="8.5" rx="2"/><path d="M7 8V6a3 3 0 0 1 6 0v2"/>',
    check: '<path d="m4.5 10 3.2 3.2 7.8-7.8"/>',
    refresh: '<path d="M15.5 7A6 6 0 1 0 16 12"/><path d="M15.5 3.5V7H12"/>',
    target: '<circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="2.5"/>',
    trash: '<path d="M4.5 6.5h11M8 3.5h4M6.5 6.5l.7 10h5.6l.7-10"/>',
  };
  return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true">${paths[name] ?? paths.chevron}</svg>`;
}

export function normalizeTheme(value) {
  return value === "light" ? "light" : "dark";
}

export function themeCacheKey(userId) {
  return `music-theory-tutor:theme:${encodeURIComponent(String(userId || "local-preview"))}`;
}

export function applyTheme(theme) {
  const next = normalizeTheme(theme);
  document.documentElement.dataset.theme = next;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", next === "light" ? "#f3efe7" : "#111318");
  return next;
}

export function cachedTheme(userId) {
  try { return normalizeTheme(localStorage.getItem(themeCacheKey(userId))); }
  catch { return "dark"; }
}

export function cacheTheme(userId, theme) {
  try { localStorage.setItem(themeCacheKey(userId), normalizeTheme(theme)); }
  catch { /* Theme persistence still comes from the user settings repository. */ }
}

export function activeAssessedSkills(skills) {
  return skills.filter((skill) => skill.assessed !== false && skill.blocksPhaseCompletion !== false && skill.contentKind !== "reference");
}

export function lessonProgressMap(rows = []) {
  return new Map(rows.map((row) => [row.lessonId, row]));
}

export function lessonCompleted(progress) {
  return Boolean(progress && Number(progress.completionCount ?? 0) > 0);
}

export function lessonDisplayState(evidence, progress) {
  if (lessonCompleted(progress)) return "completed";
  if (evidence && evidence.state !== "new") return "in-progress";
  return "not-started";
}

export function phaseEntryAllowedForGuidedFlow(phase, phaseProgressRows, requirePreviousLessons = true) {
  if (!requirePreviousLessons || phase === 1) return true;
  if (phaseProgressRows.some((row) => row.phase === phase - 1 && Boolean(row.checkpointPassedAt))) return true;
  return Boolean(phaseProgressRows.find((row) => row.phase === phase)?.validatedEntryAt);
}

export function guidedLessonUnlocked({ skill, indexInPhase, siblings, lessonProgressById, phaseEntryAllowed, requirePreviousLessons = true }) {
  if (!requirePreviousLessons) return true;
  if (!phaseEntryAllowed) return false;
  if (skill.contentKind === "reference") return true;
  if (indexInPhase === 0) return true;
  const previous = [...siblings.slice(0, indexInPhase)].reverse().find((item) => item.blocksPhaseCompletion !== false && item.assessed !== false);
  return previous ? lessonCompleted(lessonProgressById.get(previous.id)) : true;
}

export function phaseAssessedLessonsComplete(skills, phase, lessonProgressRows = []) {
  const lessonById = lessonProgressMap(lessonProgressRows);
  const required = activeAssessedSkills(skills).filter((skill) => skill.phase === phase);
  return required.length > 0 && required.every((skill) => lessonCompleted(lessonById.get(skill.id)));
}

export function learningSummary(skills, stateRows, phaseProgressRows, lessonProgressRows = []) {
  const assessed = activeAssessedSkills(skills);
  const byId = new Map(stateRows.map((row) => [row.skillId, row.evidence]));
  const lessonById = lessonProgressMap(lessonProgressRows);
  const completed = assessed.filter((skill) => lessonCompleted(lessonById.get(skill.id))).length;
  const learning = assessed.filter((skill) => {
    const evidence = byId.get(skill.id);
    return Boolean(evidence && evidence.state !== "new" && !lessonCompleted(lessonById.get(skill.id)));
  }).length;
  const overallPercent = assessed.length ? Math.round((completed / assessed.length) * 100) : 0;
  const passed = new Set(phaseProgressRows.filter((row) => row.checkpointPassedAt).map((row) => row.phase));
  let currentPhase = 1;
  for (let phase = 1; phase <= 6; phase += 1) {
    currentPhase = phase;
    if (!passed.has(phase)) break;
  }
  return { assessed, byId, lessonById, completed, learning, overallPercent, currentPhase, allCheckpointsPassed: passed.size === 6 };
}

export function phaseSummary(skills, phase, stateRows, phaseProgressRows, lessonProgressRows = []) {
  const required = activeAssessedSkills(skills).filter((skill) => skill.phase === phase);
  const lessonById = lessonProgressMap(lessonProgressRows);
  const completed = required.filter((skill) => lessonCompleted(lessonById.get(skill.id))).length;
  const percent = required.length ? Math.round((completed / required.length) * 100) : 0;
  const checkpointPassed = Boolean(phaseProgressRows.find((row) => row.phase === phase)?.checkpointPassedAt);
  return { required, completed, percent, checkpointPassed };
}