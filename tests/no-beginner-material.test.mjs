import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { SKILLS } from "../dist/curriculum/index.js";

test("beginner piano-note naming is absent, not hidden", () => {
  assert.equal(SKILLS.some((x) => x.id === "pitch.note-names"), false);
  const files = [
    "src/curriculum/skills.ts",
    "src/exercises/catalog.ts",
    "src/practice/lessons.ts",
  ].map((p) => fs.readFileSync(p, "utf8")).join("\n");
  assert.equal(/pitch\.note-names|Name piano notes|Name the highlighted natural piano key/i.test(files), false);
});

test("curriculum has none of the explicitly excluded beginner subjects", () => {
  const text = SKILLS.map((x) => `${x.id} ${x.title} ${(x.tags ?? []).join(" ")}`).join("\n");
  assert.equal(/\b(sheet music|treble clef|bass clef|finger numbers|posture|basic improvisation|ear training|aural training)\b/i.test(text), false);
});
