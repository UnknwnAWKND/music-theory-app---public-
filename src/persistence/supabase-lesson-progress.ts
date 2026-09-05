import type { LessonProgressState } from "../practice/index.js";
import { SupabaseRestTutorRepository } from "./supabase-rest.js";

declare module "./supabase-rest.js" {
  interface SupabaseRestTutorRepository {
    allLessonProgress(userId: string): Promise<LessonProgressState[]>;
    getLessonProgress(userId: string, lessonId: string): Promise<LessonProgressState | undefined>;
    upsertLessonProgress(userId: string, progress: LessonProgressState): Promise<void>;
  }
}

type Requester = {
  request<T>(path: string, init?: RequestInit): Promise<T>;
};

function requester(repo: SupabaseRestTutorRepository): Requester {
  return repo as unknown as Requester;
}

function lessonProgressState(row: any): LessonProgressState {
  return {
    lessonId: row.lesson_id,
    completionCount: row.completion_count,
    firstCompletedAt: row.first_completed_at ?? undefined,
    lastCompletedAt: row.last_completed_at ?? undefined,
  };
}

SupabaseRestTutorRepository.prototype.allLessonProgress = async function (userId) {
  const rows = await requester(this).request<any[]>(
    `lesson_progress?user_id=eq.${encodeURIComponent(userId)}&select=lesson_id,completion_count,first_completed_at,last_completed_at&order=lesson_id.asc`,
  );
  return rows.map(lessonProgressState);
};

SupabaseRestTutorRepository.prototype.getLessonProgress = async function (userId, lessonId) {
  const rows = await requester(this).request<any[]>(
    `lesson_progress?user_id=eq.${encodeURIComponent(userId)}&lesson_id=eq.${encodeURIComponent(lessonId)}&limit=1`,
  );
  const row = rows[0];
  return row ? lessonProgressState(row) : undefined;
};

SupabaseRestTutorRepository.prototype.upsertLessonProgress = async function (userId, progress) {
  await requester(this).request<void>("lesson_progress?on_conflict=user_id,lesson_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      lesson_id: progress.lessonId,
      completion_count: progress.completionCount,
      first_completed_at: progress.firstCompletedAt ?? null,
      last_completed_at: progress.lastCompletedAt ?? null,
      updated_at: new Date().toISOString(),
    }),
  });
};
