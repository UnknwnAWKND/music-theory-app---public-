import { PHASE4_SAVED_PROGRESSION_KEY } from "./phase4-ui.js";

const MAJOR_KEYS = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function keyOptions(selected) {
  return MAJOR_KEYS.map((key) => `<option value="${esc(key)}" ${key === selected ? "selected" : ""}>${esc(key)} major</option>`).join("");
}

export function phase6TranspositionLabHtml() {
  return `<section class="phase6-transposition-lab" data-phase6-lab>
    <header class="page-header"><div><div class="eyebrow">Final practical lab</div><h2>Move your progression to the far side</h2><p>Keep the Roman-numeral relationship, deliberately choose a less-familiar key, then play or program the result.</p></div></header>
    <section class="focus-card phase6-lab-card">
      <div class="phase6-lab-grid">
        <label>Starting / habitual key<select data-phase6-home>${keyOptions("C")}</select></label>
        <label>Far-side target<select data-phase6-target>${keyOptions("F#")}</select></label>
      </div>
      <label>Roman-numeral progression<input data-phase6-romans value="I–V–vi–IV" autocomplete="off" spellcheck="false"></label>
      <div class="phase6-lab-actions">
        <button class="secondary" type="button" data-phase6-pick-far>Choose far-side target</button>
        <button class="secondary" type="button" data-phase6-load-progression>Load saved / fallback</button>
      </div>
      <button class="primary" type="button" data-phase6-transpose>Transpose progression</button>
      <div class="phase6-progression-source" data-phase6-source aria-live="polite"></div>
      <div class="phase6-transposition-output" data-phase6-output aria-live="polite"></div>
    </section>
  </section>`;
}

function bindCircleVisuals() {
  document.querySelectorAll("[data-circle-of-fifths]").forEach((shell) => {
    const buttons = [...shell.querySelectorAll("button[data-circle-index]")];
    if (!buttons.length) return;
    const update = (selectedIndex) => {
      const total = buttons.length;
      buttons.forEach((button) => {
        const index = Number(button.dataset.circleIndex);
        const raw = Math.abs(index - selectedIndex);
        const distance = Math.min(raw, total - raw);
        button.classList.toggle("is-selected", distance === 0);
        button.classList.toggle("is-adjacent", distance === 1);
        button.classList.toggle("is-distant", distance >= 4);
      });
      const selected = buttons[selectedIndex];
      const prev = buttons[(selectedIndex - 1 + total) % total];
      const next = buttons[(selectedIndex + 1) % total];
      const readout = shell.querySelector("[data-circle-readout]");
      if (readout) readout.textContent = `${selected.dataset.circleMajor} major · relative ${selected.dataset.circleMinor || "—"} · adjacent: ${prev.dataset.circleMajor} / ${next.dataset.circleMajor}`;
    };
    buttons.forEach((button) => button.addEventListener("click", () => update(Number(button.dataset.circleIndex))));
  });
}

function readSavedProgression() {
  try {
    const raw = localStorage.getItem(PHASE4_SAVED_PROGRESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function bindPhase6Ui({ selectFarSideMajorTarget, transposeMajorRomanProgression, resolveFarSideProgression }) {
  bindCircleVisuals();
  document.querySelectorAll("[data-phase6-lab]").forEach((lab) => {
    const home = lab.querySelector("[data-phase6-home]");
    const target = lab.querySelector("[data-phase6-target]");
    const romans = lab.querySelector("[data-phase6-romans]");
    const source = lab.querySelector("[data-phase6-source]");
    const output = lab.querySelector("[data-phase6-output]");
    const pick = lab.querySelector("[data-phase6-pick-far]");
    const load = lab.querySelector("[data-phase6-load-progression]");
    const transpose = lab.querySelector("[data-phase6-transpose]");
    if (!home || !target || !romans || !source || !output || !pick || !load || !transpose) return;

    let pickIndex = 0;
    pick.addEventListener("click", () => {
      try {
        target.value = selectFarSideMajorTarget(home.value, pickIndex++);
        source.textContent = `${target.value} major is deliberately 4–6 circle steps from ${home.value} major.`;
      } catch (error) {
        source.textContent = error?.message ?? String(error);
      }
    });

    load.addEventListener("click", () => {
      const resolved = resolveFarSideProgression(readSavedProgression());
      romans.value = resolved.romanNumerals.join("–");
      source.textContent = resolved.source === "saved"
        ? "Loaded your last valid major-key Roman progression from Phase 4 Lesson 10."
        : "No valid saved major-key progression was available, so the lesson supplied I–V–vi–IV.";
    });

    transpose.addEventListener("click", () => {
      try {
        const result = transposeMajorRomanProgression(target.value, romans.value);
        output.innerHTML = result.map((chord) => `<div class="phase6-chord-row"><strong>${esc(chord.roman)}</strong><span>${esc(chord.root)} ${esc(chord.quality)}</span></div>`).join("");
        source.textContent = `Target: ${target.value} major. Roman numerals stay fixed; chord roots change to the target key.`;
      } catch (error) {
        output.innerHTML = `<div class="feedback incorrect"><strong>Could not transpose</strong><p>${esc(error?.message ?? error)}</p></div>`;
      }
    });
  });
}
