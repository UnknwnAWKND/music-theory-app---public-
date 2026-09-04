import { CURRICULUM_PHASES, PHASE_BY_NUMBER } from "./phases.js";
import { SKILLS, SKILL_BY_ID } from "./skills.js";
import type { PhaseNumber, SkillDefinition } from "./types.js";

export interface CurriculumValidationResult {
  valid: boolean;
  errors: string[];
}

export function skillsForPhase(phase: PhaseNumber): SkillDefinition[] {
  return SKILLS.filter((skill) => skill.phase === phase);
}

export function validateCurriculumGraph(skills: readonly SkillDefinition[] = SKILLS): CurriculumValidationResult {
  const errors: string[] = [];
  const byId = new Map<string, SkillDefinition>();
  for (const skill of skills) {
    if (byId.has(skill.id)) errors.push(`Duplicate skill id: ${skill.id}`);
    byId.set(skill.id, skill);
    if (!PHASE_BY_NUMBER.has(skill.phase)) errors.push(`Skill ${skill.id} uses an unknown phase`);
    if (skill.contentKind === "reference" && (skill.assessed || skill.blocksPhaseCompletion)) {
      errors.push(`Reference content ${skill.id} cannot be assessed or block phase completion`);
    }
  }
  for (const skill of skills) {
    for (const dependency of skill.prerequisites) {
      if (!byId.has(dependency)) errors.push(`Skill ${skill.id} depends on missing skill ${dependency}`);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) { errors.push(`Curriculum cycle detected at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.prerequisites ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const skill of skills) visit(skill.id);
  return { valid: errors.length === 0, errors };
}

export function topologicalSkillIds(skills: readonly SkillDefinition[] = SKILLS): string[] {
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const visited = new Set<string>();
  const order: string[] = [];
  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    for (const dependency of byId.get(id)?.prerequisites ?? []) visit(dependency);
    if (byId.has(id)) order.push(id);
  };
  for (const skill of skills) visit(skill.id);
  return order;
}

export function downstreamSkillIds(skillId: string): string[] {
  if (!SKILL_BY_ID.has(skillId)) return [];
  const found = new Set<string>();
  const queue = [skillId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const skill of SKILLS) {
      if (skill.prerequisites.includes(current) && !found.has(skill.id)) {
        found.add(skill.id);
        queue.push(skill.id);
      }
    }
  }
  return [...found];
}

export function phaseNumbers(): PhaseNumber[] {
  return CURRICULUM_PHASES.map((phase) => phase.phase);
}
