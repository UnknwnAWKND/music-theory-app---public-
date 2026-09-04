import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const OUT = "site";
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp("web", OUT, { recursive: true });
await cp("dist", `${OUT}/core`, { recursive: true });

const sourceConfig = existsSync("web/config.js") ? await readFile("web/config.js", "utf8") : "";
const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
if (url && key) {
  await writeFile(`${OUT}/config.js`, `globalThis.__THEORY_TUTOR_CONFIG__ = Object.freeze({\n  buildVersion: \"rebuild-block1\",\n  supabaseUrl: ${JSON.stringify(url)},\n  supabasePublishableKey: ${JSON.stringify(key)},\n});\n`);
} else if (!sourceConfig.trim()) {
  await writeFile(`${OUT}/config.js`, `globalThis.__THEORY_TUTOR_CONFIG__ = Object.freeze({ buildVersion: \"rebuild-block1\", supabaseUrl: \"\", supabasePublishableKey: \"\" });\n`);
}

console.log("Built clean Block 1 site in ./site");
