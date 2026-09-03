const FLAT = "♭";
const SHARP = "♯";

export function normalizeAccidentals(text) {
  return String(text ?? "")
    .replaceAll("#", SHARP)
    .replace(/([A-Ga-g])b/g, `$1${FLAT}`)
    .trim();
}

export function splitNoteSequence(text) {
  return String(text ?? "")
    .trim()
    .split(/[\s,;|]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(normalizeAccidentals);
}

export function parseChordSymbol(symbol) {
  const raw = normalizeAccidentals(symbol).replace(/\s+/g, "");
  const match = /^([A-Ga-g](?:♯|♭)?)(.*)$/.exec(raw);
  if (!match) return null;
  const root = match[1][0].toUpperCase() + match[1].slice(1);
  const suffix = match[2].toLowerCase();
  let quality = "major";
  if (["m", "min", "minor", "-"] .includes(suffix)) quality = "minor";
  else if (["°", "dim", "diminished"].includes(suffix)) quality = "diminished";
  else if (["+", "aug", "augmented"].includes(suffix)) quality = "augmented";
  else if (suffix !== "" && suffix !== "maj" && suffix !== "major") return null;
  return { root, quality };
}

export function parseProgression(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return [];
  const tokens = raw.includes(",") || raw.includes(";") || raw.includes("|")
    ? raw.split(/[,;|]+/)
    : raw.split(/\s+/);
  return tokens.map((x) => parseChordSymbol(x)).filter(Boolean);
}

export function answerSpecForExercise(exercise) {
  const p = exercise.payload ?? {};
  if (exercise.assessmentMode === "self-check") return { kind: "self-check" };
  if (Array.isArray(p.choices)) return { kind: "choice", choices: p.choices.map(String) };
  if (exercise.type === "major-note-degree") return { kind: "number" };
  if (exercise.type === "key-signature") return { kind: "key-signature" };
  if (exercise.type === "minor-scale-build" && p.expectedAscending && p.expectedDescending) return { kind: "two-sequences" };
  if (exercise.type === "progression-build") return { kind: "progression" };
  if ([
    "triad-build-notes", "major-scale-build", "seventh-build-notes", "inversion-build",
    "chord-color-build", "mode-scale-build"
  ].includes(exercise.type)) return { kind: "sequence" };
  if (exercise.type === "diatonic-chord-build" && p.expectedNotes) return { kind: "sequence" };
  if (exercise.type === "minor-scale-build" && p.expected) return { kind: "sequence" };
  return { kind: "text" };
}

export function parseAnswerFromValues(spec, values) {
  switch (spec.kind) {
    case "sequence": return splitNoteSequence(values.main);
    case "two-sequences": return {
      ascending: splitNoteSequence(values.ascending),
      descending: splitNoteSequence(values.descending),
    };
    case "progression": return parseProgression(values.main);
    case "number": return Number(values.main);
    case "key-signature": return { count: Number(values.count), type: values.type };
    case "choice":
    case "text": return normalizeAccidentals(values.main);
    default: return values.main;
  }
}

export function readableExpected(exercise, assessment) {
  const p = exercise.payload ?? {};
  const expected = assessment?.expected;
  if (exercise.type === "key-signature") {
    const x = expected ?? { count: p.expectedCount, type: p.expectedType };
    const count = x?.count ?? p.expectedCount;
    const type = x?.type ?? p.expectedType;
    return `${count} ${type === "none" ? "accidentals" : `${type}${Number(count) === 1 ? "" : "s"}`}`;
  }
  if (exercise.type === "minor-scale-build" && p.expectedAscending) {
    return `Ascending: ${p.expectedAscending.join(" ")} · Descending: ${p.expectedDescending.join(" ")}`;
  }
  if (exercise.type === "progression-build") {
    const seq = expected ?? p.expected;
    if (Array.isArray(seq)) return seq.map(({ root, quality }) => {
      if (quality === "minor") return `${root}m`;
      if (quality === "diminished") return `${root}°`;
      if (quality === "augmented") return `${root}+`;
      return root;
    }).join(" – ");
  }
  if (Array.isArray(expected)) return expected.join(" ");
  if (expected && typeof expected === "object") return JSON.stringify(expected);
  if (expected !== undefined) return String(expected);
  if (Array.isArray(p.expected)) return p.expected.join(" ");
  if (p.expected !== undefined) return String(p.expected);
  if (p.expectedNotes) return p.expectedNotes.join(" ");
  return "";
}
