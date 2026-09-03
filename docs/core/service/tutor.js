import { SKILLS } from "../curriculum/index.js";
import { deriveSkillEvidence } from "../learning/index.js";
import { ratingForAttempt } from "../scheduler/index.js";
import { planSession } from "../session/index.js";
export class TutorService {
    repository;
    scheduler;
    constructor(options) {
        this.repository = options.repository;
        this.scheduler = options.scheduler;
    }
    async previewPlan(userId, now = new Date()) {
        const states = await this.repository.allSkillStates(userId);
        const evidenceBySkill = new Map(states.map((x) => [x.skillId, x.evidence]));
        const dueReviews = await this.repository.dueReviews(userId, now.toISOString());
        const acquiringSkillIds = await this.repository.acquiringSkillIds(userId);
        return planSession({ evidenceBySkill, dueReviews, acquiringSkillIds });
    }
    async startSession(userId, now = new Date()) {
        const plan = await this.previewPlan(userId, now);
        const session = await this.repository.createSession(userId, now.toISOString(), plan);
        return { sessionId: session.id, plan };
    }
    async submitAttempt(input) {
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
            }
            else if (input.context === "review" &&
                input.coldProbe &&
                input.independent &&
                input.directEvidence &&
                (input.outcome === "correct" || input.outcome === "incorrect") &&
                existingCard) {
                const result = this.scheduler.schedule(existingCard, ratingForAttempt(input), new Date(input.occurredAt));
                await this.repository.upsertSchedulerCard(input.userId, result.card);
                await this.repository.appendSchedulerReview(input.userId, result.log, "review");
            }
        }
        return evidence;
    }
    async finishSession(userId, sessionId, reason = "planned-work-complete", now = new Date()) {
        await this.repository.completeSession(userId, sessionId, now.toISOString(), reason);
    }
    /** Rebuilds the derived skill-state cache from the append-only attempt log. */
    async rebuildSkillState(userId) {
        for (const skill of SKILLS) {
            const attempts = await this.repository.attemptsForSkill(userId, skill.id);
            if (attempts.length === 0)
                continue;
            const evidence = deriveSkillEvidence(attempts);
            await this.repository.upsertSkillState(userId, skill.id, evidence, attempts.at(-1)?.occurredAt);
        }
    }
}
