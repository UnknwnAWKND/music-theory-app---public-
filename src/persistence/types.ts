import type { DerivedSkillEvidence, LearningAttempt } from "../learning/index.js";
import type { SchedulerCardSnapshot, SchedulerReviewLog } from "../scheduler/index.js";
import type { SessionPlan } from "../session/index.js";

export interface StoredAttempt extends LearningAttempt {
  id: string;
  userId: string;
  responseMs?: number;
  assessmentCode?: string;
  metadata?: Record<string, unknown>;
}

export interface StudySessionRecord {
  id: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  completionReason?: string;
  plan?: SessionPlan;
}

export interface SkillStateRecord {
  userId: string;
  skillId: string;
  evidence: DerivedSkillEvidence;
  lastAttemptAt?: string;
  updatedAt: string;
}

export interface StoredSchedulerCard extends SchedulerCardSnapshot {
  userId: string;
}

export interface StoredSchedulerReview extends SchedulerReviewLog {
  id: string;
  userId: string;
  eventKind: "initial-seed" | "review";
}

export interface UserProfile {
  userId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLearningSettings {
  userId: string;
  desiredRetention: number;
  maximumIntervalDays: number;
  requirePreviousLessons: boolean;
  curriculumVersion: string;
  schedulerVersion: "fsrs-6";
}
