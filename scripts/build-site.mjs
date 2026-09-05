import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { transformBlock4App, transformBlock4Index } from "./block4-app-transform.mjs";
import { transformBlock5App, transformBlock5Index } from "./block5-app-transform.mjs";
import { transformBlock6App, transformBlock6Index } from "./block6-app-transform.mjs";

const OUT = "site";
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp("web", OUT, { recursive: true });
await cp("dist", `${OUT}/core`, { recursive: true });

const block3App = await readFile("web/app-block3.js", "utf8");
const sourceIndex = await readFile("web/index.html", "utf8");
const block4App = transformBlock4App(block3App);
const block4Index = transformBlock4Index(sourceIndex);
const block5App = transformBlock5App(block4App);
const block5Index = transformBlock5Index(block4Index);
await writeFile(`${OUT}/app-block6.js`, transformBlock6App(block5App));
await writeFile(`${OUT}/index.html`, transformBlock6Index(block5Index));

const sourceConfig = existsSync("web/config.js") ? await readFile("web/config.js", "utf8") : "";
const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
if (url && key) {
  await writeFile(`${OUT}/config.js`, `globalThis.__THEORY_TUTOR_CONFIG__ = Object.freeze({\n  buildVersion: \"rebuild-block6-phase5-relatives\",\n  supabaseUrl: ${JSON.stringify(url)},\n  supabasePublishableKey: ${JSON.stringify(key)},\n});\n`);
} else if (!sourceConfig.trim()) {
  await writeFile(`${OUT}/config.js`, `globalThis.__THEORY_TUTOR_CONFIG__ = Object.freeze({ buildVersion: \"rebuild-block6-phase5-relatives\", supabaseUrl: \"\", supabasePublishableKey: \"\" });\n`);
}

console.log("Built Block 6 Phase 5 relatives site in ./site");
