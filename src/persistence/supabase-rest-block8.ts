import {
  SupabaseRestTutorRepository as BaseSupabaseRestTutorRepository,
  type SupabaseRestRepositoryOptions,
} from "./supabase-rest.js";
import type { UserLearningSettings } from "./types.js";

export type { SupabaseRestRepositoryOptions };

type Requester = {
  request<T>(path: string, init?: RequestInit): Promise<T>;
};

function requester(repo: BaseSupabaseRestTutorRepository): Requester {
  return repo as unknown as Requester;
}

export class SupabaseRestTutorRepository extends BaseSupabaseRestTutorRepository {
  constructor(options: SupabaseRestRepositoryOptions) {
    super(options);
  }

  override async getSettings(userId: string): Promise<UserLearningSettings | undefined> {
    const rows = await requester(this).request<any[]>(
      `user_learning_settings?user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    );
    const r = rows[0];
    if (!r) return undefined;
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

  override async upsertSettings(settings: UserLearningSettings): Promise<void> {
    await requester(this).request<void>("user_learning_settings?on_conflict=user_id", {
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
