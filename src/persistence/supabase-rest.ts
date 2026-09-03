import type { DerivedSkillEvidence } from "../learning/index.js";
import type { SchedulerCardSnapshot, SchedulerReviewLog } from "../scheduler/index.js";
import type { DueReview, SessionPlan } from "../session/index.js";
import type { AppendAttemptInput, TutorRepository } from "./repository.js";
import type {
  SkillStateRecord,
  StoredAttempt,
  StoredSchedulerCard,
  StudySessionRecord,
  UserLearningSettings,
} from "./types.js";

export interface SupabaseRestRepositoryOptions {
  url: string;
  /** Current Supabase client-side key name. Safe to ship only with RLS in place. */
  publishableKey?: string;
  /** Legacy alias retained for older Supabase projects/tests. */
  anonKey?: string;
  /** Static token is retained for tests/non-refreshing callers. */
  accessToken?: string;
  /** Production browser callers should provide a fresh session token per request. */
  getAccessToken?: () => string | Promise<string>;
  fetchImpl?: typeof fetch;
}

function filterValue(value: string) {
  return encodeURIComponent(value);
}

export class SupabaseRestTutorRepository implements TutorRepository {
  private readonly base: string;
  private readonly apiKey: string;
  private readonly accessToken?: string;
  private readonly getAccessToken?: () => string | Promise<string>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SupabaseRestRepositoryOptions) {
    this.base = `${options.url.replace(/\/$/, "")}/rest/v1`;
    const apiKey = options.publishableKey ?? options.anonKey;
    if (!apiKey) throw new Error("Supabase REST repository requires a publishable/anon API key");
    this.apiKey = apiKey;
    this.accessToken = options.accessToken;
    this.getAccessToken = options.getAccessToken;
    // Safari/WebKit requires Window.fetch to be called with Window as its receiver.
    // Wrapping it also keeps injected fetch implementations working in tests.
    this.fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
    if (!this.accessToken && !this.getAccessToken) {
      throw new Error("Supabase REST repository requires an authenticated access token provider");
    }
  }

  private async token() {
    const value = this.getAccessToken ? await this.getAccessToken() : this.accessToken;
    if (!value) throw new Error("Supabase session expired or is unavailable");
    return value;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const accessToken = await this.token();
    const response = await this.fetchImpl(`${this.base}/${path}`, {
      ...init,
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase REST ${response.status}: ${body}`);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async createSession(userId: string, startedAt: string, plan: SessionPlan): Promise<StudySessionRecord> {
    const rows = await this.request<any[]>("study_sessions?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ user_id: userId, started_at: startedAt, plan_snapshot: plan ?? null }),
    });
    const row = rows[0];
    return { id: row.id, userId: row.user_id, startedAt: row.started_at, completedAt: row.completed_at ?? undefined, plan: row.plan_snapshot };
  }

  async completeSession(sessionId: string, completedAt: string): Promise<void> {
    await this.request(`study_sessions?id=eq.${filterValue(sessionId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ completed_at: completedAt }) });
  }

  async getSkillState(userId: string, skillId: string): Promise<SkillStateRecord | undefined> {
    const rows = await this.request<any[]>(`skill_state?user_id=eq.${filterValue(userId)}&skill_id=eq.${filterValue(skillId)}&select=*`);
    const row = rows[0];
    return row ? this.mapSkillState(row) : undefined;
  }

  async listSkillStates(userId: string): Promise<SkillStateRecord[]> {
    const rows = await this.request<any[]>(`skill_state?user_id=eq.${filterValue(userId)}&select=*`);
    return rows.map((row) => this.mapSkillState(row));
  }

  async upsertSkillState(record: SkillStateRecord): Promise<void> {
    await this.request("skill_state?on_conflict=user_id,skill_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(this.skillStateRow(record)) });
  }

  async appendAttempt(input: AppendAttemptInput): Promise<StoredAttempt> {
    const rows = await this.request<any[]>("learning_attempts?select=*", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ user_id: input.userId, session_id: input.sessionId ?? null, skill_id: input.skillId, attempted_at: input.attemptedAt, context: input.context, directness: input.directness, independence: input.independence, correct: input.correct, first_probe: input.firstProbe, variation: input.variation, application: input.application, latency_ms: input.latencyMs ?? null, error_type: input.errorType ?? null }) });
    return this.mapAttempt(rows[0]);
  }

  async recentAttempts(userId: string, skillId: string, limit: number): Promise<StoredAttempt[]> {
    const rows = await this.request<any[]>(`learning_attempts?user_id=eq.${filterValue(userId)}&skill_id=eq.${filterValue(skillId)}&order=attempted_at.desc&limit=${limit}&select=*`);
    return rows.map((row) => this.mapAttempt(row));
  }

  async directEvidenceForSkill(userId: string, skillId: string, limit: number): Promise<StoredAttempt[]> {
    const rows = await this.request<any[]>(`learning_attempts?user_id=eq.${filterValue(userId)}&skill_id=eq.${filterValue(skillId)}&directness=eq.direct&order=attempted_at.desc&limit=${limit}&select=*`);
    return rows.map((row) => this.mapAttempt(row));
  }

  async derivedEvidenceForSkill(userId: string, skillId: string, limit: number): Promise<DerivedSkillEvidence[]> {
    const rows = await this.request<any[]>(`learning_attempts?user_id=eq.${filterValue(userId)}&skill_id=eq.${filterValue(skillId)}&directness=eq.inferred&order=attempted_at.desc&limit=${limit}&select=*`);
    return rows.map((row) => ({ skillId: row.skill_id, attemptedAt: row.attempted_at, correct: row.correct, context: row.context }));
  }

  async getSchedulerCard(userId: string, skillId: string): Promise<StoredSchedulerCard | undefined> {
    const rows = await this.request<any[]>(`scheduler_cards?user_id=eq.${filterValue(userId)}&skill_id=eq.${filterValue(skillId)}&select=*`);
    const row = rows[0];
    return row ? this.mapSchedulerCard(row) : undefined;
  }

  async upsertSchedulerCard(card: StoredSchedulerCard): Promise<void> {
    await this.request("scheduler_cards?on_conflict=user_id,skill_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: card.userId, skill_id: card.skillId, due_at: card.dueAt, stability: card.stability, difficulty: card.difficulty, elapsed_days: card.elapsedDays, scheduled_days: card.scheduledDays, reps: card.reps, lapses: card.lapses, state: card.state, last_review_at: card.lastReviewAt ?? null, scheduler_version: card.schedulerVersion }) });
  }

  async appendSchedulerReview(log: SchedulerReviewLog): Promise<void> {
    await this.request("scheduler_reviews", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ user_id: log.userId, skill_id: log.skillId, reviewed_at: log.reviewedAt, rating: log.rating, event_kind: log.eventKind, previous_due_at: log.previousDueAt ?? null, next_due_at: log.nextDueAt, elapsed_days: log.elapsedDays, scheduled_days: log.scheduledDays, stability: log.stability, difficulty: log.difficulty, state: log.state }) });
  }

  async dueReviews(userId: string, now: string, limit: number): Promise<DueReview[]> {
    const rows = await this.request<any[]>(`scheduler_cards?user_id=eq.${filterValue(userId)}&due_at=lte.${filterValue(now)}&order=due_at.asc&limit=${limit}&select=skill_id,due_at`);
    return rows.map((row) => ({ skillId: row.skill_id, dueAt: row.due_at }));
  }

  async getSettings(userId: string): Promise<UserLearningSettings | undefined> {
    const rows = await this.request<any[]>(`user_learning_settings?user_id=eq.${filterValue(userId)}&select=*`);
    const row = rows[0];
    return row ? { userId: row.user_id, desiredRetention: Number(row.desired_retention), maximumIntervalDays: Number(row.maximum_interval_days), curriculumVersion: row.curriculum_version, schedulerVersion: row.scheduler_version } : undefined;
  }

  async upsertSettings(settings: UserLearningSettings): Promise<void> {
    await this.request("user_learning_settings?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: settings.userId, desired_retention: settings.desiredRetention, maximum_interval_days: settings.maximumIntervalDays, curriculum_version: settings.curriculumVersion, scheduler_version: settings.schedulerVersion }) });
  }

  private mapSkillState(row: any): SkillStateRecord { return { userId: row.user_id, skillId: row.skill_id, lifecycle: row.lifecycle, readyAt: row.ready_at ?? undefined, retainedAt: row.retained_at ?? undefined, lastDirectAttemptAt: row.last_direct_attempt_at ?? undefined, delayedReviewPasses: row.delayed_review_passes, recentColdReviewOutcomes: row.recent_cold_review_outcomes ?? [], recentVariationKeys: row.recent_variation_keys ?? [], applicationEvidenceCount: row.application_evidence_count ?? 0, fragileReason: row.fragile_reason ?? undefined }; }
  private skillStateRow(record: SkillStateRecord) { return { user_id: record.userId, skill_id: record.skillId, lifecycle: record.lifecycle, ready_at: record.readyAt ?? null, retained_at: record.retainedAt ?? null, last_direct_attempt_at: record.lastDirectAttemptAt ?? null, delayed_review_passes: record.delayedReviewPasses, recent_cold_review_outcomes: record.recentColdReviewOutcomes, recent_variation_keys: record.recentVariationKeys, application_evidence_count: record.applicationEvidenceCount, fragile_reason: record.fragileReason ?? null }; }
  private mapAttempt(row: any): StoredAttempt { return { id: row.id, userId: row.user_id, sessionId: row.session_id ?? undefined, skillId: row.skill_id, attemptedAt: row.attempted_at, context: row.context, directness: row.directness, independence: row.independence, correct: row.correct, firstProbe: row.first_probe, variation: row.variation, application: row.application, latencyMs: row.latency_ms ?? undefined, errorType: row.error_type ?? undefined }; }
  private mapSchedulerCard(row: any): StoredSchedulerCard { return { userId: row.user_id, skillId: row.skill_id, dueAt: row.due_at, stability: Number(row.stability), difficulty: Number(row.difficulty), elapsedDays: Number(row.elapsed_days), scheduledDays: Number(row.scheduled_days), reps: Number(row.reps), lapses: Number(row.lapses), state: row.state, lastReviewAt: row.last_review_at ?? undefined, schedulerVersion: row.scheduler_version }; }
}
