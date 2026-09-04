from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing anchor for {label}")
    return text.replace(old, new, 1)


def replace_between(text: str, start_marker: str, end_marker: str, replacement: str, label: str) -> str:
    try:
        start = text.index(start_marker)
        end = text.index(end_marker, start)
    except ValueError as exc:
        raise RuntimeError(f"Missing range anchor for {label}") from exc
    return text[:start] + replacement + text[end:]


# ---------- Persistence types ----------
path = Path("src/persistence/types.ts")
s = path.read_text()
if "export interface UserProfile" not in s:
    old = '''export interface UserLearningSettings {
  userId: string;
  desiredRetention: number;
  maximumIntervalDays: number;
  curriculumVersion: string;
  schedulerVersion: "fsrs-6";
}
'''
    new = '''export interface UserProfile {
  userId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLearningSettings {
  userId: string;
  desiredRetention: number;
  maximumIntervalDays: number;
  requirePreviousLessons: boolean;
  curriculumVersion: string;
  schedulerVersion: "fsrs-6";
}
'''
    s = replace_once(s, old, new, "persistence types")
    path.write_text(s)


# ---------- Repository contract ----------
path = Path("src/persistence/repository.ts")
s = path.read_text()
if "getProfile(userId" not in s:
    s = s.replace("  StudySessionRecord,\n  UserLearningSettings,", "  StudySessionRecord,\n  UserLearningSettings,\n  UserProfile,", 1)
    s = s.replace(
        "  completeSession(userId: string, sessionId: string, completedAt: string, completionReason: string): Promise<void>;\n",
        "  completeSession(userId: string, sessionId: string, completedAt: string, completionReason: string): Promise<void>;\n  recentSessions(userId: string, limit?: number): Promise<StudySessionRecord[]>;\n",
        1,
    )
    s = s.replace(
        "  acquiringSkillIds(userId: string): Promise<string[]>;\n  getSettings(userId: string): Promise<UserLearningSettings | undefined>;",
        "  acquiringSkillIds(userId: string): Promise<string[]>;\n  getProfile(userId: string): Promise<UserProfile | undefined>;\n  upsertProfile(userId: string, displayName: string, createdAt?: string): Promise<void>;\n  getSettings(userId: string): Promise<UserLearningSettings | undefined>;",
        1,
    )
    path.write_text(s)


# ---------- In-memory repository ----------
path = Path("src/persistence/memory.ts")
s = path.read_text()
if "readonly profiles" not in s:
    s = s.replace("  UserLearningSettings,\n} from \"./types.js\";", "  UserLearningSettings,\n  UserProfile,\n} from \"./types.js\";", 1)
    s = s.replace("  readonly settings = new Map<string, UserLearningSettings>();", "  readonly settings = new Map<string, UserLearningSettings>();\n  readonly profiles = new Map<string, UserProfile>();", 1)
    anchor = '''  async appendAttempt(input: AppendAttemptInput): Promise<StoredAttempt> {'''
    addition = '''  async recentSessions(userId: string, limit = 10): Promise<StudySessionRecord[]> {
    return this.sessions
      .filter((x) => x.userId === userId)
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
      .slice(0, Math.max(0, limit))
      .map((x) => ({ ...x }));
  }

'''
    s = replace_once(s, anchor, addition + anchor, "memory recent sessions")
    anchor = '''  async getSettings(userId: string): Promise<UserLearningSettings | undefined> {
    const row = this.settings.get(userId);
    return row ? { ...row } : undefined;
  }
'''
    replacement = '''  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const row = this.profiles.get(userId);
    return row ? { ...row } : undefined;
  }

  async upsertProfile(userId: string, displayName: string, createdAt?: string): Promise<void> {
    const existing = this.profiles.get(userId);
    const now = new Date().toISOString();
    this.profiles.set(userId, {
      userId,
      displayName,
      createdAt: existing?.createdAt ?? createdAt ?? now,
      updatedAt: now,
    });
  }

  async getSettings(userId: string): Promise<UserLearningSettings | undefined> {
    const row = this.settings.get(userId);
    return row ? { ...row, requirePreviousLessons: row.requirePreviousLessons ?? true } : undefined;
  }
'''
    s = replace_once(s, anchor, replacement, "memory profile/settings")
    path.write_text(s)


# ---------- Browser-storage repository ----------
path = Path("src/persistence/browser-storage.ts")
s = path.read_text()
if "profiles: UserProfile[]" not in s:
    s = s.replace("  UserLearningSettings,\n} from \"./types.js\";", "  UserLearningSettings,\n  UserProfile,\n} from \"./types.js\";", 1)
    s = s.replace("  settings: UserLearningSettings[];\n}", "  settings: UserLearningSettings[];\n  profiles: UserProfile[];\n}", 1)
    s = s.replace("  sessions: [], attempts: [], skillStates: [], cards: [], schedulerReviews: [], settings: [],\n};", "  sessions: [], attempts: [], skillStates: [], cards: [], schedulerReviews: [], settings: [], profiles: [],\n};", 1)
    s = s.replace(
        "        cards: parsed.cards ?? [], schedulerReviews: parsed.schedulerReviews ?? [], settings: parsed.settings ?? [],\n",
        "        cards: parsed.cards ?? [], schedulerReviews: parsed.schedulerReviews ?? [], settings: parsed.settings ?? [], profiles: parsed.profiles ?? [],\n",
        1,
    )
    anchor = '''  async appendAttempt(input: AppendAttemptInput): Promise<StoredAttempt> {'''
    addition = '''  async recentSessions(userId: string, limit = 10): Promise<StudySessionRecord[]> {
    return this.read().sessions.filter((x)=>x.userId===userId)
      .sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)).slice(0,Math.max(0,limit)).map(clone);
  }
'''
    s = replace_once(s, anchor, addition + anchor, "browser recent sessions")
    anchor = '''  async getSettings(userId: string): Promise<UserLearningSettings|undefined> {
    const row=this.read().settings.find((x)=>x.userId===userId); return row?clone(row):undefined;
  }
'''
    replacement = '''  async getProfile(userId: string): Promise<UserProfile|undefined> {
    const row=this.read().profiles.find((x)=>x.userId===userId); return row?clone(row):undefined;
  }
  async upsertProfile(userId: string, displayName: string, createdAt?: string): Promise<void> {
    const db=this.read(); const i=db.profiles.findIndex((x)=>x.userId===userId); const now=new Date().toISOString();
    const row:UserProfile={userId,displayName,createdAt:i>=0?db.profiles[i].createdAt:(createdAt??now),updatedAt:now};
    if(i>=0) db.profiles[i]=row; else db.profiles.push(row); this.write(db);
  }
  async getSettings(userId: string): Promise<UserLearningSettings|undefined> {
    const row=this.read().settings.find((x)=>x.userId===userId);
    return row?{...clone(row),requirePreviousLessons:row.requirePreviousLessons??true}:undefined;
  }
'''
    s = replace_once(s, anchor, replacement, "browser profile/settings")
    path.write_text(s)


# ---------- Supabase REST repository ----------
path = Path("src/persistence/supabase-rest.ts")
s = path.read_text()
if "async getProfile(userId" not in s:
    s = s.replace("  UserLearningSettings,\n} from \"./types.js\";", "  UserLearningSettings,\n  UserProfile,\n} from \"./types.js\";", 1)
    anchor = '''  async appendAttempt(input: AppendAttemptInput): Promise<StoredAttempt> {'''
    addition = '''  async recentSessions(userId: string, limit = 10): Promise<StudySessionRecord[]> {
    const safeLimit = Math.max(0, Math.min(50, Math.trunc(limit)));
    const rows = await this.request<any[]>(`study_sessions?user_id=eq.${filterValue(userId)}&order=started_at.desc&limit=${safeLimit}`);
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
      completionReason: row.completion_reason ?? undefined,
      plan: row.plan_snapshot ?? undefined,
    }));
  }

'''
    s = replace_once(s, anchor, addition + anchor, "supabase recent sessions")
    anchor = '''  async getSettings(userId: string): Promise<UserLearningSettings | undefined> {
'''
    profile_methods = '''  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const rows = await this.request<any[]>(`user_profiles?user_id=eq.${filterValue(userId)}&limit=1`);
    const r = rows[0];
    if (!r) return undefined;
    return {
      userId: r.user_id,
      displayName: r.display_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async upsertProfile(userId: string, displayName: string, createdAt?: string): Promise<void> {
    const body: Record<string, unknown> = {
      user_id: userId,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    };
    if (createdAt) body.created_at = createdAt;
    await this.request<void>("user_profiles?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(body),
    });
  }

'''
    s = replace_once(s, anchor, profile_methods + anchor, "supabase profile methods")
    s = s.replace(
        "      maximumIntervalDays: r.maximum_interval_days,\n      curriculumVersion: r.curriculum_version,",
        "      maximumIntervalDays: r.maximum_interval_days,\n      requirePreviousLessons: r.require_previous_lessons ?? true,\n      curriculumVersion: r.curriculum_version,",
        1,
    )
    s = s.replace(
        "        maximum_interval_days: settings.maximumIntervalDays,\n        curriculum_version: settings.curriculumVersion,",
        "        maximum_interval_days: settings.maximumIntervalDays,\n        require_previous_lessons: settings.requirePreviousLessons,\n        curriculum_version: settings.curriculumVersion,",
        1,
    )
    path.write_text(s)


# ---------- Supabase schema source ----------
path = Path("supabase/schema.sql")
s = path.read_text()
if "require_previous_lessons" not in s:
    s = s.replace(
        "  maximum_interval_days integer not null default 36500 check (maximum_interval_days >= 1),\n  curriculum_version",
        "  maximum_interval_days integer not null default 36500 check (maximum_interval_days >= 1),\n  require_previous_lessons boolean not null default true,\n  curriculum_version",
        1,
    )
    settings_end = ");\n\nalter table public.study_sessions enable row level security;"
    profile_sql = ''');

alter table public.user_learning_settings
  add column if not exists require_previous_lessons boolean not null default true;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Student' check (char_length(trim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.user_profiles (user_id, display_name, created_at, updated_at)
select
  u.id,
  coalesce(nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'Student'),
  u.created_at,
  now()
from auth.users u
on conflict (user_id) do nothing;

alter table public.study_sessions enable row level security;'''
    s = replace_once(s, settings_end, profile_sql, "schema profile table")
    s = s.replace("alter table public.user_learning_settings enable row level security;", "alter table public.user_learning_settings enable row level security;\nalter table public.user_profiles enable row level security;", 1)
    s = s.replace("revoke all on table public.user_learning_settings from anon, authenticated;", "revoke all on table public.user_learning_settings from anon, authenticated;\nrevoke all on table public.user_profiles from anon, authenticated;", 1)
    s = s.replace("grant select, insert, update on table public.user_learning_settings to authenticated;", "grant select, insert, update on table public.user_learning_settings to authenticated;\ngrant select, insert, update on table public.user_profiles to authenticated;", 1)
    s = s.replace(
        'drop policy if exists "user_learning_settings_update_own" on public.user_learning_settings;',
        'drop policy if exists "user_learning_settings_update_own" on public.user_learning_settings;\ndrop policy if exists "user_profiles_select_own" on public.user_profiles;\ndrop policy if exists "user_profiles_insert_own" on public.user_profiles;\ndrop policy if exists "user_profiles_update_own" on public.user_profiles;',
        1,
    )
    s += '''

create policy "user_profiles_select_own" on public.user_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_profiles_insert_own" on public.user_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_profiles_update_own" on public.user_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
'''
    path.write_text(s)


# ---------- Web app ----------
path = Path("web/app.js")
s = path.read_text()
if "function renderProfile(" not in s:
    s = s.replace('let authEmail = "";\n', 'let authEmail = "";\nlet userSettings = null;\nlet userProfile = null;\n', 1)
    s = s.replace('  fastPathPasses: 0,\n};', '  fastPathPasses: 0,\n  manualStudy: null,\n};', 1)

    topbar = '''function topbarHtml(label = "") {
  const sync = persistenceMode === "supabase" ? "Synced" : "Local preview";
  const accountActions = `<button class="text-button" data-profile type="button">Profile</button><button class="text-button" data-settings type="button">Settings</button>${persistenceMode === "supabase" ? `<button class="text-button" data-signout type="button">Logout</button>` : ""}`;
  return `<div class="topbar"><div class="brand">Theory Tutor</div><div class="topbar-right"><span class="phase-pill">${esc(label || sync)}</span>${accountActions}</div></div>`;
}

'''
    s = replace_between(s, "function topbarHtml(label = \"\") {", "function footerHtml()", topbar, "topbar")

    runtimes = '''function defaultLearningSettings(userId) {
  return {
    userId,
    desiredRetention: 0.90,
    maximumIntervalDays: 36500,
    requirePreviousLessons: true,
    curriculumVersion: "v0.7",
    schedulerVersion: "fsrs-6",
  };
}

function defaultDisplayName(email) {
  const local = String(email ?? "").split("@")[0].trim();
  return local || "Student";
}

async function ensureUserProfile(createdAt) {
  let profile = await repo.getProfile(USER_ID);
  if (!profile) {
    await repo.upsertProfile(USER_ID, defaultDisplayName(authEmail), createdAt);
    profile = await repo.getProfile(USER_ID);
  }
  userProfile = profile ?? {
    userId: USER_ID,
    displayName: defaultDisplayName(authEmail),
    createdAt: createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function initializeLocalRuntime() {
  persistenceMode = "local";
  USER_ID = "local-preview-user";
  authEmail = "";
  repo = new BrowserStorageTutorRepository(localStorage, "music-theory-tutor:v0.7-preview");
  let settings = await repo.getSettings(USER_ID);
  if (!settings) {
    settings = defaultLearningSettings(USER_ID);
    await repo.upsertSettings(settings);
  }
  userSettings = settings;
  await ensureUserProfile(new Date().toISOString());
  const scheduler = new Fsrs6LongTermSchedulerAdapter({
    desiredRetention: settings.desiredRetention,
    maximumIntervalDays: settings.maximumIntervalDays,
  });
  service = new TutorService({ repository: repo, scheduler });
}

async function initializeSupabaseRuntime(session) {
  persistenceMode = "supabase";
  USER_ID = session.user.id;
  authEmail = session.user.email ?? "";
  repo = new SupabaseRestTutorRepository({
    url: config.supabaseUrl,
    publishableKey: config.supabasePublishableKey,
    getAccessToken: () => getAccessToken(authClient),
  });
  let settings = await repo.getSettings(USER_ID);
  if (!settings) {
    settings = defaultLearningSettings(USER_ID);
    await repo.upsertSettings(settings);
  }
  userSettings = settings;
  await ensureUserProfile(session.user.created_at ?? new Date().toISOString());
  const scheduler = new Fsrs6LongTermSchedulerAdapter({
    desiredRetention: settings.desiredRetention,
    maximumIntervalDays: settings.maximumIntervalDays,
  });
  service = new TutorService({ repository: repo, scheduler });
}

'''
    s = replace_between(s, "async function initializeLocalRuntime() {", "function resetSessionUiState()", runtimes, "runtime initialization")
    s = s.replace("  state.fastPathPasses = 0;\n}", "  state.fastPathPasses = 0;\n  state.manualStudy = null;\n}\n", 1)

    click_handler = '''root.addEventListener("click", async (ev) => {
  const profileButton = ev.target.closest?.("[data-profile]");
  if (profileButton) return renderProfile().catch(showFatal);
  const settingsButton = ev.target.closest?.("[data-settings]");
  if (settingsButton) return renderSettings().catch(showFatal);

  const button = ev.target.closest?.("[data-signout]");
  if (!button || !authClient) return;
  button.disabled = true;
  try {
    if (state.session?.sessionId && service && USER_ID) {
      await service.finishSession(USER_ID, state.session.sessionId, "signed-out", new Date());
    }
    await supabaseSignOut(authClient);
    persistenceMode = "supabase";
    USER_ID = "";
    repo = undefined;
    service = undefined;
    userSettings = null;
    userProfile = null;
    renderAuth();
  } catch (err) { showFatal(err); }
});

'''
    s = replace_between(s, 'root.addEventListener("click", async (ev) => {', "function buildQueue(plan) {", click_handler, "topbar click handler")
    s = s.replace("async function loadToday() {\n  state.session", "async function loadToday() {\n  state.manualStudy = null;\n  state.session", 1)

    curriculum_and_account = '''function skillStatus(skill, evidence, readyIds, accessAllowed = true) {
  if (evidence?.fragile) return { label: "Repair", cls: "repair" };
  if (evidence?.retained || evidence?.state === "retained") return { label: "Retained", cls: "retained" };
  if (evidenceReady(evidence)) return { label: "Ready", cls: "ready" };
  if (evidence?.state === "acquiring") return { label: "In progress", cls: "current" };
  return accessAllowed ? { label: "Available", cls: "available" } : { label: "Locked", cls: "locked" };
}

function curriculumAccessAllowed(skill, readyIds) {
  if (userSettings?.requirePreviousLessons === false) return true;
  return skill.prerequisites.every((id) => readyIds.has(id));
}

async function renderCurriculum() {
  const records = await repo.allSkillStates(USER_ID);
  const byId = new Map(records.map((record) => [record.skillId, record.evidence]));
  const readyIds = new Set(records.filter((record) => evidenceReady(record.evidence)).map((record) => record.skillId));
  const phaseHtml = [];
  const locking = userSettings?.requirePreviousLessons !== false;

  for (let phase = 0; phase <= 12; phase += 1) {
    const skills = SKILLS.filter((skill) => skill.phase === phase);
    const required = skills.filter((skill) => !skill.optional);
    const complete = required.length > 0 && required.every((skill) => readyIds.has(skill.id));
    const anyAccessible = skills.some((skill) => curriculumAccessAllowed(skill, readyIds));
    const phaseState = complete ? "Complete" : (!locking || anyAccessible) ? "Current" : "Locked";
    const rows = skills.map((skill) => {
      const evidence = byId.get(skill.id);
      const accessAllowed = curriculumAccessAllowed(skill, readyIds);
      const status = skillStatus(skill, evidence, readyIds, accessAllowed);
      const accessClass = accessAllowed ? "" : " access-locked";
      const lockHint = !accessAllowed ? '<span class="curriculum-lock-note">Complete previous material to open.</span>' : '';
      return `<button class="curriculum-skill ${status.cls}${accessClass}" type="button" ${accessAllowed ? `data-open-skill="${esc(skill.id)}"` : "disabled"}><span class="curriculum-skill-copy"><strong>${esc(skill.title)}</strong>${skill.optional ? '<span class="optional-tag">Optional</span>' : ''}${lockHint}</span><span class="status-chip ${status.cls}">${esc(status.label)}</span></button>`;
    }).join("");
    phaseHtml.push(`<section class="curriculum-phase ${phaseState.toLowerCase()}"><div class="curriculum-phase-head"><div><div class="phase-number">Phase ${phase}</div><h2>${esc(PHASE_TITLES[phase] ?? `Phase ${phase}`)}</h2></div><span class="phase-status ${phaseState.toLowerCase()}">${phaseState === "Locked" ? "🔒 Locked" : esc(phaseState)}</span></div><div class="curriculum-skills">${rows}</div></section>`);
  }

  root.innerHTML = `
    ${topbarHtml("Curriculum")}
    <section class="card curriculum-intro">
      <div class="eyebrow">Full curriculum</div>
      <h1>See the whole path.</h1>
      <p class="muted">${locking ? "Open material as it becomes available. Locked lessons still require their prerequisites." : "Curriculum restrictions are off. You can open any lesson, but its learning status only changes when you actually study it."}</p>
      <button class="secondary curriculum-back" id="curriculumBack" type="button">Back to today</button>
    </section>
    <div class="curriculum-map">${phaseHtml.join("")}</div>
    ${footerHtml()}`;
  document.querySelector("#curriculumBack").onclick = renderToday;
  document.querySelectorAll("[data-open-skill]").forEach((button) => {
    button.addEventListener("click", () => openCurriculumSkill(button.dataset.openSkill).catch(showFatal));
  });
}

function manualStudyKind(evidence) {
  if (evidence?.fragile) return "repair";
  if (evidence?.retained || evidenceReady(evidence)) return "review";
  if (evidence?.state === "acquiring") return "acquisition";
  return "new";
}

async function openCurriculumSkill(skillId) {
  const skill = SKILL_BY_ID.get(skillId);
  if (!skill) return;
  const records = await repo.allSkillStates(USER_ID);
  const readyIds = new Set(records.filter((record) => evidenceReady(record.evidence)).map((record) => record.skillId));
  if (!curriculumAccessAllowed(skill, readyIds)) return renderCurriculum();
  const evidence = records.find((record) => record.skillId === skillId)?.evidence;
  const kind = manualStudyKind(evidence);
  state.manualStudy = {
    queue: state.queue,
    itemIndex: state.itemIndex,
    fastPathPasses: state.fastPathPasses,
  };
  state.queue = [{ skillId, kind, firstProbe: kind === "review" || kind === "repair" }];
  state.itemIndex = 0;
  state.fastPathPasses = 0;
  await beginItem();
}

function formatProfileDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

async function renderProfile(message = "") {
  const [records, due, sessions] = await Promise.all([
    repo.allSkillStates(USER_ID),
    repo.dueReviews(USER_ID, new Date().toISOString()),
    repo.recentSessions(USER_ID, 6),
  ]);
  const readyIds = new Set(records.filter((record) => evidenceReady(record.evidence)).map((record) => record.skillId));
  const required = SKILLS.filter((skill) => !skill.optional);
  const requiredReady = required.filter((skill) => readyIds.has(skill.id)).length;
  const progress = required.length ? Math.round((requiredReady / required.length) * 100) : 0;
  const mastered = records.filter((record) => evidenceReady(record.evidence)).length;
  const learning = records.filter((record) => record.evidence?.state === "acquiring" || record.evidence?.fragile).length;
  const plan = state.session?.plan ?? await service.previewPlan(USER_ID, new Date());
  const currentSkillId = plan.acquiringSkillId ?? plan.newSkillId ?? null;
  const currentSkill = currentSkillId ? SKILL_BY_ID.get(currentSkillId) : null;
  const history = sessions.length ? sessions.map((session) => `<div class="history-row"><span>${esc(formatProfileDate(session.startedAt))}</span><span>${session.completedAt ? "Completed" : "Started"}</span></div>`).join("") : '<div class="muted small-copy">No study sessions yet.</div>';

  root.innerHTML = `
    ${topbarHtml("Profile")}
    <section class="card account-card">
      <div class="eyebrow">Profile</div>
      <h1>${esc(userProfile?.displayName ?? defaultDisplayName(authEmail))}</h1>
      ${message ? `<div class="auth-message">${esc(message)}</div>` : ""}
      <form id="profileForm" class="profile-name-form">
        <label class="field-label" for="displayName">Display name</label>
        <div class="inline-form"><input class="answer-input" id="displayName" maxlength="80" required value="${esc(userProfile?.displayName ?? defaultDisplayName(authEmail))}"><button class="secondary compact-button" type="submit">Save</button></div>
      </form>
      <div class="profile-grid">
        <div class="stat-card"><span>Current phase</span><strong>${currentSkill ? `Phase ${currentSkill.phase}` : "Caught up"}</strong></div>
        <div class="stat-card"><span>Current lesson / block</span><strong>${currentSkill ? esc(currentSkill.title) : "None due"}</strong></div>
        <div class="stat-card"><span>Overall progress</span><strong>${progress}%</strong></div>
        <div class="stat-card"><span>Mastered items</span><strong>${mastered}</strong></div>
        <div class="stat-card"><span>Currently learning</span><strong>${learning}</strong></div>
        <div class="stat-card"><span>Reviews due</span><strong>${due.length}</strong></div>
      </div>
      <div class="profile-meta"><div><span>Profile ID</span><code>${esc(USER_ID)}</code></div><div><span>Created</span><strong>${esc(formatProfileDate(userProfile?.createdAt))}</strong></div></div>
      <div class="section-title">Recent study activity</div>
      <div class="history-list">${history}</div>
      <div class="actions"><button class="secondary" id="profileSettings" type="button">Settings</button><button class="secondary" id="profileBack" type="button">Back to today</button></div>
    </section>
    ${footerHtml()}`;
  document.querySelector("#profileBack").onclick = renderToday;
  document.querySelector("#profileSettings").onclick = () => renderSettings().catch(showFatal);
  document.querySelector("#profileForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const displayName = document.querySelector("#displayName").value.trim();
    if (!displayName) return;
    await repo.upsertProfile(USER_ID, displayName);
    userProfile = await repo.getProfile(USER_ID);
    await renderProfile("Profile saved.");
  });
}

async function renderSettings(message = "") {
  const locking = userSettings?.requirePreviousLessons !== false;
  root.innerHTML = `
    ${topbarHtml("Settings")}
    <section class="card account-card">
      <div class="eyebrow">Settings</div>
      <h1>Learning settings</h1>
      ${message ? `<div class="auth-message">${esc(message)}</div>` : ""}
      <div class="setting-row">
        <div class="setting-copy"><strong>Require Previous Lessons</strong><span>When enabled, phases and lessons unlock in order. When disabled, you can open any phase or lesson without completing earlier material.</span></div>
        <label class="switch"><input id="requirePreviousLessons" type="checkbox" ${locking ? "checked" : ""}><span class="switch-track"></span></label>
      </div>
      ${locking ? "" : '<div class="setting-note">Curriculum restrictions are disabled. This changes access only; skipped material is not marked complete, READY, mastered, or retained.</div>'}
      <div class="actions"><button class="secondary" id="settingsProfile" type="button">Profile</button><button class="secondary" id="settingsBack" type="button">Back to today</button></div>
    </section>
    ${footerHtml()}`;
  document.querySelector("#settingsBack").onclick = renderToday;
  document.querySelector("#settingsProfile").onclick = () => renderProfile().catch(showFatal);
  document.querySelector("#requirePreviousLessons").addEventListener("change", async (ev) => {
    const next = { ...userSettings, requirePreviousLessons: Boolean(ev.target.checked) };
    await repo.upsertSettings(next);
    userSettings = next;
    await renderSettings("Setting saved.");
  });
}

'''
    s = replace_between(s, "function skillStatus(skill, evidence, readyIds) {", "function renderToday()", curriculum_and_account, "curriculum/profile/settings")

    advance = '''async function advanceItem() {
  const item = state.queue[state.itemIndex];
  state.exerciseIndex.set(item.skillId, (state.exerciseIndex.get(item.skillId) ?? 0) + 1);
  state.itemIndex += 1;
  if (state.itemIndex >= state.queue.length && state.manualStudy) {
    const previous = state.manualStudy;
    state.manualStudy = null;
    state.queue = previous.queue;
    state.itemIndex = previous.itemIndex;
    state.fastPathPasses = previous.fastPathPasses;
    return renderCurriculum();
  }
  if (state.itemIndex >= state.queue.length) {
    const extended = await maybeAppendFastPath(item);
    if (!extended) return finishSession();
  }
  await beginItem();
}

'''
    s = replace_between(s, "async function advanceItem() {", "async function finishSession()", advance, "manual study advance")
    path.write_text(s)


# ---------- Styles ----------
path = Path("web/styles.css")
s = path.read_text()
if ".setting-row" not in s:
    s += '''

/* Profile + per-user settings */
.topbar-right { flex-wrap: wrap; justify-content: flex-end; }
.account-card { display: grid; gap: 18px; }
.profile-name-form { display: grid; gap: 9px; }
.inline-form { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
.compact-button { width: auto; min-width: 88px; }
.profile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.stat-card { border: 1px solid #2c3038; background: #181a20; border-radius: 14px; padding: 14px; display: grid; gap: 6px; }
.stat-card span, .profile-meta span, .section-title { color: #8f95a1; font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; }
.stat-card strong { font-size: 1.02rem; line-height: 1.25; }
.profile-meta { display: grid; gap: 10px; }
.profile-meta > div { display: grid; gap: 6px; }
.profile-meta code { overflow-wrap: anywhere; color: #cdd0d6; font-size: .78rem; }
.history-list { border: 1px solid #292d35; border-radius: 14px; overflow: hidden; }
.history-row { display: flex; justify-content: space-between; gap: 16px; padding: 11px 13px; border-bottom: 1px solid #252830; color: #c7cad1; font-size: .86rem; }
.history-row:last-child { border-bottom: 0; }
.small-copy { font-size: .86rem; padding: 13px; }
.setting-row { display: flex; justify-content: space-between; gap: 18px; align-items: center; padding: 18px 0; border-top: 1px solid #292d35; border-bottom: 1px solid #292d35; }
.setting-copy { display: grid; gap: 6px; }
.setting-copy span { color: #a1a1aa; line-height: 1.45; font-size: .88rem; }
.setting-note { padding: 13px 14px; border: 1px solid #444954; background: #1b1e24; border-radius: 12px; color: #c8cbd2; line-height: 1.45; font-size: .84rem; }
.switch { position: relative; flex: 0 0 auto; width: 48px; height: 28px; }
.switch input { position: absolute; opacity: 0; pointer-events: none; }
.switch-track { position: absolute; inset: 0; border-radius: 999px; background: #30343d; border: 1px solid #454a55; transition: .16s ease; }
.switch-track::after { content: ""; position: absolute; width: 20px; height: 20px; top: 3px; left: 3px; border-radius: 50%; background: #a1a1aa; transition: .16s ease; }
.switch input:checked + .switch-track { background: #e8e8ea; border-color: #e8e8ea; }
.switch input:checked + .switch-track::after { transform: translateX(20px); background: #111318; }
.curriculum-skill { width: 100%; border: 0; border-radius: 0; background: transparent; color: inherit; text-align: left; }
.curriculum-skill:not(:disabled):hover { background: #1a1d23; }
.curriculum-skill:disabled { cursor: default; }
.curriculum-skill.access-locked { opacity: .7; }
.curriculum-skill-copy { flex-wrap: wrap; }
.curriculum-lock-note { flex-basis: 100%; color: #777d89; font-size: .72rem; font-weight: 500; margin-top: 2px; }

@media (max-width: 520px) {
  .topbar { align-items: flex-start; }
  .topbar-right { gap: 9px; max-width: 66%; }
  .phase-pill { flex-basis: 100%; text-align: right; }
  .profile-grid { grid-template-columns: 1fr; }
  .inline-form { grid-template-columns: 1fr; }
  .compact-button { width: 100%; }
  .setting-row { align-items: flex-start; }
}
'''
    path.write_text(s)


# ---------- Tests ----------
path = Path("tests/profile-settings.test.mjs")
if not path.exists():
    path.write_text('''import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { InMemoryTutorRepository, SupabaseRestTutorRepository } from "../dist/persistence/index.js";

const settings = (userId, requirePreviousLessons) => ({
  userId,
  desiredRetention: 0.9,
  maximumIntervalDays: 36500,
  requirePreviousLessons,
  curriculumVersion: "v0.7",
  schedulerVersion: "fsrs-6",
});

test("profiles, settings, sessions, and skill state remain separated per user", async () => {
  const repo = new InMemoryTutorRepository();
  await repo.upsertProfile("user-a", "A", "2026-09-01T00:00:00Z");
  await repo.upsertProfile("user-b", "B", "2026-09-02T00:00:00Z");
  await repo.upsertSettings(settings("user-a", true));
  await repo.upsertSettings(settings("user-b", false));
  await repo.createSession("user-a", "2026-09-03T10:00:00Z");
  await repo.createSession("user-b", "2026-09-03T11:00:00Z");
  const evidence = {
    state: "ready", ready: true, retained: false, fragile: false,
    acquisitionIndependentSuccesses: 3, acquisitionDistinctSuccessfulPrompts: 3,
    successfulDelayedReviewSessions: 0, recentColdReviewResults: [], lastDirectOutcome: "correct",
    evidenceBasis: "objective",
  };
  await repo.upsertSkillState("user-a", "interval.M3", evidence, "2026-09-03T10:10:00Z");

  assert.equal((await repo.getProfile("user-a"))?.displayName, "A");
  assert.equal((await repo.getProfile("user-b"))?.displayName, "B");
  assert.equal((await repo.getSettings("user-a"))?.requirePreviousLessons, true);
  assert.equal((await repo.getSettings("user-b"))?.requirePreviousLessons, false);
  assert.equal((await repo.recentSessions("user-a")).length, 1);
  assert.equal((await repo.recentSessions("user-b")).length, 1);
  assert.equal((await repo.allSkillStates("user-a")).length, 1);
  assert.equal((await repo.allSkillStates("user-b")).length, 0);
});

test("Supabase REST requests keep user filters and persist the per-user locking flag", async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("user_learning_settings") && (!init.method || init.method === "GET")) {
      return { ok: true, status: 200, text: async () => JSON.stringify([{ user_id: "user-a", desired_retention: .9, maximum_interval_days: 36500, require_previous_lessons: false, curriculum_version: "v0.7", scheduler_version: "fsrs-6" }]) };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };
  const repo = new SupabaseRestTutorRepository({ url: "https://project.supabase.co", publishableKey: "sb_publishable_test", accessToken: "jwt", fetchImpl });
  const loaded = await repo.getSettings("user-a");
  await repo.upsertSettings(settings("user-a", false));
  await repo.allSkillStates("user-a");
  await repo.recentSessions("user-a", 5);

  assert.equal(loaded?.requirePreviousLessons, false);
  assert.ok(calls.some((x) => x.url.includes("user_id=eq.user-a")));
  const write = calls.find((x) => x.url.includes("user_learning_settings") && x.init.method === "POST");
  assert.equal(JSON.parse(write.init.body).require_previous_lessons, false);
});

test("curriculum unlock setting changes access only, not learning-state predicates", () => {
  const source = fs.readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
  assert.match(source, /requirePreviousLessons/);
  assert.match(source, /function curriculumAccessAllowed/);
  assert.match(source, /userSettings\?\.requirePreviousLessons === false/);
  assert.match(source, /function evidenceReady/);
  assert.match(source, /if \(evidence\?\.retained/);
  assert.match(source, /if \(state\.itemIndex >= state\.queue\.length && state\.manualStudy\)/);
  assert.match(source, /This changes access only/);
});
''')

print("Profile/settings upgrade applied")
