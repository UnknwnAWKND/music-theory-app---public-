import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const site = resolve(root, "site");
await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
await cp(resolve(root, "web"), site, { recursive: true });
await cp(resolve(root, "dist"), resolve(site, "core"), { recursive: true });

const supabaseUrl = String(process.env.SUPABASE_URL ?? "").trim();
const publishableKey = String(
  process.env.SUPABASE_PUBLISHABLE_KEY
  ?? process.env.SUPABASE_ANON_KEY
  ?? "",
).trim();

if (Boolean(supabaseUrl) !== Boolean(publishableKey)) {
  throw new Error("Set both SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or legacy SUPABASE_ANON_KEY), or neither for local preview mode.");
}

const browserConfig = {
  buildVersion: "v0.7",
  supabaseUrl,
  supabasePublishableKey: publishableKey,
};
await writeFile(
  resolve(site, "config.js"),
  `window.__THEORY_TUTOR_CONFIG__ = Object.freeze(${JSON.stringify(browserConfig, null, 2)});\n`,
  "utf8",
);

console.log(`Built static site at ${site} (${supabaseUrl ? "Supabase persistence" : "local preview persistence"})`);
