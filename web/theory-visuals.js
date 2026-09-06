function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

const PIANO_WHITE_KEYS = [
  { id: "C4", pitch: "C", label: "C" },
  { id: "D4", pitch: "D", label: "D" },
  { id: "E4", pitch: "E", label: "E" },
  { id: "F4", pitch: "F", label: "F" },
  { id: "G4", pitch: "G", label: "G" },
  { id: "A4", pitch: "A", label: "A" },
  { id: "B4", pitch: "B", label: "B" },
  { id: "C5", pitch: "C", label: "C" },
];

// Keep the default black-key label compact. Theory-specific flat spellings are
// supplied through displayLabels by the lesson that needs them, so a narrow key
// never has to carry a generic "sharp/flat" slash label.
const PIANO_BLACK_KEYS = [
  { id: "C#4", pitch: "C#", label: "C♯", left: 12.5 },
  { id: "D#4", pitch: "D#", label: "D♯", left: 25 },
  { id: "F#4", pitch: "F#", label: "F♯", left: 50 },
  { id: "G#4", pitch: "G#", label: "G♯", left: 62.5 },
  { id: "A#4", pitch: "A#", label: "A♯", left: 75 },
];

/**
 * Connected one-octave educational keyboard. `highlightedKeys` addresses exact
 * visible keys (C4/C5) so octave examples can highlight both ends. Legacy
 * `highlighted` pitch-class values remain supported and target the first
 * visible matching key, which avoids accidentally lighting both Cs.
 */
export function pianoVisual({ highlighted = [], highlightedKeys = [], displayLabels = {} } = {}) {
  const exact = new Set(highlightedKeys);
  const legacy = new Set(highlighted);
  const usedLegacyPitch = new Set();
  const isActive = (key) => {
    if (exact.has(key.id)) return true;
    if (!legacy.has(key.pitch) || usedLegacyPitch.has(key.pitch)) return false;
    usedLegacyPitch.add(key.pitch);
    return true;
  };
  const labelFor = (key) => displayLabels[key.id] ?? displayLabels[key.pitch] ?? key.label;
  const whites = PIANO_WHITE_KEYS.map((key) => {
    const active = isActive(key);
    const label = labelFor(key);
    return `<span class="piano-key white ${active ? "active" : ""}" data-key-id="${esc(key.id)}" data-note="${esc(key.pitch)}" aria-label="${esc(label)}">${esc(label)}</span>`;
  }).join("");
  const blacks = PIANO_BLACK_KEYS.map((key) => {
    const active = isActive(key);
    const label = labelFor(key);
    return `<span class="piano-key black ${active ? "active" : ""}" style="--piano-black-left:${key.left}%" data-key-id="${esc(key.id)}" data-note="${esc(key.pitch)}" aria-label="${esc(label)}">${esc(label)}</span>`;
  }).join("");
  return `<div class="theory-visual piano-visual piano-visual-v2" aria-label="Piano keyboard from C to the next C"><div class="piano-white-row">${whites}</div><div class="piano-black-layer" aria-hidden="false">${blacks}</div></div>`;
}

export function intervalVisual({ root = "", target = "", label = "" } = {}) {
  return `<div class="theory-visual interval-visual"><span>${esc(root)}</span><span aria-hidden="true">→</span><strong>${esc(label)}</strong><span aria-hidden="true">→</span><span>${esc(target)}</span></div>`;
}

export function scaleVisual({ notes = [] } = {}) {
  return `<div class="theory-visual scale-visual">${notes.map((note, index) => `<span><b>${index + 1}</b>${esc(note)}</span>`).join("")}</div>`;
}

export function chordVisual({ notes = [], rootIndex = 0 } = {}) {
  return `<div class="theory-visual chord-visual">${notes.map((note, index) => `<span class="${index === rootIndex ? "root" : ""}">${esc(note)}</span>`).join("")}</div>`;
}

const DEFAULT_MAJOR_LABELS = ["C", "G", "D", "A", "E", "B / C♭", "F♯ / G♭", "C♯ / D♭", "A♭", "E♭", "B♭", "F"];
const DEFAULT_MINOR_LABELS = ["Am", "Em", "Bm", "F♯m", "C♯m", "G♯m / A♭m", "D♯m / E♭m", "A♯m / B♭m", "Fm", "Cm", "Gm", "Dm"];

function circlePoint(index, count) {
  const angle = (Math.PI * 2 * index) / count;
  return { left: 50 + Math.sin(angle) * 42, top: 50 - Math.cos(angle) * 42 };
}

export function circleOfFifthsVisual({
  labels = DEFAULT_MAJOR_LABELS,
  minorLabels = DEFAULT_MINOR_LABELS,
  selected = "",
  adjacent = [],
  distant = [],
  interactive = false,
} = {}) {
  const majors = labels.length ? labels : DEFAULT_MAJOR_LABELS;
  const minors = minorLabels.length === majors.length ? minorLabels : majors.map(() => "");
  const selectedSet = new Set([selected]);
  const adjacentSet = new Set(adjacent);
  const distantSet = new Set(distant);
  const nodes = majors.map((label, index) => {
    const point = circlePoint(index, majors.length);
    const classes = [
      "circle-key",
      selectedSet.has(label) ? "is-selected" : "",
      adjacentSet.has(label) ? "is-adjacent" : "",
      distantSet.has(label) ? "is-distant" : "",
    ].filter(Boolean).join(" ");
    const inner = `<strong>${esc(label)}</strong>${minors[index] ? `<small>${esc(minors[index])}</small>` : ""}`;
    const attrs = `class="${classes}" style="left:${point.left.toFixed(3)}%;top:${point.top.toFixed(3)}%" data-circle-index="${index}" data-circle-major="${esc(label)}" data-circle-minor="${esc(minors[index])}" aria-label="${esc(`${label} major${minors[index] ? `, relative ${minors[index]}` : ""}`)}"`;
    return interactive ? `<button type="button" ${attrs}>${inner}</button>` : `<span ${attrs}>${inner}</span>`;
  }).join("");
  return `<div class="theory-visual circle-shell ${interactive ? "circle-interactive" : ""}" data-circle-of-fifths aria-label="Interactive Circle of Fifths">
    <div class="circle-wheel">${nodes}<div class="circle-center"><strong>5ths</strong><small>tap a key</small></div></div>
    <div class="circle-readout" data-circle-readout>${selected ? `${esc(selected)} selected` : "Choose a key to inspect its neighbors and relative minor."}</div>
  </div>`;
}
