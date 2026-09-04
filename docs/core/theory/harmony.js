import { identifySeventh, identifyTriad } from "./chord.js";
import { harmonicMinorScale, majorScale, melodicMinorAscendingScale, naturalMinorScale, } from "./scale.js";
export function diatonicTriadsFromScale(scale) {
    if (scale.length !== 7)
        throw new Error("Diatonic triad generation requires a seven-note scale");
    return scale.map((_, i) => {
        const notes = [scale[i], scale[(i + 2) % 7], scale[(i + 4) % 7]];
        return { degree: i + 1, notes, quality: identifyTriad(notes) };
    });
}
export function majorDiatonicTriads(tonic) {
    return diatonicTriadsFromScale(majorScale(tonic));
}
export function naturalMinorDiatonicTriads(tonic) {
    return diatonicTriadsFromScale(naturalMinorScale(tonic));
}
export function harmonicMinorDiatonicTriads(tonic) {
    return diatonicTriadsFromScale(harmonicMinorScale(tonic));
}
export function melodicMinorAscendingDiatonicTriads(tonic) {
    return diatonicTriadsFromScale(melodicMinorAscendingScale(tonic));
}
export function majorDiatonicSevenths(tonic) {
    const scale = majorScale(tonic);
    return scale.map((_, i) => {
        const notes = [
            scale[i],
            scale[(i + 2) % 7],
            scale[(i + 4) % 7],
            scale[(i + 6) % 7],
        ];
        return { degree: i + 1, notes, quality: identifySeventh(notes) };
    });
}
