from pathlib import Path


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise RuntimeError(f"Could not locate {label}")
    return text.replace(old, new, 1)

# persistence/types.ts
p = Path("src/persistence/types.ts")
t = p.read_text()
t = replace_once(t,
'''export interface UserLearningSettings {\n  userId: string;''',
'''export interface PhaseProgressRecord {\n  userId: string;\n  phase: number;\n  checkpointPassedAt?: string;\n  checkpointSummary?: Record<string, unknown>;\n  validatedEntryAt?: string;\n  validatedEntrySource?: "placement";\n  placementSummary?: Record<string, unknown>;\n  updatedAt: string;\n}\n\nexport interface UserLearningSettings {\n  userId: string;''',
"phase progress type")
p.write_text(t)

# repository contract
p = Path("src/persistence/repository.ts")
t = p.read_text()
t = replace_once(t,
'''  StudySessionRecord,\n  UserLearningSettings,''',
'''  StudySessionRecord,\n  PhaseProgressRecord,\n  UserLearningSettings,''',
"repository type import")
t = replace_once(t,
'''  acquiringSkillIds(userId: string): Promise<string[]>;\n  getProfile(userId: string): Promise<UserProfile | undefined>;''',
'''  acquiringSkillIds(userId: string): Promise<string[]>;\n  phaseProgress(userId: string): Promise<PhaseProgressRecord[]>;\n  upsertPhaseProgress(record: PhaseProgressRecord): Promise<void>;\n  getProfile(userId: string): Promise<UserProfile | undefined>;''',
"repository phase progress contract")
p.write_text(t)

# memory repo
p = Path("src/persistence/memory.ts")
t = p.read_text()
t = replace_once(t,
'''  StudySessionRecord,\n  UserLearningSettings,''',
'''  StudySessionRecord,\n  PhaseProgressRecord,\n  UserLearningSettings,''',
"memory type import")
t = replace_once(t,
'''  readonly profiles = new Map<string, UserProfile>();''',
'''  readonly profiles = new Map<string, UserProfile>();\n  readonly phaseProgressRows = new Map<string, PhaseProgressRecord>();''',
"memory phase map")
t = replace_once(t,
'''  async getProfile(userId: string): Promise<UserProfile | undefined> {''',
'''  async phaseProgress(userId: string): Promise<PhaseProgressRecord[]> {\n    return [...this.phaseProgressRows.values()].filter((x) => x.userId === userId).map((x) => ({ ...x }));\n  }\n\n  async upsertPhaseProgress(record: PhaseProgressRecord): Promise<void> {\n    this.phaseProgressRows.set(`${record.userId}::${record.phase}`, { ...record });\n  }\n\n  async getProfile(userId: string): Promise<UserProfile | undefined> {''',
"memory phase methods")
p.write_text(t)

# browser storage
p = Path("src/persistence/browser-storage.ts")
t = p.read_text()
t = replace_once(t,
'''  StudySessionRecord,\n  UserLearningSettings,''',
'''  StudySessionRecord,\n  PhaseProgressRecord,\n  UserLearningSettings,''',
"browser type import")
t = replace_once(t,
'''  profiles: UserProfile[];\n}''',
'''  profiles: UserProfile[];\n  phaseProgress: PhaseProgressRecord[];\n}''',
"browser snapshot field")
t = replace_once(t,
'''  sessions: [], attempts: [], skillStates: [], cards: [], schedulerReviews: [], settings: [], profiles: [],\n};''',
'''  sessions: [], attempts: [], skillStates: [], cards: [], schedulerReviews: [], settings: [], profiles: [], phaseProgress: [],\n};''',
"browser empty phase")
t = replace_once(t,
'''        cards: parsed.cards ?? [], schedulerReviews: parsed.schedulerReviews ?? [], settings: parsed.settings ?? [], profiles: parsed.profiles ?? [],''',
'''        cards: parsed.cards ?? [], schedulerReviews: parsed.schedulerReviews ?? [], settings: parsed.settings ?? [], profiles: parsed.profiles ?? [], phaseProgress: parsed.phaseProgress ?? [],''',
"browser read phase")
t = replace_once(t,
'''  async getProfile(userId: string): Promise<UserProfile|undefined> {''',
'''  async phaseProgress(userId: string): Promise<PhaseProgressRecord[]> {\n    return this.read().phaseProgress.filter((x)=>x.userId===userId).map(clone);\n  }\n  async upsertPhaseProgress(record: PhaseProgressRecord): Promise<void> {\n    const db=this.read(); const i=db.phaseProgress.findIndex((x)=>x.userId===record.userId&&x.phase===record.phase);\n    if(i>=0) db.phaseProgress[i]=clone(record); else db.phaseProgress.push(clone(record)); this.write(db);\n  }\n  async getProfile(userId: string): Promise<UserProfile|undefined> {''',
"browser phase methods")
p.write_text(t)

# supabase REST
p = Path("src/persistence/supabase-rest.ts")
t = p.read_text()
t = replace_once(t,
'''  SkillStateRecord,\n  StoredAttempt,''',
'''  SkillStateRecord,\n  PhaseProgressRecord,\n  StoredAttempt,''',
"supabase phase type import")
t = replace_once(t,
'''  async getProfile(userId: string): Promise<UserProfile | undefined> {''',
'''  async phaseProgress(userId: string): Promise<PhaseProgressRecord[]> {\n    const rows = await this.request<any[]>(`phase_progress?user_id=eq.${filterValue(userId)}&order=phase_number.asc`);\n    return rows.map((r) => ({\n      userId: r.user_id,\n      phase: r.phase_number,\n      checkpointPassedAt: r.checkpoint_passed_at ?? undefined,\n      checkpointSummary: r.checkpoint_summary ?? undefined,\n      validatedEntryAt: r.validated_entry_at ?? undefined,\n      validatedEntrySource: r.validated_entry_source ?? undefined,\n      placementSummary: r.placement_summary ?? undefined,\n      updatedAt: r.updated_at,\n    }));\n  }\n\n  async upsertPhaseProgress(record: PhaseProgressRecord): Promise<void> {\n    await this.request<void>("phase_progress?on_conflict=user_id,phase_number", {\n      method: "POST",\n      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },\n      body: JSON.stringify({\n        user_id: record.userId, phase_number: record.phase,\n        checkpoint_passed_at: record.checkpointPassedAt ?? null,\n        checkpoint_summary: record.checkpointSummary ?? {},\n        validated_entry_at: record.validatedEntryAt ?? null,\n        validated_entry_source: record.validatedEntrySource ?? null,\n        placement_summary: record.placementSummary ?? {},\n        updated_at: record.updatedAt,\n      }),\n    });\n  }\n\n  async getProfile(userId: string): Promise<UserProfile | undefined> {''',
"supabase phase methods")
p.write_text(t)

# planner gating
p = Path("src/session/planner.ts")
t = p.read_text()
t = replace_once(t,
'''  longBreakDays?: number;\n}''',
'''  longBreakDays?: number;\n  /** Guided-mode phase gates. Omit to allow normal graph-only planning. */\n  guidedPhaseAccess?: readonly number[];\n  /** Placement-validated phases may bypass older-phase prerequisite edges without fabricating READY. */\n  validatedEntryPhases?: readonly number[];\n}''',
"planner phase inputs")
t = replace_once(t,
'''function nextUnlockable(\n  evidenceBySkill: ReadonlyMap<string, DerivedSkillEvidence>,\n  skills: readonly SkillDefinition[] = SKILLS,\n  allowOptional = false,\n): SkillDefinition | undefined {''',
'''function nextUnlockable(\n  evidenceBySkill: ReadonlyMap<string, DerivedSkillEvidence>,\n  skills: readonly SkillDefinition[] = SKILLS,\n  allowOptional = false,\n  guidedPhaseAccess?: readonly number[],\n  validatedEntryPhases?: readonly number[],\n): SkillDefinition | undefined {''',
"planner next unlock signature")
t = replace_once(t,
'''    if (skill.optional && !allowOptional) return false;\n    const current = evidenceBySkill.get(skill.id);''',
'''    if (skill.optional && !allowOptional) return false;\n    if (guidedPhaseAccess && !guidedPhaseAccess.includes(skill.phase)) return false;\n    const current = evidenceBySkill.get(skill.id);''',
"planner guided filter")
t = replace_once(t,
'''    return skill.prerequisites.every((dep) => isReadyForPrerequisites(evidenceBySkill.get(dep)));''',
'''    const placementValidated = validatedEntryPhases?.includes(skill.phase) ?? false;\n    return skill.prerequisites.every((dep) => {\n      const dependency = SKILLS.find((candidate) => candidate.id === dep);\n      if (placementValidated && dependency && dependency.phase < skill.phase) return true;\n      return isReadyForPrerequisites(evidenceBySkill.get(dep));\n    });''',
"planner placement prerequisite bypass")
t = replace_once(t,
'''    newSkillId = nextUnlockable(input.evidenceBySkill, SKILLS, input.allowOptionalNew ?? false)?.id;''',
'''    newSkillId = nextUnlockable(input.evidenceBySkill, SKILLS, input.allowOptionalNew ?? false, input.guidedPhaseAccess, input.validatedEntryPhases)?.id;''',
"planner guided call")
p.write_text(t)

# tutor service reads setting + phase progress
p = Path("src/service/tutor.ts")
t = p.read_text()
t = replace_once(t,
'''    const dueReviews = await this.repository.dueReviews(userId, now.toISOString());\n    const acquiringSkillIds = await this.repository.acquiringSkillIds(userId);\n    return planSession({ evidenceBySkill, dueReviews, acquiringSkillIds, nowIso: now.toISOString() });''',
'''    const dueReviews = await this.repository.dueReviews(userId, now.toISOString());\n    const acquiringSkillIds = await this.repository.acquiringSkillIds(userId);\n    const settings = await this.repository.getSettings(userId);\n    const phaseProgress = await this.repository.phaseProgress(userId);\n    const guided = settings?.requirePreviousLessons !== false;\n    const progressByPhase = new Map(phaseProgress.map((x) => [x.phase, x]));\n    const guidedPhaseAccess = guided ? [1, ...Array.from({ length: 11 }, (_, i) => i + 2).filter((phase) =>\n      Boolean(progressByPhase.get(phase - 1)?.checkpointPassedAt || progressByPhase.get(phase)?.validatedEntryAt))] : undefined;\n    const validatedEntryPhases = guided ? phaseProgress.filter((x) => Boolean(x.validatedEntryAt)).map((x) => x.phase) : undefined;\n    return planSession({ evidenceBySkill, dueReviews, acquiringSkillIds, nowIso: now.toISOString(), guidedPhaseAccess, validatedEntryPhases });''',
"tutor phase planning")
p.write_text(t)

# schema
p = Path("supabase/schema.sql")
t = p.read_text()
marker = '''create table if not exists public.user_profiles ('''
insert = '''create table if not exists public.phase_progress (\n  user_id uuid not null references auth.users(id) on delete cascade,\n  phase_number integer not null check (phase_number between 1 and 12),\n  checkpoint_passed_at timestamptz,\n  checkpoint_summary jsonb not null default '{}'::jsonb,\n  validated_entry_at timestamptz,\n  validated_entry_source text check (validated_entry_source is null or validated_entry_source = 'placement'),\n  placement_summary jsonb not null default '{}'::jsonb,\n  updated_at timestamptz not null default now(),\n  primary key (user_id, phase_number)\n);\n\n'''
if insert not in t:
    if marker not in t: raise RuntimeError("Could not locate schema phase_progress anchor")
    t = t.replace(marker, insert + marker, 1)
t = replace_once(t,
'''alter table public.user_learning_settings enable row level security;\nalter table public.retired_skill_history enable row level security;''',
'''alter table public.user_learning_settings enable row level security;\nalter table public.phase_progress enable row level security;\nalter table public.retired_skill_history enable row level security;''',
"schema phase rls")
t = replace_once(t,
'''revoke all on table public.user_learning_settings from anon, authenticated;\nrevoke all on table public.retired_skill_history from anon, authenticated;''',
'''revoke all on table public.user_learning_settings from anon, authenticated;\nrevoke all on table public.phase_progress from anon, authenticated;\nrevoke all on table public.retired_skill_history from anon, authenticated;''',
"schema phase revoke")
t = replace_once(t,
'''grant select, insert, update on table public.user_learning_settings to authenticated;\ngrant select, insert, update on table public.user_profiles to authenticated;''',
'''grant select, insert, update on table public.user_learning_settings to authenticated;\ngrant select, insert, update on table public.phase_progress to authenticated;\ngrant select, insert, update on table public.user_profiles to authenticated;''',
"schema phase grant")
t = replace_once(t,
'''drop policy if exists "user_profiles_select_own" on public.user_profiles;''',
'''drop policy if exists "phase_progress_select_own" on public.phase_progress;\ndrop policy if exists "phase_progress_insert_own" on public.phase_progress;\ndrop policy if exists "phase_progress_update_own" on public.phase_progress;\ndrop policy if exists "user_profiles_select_own" on public.user_profiles;''',
"schema phase policy drops")
t = replace_once(t,
'''\n\ncreate policy "user_profiles_select_own" on public.user_profiles''',
'''\n\ncreate policy "phase_progress_select_own" on public.phase_progress for select to authenticated using ((select auth.uid()) = user_id);\ncreate policy "phase_progress_insert_own" on public.phase_progress for insert to authenticated with check ((select auth.uid()) = user_id);\ncreate policy "phase_progress_update_own" on public.phase_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);\n\ncreate policy "user_profiles_select_own" on public.user_profiles''',
"schema phase policies")
p.write_text(t)

# browser app
p = Path("web/app.js")
t = p.read_text()
t = replace_once(t,
'''  selectAdaptiveExercise,\n} from "./core/index.js";''',
'''  selectAdaptiveExercise,\n  checkpointDefinition,\n  placementDefinition,\n  nextCheckpointCompetency,\n  evaluateCheckpoint,\n  recommendStartingPhase,\n} from "./core/index.js";''',
"web progression imports")
t = replace_once(t,
'''  manualStudy: null,\n};''',
'''  manualStudy: null,\n  assessment: null,\n};''',
"web assessment state")
t = replace_once(t,
'''function curriculumAccessAllowed(skill, readyIds) {\n  if (userSettings?.requirePreviousLessons === false) return true;\n  return skill.prerequisites.every((id) => readyIds.has(id));\n}''',
'''function phaseProgressMap(rows) { return new Map((rows ?? []).map((row) => [Number(row.phase), row])); }\n\nfunction guidedPhaseAllowed(phase, phaseProgress) {\n  if (userSettings?.requirePreviousLessons === false) return true;\n  if (phase === 1) return true;\n  return Boolean(phaseProgress.get(phase - 1)?.checkpointPassedAt || phaseProgress.get(phase)?.validatedEntryAt);\n}\n\nfunction curriculumAccessAllowed(skill, readyIds, phaseProgress = new Map()) {\n  if (userSettings?.requirePreviousLessons === false) return true;\n  if (!guidedPhaseAllowed(skill.phase, phaseProgress)) return false;\n  const validatedEntry = Boolean(phaseProgress.get(skill.phase)?.validatedEntryAt);\n  return skill.prerequisites.every((id) => {\n    if (readyIds.has(id)) return true;\n    const dependency = SKILL_BY_ID.get(id);\n    return Boolean(validatedEntry && dependency && dependency.phase < skill.phase);\n  });\n}''',
"web guided gate")
t = replace_once(t,
'''function phaseSummary(phase, byId, readyIds) {''',
'''function phaseSummary(phase, byId, readyIds, phaseProgress = new Map()) {''',
"phase summary signature")
t = replace_once(t,
'''  const canOpen = complete || skills.some((skill) => curriculumAccessAllowed(skill, readyIds));''',
'''  const canOpen = guidedPhaseAllowed(phase, phaseProgress) && (complete || skills.some((skill) => curriculumAccessAllowed(skill, readyIds, phaseProgress)));''',
"phase summary gate")
t = replace_once(t,
'''  const records = await repo.allSkillStates(USER_ID);\n  const { byId, readyIds } = progressSummary(records);\n  const locking = userSettings?.requirePreviousLessons !== false;\n  const summaries = Array.from({ length: 12 }, (_, index) => phaseSummary(index + 1, byId, readyIds));''',
'''  const [records, phaseProgressRows] = await Promise.all([repo.allSkillStates(USER_ID), repo.phaseProgress(USER_ID)]);\n  const { byId, readyIds } = progressSummary(records);\n  const phaseProgress = phaseProgressMap(phaseProgressRows);\n  const locking = userSettings?.requirePreviousLessons !== false;\n  const summaries = Array.from({ length: 12 }, (_, index) => phaseSummary(index + 1, byId, readyIds, phaseProgress));''',
"curriculum phase progress load")
t = replace_once(t,
'''    return `<button class="phase-card ${stateClass}" type="button" ${open ? `data-open-phase="${summary.phase}"` : "disabled"}>''',
'''    return `<button class="phase-card ${stateClass}" type="button" ${open ? `data-open-phase="${summary.phase}"` : `data-locked-phase="${summary.phase}"`}>''',
"locked phase clickable")
t = replace_once(t,
'''  document.querySelectorAll("[data-open-phase]").forEach((button) => {\n    button.addEventListener("click", () => renderPhase(Number(button.dataset.openPhase)).catch(showFatal));\n  });''',
'''  document.querySelectorAll("[data-open-phase]").forEach((button) => {\n    button.addEventListener("click", () => renderPhase(Number(button.dataset.openPhase)).catch(showFatal));\n  });\n  document.querySelectorAll("[data-locked-phase]").forEach((button) => {\n    button.addEventListener("click", () => renderLockedPhase(Number(button.dataset.lockedPhase)).catch(showFatal));\n  });''',
"locked phase handler")
t = replace_once(t,
'''async function renderPhase(phase) {\n  const records = await repo.allSkillStates(USER_ID);\n  const { byId, readyIds } = progressSummary(records);\n  const summary = phaseSummary(phase, byId, readyIds);\n  const locking = userSettings?.requirePreviousLessons !== false;\n  if (locking && !summary.canOpen) return renderCurriculum();''',
'''async function renderPhase(phase) {\n  const [records, phaseProgressRows] = await Promise.all([repo.allSkillStates(USER_ID), repo.phaseProgress(USER_ID)]);\n  const { byId, readyIds } = progressSummary(records);\n  const phaseProgress = phaseProgressMap(phaseProgressRows);\n  const summary = phaseSummary(phase, byId, readyIds, phaseProgress);\n  const locking = userSettings?.requirePreviousLessons !== false;\n  if (locking && !summary.canOpen) return renderLockedPhase(phase);''',
"render phase gate")
t = replace_once(t,
'''    const accessAllowed = curriculumAccessAllowed(skill, readyIds);''',
'''    const accessAllowed = curriculumAccessAllowed(skill, readyIds, phaseProgress);''',
"lesson phase access")
t = replace_once(t,
'''    <section class="phase-overview">${progressBarHtml(summary.percent, "Phase progress")}</section>\n    <section class="lesson-list">${rows}</section>`, { activeNav: "learn", className: "phase-screen" });''',
'''    <section class="phase-overview">${progressBarHtml(summary.percent, "Phase progress")}</section>\n    <section class="lesson-list">${rows}</section>\n    ${phase < 12 && summary.complete ? checkpointCardHtml(phase, phaseProgress.get(phase)) : ""}`, { activeNav: "learn", className: "phase-screen" });''',
"checkpoint card in phase")
t = replace_once(t,
'''  document.querySelectorAll("[data-open-skill]").forEach((button) => {\n    button.addEventListener("click", () => openCurriculumSkill(button.dataset.openSkill).catch(showFatal));\n  });\n}''',
'''  document.querySelectorAll("[data-open-skill]").forEach((button) => {\n    button.addEventListener("click", () => openCurriculumSkill(button.dataset.openSkill).catch(showFatal));\n  });\n  document.querySelector("[data-checkpoint]")?.addEventListener("click", () => startPhaseAssessment("checkpoint", phase).catch(showFatal));\n}\n\nfunction checkpointCardHtml(phase, progress) {\n  if (progress?.checkpointPassedAt) return `<section class="assessment-card passed"><div><span>Phase ${phase} checkpoint</span><strong>${icon("checkCircle", 19)} Passed</strong></div><p>Your phase knowledge is validated for progression. Reviews still continue normally.</p></section>`;\n  return `<section class="assessment-card"><div><span>Phase ${phase} complete</span><strong>Ready for your checkpoint.</strong></div><p>A short adaptive check across the important skills in this phase.</p><button class="primary" data-checkpoint type="button">Take Checkpoint</button></section>`;\n}\n\nasync function renderLockedPhase(phase) {\n  root.innerHTML = shellHtml(`\n    ${topbarHtml(PHASE_TITLES[phase] ?? `Phase ${phase}`, { backTarget: "learn", eyebrow: `Phase ${phase}` })}\n    <section class="locked-phase-panel">${icon("lock", 28)}<h1>Phase ${phase} is locked.</h1><p>Continue the earlier phases, or show that you already know the prerequisites.</p><button class="primary" data-placement type="button">Test Into Phase ${phase}</button><button class="secondary" data-back-learn type="button">Continue Earlier Phases</button></section>`, { activeNav: "learn", className: "locked-phase-screen" });\n  document.querySelector("[data-placement]")?.addEventListener("click", () => startPhaseAssessment("placement", phase).catch(showFatal));\n  document.querySelector("[data-back-learn]")?.addEventListener("click", () => renderCurriculum().catch(showFatal));\n}''',
"checkpoint and locked screens")
t = replace_once(t,
'''  const records = await repo.allSkillStates(USER_ID);\n  const readyIds = new Set(records.filter((record) => evidenceReady(record.evidence)).map((record) => record.skillId));\n  if (!curriculumAccessAllowed(skill, readyIds)) return renderPhase(skill.phase);''',
'''  const [records, phaseProgressRows] = await Promise.all([repo.allSkillStates(USER_ID), repo.phaseProgress(USER_ID)]);\n  const readyIds = new Set(records.filter((record) => evidenceReady(record.evidence)).map((record) => record.skillId));\n  const phaseProgress = phaseProgressMap(phaseProgressRows);\n  if (!curriculumAccessAllowed(skill, readyIds, phaseProgress)) return renderPhase(skill.phase);''',
"open skill phase gate")

# Add assessment runtime before manualStudyKind
anchor = '''function manualStudyKind(evidence) {'''
assessment_code = r'''function responseModeForDiagnostic(spec, exercise) {
  return responseModeForEvidence(spec, exercise);
}

async function startPhaseAssessment(kind, phase) {
  const def = kind === "checkpoint" ? checkpointDefinition(phase) : placementDefinition(phase);
  if (!def || !def.competencies.length) return renderPhase(phase);
  const session = await repo.createSession(USER_ID, new Date().toISOString());
  state.assessment = { kind, phase, def, results: [], sessionId: session.id, current: null, submitted: false, feedback: null, questionNumber: 0 };
  await loadAssessmentQuestion();
}

async function loadAssessmentQuestion() {
  const a = state.assessment;
  if (!a) return renderCurriculum();
  const evaluation = evaluateCheckpoint(a.def, a.results);
  if (evaluation.complete) return finishPhaseAssessment(evaluation);
  const competency = nextCheckpointCompetency(a.def, a.results);
  if (!competency) return finishPhaseAssessment(evaluation);
  const counts = new Map();
  a.results.filter((r) => r.competencyId === competency.id).forEach((r) => counts.set(r.skillId, (counts.get(r.skillId) ?? 0) + 1));
  const skillId = [...competency.skillIds].sort((x, y) => (counts.get(x) ?? 0) - (counts.get(y) ?? 0))[0];
  const history = await repo.attemptsForSkill(USER_ID, skillId);
  const selected = selectAdaptiveExercise(skillId, history, a.questionNumber, 16);
  a.current = { competency, skillId, exercise: selected.exercise, spec: answerSpecForExercise(selected.exercise) };
  a.submitted = false;
  a.feedback = null;
  a.questionNumber += 1;
  renderAssessmentQuestion();
}

function renderAssessmentQuestion() {
  const a = state.assessment;
  const current = a?.current;
  if (!a || !current) return;
  const placement = a.kind === "placement";
  const title = placement ? `Test Into Phase ${a.phase}` : `Phase ${a.phase} Checkpoint`;
  const spec = current.spec;
  root.innerHTML = shellHtml(`
    ${topbarHtml(title, { backTarget: placement ? "learn" : `phase:${a.phase}`, eyebrow: `${Math.min(a.questionNumber, a.def.maxItems)} of up to ${a.def.maxItems}` })}
    <section class="assessment-question">
      <div class="assessment-competency">${esc(current.competency.label)}</div>
      <div class="prompt">${esc(current.exercise.prompt)}</div>
      ${answerControls(spec)}
      ${a.feedback ? feedbackHtml(a.feedback) : ""}
      ${a.submitted ? '<button class="primary" id="assessmentContinue" type="button">Continue</button>' : '<button class="primary" id="assessmentSubmit" type="button">Check answer</button>'}
    </section>`, { className: "assessment-screen" });
  bindChoiceButtons();
  document.querySelector("#assessmentSubmit")?.addEventListener("click", () => submitAssessmentAnswer().catch(showFatal));
  document.querySelector("#assessmentContinue")?.addEventListener("click", () => loadAssessmentQuestion().catch(showFatal));
}

async function submitAssessmentAnswer() {
  const a = state.assessment;
  const current = a?.current;
  if (!a || !current || a.submitted) return;
  const values = collectValues(current.spec);
  if (current.spec.kind === "choice" && !values.main) return;
  const answer = parseAnswerFromValues(current.spec, values);
  const assessment = gradeExercise(current.exercise, answer);
  const responseMode = responseModeForDiagnostic(current.spec, current.exercise);
  const occurredAt = new Date().toISOString();
  await service.submitAttempt({
    userId: USER_ID, skillId: current.skillId, sessionId: a.sessionId,
    promptSignature: current.exercise.id, occurredAt,
    outcome: assessment.correct ? "correct" : "incorrect", independent: true, directEvidence: true,
    context: "diagnostic", coldProbe: false, evidenceSource: "objective", eventKind: "response",
    responseMode, guidance: "none", solutionSeen: false,
    exampleSignature: exampleSignatureForExercise(current.exercise),
    exampleAttributes: evidenceAttributesForExercise(current.exercise), evidenceVersion: "v2",
    assessmentCode: `${a.kind}:phase-${a.phase}:${current.competency.id}`,
    metadata: { assessmentKind: a.kind, assessmentPhase: a.phase, competencyId: current.competency.id },
  });
  const expected = readableExpected(current.exercise, assessment);
  if (!assessment.correct && expected) {
    await service.submitAttempt({
      userId: USER_ID, skillId: current.skillId, sessionId: a.sessionId,
      promptSignature: current.exercise.id, occurredAt: new Date().toISOString(), outcome: "revealed",
      independent: false, directEvidence: false, context: "diagnostic", coldProbe: false,
      evidenceSource: "objective", eventKind: "answer-reveal", responseMode, guidance: "answer-reveal",
      solutionSeen: true, exampleSignature: exampleSignatureForExercise(current.exercise),
      exampleAttributes: evidenceAttributesForExercise(current.exercise), evidenceVersion: "v2",
      assessmentCode: `${a.kind}:phase-${a.phase}:${current.competency.id}`,
      metadata: { assessmentKind: a.kind, assessmentPhase: a.phase, competencyId: current.competency.id },
    });
  }
  a.results.push({
    competencyId: current.competency.id, skillId: current.skillId,
    promptSignature: current.exercise.id, exampleSignature: exampleSignatureForExercise(current.exercise),
    correct: assessment.correct, firstSubmission: true, independent: true, responseMode,
    guidanceUsed: false, solutionSeen: false,
  });
  a.submitted = true;
  a.feedback = { correct: assessment.correct, expected: assessment.correct ? "" : expected, detail: assessment.correct ? "Good — that competency is demonstrated on this example." : diagnosticDetail(assessment, expected) };
  renderAssessmentQuestion();
}

async function finishPhaseAssessment(evaluation) {
  const a = state.assessment;
  if (!a) return;
  await repo.completeSession(USER_ID, a.sessionId, new Date().toISOString(), `${a.kind}-${evaluation.passed ? "passed" : "needs-repair"}`);
  if (evaluation.passed) {
    const rows = await repo.phaseProgress(USER_ID);
    const map = phaseProgressMap(rows);
    const existing = map.get(a.phase) ?? { userId: USER_ID, phase: a.phase, updatedAt: new Date().toISOString() };
    if (a.kind === "checkpoint") {
      await repo.upsertPhaseProgress({ ...existing, checkpointPassedAt: new Date().toISOString(), checkpointSummary: evaluation, updatedAt: new Date().toISOString() });
    } else {
      await repo.upsertPhaseProgress({ ...existing, validatedEntryAt: new Date().toISOString(), validatedEntrySource: "placement", placementSummary: evaluation, updatedAt: new Date().toISOString() });
    }
  }
  const recommended = a.kind === "placement" && !evaluation.passed ? recommendStartingPhase(a.phase, evaluation) : undefined;
  const strong = evaluation.strong.length ? evaluation.strong.map((x) => `<li>${esc(x)}</li>`).join("") : "<li>Keep building these foundations.</li>";
  const review = evaluation.review.length ? evaluation.review.map((x) => `<li>${esc(x)}</li>`).join("") : "<li>Nothing critical right now.</li>";
  const targetPhase = a.phase;
  const kind = a.kind;
  state.assessment = null;
  root.innerHTML = shellHtml(`
    ${topbarHtml(evaluation.passed ? (kind === "checkpoint" ? "Checkpoint Passed" : `Phase ${targetPhase} Unlocked`) : "Not quite yet", { eyebrow: kind === "checkpoint" ? `Phase ${targetPhase}` : "Placement Test" })}
    <section class="assessment-results">
      <div class="completion-icon">${icon(evaluation.passed ? "check" : "review", 28)}</div>
      <h1>${evaluation.passed ? "You showed the important skills." : "You’re close."}</h1>
      <div class="result-columns"><div><strong>Strong</strong><ul>${strong}</ul></div><div><strong>Review</strong><ul>${review}</ul></div></div>
      ${recommended ? `<div class="soft-note">Recommended starting point: Phase ${recommended} — ${esc(PHASE_TITLES[recommended] ?? "")}</div>` : ""}
      <button class="primary" data-result-next type="button">${evaluation.passed ? (kind === "checkpoint" ? `Continue to Phase ${Math.min(12, targetPhase + 1)}` : `Open Phase ${targetPhase}`) : `Review Phase ${recommended ?? targetPhase}`}</button>
    </section>`, { className: "assessment-results-screen" });
  document.querySelector("[data-result-next]")?.addEventListener("click", () => renderPhase(evaluation.passed ? (kind === "checkpoint" ? Math.min(12, targetPhase + 1) : targetPhase) : (recommended ?? targetPhase)).catch(showFatal));
}

'''
if assessment_code not in t:
    if anchor not in t: raise RuntimeError("Could not locate web assessment anchor")
    t = t.replace(anchor, assessment_code + anchor, 1)

# Back routing understands phase:n in the app-wide delegated navigation handler.
old = '''    if (target === "profile") return renderProfile().catch(showFatal);\n    if (target === "session") return leaveStudyToPrevious().catch(showFatal);'''
new = '''    if (target === "profile") return renderProfile().catch(showFatal);\n    if (target?.startsWith("phase:")) return renderPhase(Number(target.split(":")[1])).catch(showFatal);\n    if (target === "session") return leaveStudyToPrevious().catch(showFatal);'''
t = replace_once(t, old, new, "phase back routing")
p.write_text(t)

print("Phase checkpoints and placement integration applied")
