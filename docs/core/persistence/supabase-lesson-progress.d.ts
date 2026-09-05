import type { LessonProgressState } from "../practice/index.js";
declare module "./supabase-rest.js" {
    interface SupabaseRestTutorRepository {
        allLessonProgress(userId: string): Promise<LessonProgressState[]>;
        getLessonProgress(userId: string, lessonId: string): Promise<LessonProgressState | undefined>;
        upsertLessonProgress(userId: string, progress: LessonProgressState): Promise<void>;
    }
}
