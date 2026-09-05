import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const [baseTokens, appearance] = await Promise.all([
  readFile(new URL("../web/reference-tokens.css", import.meta.url), "utf8"),
  readFile(new URL("../web/appearance-system.css", import.meta.url), "utf8"),
]);

test("success and error remain semantic tokens, not accent aliases", () => {
  assert.match(baseTokens, /--success:\s*#/);
  assert.match(baseTokens, /--error:\s*#/);
  assert.doesNotMatch(appearance, /--success\s*:/);
  assert.doesNotMatch(appearance, /--error\s*:/);
  assert.doesNotMatch(appearance, /--danger\s*:\s*var\(--accent/);
});
