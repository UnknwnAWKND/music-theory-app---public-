import type { DerivedSkillEvidence } from "../learning/index.js";
import type { SchedulerCardSnapshot, SchedulerReviewLog } from "../scheduler/index.js";
import type { DueReview, SessionPlan } from "../session/index.js";
import type { AppendAttemptInput, TutorRepository } from "./repository.js";
import type { SkillStateRecord, PhaseProgressRecord, StoredAttempt, StoredSchedulerCard, StudySessionRecord, UserLearningSettings, UserProfile } from "./types.js";
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
export declare class SupabaseRestTutorRepository implements TutorRepository {
    private readonly base;
    private readonly apiKey;
    private readonly accessToken?;
    private readonly getAccessToken?;
    private readonly fetchImpl;
    constructor(options: SupabaseRestRepositoryOptions);
    private token;
    private request;
    createSession(userId: string, startedAt: string, plan?: SessionPlan): Promise<StudySessionRecord>;
    completeSession(userId: string, sessionId: string, completedAt: string, completionReason: string): Promise<void>;
    recentSessions(userId: string, limit?: number): Promise<StudySessionRecord[]>;
    appendAttempt(input: AppendAttemptInput): Promise<StoredAttempt>;
    attemptsForSkill(userId: string, skillId: string): Promise<StoredAttempt[]>;
    allSkillStates(userId: string): Promise<SkillStateRecord[]>;
    upsertSkillState(userId: string, skillId: string, evidence: DerivedSkillEvidence, lastAttemptAt?: string): Promise<void>;
    dueReviews(userId: string, at: string): Promise<DueReview[]>;
    getSchedulerCard(userId: string, skillId: string): Promise<StoredSchedulerCard | undefined>;
    upsertSchedulerCard(userId: string, card: SchedulerCardSnapshot): Promise<void>;
    appendSchedulerReview(userId: string, log: SchedulerReviewLog, eventKind: "initial-seed" | "review"): Promise<void>;
    acquiringSkillIds(userId: string): Promise<string[]>;
    phaseProgress(userId: string): Promise<PhaseProgressRecord[]>;
    upsertPhaseProgress(record: PhaseProgressRecord): Promise<void>;
    getProfile(userId: string): Promise<UserProfile | undefined>;
    upsertProfile(userId: string, displayName: string, createdAt?: string): Promise<void>;
    getSettings(userId: string): Promise<UserLearningSettings | undefined>;
    upsertSettings(settings: UserLearningSettings): Promise<void>;
}
