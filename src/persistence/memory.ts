import type { DerivedSkillEvidence } from "../learning/index.js";
import type { SchedulerCardSnapshot, SchedulerReviewLog } from "../scheduler/index.js";
import type { DueReview, SessionPlan } from "../session/index.js";
import type { AppendAttemptInput, TutorRepository } from "./repository.js";
import type {
  SkillStateRecord,
  StoredAttempt,
  StoredSchedulerCard,
  StoredSchedulerReview,
  StudySessionRecord,
  UserLearningSettings,
  UserProfile,
} from "./types.js";

let counter = 0;
function id(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}

export class InMemoryTutorRepository implements TutorRepository {
  readonly sessions: StudySessionRecord[] = [];
  readonly attempts: StoredAttempt[] = [];
  readonly skillStates = new Map<string, SkillStateRecord>();
  readonly cards = new Map<string, StoredSchedulerCard>();
  readonly schedulerReviews: StoredSchedulerReview[] = [];
  readonly settings = new Map<string, UserLearningSettings>();
  readonly profiles = new Map<string, UserProfile>();

  private key(userId: string, skillId: string) {
    return `${userId}::${skillId}`;
  }

  async createSession(userId: string, startedAt: string, plan?: SessionPlan): Promise<StudySessionRecord> {
    const row: StudySessionRecord = { id: id("session"), userId, startedAt, plan };
    this.sessions.push(row);
    return { ...row };
  }

  async completeSession(userId: string, sessionId: string, completedAt: string, completionReason: string): Promise<void> {
    const row = this.sessions.find((x) => x.id === sessionId && x.userId === userId);
    if (!row) throw new Error(`Unknown session ${sessionId}`);
    row.completedAt = completedAt;
    row.completionReason = completionReason;
  }

  async recentSessions(userId: string, limit = 10): Promise<StudySessionRecord[]> {
    return this.sessions
      .filter((x) => x.userId === userId)
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
      .slice(0, Math.max(0, limit))
      .map((x) => ({ ...x }));
  }

  async appendAttempt(input: AppendAttemptInput): Promise<StoredAttempt> {
    const row: StoredAttempt = { id: id("attempt"), ...input };
    this.attempts.push(row);
    return { ...row };
  }

  async attemptsForSkill(userId: string, skillId: string): Promise<StoredAttempt[]> {
    return this.attempts
      .filter((x) => x.userId === userId && x.skillId === skillId)
      .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))
      .map((x) => ({ ...x }));
  }

  async allSkillStates(userId: string): Promise<SkillStateRecord[]> {
    return [...this.skillStates.values()].filter((x) => x.userId === userId).map((x) => ({ ...x }));
  }

  async upsertSkillState(userId: string, skillId: string, evidence: DerivedSkillEvidence, lastAttemptAt?: string): Promise<void> {
    const updatedAt = lastAttemptAt ?? new Date().toISOString();
    this.skillStates.set(this.key(userId, skillId), { userId, skillId, evidence, lastAttemptAt, updatedAt });
  }

  async dueReviews(userId: string, at: string): Promise<DueReview[]> {
    const now = Date.parse(at);
    return [...this.cards.values()]
      .filter((x) => x.userId === userId && Date.parse(x.dueAt) <= now)
      .map((x) => {
        const overdueDays = Math.max(0, (now - Date.parse(x.dueAt)) / 86_400_000);
        return { skillId: x.skillId, dueAt: x.dueAt, urgency: 1 + overdueDays };
      });
  }

  async getSchedulerCard(userId: string, skillId: string): Promise<StoredSchedulerCard | undefined> {
    const card = this.cards.get(this.key(userId, skillId));
    return card ? { ...card } : undefined;
  }

  async upsertSchedulerCard(userId: string, card: SchedulerCardSnapshot): Promise<void> {
    this.cards.set(this.key(userId, card.skillId), { userId, ...card });
  }

  async appendSchedulerReview(userId: string, log: SchedulerReviewLog, eventKind: StoredSchedulerReview["eventKind"]): Promise<void> {
    this.schedulerReviews.push({ id: id("sched"), userId, eventKind, ...log });
  }

  async acquiringSkillIds(userId: string): Promise<string[]> {
    return [...this.skillStates.values()]
      .filter((x) => x.userId === userId && x.evidence.state === "acquiring")
      .map((x) => x.skillId);
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
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

  async upsertSettings(settings: UserLearningSettings): Promise<void> {
    this.settings.set(settings.userId, { ...settings });
  }
}
