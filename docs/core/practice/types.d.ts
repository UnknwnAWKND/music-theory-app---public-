export type LessonExpectation = "know-instantly" | "understand";
export interface LessonTeachingStep {
    id: string;
    title: string;
    body: string;
    workedExample?: string;
    payoff?: string;
    expectation?: LessonExpectation;
    visual?: {
        kind: "piano" | "interval" | "scale" | "chord" | "circle";
        data?: Record<string, unknown>;
    };
}
export interface LessonContent {
    skillId: string;
    title: string;
    teachingSteps: readonly LessonTeachingStep[];
}
export interface LessonProgressState {
    lessonId: string;
    completionCount: number;
    firstCompletedAt?: string;
    lastCompletedAt?: string;
}
