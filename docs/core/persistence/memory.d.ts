import type { DerivedSkillEvidence } from "../learning/index.js";
import type { SchedulerCardSnapshot, SchedulerReviewLog } from "../scheduler/index.js";
import type { DueReview, SessionPlan } from "../session/index.js";
import type { AppendAttemptInput, TutorRepository } from "./repository.js";
import type { SkillStateRecord, StoredAttempt, StoredSchedulerCard, StoredSchedulerReview, StudySessionRecord, UserLearningSettings } from "./types.js";
export declare class InMemoryTutorRepository implements TutorRepository {
    readonly sessions: StudySessionRecord[];
    readonly attempts: StoredAttempt[];
    readonly skillStates: Map<string, SkillStateRecord>;
    readonly cards: Map<string, StoredSchedulerCard>;
    readonly schedulerReviews: StoredSchedulerReview[];
    readonly settings: Map<string, UserLearningSettings>;
    private key;
    createSession(userId: string, startedAt: string, plan?: SessionPlan): Promise<StudySessionRecord>;
    completeSession(userId: string, sessionId: string, completedAt: string, completionReason: string): Promise<void>;
    appendAttempt(input: AppendAttemptInput): Promise<StoredAttempt>;
    attemptsForSkill(userId: string, skillId: string): Promise<StoredAttempt[]>;
    allSkillStates(userId: string): Promise<SkillStateRecord[]>;
    upsertSkillState(userId: string, skillId: string, evidence: DerivedSkillEvidence, lastAttemptAt?: string): Promise<void>;
    dueReviews(userId: string, at: string): Promise<DueReview[]>;
    getSchedulerCard(userId: string, skillId: string): Promise<StoredSchedulerCard | undefined>;
    upsertSchedulerCard(userId: string, card: SchedulerCardSnapshot): Promise<void>;
    appendSchedulerReview(userId: string, log: SchedulerReviewLog, eventKind: StoredSchedulerReview["eventKind"]): Promise<void>;
    acquiringSkillIds(userId: string): Promise<string[]>;
    getSettings(userId: string): Promise<UserLearningSettings | undefined>;
    upsertSettings(settings: UserLearningSettings): Promise<void>;
}
