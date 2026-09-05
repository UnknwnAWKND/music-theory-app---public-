import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const OUT = "site";
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp("web", OUT, { recursive: true });
await cp("dist", `${OUT}/core`, { recursive: true });

// Block 8 is the final product build. Historical intermediate app shells are
// intentionally not shipped in the production site.
for (const oldFile of ["app.js", "app-block3.js", "reset-progress-settings.js"]) {
  await rm(`${OUT}/${oldFile}`, { force: true });
}

const sourceConfig = existsSync("web/config.js") ? await readFile("web/config.js", "utf8") : "";
const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
if (url && key) {
  await writeFile(`${OUT}/config.js`, `globalThis.__THEORY_TUTOR_CONFIG__ = Object.freeze({\n  buildVersion: \"rebuild-block8-final\",\n  supabaseUrl: ${JSON.stringify(url)},\n  supabasePublishableKey: ${JSON.stringify(key)},\n});\n`);
} else if (!sourceConfig.trim()) {
  await writeFile(`${OUT}/config.js`, `globalThis.__THEORY_TUTOR_CONFIG__ = Object.freeze({ buildVersion: \"rebuild-block8-final\", supabaseUrl: \"\", supabasePublishableKey: \"\" });\n`);
}

console.log("Built Block 8 final polished site in ./site");
