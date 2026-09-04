function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

export function renderTeachingLesson({ lesson, openingState }) {
  const steps = lesson.teachingSteps.map((step) => `
    <section class="lesson-step" data-step="${esc(step.id)}">
      <h2>${esc(step.title)}</h2>
      <p>${esc(step.body)}</p>
      ${step.workedExample ? `<div class="worked-example">${esc(step.workedExample)}</div>` : ""}
    </section>`).join("");
  const skip = openingState.canSkipToReview && openingState.skipPlacement === "teaching-bottom"
    ? `<button class="secondary lesson-skip-review" data-action="skip-review" type="button">Skip to Review</button>`
    : "";
  return `<div class="lesson-content">${steps}${skip}</div>`;
}

export function renderPracticeRoundCounter(answered, size, roundNumber = 1) {
  const safeSize = Math.max(1, Number(size) || 1);
  const questionNumber = Math.min(safeSize, Math.max(0, Number(answered) || 0) + 1);
  return `<div class="question-meta"><span>Question ${questionNumber} of ${safeSize}</span><span>Round ${Math.max(1, Number(roundNumber) || 1)}</span></div>`;
}
