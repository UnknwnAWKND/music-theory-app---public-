function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

export function pianoVisual({ highlighted = [] } = {}) {
  const active = new Set(highlighted);
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `<div class="theory-visual piano-visual" aria-label="Piano keyboard">${notes.map((note) => `<span class="piano-key ${note.includes("#") ? "black" : "white"} ${active.has(note) ? "active" : ""}" data-note="${esc(note)}">${esc(note)}</span>`).join("")}</div>`;
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

export function circleOfFifthsVisual({ labels = [] } = {}) {
  return `<div class="theory-visual circle-visual" aria-label="Circle of Fifths">${labels.map((label, index) => `<span style="--i:${index};--n:${Math.max(1, labels.length)}">${esc(label)}</span>`).join("")}</div>`;
}
