function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

const WHITE_KEYS = Object.freeze([
  { id: "C4", pitch: "C", label: "C" },
  { id: "D4", pitch: "D", label: "D" },
  { id: "E4", pitch: "E", label: "E" },
  { id: "F4", pitch: "F", label: "F" },
  { id: "G4", pitch: "G", label: "G" },
  { id: "A4", pitch: "A", label: "A" },
  { id: "B4", pitch: "B", label: "B" },
  { id: "C5", pitch: "C", label: "C" },
]);

const BLACK_KEYS = Object.freeze([
  { id: "C#4", pitch: "C#", left: 12.5, label: "C#/Db" },
  { id: "D#4", pitch: "D#", left: 25, label: "D#/Eb" },
  { id: "F#4", pitch: "F#", left: 50, label: "F#/Gb" },
  { id: "G#4", pitch: "G#", left: 62.5, label: "G#/Ab" },
  { id: "A#4", pitch: "A#", left: 75, label: "A#/Bb" },
]);

function normalizeHighlightSet(highlighted) {
  const exact = new Set();
  const pitchClasses = new Set();
  for (const value of highlighted ?? []) {
    const text = String(value);
    if (/^[A-G](?:#|b)?\d+$/.test(text)) exact.add(text.replace("b", "♭"));
    else pitchClasses.add(text.replace("♭", "b"));
  }
  return { exact, pitchClasses };
}

function keyIsActive(key, index, highlights) {
  if (highlights.exact.has(key.id)) return true;
  if (!highlights.pitchClasses.has(key.pitch)) return false;
  // Pitch-class-only callers historically had one C. Keep that behavior by
  // highlighting the lower C only when the one-octave component adds C5.
  return key.pitch !== "C" || index === 0;
}

function labelFor(key, displayLabels) {
  return displayLabels[key.id] ?? displayLabels[key.pitch] ?? key.label;
}

/**
 * Connected C4→C5 educational keyboard. White keys form one continuous bed;
 * black keys overlay the correct five gaps. Callers may use octave-aware IDs
 * (C4/C5) when the same pitch class must be shown twice, such as P8.
 */
export function pianoVisual({ highlighted = [], displayLabels = {} } = {}) {
  const highlights = normalizeHighlightSet(highlighted);
  const whites = WHITE_KEYS.map((key, index) => {
    const label = labelFor(key, displayLabels);
    return `<span class="piano-key white ${keyIsActive(key, index, highlights) ? "active" : ""}" data-note="${esc(key.id)}" data-pitch-class="${esc(key.pitch)}" aria-label="${esc(label)}"><span>${esc(label)}</span></span>`;
  }).join("");
  const blacks = BLACK_KEYS.map((key) => {
    const label = labelFor(key, displayLabels);
    return `<span class="piano-key black ${keyIsActive(key, -1, highlights) ? "active" : ""}" style="left:${key.left}%" data-note="${esc(key.id)}" data-pitch-class="${esc(key.pitch)}" aria-label="${esc(label)}"><span>${esc(label)}</span></span>`;
  }).join("");
  return `<div class="theory-visual piano-visual" data-full-octave="C4-C5" aria-label="Piano keyboard from C to the next C"><div class="piano-white-row">${whites}</div><div class="piano-black-layer" aria-hidden="false">${blacks}</div></div>`;
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

/**
 * Readable relationship-first Circle of Fifths visual. Major labels are the
 * outer/key-signature identity; relative minors sit directly with that same
 * position. Buttons become interactive when phase6-ui binds them.
 */
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
