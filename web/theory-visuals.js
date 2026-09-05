function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

/**
 * `highlighted` uses physical equal-tempered pitch-class keys (C, C#, ...).
 * `displayLabels` can override the printed spelling so the same black key can
 * correctly appear as F# in an A4 context or G♭ in a d5 context. When no
 * spelling is supplied, black keys show both common enharmonic names rather
 * than silently implying that the sharp spelling is always correct.
 */
export function pianoVisual({ highlighted = [], displayLabels = {} } = {}) {
  const active = new Set(highlighted);
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const defaults = { "C#": "C#/Db", "D#": "D#/Eb", "F#": "F#/Gb", "G#": "G#/Ab", "A#": "A#/Bb" };
  return `<div class="theory-visual piano-visual" aria-label="Piano keyboard">${notes.map((note) => {
    const label = displayLabels[note] ?? defaults[note] ?? note;
    return `<span class="piano-key ${note.includes("#") ? "black" : "white"} ${active.has(note) ? "active" : ""}" data-note="${esc(note)}" aria-label="${esc(label)}">${esc(label)}</span>`;
  }).join("")}</div>`;
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
