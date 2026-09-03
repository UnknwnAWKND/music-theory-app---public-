import { SKILLS } from "../curriculum/index.js";
import { deriveSkillEvidence, type DerivedSkillEvidence } from "../learning/index.js";
import type { AppendAttemptInput, TutorRepository } from "../persistence/index.js";
import { ratingForAttempt, type ReviewSchedulerAdapter } from "../scheduler/index.js";
import { planSession, type SessionPlan } from "../session/index.js";

export interface TutorServiceOptions {
  repository: TutorRepository;
  scheduler?: ReviewSchedulerAdapter;
}

export interface StartedStudySession {
  sessionId: string;
  plan: SessionPlan;
}

export class TutorService {
  private readonly repository: TutorRepository;
  private readonly scheduler?: ReviewSchedulerAdapter;

  constructor(options: TutorServiceOptions) {
    this.repository = options.repository;
    this.scheduler = options.scheduler;
  }

  async previewPlan(userId: string, now = new Date()): Promise<SessionPlan> {
    const states = await this.repository.allSkillStates(userId);
    const evidenceBySkill = new Map<string, DerivedSkillEvidence>(states.map((x) => [x.skillId, x.evidence]));
    const dueReviews = await this.repository.dueReviews(userId, now.toISOString());
    const acquiringSkillIds = await this.repository.acquiringSkillIds(userId);
    return planSession({ evidenceBySkill, dueReviews, acquiringSkillIds });
  }

  async startSession(userId: string, now = new Date()): Promise<StartedStudySession> {
    const plan = await this.previewPlan(userId, now);
    const session = await this.repository.createSession(userId, now.toISOString(), plan);
    return { sessionId: session.id, plan };
  }

  async submitAttempt(input: AppendAttemptInput): Promise<DerivedSkillEvidence> {
    const previousAttempts = await this.repository.attemptsForSkill(input.userId, input.skillId);
    const previousEvidence = deriveSkillEvidence(previousAttempts);
    await this.repository.appendAttempt(input);
    const attempts = await this.repository.attemptsForSkill(input.userId, input.skillId);
    const evidence = deriveSkillEvidence(attempts);
    await this.repository.upsertSkillState(input.userId, input.skillId, evidence, input.occurredAt);

    if (this.scheduler) {
      const existingCard = await this.repository.getSchedulerCard(input.userId, input.skillId);
      const transitionedToReady = !previousEvidence.ready && evidence.ready;
      if (transitionedToReady && !existingCard) {
        const seeded = this.scheduler.initializeAfterAcquisition(input.skillId, new Date(input.occurredAt));
        await this.repository.upsertSchedulerCard(input.userId, seeded.card);
        await this.repository.appendSchedulerReview(input.userId, seeded.log, "initial-seed");
      } else if (
        input.context === "review" &&
        input.coldProbe &&
        input.independent &&
        input.directEvidence &&
        (input.outcome === "correct" || input.outcome === "incorrect") &&
        existingCard
      ) {
        const result = this.scheduler.schedule(existingCard, ratingForAttempt(input), new Date(input.occurredAt));
        await this.repository.upsertSchedulerCard(input.userId, result.card);
        await this.repository.appendSchedulerReview(input.userId, result.log, "review");
      }
    }
    return evidence;
  }

  async finishSession(userId: string, sessionId: string, reason = "planned-work-complete", now = new Date()): Promise<void> {
    await this.repository.completeSession(userId, sessionId, now.toISOString(), reason);
  }

  /** Rebuilds the derived skill-state cache from the append-only attempt log. */
  async rebuildSkillState(userId: string): Promise<void> {
    for (const skill of SKILLS) {
      const attempts = await this.repository.attemptsForSkill(userId, skill.id);
      if (attempts.length === 0) continue;
      const evidence = deriveSkillEvidence(attempts);
      await this.repository.upsertSkillState(userId, skill.id, evidence, attempts.at(-1)?.occurredAt);
    }
  }
}
