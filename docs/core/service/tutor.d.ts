import { type DerivedSkillEvidence } from "../learning/index.js";
import type { AppendAttemptInput, TutorRepository } from "../persistence/index.js";
import { type ReviewSchedulerAdapter } from "../scheduler/index.js";
import { type SessionPlan } from "../session/index.js";
export interface TutorServiceOptions {
    repository: TutorRepository;
    scheduler?: ReviewSchedulerAdapter;
}
export interface StartedStudySession {
    sessionId: string;
    plan: SessionPlan;
}
export declare class TutorService {
    private readonly repository;
    private readonly scheduler?;
    constructor(options: TutorServiceOptions);
    previewPlan(userId: string, now?: Date): Promise<SessionPlan>;
    startSession(userId: string, now?: Date): Promise<StartedStudySession>;
    submitAttempt(input: AppendAttemptInput): Promise<DerivedSkillEvidence>;
    finishSession(userId: string, sessionId: string, reason?: string, now?: Date): Promise<void>;
    /** Rebuilds the derived skill-state cache from the append-only attempt log. */
    rebuildSkillState(userId: string): Promise<void>;
}
