import type { AcquisitionAction, DerivedSkillEvidence, LearningAttempt, SkillEvidencePolicy } from "./types.js";
export declare const DEFAULT_EVIDENCE_POLICY: SkillEvidencePolicy;
export declare function evidencePolicyForModes(modes?: readonly string[]): SkillEvidencePolicy;
export declare function normalizeLearningAttempt(input: LearningAttempt, previousInput?: readonly LearningAttempt[]): LearningAttempt;
export declare function deriveSkillEvidence(attemptsInput: readonly LearningAttempt[], policy?: SkillEvidencePolicy): DerivedSkillEvidence;
export declare function nextAcquisitionAction(attemptsInput: readonly LearningAttempt[], policy?: SkillEvidencePolicy): AcquisitionAction;
export declare function stateSatisfiesPrerequisite(evidence: DerivedSkillEvidence): boolean;
