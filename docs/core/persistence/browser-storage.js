const EMPTY = {
    sessions: [], attempts: [], skillStates: [], cards: [], schedulerReviews: [], settings: [],
};
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function uid(prefix) {
    const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${random}`;
}
/**
 * Browser-only preview persistence. Production persistence remains Supabase.
 * This adapter intentionally stores the same repository shapes so the UI can be
 * exercised before deployment credentials are available.
 */
export class BrowserStorageTutorRepository {
    storage;
    storageKey;
    constructor(storage, storageKey = "music-theory-tutor:v1") {
        this.storage = storage;
        this.storageKey = storageKey;
    }
    read() {
        const raw = this.storage.getItem(this.storageKey);
        if (!raw)
            return clone(EMPTY);
        try {
            const parsed = JSON.parse(raw);
            return {
                sessions: parsed.sessions ?? [], attempts: parsed.attempts ?? [], skillStates: parsed.skillStates ?? [],
                cards: parsed.cards ?? [], schedulerReviews: parsed.schedulerReviews ?? [], settings: parsed.settings ?? [],
            };
        }
        catch {
            return clone(EMPTY);
        }
    }
    write(snapshot) { this.storage.setItem(this.storageKey, JSON.stringify(snapshot)); }
    async createSession(userId, startedAt, plan) {
        const db = this.read();
        const row = { id: uid("session"), userId, startedAt, plan };
        db.sessions.push(row);
        this.write(db);
        return clone(row);
    }
    async completeSession(userId, sessionId, completedAt, completionReason) {
        const db = this.read();
        const row = db.sessions.find((x) => x.id === sessionId && x.userId === userId);
        if (!row)
            throw new Error(`Unknown session ${sessionId}`);
        row.completedAt = completedAt;
        row.completionReason = completionReason;
        this.write(db);
    }
    async appendAttempt(input) {
        const db = this.read();
        const row = { id: uid("attempt"), ...clone(input) };
        db.attempts.push(row);
        this.write(db);
        return clone(row);
    }
    async attemptsForSkill(userId, skillId) {
        return this.read().attempts.filter((x) => x.userId === userId && x.skillId === skillId)
            .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt)).map(clone);
    }
    async allSkillStates(userId) {
        return this.read().skillStates.filter((x) => x.userId === userId).map(clone);
    }
    async upsertSkillState(userId, skillId, evidence, lastAttemptAt) {
        const db = this.read();
        const i = db.skillStates.findIndex((x) => x.userId === userId && x.skillId === skillId);
        const updatedAt = lastAttemptAt ?? new Date().toISOString();
        const row = { userId, skillId, evidence: clone(evidence), lastAttemptAt, updatedAt };
        if (i >= 0)
            db.skillStates[i] = row;
        else
            db.skillStates.push(row);
        this.write(db);
    }
    async dueReviews(userId, at) {
        const now = Date.parse(at);
        return this.read().cards.filter((x) => x.userId === userId && Date.parse(x.dueAt) <= now)
            .map((x) => ({ skillId: x.skillId, dueAt: x.dueAt, urgency: 1 + Math.max(0, (now - Date.parse(x.dueAt)) / 86_400_000) }));
    }
    async getSchedulerCard(userId, skillId) {
        const row = this.read().cards.find((x) => x.userId === userId && x.skillId === skillId);
        return row ? clone(row) : undefined;
    }
    async upsertSchedulerCard(userId, card) {
        const db = this.read();
        const row = { userId, ...clone(card) };
        const i = db.cards.findIndex((x) => x.userId === userId && x.skillId === card.skillId);
        if (i >= 0)
            db.cards[i] = row;
        else
            db.cards.push(row);
        this.write(db);
    }
    async appendSchedulerReview(userId, log, eventKind) {
        const db = this.read();
        db.schedulerReviews.push({ id: uid("sched"), userId, eventKind, ...clone(log) });
        this.write(db);
    }
    async acquiringSkillIds(userId) {
        return this.read().skillStates.filter((x) => x.userId === userId && x.evidence.state === "acquiring").map((x) => x.skillId);
    }
    async getSettings(userId) {
        const row = this.read().settings.find((x) => x.userId === userId);
        return row ? clone(row) : undefined;
    }
    async upsertSettings(settings) {
        const db = this.read();
        const i = db.settings.findIndex((x) => x.userId === settings.userId);
        if (i >= 0)
            db.settings[i] = clone(settings);
        else
            db.settings.push(clone(settings));
        this.write(db);
    }
}
