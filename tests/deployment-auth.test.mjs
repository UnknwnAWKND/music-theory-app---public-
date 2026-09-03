import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../web/app.js", import.meta.url), "utf8");
const runtime = await readFile(new URL("../web/runtime.js", import.meta.url), "utf8");
const buildScript = await readFile(new URL("../scripts/build-site.mjs", import.meta.url), "utf8");
const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");


test("production web runtime uses Supabase Auth and session-backed REST persistence", () => {
  assert.match(runtime, /@supabase\/supabase-js@2\.114\.0/);
  assert.match(runtime, /persistSession:\s*true/);
  assert.match(runtime, /autoRefreshToken:\s*true/);
  assert.match(runtime, /signInWithPassword/);
  assert.match(app, /SupabaseRestTutorRepository/);
  assert.match(app, /getAccessToken:\s*\(\)\s*=>\s*getAccessToken\(authClient\)/);
  assert.match(app, /USER_ID\s*=\s*session\.user\.id/);
});


test("browser build injects only Supabase public client configuration", () => {
  assert.match(buildScript, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(buildScript, /SUPABASE_ANON_KEY/);
  assert.doesNotMatch(buildScript, /SUPABASE_(SECRET|SERVICE_ROLE)_KEY/);
  assert.match(envExample, /SUPABASE_PUBLISHABLE_KEY=/);
  assert.doesNotMatch(envExample, /^SUPABASE_(SECRET|SERVICE_ROLE)_KEY=/m);
});


test("web app retains an explicit local-only preview mode when Supabase config is absent", () => {
  assert.match(app, /hasSupabaseConfig\(config\)/);
  assert.match(app, /BrowserStorageTutorRepository/);
  assert.match(app, /music-theory-tutor:v0\.7-preview/);
});


test("appBaseUrl preserves a GitHub Pages repository path", async () => {
  const source = await readFile(new URL("../web/runtime.js", import.meta.url), "utf8");
  assert.match(source, /new URL\("\.", locationLike\.href\)\.href/);
  assert.doesNotMatch(source, /emailRedirectTo:\s*globalThis\.location\?\.origin/);
});
