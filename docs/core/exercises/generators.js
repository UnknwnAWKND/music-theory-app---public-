/** Generic deterministic factory. Curriculum blocks supply the musical content later. */
export function createExercise(input, index = 0) {
    return {
        id: `${input.skillId}:${input.exampleSignature}:${index}`,
        skillId: input.skillId,
        promptSignature: input.promptSignature ?? `${input.skillId}:${input.exampleSignature}`,
        exampleSignature: input.exampleSignature,
        prompt: input.prompt,
        answerSpec: input.answerSpec,
        explanation: input.explanation,
        directEvidence: input.directEvidence ?? input.answerSpec.kind !== "self-check",
        metadata: input.metadata,
    };
}
export function cycleDeterministically(items, index) {
    if (items.length === 0)
        throw new Error("Cannot choose from an empty exercise source");
    return items[((index % items.length) + items.length) % items.length];
}
