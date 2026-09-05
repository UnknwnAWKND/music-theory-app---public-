let counter = 0;
function id(prefix) {
    counter += 1;
    return `${prefix}-${counter}`;
}
function lessonProgressState(row) {
    return { lessonId: row.lessonId, completionCount: row.completionCount, firstCompletedAt: row.firstCompletedAt, lastCompletedAt: row.lastCompletedAt };
}
export class InMemoryTutorRepository {
    sessions = [];
    attempts = [];
    skillStates = new Map();
    cards = new Map();
    schedulerReviews = [];
    settings = new Map();
    profiles = new Map();
    phaseProgressRows = new Map();
    lessonProgressRows = new Map();
    key(userId, skillId) {
        return `${userId}::${skillId}`;
    }
    async createSession(userId, startedAt, plan) {
        const row = { id: id("session"), userId, startedAt, plan };
        this.sessions.push(row);
        return { ...row };
    }
    async completeSession(userId, sessionId, completedAt, completionReason) {
        const row = this.sessions.find((x) => x.id === sessionId && x.userId === userId);
        if (!row)
            throw new Error(`Unknown session ${sessionId}`);
        row.completedAt = completedAt;
        row.completionReason = completionReason;
    }
    async recentSessions(userId, limit = 10) {
        return this.sessions
            .filter((x) => x.userId === userId)
            .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
            .slice(0, Math.max(0, limit))
            .map((x) => ({ ...x }));
    }
    async appendAttempt(input) {
        const row = { id: id("attempt"), ...input };
        this.attempts.push(row);
        return { ...row };
    }
    async attemptsForSkill(userId, skillId) {
        return this.attempts
            .filter((x) => x.userId === userId && x.skillId === skillId)
            .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))
            .map((x) => ({ ...x }));
    }
    async allSkillStates(userId) {
        return [...this.skillStates.values()].filter((x) => x.userId === userId).map((x) => ({ ...x }));
    }
    async upsertSkillState(userId, skillId, evidence, lastAttemptAt) {
        const updatedAt = lastAttemptAt ?? new Date().toISOString();
        this.skillStates.set(this.key(userId, skillId), { userId, skillId, evidence, lastAttemptAt, updatedAt });
    }
    async dueReviews(userId, at) {
        const now = Date.parse(at);
        return [...this.cards.values()]
            .filter((x) => x.userId === userId && Date.parse(x.dueAt) <= now)
            .map((x) => {
            const overdueDays = Math.max(0, (now - Date.parse(x.dueAt)) / 86_400_000);
            return { skillId: x.skillId, dueAt: x.dueAt, urgency: 1 + overdueDays };
        });
    }
    async getSchedulerCard(userId, skillId) {
        const card = this.cards.get(this.key(userId, skillId));
        return card ? { ...card } : undefined;
    }
    async upsertSchedulerCard(userId, card) {
        this.cards.set(this.key(userId, card.skillId), { userId, ...card });
    }
    async appendSchedulerReview(userId, log, eventKind) {
        this.schedulerReviews.push({ id: id("sched"), userId, eventKind, ...log });
    }
    async acquiringSkillIds(userId) {
        return [...this.skillStates.values()]
            .filter((x) => x.userId === userId && x.evidence.state === "acquiring")
            .map((x) => x.skillId);
    }
    async phaseProgress(userId) {
        return [...this.phaseProgressRows.values()].filter((x) => x.userId === userId).map((x) => ({ ...x }));
    }
    async upsertPhaseProgress(record) {
        this.phaseProgressRows.set(`${record.userId}::${record.phase}`, { ...record });
    }
    async allLessonProgress(userId) {
        return [...this.lessonProgressRows.values()].filter((x) => x.userId === userId).map((row) => lessonProgressState(row));
    }
    async getLessonProgress(userId, lessonId) {
        const row = this.lessonProgressRows.get(this.key(userId, lessonId));
        return row ? lessonProgressState(row) : undefined;
    }
    async upsertLessonProgress(userId, progress) {
        this.lessonProgressRows.set(this.key(userId, progress.lessonId), { ...progress, userId, updatedAt: new Date().toISOString() });
    }
    async getProfile(userId) {
        const row = this.profiles.get(userId);
        return row ? { ...row } : undefined;
    }
    async upsertProfile(userId, displayName, createdAt) {
        const existing = this.profiles.get(userId);
        const now = new Date().toISOString();
        this.profiles.set(userId, {
            userId,
            displayName,
            createdAt: existing?.createdAt ?? createdAt ?? now,
            updatedAt: now,
        });
    }
    async getSettings(userId) {
        const row = this.settings.get(userId);
        return row ? { ...row, requirePreviousLessons: row.requirePreviousLessons ?? true } : undefined;
    }
    async upsertSettings(settings) {
        this.settings.set(settings.userId, { ...settings });
    }
}
