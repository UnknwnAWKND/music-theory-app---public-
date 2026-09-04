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
  UserProfile,
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
    this.fetchImpl = options.fetchImpl ?? fetch;
    if (!this.accessToken && !this.getAccessToken) {
      throw new Error("Supabase REST repository requires an authenticated access token provider");
    }
  }

  private async token(): Promise<string> {
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

  async createSession(userId: string, startedAt: string, plan?: SessionPlan): Promise<StudySessionRecord> {
    const rows = await this.request<any[]>("study_sessions?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ user_id: userId, started_at: startedAt, plan_snapshot: plan ?? null }),
    });
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
      completionReason: row.completion_reason ?? undefined,
      plan: row.plan_snapshot ?? undefined,
    };
  }

  async completeSession(userId: string, sessionId: string, completedAt: string, completionReason: string): Promise<void> {
    await this.request<void>(`study_sessions?id=eq.${filterValue(sessionId)}&user_id=eq.${filterValue(userId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ completed_at: completedAt, completion_reason: completionReason }),
    });
  }

  async recentSessions(userId: string, limit = 10): Promise<StudySessionRecord[]> {
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

  async appendAttempt(input: AppendAttemptInput): Promise<StoredAttempt> {
    const rows = await this.request<any[]>("learning_attempts?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: input.userId,
        session_id: input.sessionId,
        skill_id: input.skillId,
        prompt_signature: input.promptSignature,
        occurred_at: input.occurredAt,
        outcome: input.outcome,
        independent: input.independent,
        direct_evidence: input.directEvidence,
        evidence_context: input.context,
        cold_probe: input.coldProbe ?? false,
        response_ms: input.responseMs ?? null,
        assessment_code: input.assessmentCode ?? null,
        metadata: input.metadata ?? {},
        evidence_source: input.evidenceSource ?? "objective",
        event_kind: input.eventKind ?? "response",
        submission_index: input.submissionIndex ?? null,
        first_submission: input.firstSubmission ?? null,
        attempt_stage: input.stage ?? "initial",
        response_mode: input.responseMode ?? null,
        guidance: input.guidance ?? "none",
        solution_seen: input.solutionSeen ?? false,
        example_signature: input.exampleSignature ?? null,
        example_attributes: input.exampleAttributes ?? {},
        confusion_with: input.confusionWith ?? null,
        prior_relevant_exposure_at: input.priorRelevantExposureAt ?? null,
        elapsed_since_relevant_exposure_ms: input.elapsedSinceRelevantExposureMs ?? null,
        evidence_version: input.evidenceVersion ?? "v2",
      }),
    });
    const r = rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      sessionId: r.session_id,
      skillId: r.skill_id,
      promptSignature: r.prompt_signature,
      occurredAt: r.occurred_at,
      outcome: r.outcome,
      independent: r.independent,
      directEvidence: r.direct_evidence,
      context: r.evidence_context,
      coldProbe: r.cold_probe,
      responseMs: r.response_ms ?? undefined,
      assessmentCode: r.assessment_code ?? undefined,
      metadata: r.metadata ?? {},
      evidenceSource: r.evidence_source ?? "objective",
      eventKind: r.event_kind ?? "response",
      submissionIndex: r.submission_index ?? undefined,
      firstSubmission: r.first_submission ?? undefined,
      stage: r.attempt_stage ?? undefined,
      responseMode: r.response_mode ?? undefined,
      guidance: r.guidance ?? undefined,
      solutionSeen: r.solution_seen ?? false,
      exampleSignature: r.example_signature ?? undefined,
      exampleAttributes: r.example_attributes ?? undefined,
      confusionWith: r.confusion_with ?? undefined,
      priorRelevantExposureAt: r.prior_relevant_exposure_at ?? undefined,
      elapsedSinceRelevantExposureMs: r.elapsed_since_relevant_exposure_ms ?? undefined,
      evidenceVersion: r.evidence_version ?? "legacy-v1",
    };
  }

  async attemptsForSkill(userId: string, skillId: string): Promise<StoredAttempt[]> {
    const rows = await this.request<any[]>(`learning_attempts?user_id=eq.${filterValue(userId)}&skill_id=eq.${filterValue(skillId)}&order=occurred_at.asc`);
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      sessionId: r.session_id,
      skillId: r.skill_id,
      promptSignature: r.prompt_signature,
      occurredAt: r.occurred_at,
      outcome: r.outcome,
      independent: r.independent,
      directEvidence: r.direct_evidence,
      context: r.evidence_context,
      coldProbe: r.cold_probe,
      responseMs: r.response_ms ?? undefined,
      assessmentCode: r.assessment_code ?? undefined,
      metadata: r.metadata ?? {},
      evidenceSource: r.evidence_source ?? "objective",
      eventKind: r.event_kind ?? "response",
      submissionIndex: r.submission_index ?? undefined,
      firstSubmission: r.first_submission ?? undefined,
      stage: r.attempt_stage ?? undefined,
      responseMode: r.response_mode ?? undefined,
      guidance: r.guidance ?? undefined,
      solutionSeen: r.solution_seen ?? false,
      exampleSignature: r.example_signature ?? undefined,
      exampleAttributes: r.example_attributes ?? undefined,
      confusionWith: r.confusion_with ?? undefined,
      priorRelevantExposureAt: r.prior_relevant_exposure_at ?? undefined,
      elapsedSinceRelevantExposureMs: r.elapsed_since_relevant_exposure_ms ?? undefined,
      evidenceVersion: r.evidence_version ?? "legacy-v1",
    }));
  }

  async allSkillStates(userId: string): Promise<SkillStateRecord[]> {
    const rows = await this.request<any[]>(`skill_state?user_id=eq.${filterValue(userId)}`);
    return rows.map((r) => {
      const evidence: DerivedSkillEvidence = r.evidence_summary && Object.keys(r.evidence_summary).length
        ? r.evidence_summary
        : {
          state: r.learning_state,
          ready: r.ready,
          retained: r.retained,
          fragile: r.fragile,
          retentionAtRisk: false,
          everRetained: r.retained,
          readinessBasis: r.ready ? "legacy-v1" : "none",
          readyEstablishedAt: r.ready_established_at ?? undefined,
          retainedEstablishedAt: r.retained_established_at ?? undefined,
          acquisitionIndependentSuccesses: r.acquisition_successes,
          acquisitionDistinctSuccessfulPrompts: r.distinct_successful_prompts,
          successfulDelayedReviewSessions: r.successful_delayed_reviews,
          independentFirstAttemptSuccesses: 0,
          independentFirstAttemptFailures: 0,
          distinctSuccessfulExamples: 0,
          recognitionSuccesses: 0,
          constructedSuccesses: 0,
          discriminationSuccesses: 0,
          applicationSuccesses: 0,
          hintedOrGuidedSuccesses: 0,
          answerRevealEvents: 0,
          immediatePostInstructionResponses: 0,
          successfulColdRetrievals: r.successful_delayed_reviews,
          failedColdRetrievals: 0,
          successfulRelearningEvents: 0,
          recentColdReviewResults: [],
          lastDirectOutcome: r.last_direct_outcome ?? undefined,
          evidenceBasis: r.evidence_basis ?? "none",
          confusions: {},
          evidenceVersion: "v2",
        };
      return {
        userId: r.user_id,
        skillId: r.skill_id,
        evidence,
        lastAttemptAt: r.last_attempt_at ?? undefined,
        updatedAt: r.updated_at,
      };
    });
  }

  async upsertSkillState(userId: string, skillId: string, evidence: DerivedSkillEvidence, lastAttemptAt?: string): Promise<void> {
    await this.request<void>("skill_state?on_conflict=user_id,skill_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        skill_id: skillId,
        learning_state: evidence.state,
        ready: evidence.ready,
        retained: evidence.retained,
        fragile: evidence.fragile,
        acquisition_successes: evidence.acquisitionIndependentSuccesses,
        distinct_successful_prompts: evidence.acquisitionDistinctSuccessfulPrompts,
        successful_delayed_reviews: evidence.successfulDelayedReviewSessions,
        last_direct_outcome: evidence.lastDirectOutcome ?? null,
        evidence_basis: evidence.evidenceBasis,
        evidence_summary: evidence,
        evidence_version: evidence.evidenceVersion,
        ready_established_at: evidence.readyEstablishedAt ?? null,
        retained_established_at: evidence.retainedEstablishedAt ?? null,
        last_attempt_at: lastAttemptAt ?? null,
        updated_at: lastAttemptAt ?? new Date().toISOString(),
      }),
    });
  }

  async dueReviews(userId: string, at: string): Promise<DueReview[]> {
    const rows = await this.request<any[]>(`scheduler_cards?user_id=eq.${filterValue(userId)}&due_at=lte.${filterValue(at)}&order=due_at.asc`);
    const now = Date.parse(at);
    return rows.map((r) => ({
      skillId: r.skill_id,
      dueAt: r.due_at,
      urgency: 1 + Math.max(0, (now - Date.parse(r.due_at)) / 86_400_000),
    }));
  }

  async getSchedulerCard(userId: string, skillId: string): Promise<StoredSchedulerCard | undefined> {
    const rows = await this.request<any[]>(`scheduler_cards?user_id=eq.${filterValue(userId)}&skill_id=eq.${filterValue(skillId)}&limit=1`);
    const r = rows[0];
    if (!r) return undefined;
    return {
      userId: r.user_id,
      skillId: r.skill_id,
      dueAt: r.due_at,
      stability: r.stability,
      difficulty: r.difficulty,
      elapsedDays: r.elapsed_days,
      scheduledDays: r.scheduled_days,
      learningSteps: r.learning_steps,
      reps: r.reps,
      lapses: r.lapses,
      state: r.scheduler_state,
      lastReviewAt: r.last_review_at ?? undefined,
      schedulerVersion: r.scheduler_version,
    };
  }

  async upsertSchedulerCard(userId: string, card: SchedulerCardSnapshot): Promise<void> {
    await this.request<void>("scheduler_cards?on_conflict=user_id,skill_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        skill_id: card.skillId,
        due_at: card.dueAt,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsedDays,
        scheduled_days: card.scheduledDays,
        learning_steps: card.learningSteps,
        reps: card.reps,
        lapses: card.lapses,
        scheduler_state: card.state,
        last_review_at: card.lastReviewAt ?? null,
        scheduler_version: card.schedulerVersion,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  async appendSchedulerReview(userId: string, log: SchedulerReviewLog, eventKind: "initial-seed" | "review"): Promise<void> {
    await this.request<void>("scheduler_reviews", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        skill_id: log.skillId,
        event_kind: eventKind,
        reviewed_at: log.reviewedAt,
        rating: log.rating,
        due_before: log.dueBefore,
        due_after: log.dueAfter,
        card_before: log.cardBefore,
        card_after: log.cardAfter,
        scheduler_version: log.cardAfter.schedulerVersion,
      }),
    });
  }

  async acquiringSkillIds(userId: string): Promise<string[]> {
    const rows = await this.request<any[]>(`skill_state?user_id=eq.${filterValue(userId)}&learning_state=eq.acquiring&select=skill_id`);
    return rows.map((r) => r.skill_id);
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
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

  async getSettings(userId: string): Promise<UserLearningSettings | undefined> {
    const rows = await this.request<any[]>(`user_learning_settings?user_id=eq.${filterValue(userId)}&limit=1`);
    const r = rows[0];
    if (!r) return undefined;
    return {
      userId: r.user_id,
      desiredRetention: r.desired_retention,
      maximumIntervalDays: r.maximum_interval_days,
      requirePreviousLessons: r.require_previous_lessons ?? true,
      curriculumVersion: r.curriculum_version,
      schedulerVersion: r.scheduler_version,
    };
  }

  async upsertSettings(settings: UserLearningSettings): Promise<void> {
    await this.request<void>("user_learning_settings?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: settings.userId,
        desired_retention: settings.desiredRetention,
        maximum_interval_days: settings.maximumIntervalDays,
        require_previous_lessons: settings.requirePreviousLessons,
        curriculum_version: settings.curriculumVersion,
        scheduler_version: settings.schedulerVersion,
        updated_at: new Date().toISOString(),
      }),
    });
  }
}
