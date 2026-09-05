import { majorDegreeForRoman, majorProgression } from "./extended.js";
import { formatNote, mod, parseNote, pitchClass } from "./note.js";
import { majorScaleNames, relativeMinorTonic } from "./scale.js";
const RAW_MAJOR_ALIASES = [
    ["C"],
    ["G"],
    ["D"],
    ["A"],
    ["E"],
    ["B", "Cb"],
    ["F#", "Gb"],
    ["C#", "Db"],
    ["Ab"],
    ["Eb"],
    ["Bb"],
    ["F"],
];
function display(name) {
    return formatNote(parseNote(name));
}
function relativeMinorForMajor(majorName) {
    return formatNote(relativeMinorTonic(parseNote(majorName)));
}
export const CIRCLE_MAJOR_ORDER = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
export const CIRCLE_POSITIONS = Object.freeze(RAW_MAJOR_ALIASES.map((aliases, index) => Object.freeze({
    index,
    majorAliases: Object.freeze(aliases.map(display)),
    relativeMinorAliases: Object.freeze(aliases.map(relativeMinorForMajor)),
})));
function normalized(name) {
    return display(name);
}
function spellingFamily(name) {
    const text = normalized(name);
    if (text.includes("♯"))
        return "sharp";
    if (text.includes("♭"))
        return "flat";
    return "natural";
}
export function circlePositionForMajorKey(keyName) {
    const key = normalized(keyName);
    const position = CIRCLE_POSITIONS.find((item) => item.majorAliases.includes(key));
    if (!position)
        throw new Error(`Unsupported Circle-of-Fifths major-key spelling: ${keyName}`);
    return position;
}
export function circleMajorDisplayLabel(positionIndex) {
    return CIRCLE_POSITIONS[mod(positionIndex, 12)].majorAliases.join(" / ");
}
export function circleMinorDisplayLabel(positionIndex) {
    return CIRCLE_POSITIONS[mod(positionIndex, 12)].relativeMinorAliases.map((name) => `${name}m`).join(" / ");
}
export function circleDistanceBetweenMajors(a, b) {
    const left = circlePositionForMajorKey(a).index;
    const right = circlePositionForMajorKey(b).index;
    const clockwise = mod(right - left, 12);
    return Math.min(clockwise, 12 - clockwise);
}
function aliasForTarget(target, sourceKey, direction) {
    if (target.majorAliases.length === 1)
        return target.majorAliases[0];
    const family = spellingFamily(sourceKey);
    if (family === "flat")
        return target.majorAliases.find((name) => name.includes("♭")) ?? target.majorAliases.at(-1);
    if (family === "sharp")
        return target.majorAliases.find((name) => name.includes("♯")) ?? target.majorAliases[0];
    if (direction === "counterclockwise")
        return target.majorAliases.find((name) => name.includes("♭")) ?? target.majorAliases.at(-1);
    return target.majorAliases.find((name) => name.includes("♯")) ?? target.majorAliases[0];
}
export function circleMoveMajor(keyName, direction) {
    const source = circlePositionForMajorKey(keyName);
    const targetIndex = mod(source.index + (direction === "clockwise" ? 1 : -1), 12);
    const target = CIRCLE_POSITIONS[targetIndex];
    const to = aliasForTarget(target, keyName, direction);
    const fromPc = pitchClass(parseNote(keyName));
    const toPc = pitchClass(parseNote(to));
    const expected = direction === "clockwise" ? 7 : 5;
    const actual = mod(toPc - fromPc, 12);
    if (actual !== expected)
        throw new Error(`Circle movement mismatch: ${keyName} -> ${to}`);
    const sourceFamily = spellingFamily(keyName);
    const targetFamily = spellingFamily(to);
    return {
        from: normalized(keyName),
        to,
        direction,
        circleSteps: 1,
        pitchClassSemitones: expected,
        relationship: direction === "clockwise" ? "P5 up" : "P5 down / P4 up",
        enharmonicRespelling: sourceFamily !== "natural" && targetFamily !== "natural" && sourceFamily !== targetFamily,
    };
}
function majorScalePitchClasses(keyName) {
    return new Set(majorScaleNames(keyName).map((note) => pitchClass(parseNote(note))));
}
export function sharedMajorScalePitchClasses(a, b) {
    const left = majorScalePitchClasses(a);
    const right = majorScalePitchClasses(b);
    return [...left].filter((pc) => right.has(pc)).sort((x, y) => x - y);
}
export function sharedMajorScaleNoteCount(a, b) {
    return sharedMajorScalePitchClasses(a, b).length;
}
export function areAdjacentMajorKeys(a, b) {
    return circleDistanceBetweenMajors(a, b) === 1;
}
export function relativeMinorAtMajorKey(majorName) {
    return relativeMinorForMajor(majorName);
}
export function closelyRelatedKeysForMajor(homeMajor) {
    const left = circleMoveMajor(homeMajor, "counterclockwise").to;
    const right = circleMoveMajor(homeMajor, "clockwise").to;
    return {
        majors: [left, right],
        minors: [relativeMinorForMajor(left), relativeMinorForMajor(homeMajor), relativeMinorForMajor(right)],
    };
}
export function isFarSideMajorTarget(homeMajor, targetMajor) {
    return circleDistanceBetweenMajors(homeMajor, targetMajor) >= 4;
}
export function farSideMajorTargets(homeMajor) {
    const home = circlePositionForMajorKey(homeMajor);
    const family = spellingFamily(homeMajor);
    return CIRCLE_POSITIONS
        .filter((position) => circleDistanceBetweenMajors(homeMajor, position.majorAliases[0]) >= 4)
        .map((position) => {
        if (position.majorAliases.length === 1)
            return position.majorAliases[0];
        if (family === "flat")
            return position.majorAliases.find((name) => name.includes("♭")) ?? position.majorAliases.at(-1);
        if (family === "sharp")
            return position.majorAliases.find((name) => name.includes("♯")) ?? position.majorAliases[0];
        if (position.index === 7)
            return position.majorAliases.find((name) => name.includes("♭")) ?? position.majorAliases[0];
        return position.majorAliases[0];
    });
}
export function selectFarSideMajorTarget(homeMajor, index = 0) {
    const candidates = farSideMajorTargets(homeMajor);
    if (!candidates.length)
        throw new Error(`No far-side target available for ${homeMajor}`);
    return candidates[mod(index, candidates.length)];
}
export function parseMajorRomanProgression(input) {
    const tokens = Array.isArray(input)
        ? [...input]
        : String(input).split(/[\s,|/\-–—→]+/).filter(Boolean);
    const normalizedTokens = tokens.map((token) => String(token).trim().replace(/o$/i, "°")).filter(Boolean);
    if (!normalizedTokens.length)
        throw new Error("Enter at least one Roman numeral.");
    for (const token of normalizedTokens)
        majorDegreeForRoman(token);
    return normalizedTokens;
}
export function transposeMajorRomanProgression(targetMajor, progression) {
    const romans = parseMajorRomanProgression(progression);
    return majorProgression(parseNote(targetMajor), romans).map((chord) => ({
        roman: chord.roman,
        root: formatNote(chord.root),
        quality: chord.quality,
        notes: chord.notes.map(formatNote),
    }));
}
export const PHASE6_FALLBACK_ROMAN_PROGRESSION = ["I", "V", "vi", "IV"];
export function resolveFarSideProgression(saved) {
    if (saved?.form === "major" && Array.isArray(saved.romanNumerals) && saved.romanNumerals.length >= 2) {
        try {
            return { source: "saved", romanNumerals: parseMajorRomanProgression(saved.romanNumerals) };
        }
        catch {
            // Invalid or unsupported saved analysis falls through to the safe lesson progression.
        }
    }
    return { source: "fallback", romanNumerals: [...PHASE6_FALLBACK_ROMAN_PROGRESSION] };
}
