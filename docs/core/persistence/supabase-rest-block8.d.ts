import { SupabaseRestTutorRepository as BaseSupabaseRestTutorRepository, type SupabaseRestRepositoryOptions } from "./supabase-rest.js";
import type { UserLearningSettings } from "./types.js";
export type { SupabaseRestRepositoryOptions };
export declare class SupabaseRestTutorRepository extends BaseSupabaseRestTutorRepository {
    constructor(options: SupabaseRestRepositoryOptions);
    getSettings(userId: string): Promise<UserLearningSettings | undefined>;
    upsertSettings(settings: UserLearningSettings): Promise<void>;
}
