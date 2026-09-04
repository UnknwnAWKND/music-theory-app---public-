import type { PhaseNumber, SkillDefinition } from "./types.js";
export interface CurriculumValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function skillsForPhase(phase: PhaseNumber): SkillDefinition[];
export declare function validateCurriculumGraph(skills?: readonly SkillDefinition[]): CurriculumValidationResult;
export declare function topologicalSkillIds(skills?: readonly SkillDefinition[]): string[];
export declare function downstreamSkillIds(skillId: string): string[];
export declare function phaseNumbers(): PhaseNumber[];
