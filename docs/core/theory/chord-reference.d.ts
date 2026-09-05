/**
 * Learner-facing lookup rows. The concrete examples are all rooted on C so the
 * root column is explicit rather than making the learner infer it from the
 * first note of the example.
 */
export declare const PHASE4_CHORD_REFERENCE: readonly Readonly<{
    root: "C";
    id: import("./chord.js").TriadQuality | import("./chord.js").SeventhQuality;
    chordName: string;
    thirdQuality: string;
    fifthQuality: string;
    seventhQuality?: string;
    intervalFormula: string;
    example: string;
}>[];
