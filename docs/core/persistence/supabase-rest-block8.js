import { SupabaseRestTutorRepository as BaseSupabaseRestTutorRepository, } from "./supabase-rest.js";
function requester(repo) {
    return repo;
}
export class SupabaseRestTutorRepository extends BaseSupabaseRestTutorRepository {
    constructor(options) {
        super(options);
    }
    async getSettings(userId) {
        const rows = await requester(this).request(`user_learning_settings?user_id=eq.${encodeURIComponent(userId)}&limit=1`);
        const r = rows[0];
        if (!r)
            return undefined;
        return {
            userId: r.user_id,
            desiredRetention: r.desired_retention,
            maximumIntervalDays: r.maximum_interval_days,
            requirePreviousLessons: r.require_previous_lessons ?? true,
            theme: r.theme === "light" ? "light" : "dark",
            curriculumVersion: r.curriculum_version,
            schedulerVersion: r.scheduler_version,
        };
    }
    async upsertSettings(settings) {
        await requester(this).request("user_learning_settings?on_conflict=user_id", {
            method: "POST",
            headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
            body: JSON.stringify({
                user_id: settings.userId,
                desired_retention: settings.desiredRetention,
                maximum_interval_days: settings.maximumIntervalDays,
                require_previous_lessons: settings.requirePreviousLessons,
                theme: settings.theme === "light" ? "light" : "dark",
                curriculum_version: settings.curriculumVersion,
                scheduler_version: settings.schedulerVersion,
                updated_at: new Date().toISOString(),
            }),
        });
    }
}
