export type PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type EvidenceMode = "construct" | "identify" | "translate" | "transform" | "diagnose" | "apply";
export interface SkillDefinition {
    id: string;
    phase: PhaseNumber;
    title: string;
    prerequisites: readonly string[];
    evidence: readonly EvidenceMode[];
    tags?: readonly string[];
    optional?: boolean;
}
export interface GraphValidationResult {
    ok: boolean;
    missingPrerequisites: Array<{
        skillId: string;
        prerequisiteId: string;
    }>;
    duplicateIds: string[];
    cycles: string[][];
}
