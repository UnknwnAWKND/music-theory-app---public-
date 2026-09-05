import { chordVisual, circleOfFifthsVisual, intervalVisual, pianoVisual, scaleVisual } from "./theory-visuals.js";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function expectationLabel(expectation) {
  if (expectation === "know-instantly") return `<div class="learning-expectation automatic">KNOW THIS INSTANTLY</div>`;
  if (expectation === "understand") return `<div class="learning-expectation conceptual">UNDERSTAND THIS</div>`;
  return "";
}

function renderVisual(visual) {
  if (!visual) return "";
  const data = visual.data ?? {};
  if (visual.kind === "piano") return pianoVisual(data);
  if (visual.kind === "interval") return intervalVisual(data);
  if (visual.kind === "scale") return scaleVisual(data);
  if (visual.kind === "chord") return chordVisual(data);
  if (visual.kind === "circle") return circleOfFifthsVisual(data);
  return "";
}

function renderStep(step, index, total) {
  return `<section class="lesson-step" data-step="${esc(step.id)}">
    <div class="question-meta"><span>Teaching ${index + 1} of ${total}</span></div>
    ${expectationLabel(step.expectation)}
    <h2>${esc(step.title)}</h2>
    <p>${esc(step.body)}</p>
    ${renderVisual(step.visual)}
    ${step.workedExample ? `<div class="worked-example"><strong>Example</strong><span>${esc(step.workedExample)}</span></div>` : ""}
    ${step.payoff ? `<div class="lesson-payoff"><strong>Why this matters</strong><span>${esc(step.payoff)}</span></div>` : ""}
  </section>`;
}

/** Full teaching rendering remains useful for replay/QA and places Skip to Review only after all teaching. */
export function renderTeachingLesson({ lesson, openingState }) {
  const steps = lesson.teachingSteps.map((step, index) => renderStep(step, index, lesson.teachingSteps.length)).join("");
  const skip = openingState.canSkipToReview && openingState.skipPlacement === "teaching-bottom"
    ? `<button class="secondary lesson-skip-review" data-action="skip-review" type="button">Skip to Review</button>`
    : "";
  return `<div class="lesson-content">${steps}${skip}</div>`;
}

/** The live lesson flow shows one short teaching screen at a time. */
export function renderTeachingStep({ lesson, openingState, stepIndex }) {
  const safeIndex = Math.min(Math.max(0, Number(stepIndex) || 0), Math.max(0, lesson.teachingSteps.length - 1));
  const step = lesson.teachingSteps[safeIndex];
  const atEnd = safeIndex === lesson.teachingSteps.length - 1;
  const skip = atEnd && openingState.canSkipToReview && openingState.skipPlacement === "teaching-bottom"
    ? `<button class="secondary lesson-skip-review" data-action="skip-review" type="button">Skip to Review</button>`
    : "";
  return `<div class="lesson-content">${renderStep(step, safeIndex, lesson.teachingSteps.length)}
    <div class="lesson-actions">
      ${safeIndex > 0 ? `<button class="secondary" data-action="previous-teaching" type="button">Back</button>` : ""}
      ${atEnd ? `<button class="primary" data-action="start-practice" type="button">Start Practice</button>` : `<button class="primary" data-action="next-teaching" type="button">Continue</button>`}
    </div>
    ${skip}
  </div>`;
}

export function renderPracticeRoundCounter(answered, size, roundNumber = 1) {
  const safeSize = Math.max(1, Number(size) || 1);
  const questionNumber = Math.min(safeSize, Math.max(0, Number(answered) || 0) + 1);
  return `<div class="question-meta"><span>Question ${questionNumber} of ${safeSize}</span><span>Round ${Math.max(1, Number(roundNumber) || 1)}</span></div>`;
}
