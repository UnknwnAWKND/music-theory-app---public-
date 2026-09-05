import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { transformBlock4App, transformBlock4Index } from "./block4-app-transform.mjs";

const OUT = "site";
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp("web", OUT, { recursive: true });
await cp("dist", `${OUT}/core`, { recursive: true });

const block3App = await readFile("web/app-block3.js", "utf8");
const sourceIndex = await readFile("web/index.html", "utf8");
await writeFile(`${OUT}/app-block4.js`, transformBlock4App(block3App));
await writeFile(`${OUT}/index.html`, transformBlock4Index(sourceIndex));

const sourceConfig = existsSync("web/config.js") ? await readFile("web/config.js", "utf8") : "";
const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
if (url && key) {
  await writeFile(`${OUT}/config.js`, `globalThis.__THEORY_TUTOR_CONFIG__ = Object.freeze({\n  buildVersion: \"rebuild-block4-phase3-minor-scales\",\n  supabaseUrl: ${JSON.stringify(url)},\n  supabasePublishableKey: ${JSON.stringify(key)},\n});\n`);
} else if (!sourceConfig.trim()) {
  await writeFile(`${OUT}/config.js`, `globalThis.__THEORY_TUTOR_CONFIG__ = Object.freeze({ buildVersion: \"rebuild-block4-phase3-minor-scales\", supabaseUrl: \"\", supabasePublishableKey: \"\" });\n`);
}

console.log("Built Block 4 Phase 3 minor-scale site in ./site");
