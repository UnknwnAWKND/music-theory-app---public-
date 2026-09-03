import { SKILLS } from "./skills.js";
import type { GraphValidationResult, SkillDefinition } from "./types.js";

export function validateSkillGraph(skills: readonly SkillDefinition[] = SKILLS): GraphValidationResult {
  const counts = new Map<string, number>();
  for (const skill of skills) counts.set(skill.id, (counts.get(skill.id) ?? 0) + 1);
  const duplicateIds = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  const ids = new Set(skills.map((x) => x.id));
  const missingPrerequisites: GraphValidationResult["missingPrerequisites"] = [];
  for (const skill of skills) {
    for (const prerequisiteId of skill.prerequisites) {
      if (!ids.has(prerequisiteId)) missingPrerequisites.push({ skillId: skill.id, prerequisiteId });
    }
  }

  const byId = new Map(skills.map((skill) => [skill.id, skill] as const));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  const cycleKeys = new Set<string>();

  const dfs = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      const key = cycle.join("→");
      if (!cycleKeys.has(key)) {
        cycleKeys.add(key);
        cycles.push(cycle);
      }
      return;
    }
    visiting.add(id);
    stack.push(id);
    const skill = byId.get(id);
    if (skill) for (const dep of skill.prerequisites) if (byId.has(dep)) dfs(dep);
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  };

  for (const skill of skills) dfs(skill.id);
  return {
    ok: duplicateIds.length === 0 && missingPrerequisites.length === 0 && cycles.length === 0,
    duplicateIds,
    missingPrerequisites,
    cycles,
  };
}

export function topologicalSkillOrder(skills: readonly SkillDefinition[] = SKILLS): SkillDefinition[] {
  const validation = validateSkillGraph(skills);
  if (!validation.ok) throw new Error(`Invalid skill graph: ${JSON.stringify(validation)}`);

  const byId = new Map(skills.map((skill) => [skill.id, skill] as const));
  const inDegree = new Map<string, number>(skills.map((skill) => [skill.id, 0]));
  const children = new Map<string, string[]>();
  for (const skill of skills) {
    for (const dep of skill.prerequisites) {
      inDegree.set(skill.id, (inDegree.get(skill.id) ?? 0) + 1);
      const arr = children.get(dep) ?? [];
      arr.push(skill.id);
      children.set(dep, arr);
    }
  }
  const queue = skills.filter((s) => inDegree.get(s.id) === 0).map((s) => s.id);
  const result: SkillDefinition[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    result.push(byId.get(id)!);
    for (const child of children.get(id) ?? []) {
      const next = (inDegree.get(child) ?? 0) - 1;
      inDegree.set(child, next);
      if (next === 0) queue.push(child);
    }
  }
  return result;
}

export function prerequisitesMet(skill: SkillDefinition, readySkillIds: ReadonlySet<string>): boolean {
  return skill.prerequisites.every((id) => readySkillIds.has(id));
}

export function unlockableSkills(
  readySkillIds: ReadonlySet<string>,
  knownSkillIds: ReadonlySet<string> = new Set(),
  skills: readonly SkillDefinition[] = SKILLS,
): SkillDefinition[] {
  return skills.filter(
    (skill) => !readySkillIds.has(skill.id) && !knownSkillIds.has(skill.id) && prerequisitesMet(skill, readySkillIds),
  );
}

export function descendantsOf(skillId: string, skills: readonly SkillDefinition[] = SKILLS): Set<string> {
  const children = new Map<string, string[]>();
  for (const skill of skills) {
    for (const dep of skill.prerequisites) {
      const arr = children.get(dep) ?? [];
      arr.push(skill.id);
      children.set(dep, arr);
    }
  }
  const out = new Set<string>();
  const queue = [...(children.get(skillId) ?? [])];
  while (queue.length) {
    const id = queue.shift()!;
    if (out.has(id)) continue;
    out.add(id);
    queue.push(...(children.get(id) ?? []));
  }
  return out;
}
