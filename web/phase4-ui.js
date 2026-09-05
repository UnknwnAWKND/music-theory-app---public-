const ROOTS = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "G", "G#", "Ab", "A", "Bb", "B"];
const QUALITIES = ["major", "minor", "diminished", "augmented"];
const FORMS = [
  ["major", "Major"],
  ["natural-minor", "Natural minor"],
  ["harmonic-minor", "Harmonic minor"],
  ["melodic-minor-ascending", "Melodic minor (ascending)"],
];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function options(values, selected) {
  return values.map((value) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(value)}</option>`).join("");
}

function chordSlot(progressionIndex, chordIndex, root = "C", quality = "major") {
  return `<div class="progression-chord-slot">
    <label>Chord ${chordIndex + 1}
      <select data-progression="${progressionIndex}" data-chord-root="${chordIndex}">${options(ROOTS, root)}</select>
    </label>
    <label>Quality
      <select data-progression="${progressionIndex}" data-chord-quality="${chordIndex}">${options(QUALITIES, quality)}</select>
    </label>
  </div>`;
}

function progressionCard(index) {
  const defaults = [
    [["C", "major"], ["G", "major"], ["A", "minor"], ["F", "major"]],
    [["A", "minor"], ["F", "major"], ["C", "major"], ["G", "major"]],
    [["D", "minor"], ["G", "major"], ["C", "major"], ["C", "major"]],
  ][index];
  return `<section class="focus-card progression-analyzer-card" data-progression-card="${index}">
    <div class="eyebrow">Your progression ${index + 1}</div>
    <div class="progression-key-row">
      <label>Key / tonic<select data-progression-key="${index}">${options(ROOTS, index === 1 ? "A" : "C")}</select></label>
      <label>Scale form<select data-progression-form="${index}">${FORMS.map(([value, label]) => `<option value="${esc(value)}" ${index === 1 && value === "natural-minor" ? "selected" : index !== 1 && value === "major" ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></label>
    </div>
    <div class="progression-chord-grid">${defaults.map(([root, quality], chordIndex) => chordSlot(index, chordIndex, root, quality)).join("")}</div>
    <button class="secondary" data-analyze-progression="${index}" type="button">Analyze progression ${index + 1}</button>
    <div class="progression-analysis-output" data-progression-result="${index}" aria-live="polite"></div>
  </section>`;
}

export function phase4ProgressionLabHtml() {
  return `<section class="phase4-progression-lab">
    <header class="page-header"><div><div class="eyebrow">Practical lab</div><h2>Analyze 3 of your own progressions</h2><p>Choose the key, scale form, chord roots, and qualities. The app checks only the diatonic harmony taught in this phase.</p></div></header>
    ${[0, 1, 2].map(progressionCard).join("")}
  </section>`;
}

export function bindPhase4ProgressionLab(analyzeStructuredProgression) {
  document.querySelectorAll("[data-analyze-progression]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.analyzeProgression);
      const tonic = document.querySelector(`[data-progression-key="${index}"]`)?.value;
      const form = document.querySelector(`[data-progression-form="${index}"]`)?.value;
      const inputs = Array.from({ length: 4 }, (_, chordIndex) => ({
        root: document.querySelector(`[data-progression="${index}"][data-chord-root="${chordIndex}"]`)?.value ?? "C",
        quality: document.querySelector(`[data-progression="${index}"][data-chord-quality="${chordIndex}"]`)?.value ?? "major",
      }));
      const output = document.querySelector(`[data-progression-result="${index}"]`);
      if (!output || !tonic || !form) return;
      try {
        const rows = analyzeStructuredProgression(tonic, form, inputs);
        output.innerHTML = `<div class="worked-example"><strong>Analysis</strong>${rows.map((row, chordIndex) => `<span><b>${chordIndex + 1}. ${row.diatonic ? esc(row.romanNumeral) : "Outside current diatonic set"}</b> — ${esc(row.explanation)}</span>`).join("")}</div>`;
      } catch (error) {
        output.innerHTML = `<div class="feedback incorrect"><strong>Could not analyze</strong><p>${esc(error?.message ?? error)}</p></div>`;
      }
    });
  });
}
