import type { DerivedSkillEvidence } from "../learning/index.js";
import type { LessonProgressState } from "../practice/index.js";
import type { SchedulerCardSnapshot, SchedulerReviewLog } from "../scheduler/index.js";
import type { DueReview, SessionPlan } from "../session/index.js";
import type { AppendAttemptInput, TutorRepository } from "./repository.js";
import type {
  SkillStateRecord,
  StoredAttempt,
  StoredLessonProgress,
  StoredSchedulerCard,
  StoredSchedulerReview,
  StudySessionRecord,
  PhaseProgressRecord,
  UserLearningSettings,
  UserProfile,
} from "./types.js";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface BrowserSnapshot {
  sessions: StudySessionRecord[];
  attempts: StoredAttempt[];
  skillStates: SkillStateRecord[];
  cards: StoredSchedulerCard[];
  schedulerReviews: StoredSchedulerReview[];
  settings: UserLearningSettings[];
  profiles: UserProfile[];
  phaseProgress: PhaseProgressRecord[];
  lessonProgress: StoredLessonProgress[];
}

const EMPTY: BrowserSnapshot = {
  sessions: [], attempts: [], skillStates: [], cards: [], schedulerReviews: [], settings: [], profiles: [], phaseProgress: [], lessonProgress: [],
};

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function uid(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

export class BrowserStorageTutorRepository implements TutorRepository {
  constructor(private readonly storage: KeyValueStorage, private readonly storageKey = "music-theory-tutor:v1") {}

  private read(): BrowserSnapshot {
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) return clone(EMPTY);
    try {
      const parsed = JSON.parse(raw) as Partial<BrowserSnapshot>;
      return {
        sessions: parsed.sessions ?? [], attempts: parsed.attempts ?? [], skillStates: parsed.skillStates ?? [],
        cards: parsed.cards ?? [], schedulerReviews: parsed.schedulerReviews ?? [], settings: parsed.settings ?? [], profiles: parsed.profiles ?? [],
        phaseProgress: parsed.phaseProgress ?? [], lessonProgress: parsed.lessonProgress ?? [],
      };
    } catch { return clone(EMPTY); }
  }
  private write(snapshot: BrowserSnapshot) { this.storage.setItem(this.storageKey, JSON.stringify(snapshot)); }

  async createSession(userId: string, startedAt: string, plan?: SessionPlan): Promise<StudySessionRecord> {
    const db = this.read(); const row: StudySessionRecord = { id: uid("session"), userId, startedAt, plan };
    db.sessions.push(row); this.write(db); return clone(row);
  }
  async completeSession(userId: string, sessionId: string, completedAt: string, completionReason: string): Promise<void> {
    const db = this.read(); const row = db.sessions.find((x) => x.id === sessionId && x.userId === userId);
    if (!row) throw new Error(`Unknown session ${sessionId}`);
    row.completedAt = completedAt; row.completionReason = completionReason; this.write(db);
  }
  async recentSessions(userId: string, limit = 10): Promise<StudySessionRecord[]> {
    return this.read().sessions.filter((x)=>x.userId===userId)
      .sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)).slice(0,Math.max(0,limit)).map(clone);
  }
  async appendAttempt(input: AppendAttemptInput): Promise<StoredAttempt> {
    const db = this.read(); const row: StoredAttempt = { id: uid("attempt"), ...clone(input) };
    db.attempts.push(row); this.write(db); return clone(row);
  }
  async attemptsForSkill(userId: string, skillId: string): Promise<StoredAttempt[]> {
    return this.read().attempts.filter((x) => x.userId === userId && x.skillId === skillId)
      .sort((a,b)=>Date.parse(a.occurredAt)-Date.parse(b.occurredAt)).map(clone);
  }
  async allSkillStates(userId: string): Promise<SkillStateRecord[]> {
    return this.read().skillStates.filter((x)=>x.userId===userId).map(clone);
  }
  async upsertSkillState(userId: string, skillId: string, evidence: DerivedSkillEvidence, lastAttemptAt?: string): Promise<void> {
    const db=this.read(); const i=db.skillStates.findIndex((x)=>x.userId===userId&&x.skillId===skillId);
    const updatedAt=lastAttemptAt??new Date().toISOString(); const row:SkillStateRecord={userId,skillId,evidence:clone(evidence),lastAttemptAt,updatedAt};
    if(i>=0) db.skillStates[i]=row; else db.skillStates.push(row); this.write(db);
  }
  async dueReviews(userId: string, at: string): Promise<DueReview[]> {
    const now=Date.parse(at); return this.read().cards.filter((x)=>x.userId===userId&&Date.parse(x.dueAt)<=now)
      .map((x)=>({skillId:x.skillId,dueAt:x.dueAt,urgency:1+Math.max(0,(now-Date.parse(x.dueAt))/86_400_000)}));
  }
  async getSchedulerCard(userId: string, skillId: string): Promise<StoredSchedulerCard|undefined> {
    const row=this.read().cards.find((x)=>x.userId===userId&&x.skillId===skillId); return row?clone(row):undefined;
  }
  async upsertSchedulerCard(userId: string, card: SchedulerCardSnapshot): Promise<void> {
    const db=this.read(); const row:StoredSchedulerCard={userId,...clone(card)}; const i=db.cards.findIndex((x)=>x.userId===userId&&x.skillId===card.skillId);
    if(i>=0) db.cards[i]=row; else db.cards.push(row); this.write(db);
  }
  async appendSchedulerReview(userId: string, log: SchedulerReviewLog, eventKind: StoredSchedulerReview["eventKind"]): Promise<void> {
    const db=this.read(); db.schedulerReviews.push({id:uid("sched"),userId,eventKind,...clone(log)}); this.write(db);
  }
  async acquiringSkillIds(userId: string): Promise<string[]> {
    return this.read().skillStates.filter((x)=>x.userId===userId&&x.evidence.state==="acquiring").map((x)=>x.skillId);
  }
  async phaseProgress(userId: string): Promise<PhaseProgressRecord[]> {
    return this.read().phaseProgress.filter((x)=>x.userId===userId).map(clone);
  }
  async upsertPhaseProgress(record: PhaseProgressRecord): Promise<void> {
    const db=this.read(); const i=db.phaseProgress.findIndex((x)=>x.userId===record.userId&&x.phase===record.phase);
    if(i>=0) db.phaseProgress[i]=clone(record); else db.phaseProgress.push(clone(record)); this.write(db);
  }
  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgressState|undefined> {
    const row=this.read().lessonProgress.find((x)=>x.userId===userId&&x.lessonId===lessonId);
    return row?{lessonId:row.lessonId,completionCount:row.completionCount,firstCompletedAt:row.firstCompletedAt,lastCompletedAt:row.lastCompletedAt}:undefined;
  }
  async upsertLessonProgress(userId: string, progress: LessonProgressState): Promise<void> {
    const db=this.read(); const i=db.lessonProgress.findIndex((x)=>x.userId===userId&&x.lessonId===progress.lessonId);
    const row:StoredLessonProgress={...clone(progress),userId,updatedAt:new Date().toISOString()};
    if(i>=0) db.lessonProgress[i]=row; else db.lessonProgress.push(row); this.write(db);
  }
  async getProfile(userId: string): Promise<UserProfile|undefined> {
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
  async upsertSettings(settings: UserLearningSettings): Promise<void> {
    const db=this.read(); const i=db.settings.findIndex((x)=>x.userId===settings.userId);
    if(i>=0) db.settings[i]=clone(settings); else db.settings.push(clone(settings)); this.write(db);
  }
}
