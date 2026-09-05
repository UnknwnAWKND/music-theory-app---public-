import { SKILLS, SKILL_BY_ID } from "../curriculum/index.js";
const PHASE1_CHECKPOINT = Object.freeze({
    phase: 1, minItems: 14, maxItems: 24, competencies: Object.freeze([
        { id: "perfect-construction", label: "Construct perfect unisons, octaves, 5ths, and 4ths", skillIds: ["intervals.lesson-1-unison-octave", "intervals.lesson-2-perfect-fifth", "intervals.lesson-3-perfect-fourth"], critical: true },
        { id: "major-minor-construction", label: "Construct major and minor 2nds, 3rds, 6ths, and 7ths", skillIds: ["intervals.lesson-4-thirds", "intervals.lesson-5-sixths", "intervals.lesson-6-seconds", "intervals.lesson-7-sevenths"], critical: true },
        { id: "interval-identification", label: "Identify exact interval number and quality from two notes", skillIds: SKILLS.filter((skill) => skill.phase === 1).map((skill) => skill.id), critical: true },
        { id: "interval-inversion", label: "Invert interval numbers and qualities accurately", skillIds: ["intervals.lesson-3-perfect-fourth", "intervals.lesson-5-sixths", "intervals.lesson-7-sevenths", "intervals.lesson-9-inversion-capstone"], critical: true },
        { id: "quality-discrimination", label: "Discriminate perfect, major, minor, augmented, and diminished qualities", skillIds: ["intervals.lesson-4-thirds", "intervals.lesson-5-sixths", "intervals.lesson-6-seconds", "intervals.lesson-7-sevenths", "intervals.lesson-8-tritone"], critical: true },
        { id: "tritone-spelling", label: "Distinguish and construct A4 versus d5 by spelling", skillIds: ["intervals.lesson-8-tritone", "intervals.lesson-10-cumulative"], critical: true },
        { id: "varied-root-spelling", label: "Construct intervals above natural, sharp, and flat roots", skillIds: ["intervals.lesson-8-tritone", "intervals.lesson-10-cumulative"], critical: true },
    ]),
});
const PHASE2_CHECKPOINT = Object.freeze({
    phase: 2, minItems: 14, maxItems: 24, competencies: Object.freeze([
        { id: "formula-understanding", label: "Apply W-W-H-W-W-W-H and connect it to tonic-based intervals", skillIds: ["major-scales.lesson-1-formula"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "scale-construction", label: "Construct complete major scales and individual scale tones", skillIds: ["major-scales.lesson-1-formula", "major-scales.lesson-3-build-all-roots", "major-scales.lesson-4-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "correct-spelling", label: "Use exact theoretical major-scale spelling rather than enharmonic substitutes", skillIds: ["major-scales.lesson-3-build-all-roots", "major-scales.lesson-4-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "scale-degrees", label: "Translate scale-degree numbers, names, and notes accurately", skillIds: ["major-scales.lesson-2-degree-names", "major-scales.lesson-3-build-all-roots", "major-scales.lesson-4-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "key-variety", label: "Demonstrate major-scale knowledge across varied roots, not only easy keys", skillIds: ["major-scales.lesson-3-build-all-roots", "major-scales.lesson-4-instant-recall"], critical: true, minStrongEvidence: 3, minDistinctExamples: 3 },
        { id: "instant-recall", label: "Recall major-scale information without formula scaffolding", skillIds: ["major-scales.lesson-4-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
    ]),
});
const PHASE3_CHECKPOINT = Object.freeze({
    phase: 3, minItems: 18, maxItems: 32, competencies: Object.freeze([
        { id: "natural-formula", label: "Apply W-H-W-W-H-W-W and connect natural minor to interval relationships", skillIds: ["minor-scales.lesson-1-natural-formula"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "all-root-construction", label: "Construct natural-minor scales and scale tones across varied roots", skillIds: ["minor-scales.lesson-2-natural-all-roots", "minor-scales.lesson-5-instant-recall"], critical: true, minStrongEvidence: 3, minDistinctExamples: 3 },
        { id: "harmonic-alteration", label: "Transform natural minor into harmonic minor by raising degree 7", skillIds: ["minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-5-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "melodic-alteration", label: "Apply raised 6 and 7 ascending and natural-minor pitches descending", skillIds: ["minor-scales.lesson-4-melodic-minor", "minor-scales.lesson-5-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "correct-spelling", label: "Spell minor forms with the correct scale-degree letters and accidentals", skillIds: ["minor-scales.lesson-2-natural-all-roots", "minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-4-melodic-minor", "minor-scales.lesson-5-instant-recall"], critical: true, minStrongEvidence: 3, minDistinctExamples: 3 },
        { id: "form-discrimination", label: "Discriminate natural, harmonic, melodic ascending, and melodic descending forms", skillIds: ["minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-4-melodic-minor", "minor-scales.lesson-5-instant-recall"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "leading-tone", label: "Identify the raised seventh as a leading tone and explain its tonic/dominant pull", skillIds: ["minor-scales.lesson-3-harmonic-minor"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "augmented-second", label: "Identify the harmonic-minor augmented 2nd between degrees 6 and 7", skillIds: ["minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-4-melodic-minor"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "key-variety", label: "Demonstrate minor-scale knowledge across varied roots rather than overusing A minor", skillIds: ["minor-scales.lesson-2-natural-all-roots", "minor-scales.lesson-3-harmonic-minor", "minor-scales.lesson-4-melodic-minor", "minor-scales.lesson-5-instant-recall"], critical: true, minStrongEvidence: 3, minDistinctExamples: 3 },
    ]),
});
const PHASE4_CHECKPOINT = Object.freeze({
    phase: 4, minItems: 20, maxItems: 36, competencies: Object.freeze([
        { id: "stacking-thirds", label: "Build triads by stacking diatonic thirds and identify root, 3rd, and 5th", skillIds: ["diatonic-chords.lesson-1-stacking-thirds"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "major-diatonic-triads", label: "Construct and label major-key diatonic triads across varied keys", skillIds: ["diatonic-chords.lesson-2-major-triads"], critical: true, minStrongEvidence: 3, minDistinctExamples: 3 },
        { id: "natural-minor-triads", label: "Construct and label natural-minor diatonic triads", skillIds: ["diatonic-chords.lesson-3-natural-minor-triads"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "harmonic-minor-triads", label: "Derive harmonic-minor triads including major V and augmented III", skillIds: ["diatonic-chords.lesson-4-harmonic-minor-triads"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "harmonic-minor-reason", label: "Explain how raised degree 7 changes V and III in harmonic minor", skillIds: ["diatonic-chords.lesson-4-harmonic-minor-triads"], critical: true, minStrongEvidence: 1, minDistinctExamples: 1 },
        { id: "melodic-minor-awareness", label: "Accurately derive ascending melodic-minor triads without over-weighting rote recall", skillIds: ["diatonic-chords.lesson-5-melodic-minor-triads"], critical: true, minStrongEvidence: 1, minDistinctExamples: 1 },
        { id: "seventh-chords", label: "Construct and identify diatonic seventh-chord qualities across all four scale collections", skillIds: ["diatonic-chords.lesson-6-seventh-chords"], critical: true, minStrongEvidence: 3, minDistinctExamples: 3 },
        { id: "correct-spelling", label: "Spell triads and seventh chords with exact theoretical note names", skillIds: ["diatonic-chords.lesson-2-major-triads", "diatonic-chords.lesson-3-natural-minor-triads", "diatonic-chords.lesson-6-seventh-chords"], critical: true, minStrongEvidence: 3, minDistinctExamples: 3, minDistinctSkills: 2 },
        { id: "roman-numeral-translation", label: "Translate between scale degree, chord spelling, and Roman numeral", skillIds: ["diatonic-chords.lesson-2-major-triads", "diatonic-chords.lesson-3-natural-minor-triads", "diatonic-chords.lesson-6-seventh-chords", "diatonic-chords.lesson-9-progressions", "diatonic-chords.lesson-10-own-progressions"], critical: true, minStrongEvidence: 3, minDistinctExamples: 3, minDistinctSkills: 2 },
        { id: "chord-function", label: "Apply tonic, predominant/subdominant, dominant, and context-dependent function accurately", skillIds: ["diatonic-chords.lesson-8-function"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2 },
        { id: "progression-application", label: "Transpose and analyze Roman-numeral progressions in multiple keys", skillIds: ["diatonic-chords.lesson-9-progressions", "diatonic-chords.lesson-10-own-progressions"], critical: true, minStrongEvidence: 2, minDistinctExamples: 2, minDistinctSkills: 2 },
    ]),
});
export function checkpointDefinition(phase) {
    if (phase === 1)
        return PHASE1_CHECKPOINT;
    if (phase === 2)
        return PHASE2_CHECKPOINT;
    if (phase === 3)
        return PHASE3_CHECKPOINT;
    if (phase === 4)
        return PHASE4_CHECKPOINT;
    return undefined;
}
export function allCheckpointDefinitions() { return [PHASE1_CHECKPOINT, PHASE2_CHECKPOINT, PHASE3_CHECKPOINT, PHASE4_CHECKPOINT]; }
function isStrong(result) { return result.correct && result.firstSubmission && result.independent && !result.guidanceUsed && !result.solutionSeen && ["constructed", "discrimination", "application"].includes(result.responseMode); }
function isModerate(result) { return result.correct && result.firstSubmission && result.independent && !result.guidanceUsed && !result.solutionSeen && result.responseMode === "recognition"; }
export function evaluateCheckpoint(definition, results) {
    const competencies = definition.competencies.map((competency) => {
        const rows = results.filter((result) => result.competencyId === competency.id);
        const strong = rows.filter(isStrong);
        const moderate = rows.filter(isModerate);
        const failures = rows.filter((result) => result.firstSubmission && result.independent && !result.correct).length;
        const successful = [...strong, ...moderate];
        const distinctSkills = new Set(successful.map((result) => result.skillId)).size;
        const distinctExamples = new Set(successful.map((result) => result.exampleSignature)).size;
        const minStrong = competency.minStrongEvidence ?? 1;
        const minExamples = competency.minDistinctExamples ?? 1;
        const minSkills = competency.minDistinctSkills ?? 1;
        const enoughEvidence = strong.length >= minStrong || (minStrong === 1 && moderate.length >= 2 && distinctExamples >= 2);
        const demonstrated = failures === 0 && enoughEvidence && distinctExamples >= minExamples && distinctSkills >= minSkills;
        return { competencyId: competency.id, label: competency.label, demonstrated, strongEvidence: strong.length, moderateEvidence: moderate.length, failures, distinctSkills, distinctExamples };
    });
    const hasContent = competencies.length > 0;
    const passed = hasContent && competencies.every((competency) => competency.demonstrated) && results.length >= definition.minItems;
    const complete = passed || (hasContent && results.length >= definition.maxItems);
    return { passed, complete, strong: competencies.filter((c) => c.demonstrated).map((c) => c.label), review: competencies.filter((c) => !c.demonstrated).map((c) => c.label), competencies };
}
export function nextCheckpointCompetency(definition, results) {
    if (!definition.competencies.length)
        return undefined;
    const evaluation = evaluateCheckpoint(definition, results);
    if (evaluation.complete)
        return undefined;
    const unresolved = definition.competencies.filter((competency) => !evaluation.competencies.find((row) => row.competencyId === competency.id)?.demonstrated);
    const candidates = unresolved.length ? unresolved : definition.competencies;
    const counts = new Map();
    for (const result of results)
        counts.set(result.competencyId, (counts.get(result.competencyId) ?? 0) + 1);
    return [...candidates].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
}
/** Placement prerequisites remain graph-derived; Phase 5+ placement content is not authored in Block 5. */
export function placementPrerequisitePhases(targetPhase) {
    const required = new Set();
    const seen = new Set();
    const visit = (skillId) => { if (seen.has(skillId))
        return; seen.add(skillId); const skill = SKILL_BY_ID.get(skillId); if (!skill)
        return; for (const dependencyId of skill.prerequisites) {
        const dependency = SKILL_BY_ID.get(dependencyId);
        if (!dependency)
            continue;
        if (dependency.phase < targetPhase)
            required.add(dependency.phase);
        visit(dependencyId);
    } };
    SKILLS.filter((skill) => skill.phase === targetPhase && !skill.optional).forEach((skill) => visit(skill.id));
    return [...required].sort((a, b) => a - b);
}
export function placementDefinition(targetPhase) { return { phase: targetPhase, competencies: [], minItems: 1, maxItems: 1 }; }
export function recommendStartingPhase(targetPhase, evaluation) { return evaluation.recommendedPhase ?? targetPhase; }
export function phaseCoreReady(phase, readySkillIds) {
    const required = SKILLS.filter((skill) => skill.phase === phase && !skill.optional && skill.assessed && skill.blocksPhaseCompletion);
    return required.length > 0 && required.every((skill) => readySkillIds.has(skill.id));
}
