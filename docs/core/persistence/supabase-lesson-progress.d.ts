import type { LessonProgressState } from "../practice/index.js";
declare module "./supabase-rest.js" {
    interface SupabaseRestTutorRepository {
        getLessonProgress(userId: string, lessonId: string): Promise<LessonProgressState | undefined>;
        upsertLessonProgress(userId: string, progress: LessonProgressState): Promise<void>;
    }
}
