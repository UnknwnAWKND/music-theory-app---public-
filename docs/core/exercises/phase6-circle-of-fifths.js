import { CIRCLE_POSITIONS, circleDistanceBetweenMajors, circleMoveMajor, closelyRelatedKeysForMajor, farSideMajorTargets, relativeMinorAtMajorKey, resolveFarSideProgression, selectFarSideMajorTarget, sharedMajorScaleNoteCount, transposeMajorRomanProgression, } from "../theory/index.js";
import { createExercise } from "./generators.js";
import { phase1ExerciseForSkill } from "./phase1-intervals.js";
import { phase2ExerciseForSkill } from "./phase2-major-scales.js";
import { phase3ExerciseForSkill } from "./phase3-minor-scales.js";
import { phase4ExerciseForSkill } from "./phase4-diatonic-chords.js";
import { phase5ExerciseForSkill } from "./phase5-relatives.js";
export const PHASE6_CIRCLE_SKILL_IDS = [
    "circle-of-fifths.lesson-1-what-it-represents",
    "circle-of-fifths.lesson-2-close-vs-distant",
    "circle-of-fifths.lesson-3-target-unfamiliar-keys",
    "circle-of-fifths.lesson-4-far-side-transposition",
];
const HOME_KEYS = ["C", "G", "F", "D", "Bb", "A", "Eb", "E", "Ab", "B", "F#", "Gb", "Db", "C#"];
const PROGRESSIONS = [
    ["I", "V", "vi", "IV"],
    ["ii", "V", "I"],
    ["I", "IV", "V", "I"],
    ["vi", "IV", "I", "V"],
];
function mod(n, m) { return ((n % m) + m) % m; }
function homeAt(index) { return HOME_KEYS[mod(index * 5 + Math.floor(index / HOME_KEYS.length), HOME_KEYS.length)]; }
function metadata(homeKey, targetKey, competencies, extra = {}) {
    return {
        family: "circle-of-fifths",
        homeKey,
        targetKey,
        checkpointCompetencies: competencies,
        responseMode: "application",
        circleDistance: targetKey ? circleDistanceBetweenMajors(homeKey, targetKey) : 0,
        ...extra,
    };
}
function nativeReview(generator, skillId, expectedPrefix, seed) {
    for (let offset = 0; offset < 80; offset += 1) {
        const candidate = generator(skillId, seed + offset);
        if (candidate && candidate.skillId.startsWith(expectedPrefix) && !candidate.metadata?.crossPhaseReview)
            return candidate;
    }
    throw new Error(`Could not produce native review item for ${skillId}`);
}
function priorReview(index) {
    const slot = mod(Math.floor(index / 19), 5);
    let item;
    let reviewPhase;
    if (slot === 0) {
        item = nativeReview(phase1ExerciseForSkill, "intervals.lesson-2-perfect-fifth", "intervals.", 3 + mod(index, 12));
        reviewPhase = 1;
    }
    else if (slot === 1) {
        item = nativeReview(phase2ExerciseForSkill, "major-scales.lesson-4-instant-recall", "major-scales.", 17 + mod(index, 12) * 7);
        reviewPhase = 2;
    }
    else if (slot === 2) {
        item = nativeReview(phase3ExerciseForSkill, "minor-scales.lesson-5-instant-recall", "minor-scales.", 11 + mod(index, 12) * 5);
        reviewPhase = 3;
    }
    else if (slot === 3) {
        item = nativeReview(phase4ExerciseForSkill, "diatonic-chords.lesson-9-progressions", "diatonic-chords.", 7 + mod(index, 12) * 3);
        reviewPhase = 4;
    }
    else {
        item = nativeReview(phase5ExerciseForSkill, "relatives.lesson-4-instant-recall", "relatives.", 13 + mod(index, 15) * 4);
        reviewPhase = 5;
    }
    return {
        ...item,
        metadata: {
            ...(item.metadata ?? {}),
            crossPhaseReview: true,
            reviewPhase,
            reviewReason: reviewPhase === 1 ? "circle-perfect-fifth" : "circle-applied-foundation",
        },
    };
}
function withReview(index, own) {
    return index > 0 && index % 19 === 0 ? priorReview(index) : own(index);
}
function neighborAnswer(home, direction) {
    const move = circleMoveMajor(home, direction);
    const targetPosition = CIRCLE_POSITIONS.find((position) => position.majorAliases.includes(move.to));
    return { move, accepted: targetPosition?.majorAliases ?? [move.to] };
}
function lesson1Generator(index) {
    const skillId = PHASE6_CIRCLE_SKILL_IDS[0];
    return withReview(index, (safe) => {
        const home = homeAt(safe);
        const variant = mod(safe, 5);
        if (variant === 0 || variant === 1) {
            const direction = variant === 0 ? "clockwise" : "counterclockwise";
            const { move, accepted } = neighborAnswer(home, direction);
            return createExercise({
                skillId,
                prompt: `${home} major is selected. Move one step ${direction} on the Circle of Fifths. Name the neighboring major key.`,
                answerSpec: { kind: "text", expected: move.to, accepted },
                explanation: direction === "clockwise" ? `${home} → ${move.to} is one clockwise P5-up pitch-class move.` : `${home} → ${move.to} is one counterclockwise P5-down / P4-up move.`,
                exampleSignature: `${skillId}:${home}:${direction}:${move.to}`,
                metadata: metadata(home, move.to, ["circle-fifth-movement", "key-variety"], { direction, relationship: move.relationship }),
            }, safe);
        }
        if (variant === 2) {
            const target = circleMoveMajor(home, "clockwise").to;
            return createExercise({
                skillId,
                prompt: `How many pitch classes do adjacent major keys ${home} and ${target} share?`,
                answerSpec: { kind: "number", expected: 6 },
                explanation: `Adjacent major keys differ by one key-signature pitch class, so they share 6 of 7. The engine verifies ${home}/${target} = ${sharedMajorScaleNoteCount(home, target)} shared pitch classes.`,
                exampleSignature: `${skillId}:${home}:${target}:shared-six`,
                metadata: metadata(home, target, ["adjacent-six-of-seven"], { direction: "shared-note-count" }),
            }, safe);
        }
        if (variant === 3) {
            return createExercise({
                skillId,
                prompt: `From ${home} major, which direction on the circle is an ascending Perfect 5th?`,
                answerSpec: { kind: "choice", expected: "clockwise", choices: ["clockwise", "counterclockwise"] },
                explanation: "Clockwise moves up by P5 pitch class; counterclockwise is the inverse path, down P5 / up P4.",
                exampleSignature: `${skillId}:${home}:direction-rule`,
                metadata: metadata(home, undefined, ["circle-fifth-movement"], { direction: "direction-rule", responseMode: "discrimination" }),
            }, safe);
        }
        const target = circleMoveMajor(home, "counterclockwise").to;
        return createExercise({
            skillId,
            prompt: `Are ${home} major and ${target} major adjacent on the circle?`,
            answerSpec: { kind: "choice", expected: "yes", choices: ["yes", "no"] },
            explanation: `Yes. Their circle distance is 1 and they share ${sharedMajorScaleNoteCount(home, target)} of 7 scale pitch classes.`,
            exampleSignature: `${skillId}:${home}:${target}:adjacent-check`,
            metadata: metadata(home, target, ["adjacent-six-of-seven", "circle-proximity"], { direction: "adjacency" }),
        }, safe);
    });
}
function lesson2Generator(index) {
    const skillId = PHASE6_CIRCLE_SKILL_IDS[1];
    return withReview(index, (safe) => {
        const home = homeAt(safe + 3);
        const close = closelyRelatedKeysForMajor(home);
        const variant = mod(safe, 5);
        if (variant === 0) {
            const target = close.majors[mod(safe, close.majors.length)];
            return createExercise({
                skillId,
                prompt: `Is ${target} major closely related to ${home} major by the immediate circle relationship taught here?`,
                answerSpec: { kind: "choice", expected: "yes", choices: ["yes", "no"] },
                explanation: `${target} major is adjacent to ${home} major on the circle and differs by one key-signature step.`,
                exampleSignature: `${skillId}:${home}:${target}:close-major`,
                metadata: metadata(home, target, ["circle-proximity"], { direction: "close-major", responseMode: "discrimination" }),
            }, safe);
        }
        if (variant === 1) {
            const target = close.minors[mod(safe, close.minors.length)];
            return createExercise({
                skillId,
                prompt: `${target} is one of the closely related minor keys around ${home} major. Which prior relationship explains its circle placement?`,
                answerSpec: { kind: "choice", expected: "relative major/minor shares a key signature", choices: ["relative major/minor shares a key signature", "parallel keys share every note", "all minor keys sit opposite their major", "minor keys move by tritone"] },
                explanation: "The inner minor positions are the relative minors of the major key signatures from Phase 5.",
                exampleSignature: `${skillId}:${home}:${target}:relative-integration`,
                metadata: metadata(home, undefined, ["relative-key-integration", "circle-proximity"], { direction: "relative-integration", responseMode: "application" }),
            }, safe);
        }
        const far = selectFarSideMajorTarget(home, safe + 1);
        if (variant === 2) {
            return createExercise({
                skillId,
                prompt: `Which is farther from ${home} major on the major-key circle: an adjacent key or ${far} major?`,
                answerSpec: { kind: "text", expected: `${far} major`, accepted: [far, `${far} major`] },
                explanation: `${far} is ${circleDistanceBetweenMajors(home, far)} steps away; an adjacent major key is one step away.`,
                exampleSignature: `${skillId}:${home}:${far}:distance-compare`,
                metadata: metadata(home, far, ["circle-proximity", "distant-key-selection"], { direction: "distance-compare" }),
            }, safe);
        }
        if (variant === 3) {
            const near = circleMoveMajor(home, safe % 2 ? "clockwise" : "counterclockwise").to;
            return createExercise({
                skillId,
                prompt: `${home} major and ${near} major are one circle step apart. How many major-scale pitch classes do they share?`,
                answerSpec: { kind: "number", expected: 6 },
                explanation: `Adjacent major keys share 6 of 7 pitch classes; ${home}/${near} verifies that relationship directly.`,
                exampleSignature: `${skillId}:${home}:${near}:six-review`,
                metadata: metadata(home, near, ["adjacent-six-of-seven", "circle-proximity"], { direction: "shared-note-count" }),
            }, safe);
        }
        return createExercise({
            skillId,
            prompt: `What is the relative minor paired with ${home} major at the same Circle-of-Fifths signature position?`,
            answerSpec: { kind: "text", expected: relativeMinorAtMajorKey(home) },
            explanation: `${home} major and ${relativeMinorAtMajorKey(home)} minor share a key signature, so the minor sits at the same circle position.`,
            exampleSignature: `${skillId}:${home}:relative-minor`,
            metadata: metadata(home, undefined, ["relative-key-integration"], { direction: "relative-minor" }),
        }, safe);
    });
}
function lesson3Generator(index) {
    const skillId = PHASE6_CIRCLE_SKILL_IDS[2];
    return withReview(index, (safe) => {
        const home = homeAt(safe + 7);
        const target = selectFarSideMajorTarget(home, safe * 3 + 1);
        const variant = mod(safe, 4);
        if (variant === 0) {
            const close = circleMoveMajor(home, "clockwise").to;
            return createExercise({
                skillId,
                prompt: `You want to escape ${home} major rather than stay near it. Which target is deliberately farther: ${close} major or ${target} major?`,
                answerSpec: { kind: "text", expected: `${target} major`, accepted: [target, `${target} major`] },
                explanation: `${close} is adjacent. ${target} is ${circleDistanceBetweenMajors(home, target)} circle steps away, so it meets the far-side practice rule.`,
                exampleSignature: `${skillId}:${home}:${target}:choose-unfamiliar`,
                metadata: metadata(home, target, ["distant-key-selection", "unfamiliar-key-application"], { direction: "choose-unfamiliar" }),
            }, safe);
        }
        if (variant === 1) {
            return createExercise({
                skillId,
                prompt: `After choosing ${target} major as an unfamiliar target, what relative minor is available at the same key-signature position?`,
                answerSpec: { kind: "text", expected: relativeMinorAtMajorKey(target) },
                explanation: `${target} major ↔ ${relativeMinorAtMajorKey(target)} minor. That reuses the Phase 5 relative-key relationship.`,
                exampleSignature: `${skillId}:${home}:${target}:target-relative`,
                metadata: metadata(home, target, ["relative-key-integration", "unfamiliar-key-application"], { direction: "target-relative" }),
            }, safe);
        }
        if (variant === 2) {
            return createExercise({
                skillId,
                prompt: `Is ${target} major far enough from ${home} major for this phase's deliberate unfamiliar-key drill?`,
                answerSpec: { kind: "choice", expected: "yes", choices: ["yes", "no"] },
                explanation: `Yes. The drill requires 4–6 major-circle steps; this pair is ${circleDistanceBetweenMajors(home, target)} steps apart.`,
                exampleSignature: `${skillId}:${home}:${target}:far-side-rule`,
                metadata: metadata(home, target, ["distant-key-selection", "unfamiliar-key-application"], { direction: "far-side-rule", responseMode: "discrimination" }),
            }, safe);
        }
        const progression = PROGRESSIONS[mod(safe, PROGRESSIONS.length)];
        const chords = transposeMajorRomanProgression(target, progression);
        return createExercise({
            skillId,
            prompt: `You chose ${target} major. For ${progression.join("–")}, what is the ROOT of the ${progression[0]} chord?`,
            answerSpec: { kind: "text", expected: chords[0].root },
            explanation: `Keep the Roman relationship and rebuild it inside ${target} major. ${progression[0]} has root ${chords[0].root}.`,
            exampleSignature: `${skillId}:${target}:${progression.join("-")}:first-root`,
            metadata: metadata(home, target, ["unfamiliar-key-application", "practical-transposition"], { direction: "roman-application", roman: progression[0] }),
        }, safe);
    });
}
function lesson4Generator(index) {
    const skillId = PHASE6_CIRCLE_SKILL_IDS[3];
    return withReview(index, (safe) => {
        const home = homeAt(safe + 11);
        const target = selectFarSideMajorTarget(home, safe * 7 + 2);
        const progression = PROGRESSIONS[mod(safe, PROGRESSIONS.length)];
        const chords = transposeMajorRomanProgression(target, progression);
        const variant = mod(safe, 5);
        if (variant === 0 || variant === 1) {
            const chordIndex = mod(safe * 3 + variant, progression.length);
            return createExercise({
                skillId,
                prompt: `Transpose ${progression.join("–")} into ${target} major. What chord root realizes ${progression[chordIndex]}?`,
                answerSpec: { kind: "text", expected: chords[chordIndex].root },
                explanation: `${progression[chordIndex]} in ${target} major is rooted on ${chords[chordIndex].root}; the Roman-numeral relationship stays unchanged.`,
                exampleSignature: `${skillId}:${target}:${progression.join("-")}:${chordIndex}:root`,
                metadata: metadata(home, target, ["practical-transposition", "unfamiliar-key-application"], { direction: "transpose-chord", roman: progression[chordIndex] }),
            }, safe);
        }
        if (variant === 2) {
            return createExercise({
                skillId,
                prompt: `Which Roman-numeral pattern should remain unchanged when you transpose ${progression.join("–")} from ${home} major to ${target} major?`,
                answerSpec: { kind: "text", expected: progression.join("–"), accepted: [progression.join("-"), progression.join(" "), progression.join("–")] },
                explanation: "Transposition changes absolute chord names while preserving the Roman-numeral pattern.",
                exampleSignature: `${skillId}:${home}:${target}:${progression.join("-")}:preserve`,
                metadata: metadata(home, target, ["practical-transposition"], { direction: "preserve-romans" }),
            }, safe);
        }
        if (variant === 3) {
            const fallback = resolveFarSideProgression(undefined);
            return createExercise({
                skillId,
                prompt: `No valid Phase 4 progression is saved. Which progression does the Phase 6 lab safely supply?`,
                answerSpec: { kind: "text", expected: fallback.romanNumerals.join("–"), accepted: [fallback.romanNumerals.join("-"), fallback.romanNumerals.join(" "), fallback.romanNumerals.join("–")] },
                explanation: "The lab falls back to I–V–vi–IV so the practical transposition lesson never depends on prior saved data.",
                exampleSignature: `${skillId}:fallback:${home}:${target}`,
                metadata: metadata(home, target, ["practical-transposition"], { direction: "saved-progression-fallback" }),
            }, safe);
        }
        const candidate = farSideMajorTargets(home)[mod(safe, farSideMajorTargets(home).length)];
        return createExercise({
            skillId,
            prompt: `For the final drill, ${candidate} major is ${circleDistanceBetweenMajors(home, candidate)} circle steps from ${home} major. Is it a valid far-side target?`,
            answerSpec: { kind: "choice", expected: "yes", choices: ["yes", "no"] },
            explanation: "Yes. Phase 6 uses 4–6 major-circle steps for deliberate unfamiliar-key transposition practice.",
            exampleSignature: `${skillId}:${home}:${candidate}:target-check`,
            metadata: metadata(home, candidate, ["distant-key-selection", "unfamiliar-key-application"], { direction: "target-check", responseMode: "discrimination" }),
        }, safe);
    });
}
export const PHASE6_CIRCLE_GENERATORS = new Map([
    [PHASE6_CIRCLE_SKILL_IDS[0], lesson1Generator],
    [PHASE6_CIRCLE_SKILL_IDS[1], lesson2Generator],
    [PHASE6_CIRCLE_SKILL_IDS[2], lesson3Generator],
    [PHASE6_CIRCLE_SKILL_IDS[3], lesson4Generator],
]);
export function phase6ExerciseForSkill(skillId, index = 0) {
    return PHASE6_CIRCLE_GENERATORS.get(skillId)?.(index);
}
