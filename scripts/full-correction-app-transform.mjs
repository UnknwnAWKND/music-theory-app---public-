function replaceRequired(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`Full correction transform could not find: ${label}`);
  return next;
}

export function transformProfileController(source) {
  let out = source;
  out = replaceRequired(
    out,
    "let enhancing = false;\nlet accountSubview = null;",
    "let enhancing = false;\nlet enhancePending = false;\nlet accountSubview = null;",
    "profile enhancement state",
  );
  out = replaceRequired(
    out,
    '  if (currentRoute() !== "profile") return;',
    '  if (currentRoute() !== "profile" || !main.isConnected || app?.querySelector(".screen-content") !== main) return;',
    "detached Profile render guard",
  );
  out = replaceRequired(
    out,
    "async function enhance() {\n  if (!app || enhancing) return;\n  enhancing = true;",
    "async function enhance() {\n  if (!app) return;\n  if (enhancing) { enhancePending = true; return; }\n  enhancing = true;",
    "profile enhancement re-entry guard",
  );
  out = replaceRequired(
    out,
    "  } catch (error) {\n    console.error(\"Profile/account enhancement failed\", error);\n  } finally { enhancing = false; }\n}",
    "  } catch (error) {\n    console.error(\"Profile/account enhancement failed\", error);\n  } finally {\n    enhancing = false;\n    if (enhancePending) { enhancePending = false; scheduleEnhance(); }\n  }\n}",
    "profile enhancement pending rerun",
  );
  return out;
}

function firstMissingCheckpointHelpers() {
  return `function firstMissingPrerequisiteCheckpoint(targetPhase, progressRows) {
  for (let phase = 1; phase < targetPhase; phase += 1) {
    if (!checkpointPassed(progressRows, phase)) return phase;
  }
  return null;
}

async function renderPrerequisiteCheckpointGate(targetPhase) {
  const progressRows = await state.repo.phaseProgress(state.userId);
  const requiredPhase = firstMissingPrerequisiteCheckpoint(targetPhase, progressRows);
  if (!requiredPhase) return navigate("learn", true);
  root.innerHTML = shell(\`<header class="page-header lesson-header"><button class="back-button" id="lockedPhaseBack" type="button">\${uiIcon("back")}<span>Learn</span></button><div><div class="eyebrow">Phase \${targetPhase}</div><h1>Phase \${targetPhase} is locked</h1></div></header>
    <section class="focus-card locked-phase-gate"><h2>Pass the Phase \${requiredPhase} checkpoint</h2><p>Complete the prerequisite checkpoint to keep moving toward Phase \${targetPhase}. The checkpoint tests Phase \${requiredPhase} material, not Phase \${targetPhase} material.</p><button class="primary" id="takeRequiredCheckpoint" type="button">Take Phase \${requiredPhase} Checkpoint</button></section>\`, "learn", false);
  document.querySelector("#lockedPhaseBack").onclick = () => navigate("learn");
  document.querySelector("#takeRequiredCheckpoint").onclick = () => startCheckpoint(requiredPhase, targetPhase);
}

`;
}

function correctedRenderLearn() {
  return `async function renderLearn() {
  const states = await state.repo.allSkillStates(state.userId);
  const bySkill = evidenceMap(states);
  const lessonProgress = await state.repo.allLessonProgress(state.userId);
  const lessonById = lessonProgressMap(lessonProgress);
  const readyIds = new Set(states.filter((row) => row.evidence.ready && !row.evidence.fragile).map((row) => row.skillId));
  const progress = await state.repo.phaseProgress(state.userId);
  const summary = learningSummary(SKILLS, states, progress, lessonProgress);

  const sections = CURRICULUM_PHASES.map(({ phase, title }) => {
    const skills = phaseSkills(phase);
    const phaseInfo = phaseSummary(SKILLS, phase, states, progress, lessonProgress);
    const entryAllowed = phaseEntryAllowed(phase, progress);
    const phaseProgress = progress.find((row) => row.phase === phase);
    const checkpointReady = entryAllowed && phaseCoreReady(phase, readyIds) && phaseAssessedLessonsComplete(SKILLS, phase, lessonProgress);
    const open = phase === summary.currentPhase || Boolean(phaseProgress?.validatedEntryAt && !phaseProgress?.checkpointPassedAt);
    const stateLabel = phaseInfo.checkpointPassed ? "Complete" : !entryAllowed ? "Locked" : phase === summary.currentPhase ? "Current" : "Available";
    const stateClass = phaseInfo.checkpointPassed ? "complete" : phase === summary.currentPhase ? "current" : "";
    const requiredCheckpointPhase = firstMissingPrerequisiteCheckpoint(phase, progress);

    const rows = skills.map((skill, index) => {
      const unlocked = lessonUnlocked(skill, index, lessonById, progress);
      const phaseLocked = !entryAllowed && state.settings?.requirePreviousLessons !== false;
      const status = skill.contentKind === "reference" ? { label: "Reference", cls: "" } : statusFor(bySkill.get(skill.id), lessonById.get(skill.id));
      const lockedCopy = phaseLocked && requiredCheckpointPhase
        ? \`Pass the Phase \${requiredCheckpointPhase} checkpoint to unlock Phase \${phase}\`
        : "Complete the previous lesson first";
      const lockAttrs = unlocked ? "" : phaseLocked ? \`data-locked-phase="\${phase}"\` : "disabled";
      return \`<button class="lesson-row \${unlocked ? "" : "locked"}" data-skill="\${esc(skill.id)}" \${lockAttrs} type="button">
        <span class="lesson-number">\${index + 1}</span>
        <span class="lesson-copy"><strong>\${esc(skill.title)}</strong><small>\${esc(unlocked ? lessonSubcopy(skill, index) : lockedCopy)}</small></span>
        <span class="lesson-status \${status.cls}">\${unlocked ? status.label : "Locked"}</span>
      </button>\`;
    }).join("");

    return \`<details class="phase-section-final" data-phase="\${phase}" \${open ? "open" : ""}>
      <summary class="phase-summary-final">
        <span class="phase-number-final">\${phase}</span>
        <span class="phase-copy-final"><strong>\${esc(title)}</strong><small>\${phaseInfo.completed} of \${phaseInfo.required.length} assessed lessons complete · \${phaseInfo.percent}%</small></span>
        <span class="phase-state-final \${stateClass}">\${stateLabel}</span>
      </summary>
      <div class="phase-body-final">
        <section class="phase-intro"><p>\${esc(phaseIntro(phase))}</p></section>
        <section class="lesson-list">\${rows}</section>
        <section class="checkpoint-card \${checkpointReady ? "" : "locked"}">
          <div class="eyebrow">Phase \${phase} checkpoint</div>
          <h2>\${phaseInfo.checkpointPassed ? "Checkpoint passed" : "Ready when the phase is ready"}</h2>
          <p>\${esc(checkpointCopy(phase))}</p>
          <button class="\${checkpointReady ? "primary" : "secondary"}" data-checkpoint-phase="\${phase}" type="button" \${checkpointReady ? "" : "disabled"}>\${phaseInfo.checkpointPassed ? "Retake Checkpoint" : checkpointReady ? "Take Checkpoint" : entryAllowed ? "Complete the assessed lessons first" : "Phase locked"}</button>
        </section>
      </div>
    </details>\`;
  }).join("");

  root.innerHTML = shell(\`<header class="curriculum-header"><div><div class="eyebrow">Learn</div><h1>Six-phase curriculum</h1><p>Open the phase you are working on. Earlier foundations continue in review.</p></div></header>
    <section class="phase-list-final">\${sections}</section>\`, "learn");
  bindNav();
  document.querySelectorAll("[data-skill]:not([data-locked-phase])").forEach((button) => button.addEventListener("click", () => openLesson(button.dataset.skill)));
  document.querySelectorAll("[data-locked-phase]").forEach((button) => button.addEventListener("click", () => renderPrerequisiteCheckpointGate(Number(button.dataset.lockedPhase))));
  document.querySelectorAll("[data-checkpoint-phase]").forEach((button) => {
    if (!button.disabled) button.addEventListener("click", () => startCheckpoint(Number(button.dataset.checkpointPhase)));
  });
}

`;
}

export function transformAppBlock8(source) {
  let out = source;

  // The standalone placement route is no longer a normal user-facing destination.
  out = replaceRequired(
    out,
    '["home", "learn", "profile", "settings", "edit-profile", "placement"].includes(value)',
    '["home", "learn", "profile", "settings", "edit-profile"].includes(value)',
    "placement route removal",
  );

  out = replaceRequired(
    out,
    /async function renderLearn\(\) \{[\s\S]*?\n\}\n\nasync function renderLesson\(\) \{/,
    `${firstMissingCheckpointHelpers()}${correctedRenderLearn()}async function renderLesson() {`,
    "Learn screen contextual checkpoint flow",
  );

  out = replaceRequired(
    out,
    "    const round = practiceRoundPlan(skillId, kind);",
    "    const round = practiceRoundPlan(skillId, kind, Boolean(options.followUp));",
    "follow-up round planning",
  );
  out = replaceRequired(
    out,
    "      skillId, kind, roundSize: round.size, roundNumber: 1, answered: 0,",
    "      skillId, kind, roundSize: round.size, roundNumber: 1, answered: 0, correctFirstAttempt: 0,",
    "practice accuracy state",
  );
  out = replaceRequired(
    out,
    "    practice.feedback = grade;\n    practice.answered += 1;",
    "    practice.feedback = grade;\n    if (grade.correct) practice.correctFirstAttempt += 1;\n    practice.answered += 1;",
    "first-attempt correct increment",
  );
  out = replaceRequired(
    out,
    "      <h2>${ready ? \"Ready to move forward.\" : \"More evidence needed.\"}</h2>\n      <p>${ready ? \"You can continue. This skill will still return in spaced and cumulative review.\" : \"One round is not enough evidence yet. You can do another focused round or stop for now.\"}</p>\n      <div class=\"lesson-actions\">\n        ${ready ? `<button class=\"primary\" id=\"backToLessons\" type=\"button\">Back to Phase ${phase}</button>` : `<button class=\"primary\" id=\"anotherRound\" type=\"button\">Start another ${practiceRoundPlan(practice.skillId, \"acquisition\", true).size}-question round</button><button class=\"secondary\" id=\"backToLessons\" type=\"button\">Stop for now</button>`}",
    "      <h2>${ready ? \"Ready to move forward.\" : \"Skill not mastered yet\"}</h2>\n      <p>${ready ? \"You can continue. This skill will still return in spaced and cumulative review.\" : \"Continue practicing this skill before moving on.\"}</p>\n      <div class=\"lesson-actions\">\n        ${ready ? `<button class=\"primary\" id=\"backToLessons\" type=\"button\">Back to Phase ${phase}</button>` : `<button class=\"primary\" id=\"anotherRound\" type=\"button\">Continue Practicing</button><button class=\"secondary\" id=\"backToLessons\" type=\"button\">Stop for Now</button>`}",
    "learner-facing round completion wording",
  );
  out = replaceRequired(
    out,
    "  if (another) another.onclick = () => startPractice(practice.skillId, practice.kind, { lessonProgress: practice.lessonProgress, replay: practice.replay });",
    "  if (another) another.onclick = () => startPractice(practice.skillId, practice.kind, { lessonProgress: practice.lessonProgress, replay: practice.replay, followUp: true });",
    "follow-up practice action",
  );
  out = replaceRequired(
    out,
    "      ${renderPracticeRoundCounter(counterAnswered, practice.roundSize, practice.roundNumber)}",
    "      ${renderPracticeRoundCounter(counterAnswered, practice.roundSize, practice.correctFirstAttempt, practice.answered)}",
    "live practice accuracy counter",
  );

  out = replaceRequired(
    out,
    "function startAssessment(definition, kind, targetPhase = definition.phase) {\n  if (!definition?.competencies?.length) return;\n  state.screen = \"checkpoint\";\n  state.checkpoint = { definition, kind, targetPhase, results: [], index: 0, current: null, feedback: null, recentSignatures: [] };",
    "function startAssessment(definition, kind, targetPhase = definition.phase, options = {}) {\n  if (!definition?.competencies?.length) return;\n  state.screen = \"checkpoint\";\n  state.checkpoint = { definition, kind, targetPhase, results: [], index: 0, current: null, feedback: null, recentSignatures: [], ...options };",
    "checkpoint context options",
  );
  out = replaceRequired(
    out,
    "function startCheckpoint(phase) {\n  const definition = checkpointDefinition(phase);\n  if (definition) startAssessment(definition, \"checkpoint\", phase);\n}",
    "function startCheckpoint(phase, prerequisiteTargetPhase = null) {\n  const definition = checkpointDefinition(phase);\n  if (definition) startAssessment(definition, \"checkpoint\", phase, { prerequisiteTargetPhase });\n}",
    "contextual checkpoint start",
  );
  out = replaceRequired(
    out,
    "  checkpoint.recentSignatures = [...checkpoint.recentSignatures, selected.exercise.exampleSignature].slice(-12);",
    "  checkpoint.recentSignatures = [...checkpoint.recentSignatures, selected.exercise.exampleSignature];",
    "checkpoint duplicate suppression history",
  );
  out = replaceRequired(
    out,
    "      <button class=\"primary\" id=\"assessmentDone\" type=\"button\">${checkpoint.kind === \"placement\" ? \"Back to Learn\" : \"Back to Learn\"}</button>",
    "      <button class=\"primary\" id=\"assessmentDone\" type=\"button\">${evaluation.passed && checkpoint.prerequisiteTargetPhase ? \"Continue\" : \"Back to Learn\"}</button>",
    "contextual checkpoint result action",
  );
  out = replaceRequired(
    out,
    "  document.querySelector(\"#assessmentDone\").onclick = () => navigate(\"learn\");",
    "  document.querySelector(\"#assessmentDone\").onclick = () => evaluation.passed && checkpoint.prerequisiteTargetPhase ? renderPrerequisiteCheckpointGate(checkpoint.prerequisiteTargetPhase) : navigate(\"learn\");",
    "contextual checkpoint sequencing",
  );
  out = replaceRequired(
    out,
    "      <div class=\"assessment-meta\"><span>Item ${Math.max(1,itemNumber)}</span><span>Up to ${checkpoint.definition.maxItems}</span></div>",
    "      <div class=\"assessment-meta\"><span>Question ${Math.max(1,itemNumber)} of ${checkpoint.definition.maxItems}</span><span>Checkpoint</span></div>",
    "checkpoint progress label",
  );
  out = replaceRequired(
    out,
    "  document.querySelector(\"#exitCheckpoint\").onclick = () => checkpoint.kind === \"placement\" ? navigate(\"placement\") : navigate(\"learn\");",
    "  document.querySelector(\"#exitCheckpoint\").onclick = () => checkpoint.prerequisiteTargetPhase ? renderPrerequisiteCheckpointGate(checkpoint.prerequisiteTargetPhase) : navigate(\"learn\");",
    "checkpoint exit safety flow",
  );

  // Profile rendering has one owner: profile-account-controller.js. The base app
  // now supplies only a loading host, eliminating the legacy-layout flash/race.
  out = replaceRequired(
    out,
    /async function renderProfile\(\) \{[\s\S]*?\n\}\n\nasync function saveSettings/,
    `async function renderProfile() {
  root.innerHTML = shell(\`<section class="profile-controller-host loading-state" aria-live="polite"><span>Loading profile…</span></section>\`, "profile");
  bindNav();
}

async function saveSettings`,
    "legacy Profile renderer",
  );
  out = replaceRequired(
    out,
    /async function renderEditProfile\(\) \{[\s\S]*?\n\}\n\nasync function render\(\) \{/,
    `async function renderEditProfile() {
  root.innerHTML = shell(\`<header class="page-header lesson-header"><button class="back-button" id="editProfileHostBack" type="button">\${uiIcon("back")}<span>Profile</span></button><div><div class="eyebrow">Profile</div><h1>Edit Profile</h1></div></header><section class="profile-controller-host loading-state" aria-live="polite"><span>Loading profile…</span></section>\`, "profile", false);
  document.querySelector("#editProfileHostBack").onclick = () => navigate("profile");
}

async function render() {`,
    "legacy Edit Profile renderer",
  );
  out = replaceRequired(
    out,
    '    if (state.screen === "placement") return await renderPlacement();',
    '    if (state.screen === "placement") return navigate("learn", true);',
    "standalone placement render redirect",
  );

  return out;
}
