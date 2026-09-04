import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const command = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
  .find((name) => spawnSync("which", [name], { stdio: "ignore" }).status === 0);
if (!command) throw new Error("Responsive smoke test requires Chrome or Chromium on the CI runner.");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "theory-ui-"));
const webDir = path.join(tmp, "web");
fs.cpSync("web", webDir, { recursive: true });
fs.writeFileSync(path.join(webDir, "config.js"), "window.__THEORY_TUTOR_CONFIG__ = {};\n");

const server = spawn("python3", ["-m", "http.server", "4173", "--bind", "127.0.0.1", "--directory", webDir], { stdio: "ignore" });
const chrome = spawn(command, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--hide-scrollbars",
  "--remote-debugging-port=9222",
  `--user-data-dir=${path.join(tmp, "chrome")}`,
  "--remote-allow-origins=*",
  "about:blank",
], { stdio: "ignore" });

async function pollJson(url, timeoutMs = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function openTarget(url) {
  const started = Date.now();
  while (Date.now() - started < 8000) {
    try {
      const response = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
      if (response.ok) return response.json();
    } catch {}
    await sleep(100);
  }
  throw new Error("Could not open Chrome debugging target");
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("Chrome DevTools websocket failed")), { once: true });
  });
  const send = async (method, params = {}) => {
    await ready;
    const id = nextId++;
    const promise = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    ws.send(JSON.stringify({ id, method, params }));
    return promise;
  };
  return { ws, send };
}

async function evaluate(send, expression) {
  const out = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (out.exceptionDetails) throw new Error(out.exceptionDetails.text || "Browser evaluation failed");
  return out.result?.value;
}

async function waitFor(send, selector, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(send, `Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return;
    await sleep(80);
  }
  throw new Error(`Timed out waiting for ${selector}`);
}

async function checkLayout(send, label, width, height) {
  const result = await evaluate(send, `(() => {
    const controls = [...document.querySelectorAll('button, input:not([type="checkbox"]), select')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      })
      .map((el) => ({ tag: el.tagName, id: el.id, cls: el.className, h: el.getBoundingClientRect().height }))
      .filter((x) => x.h < 43.5);
    return {
      innerWidth,
      innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      shortControls: controls,
    };
  })()`);
  assert.ok(result.scrollWidth <= result.innerWidth + 1, `${label} overflows horizontally at ${width}x${height}: ${JSON.stringify(result)}`);
  assert.deepEqual(result.shortControls, [], `${label} has undersized tap controls at ${width}x${height}: ${JSON.stringify(result.shortControls)}`);
}

const viewports = [
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
];

let client;
try {
  await pollJson("http://127.0.0.1:9222/json/version");
  const target = await openTarget("http://127.0.0.1:4173/");
  client = connect(target.webSocketDebuggerUrl);
  const { send } = client;
  await send("Page.enable");
  await send("Runtime.enable");

  for (const [width, height] of viewports) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
    await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
    await waitFor(send, ".home-screen");
    await checkLayout(send, "Home", width, height);

    await evaluate(send, `document.querySelector('[data-nav="learn"]').click()`);
    await waitFor(send, ".curriculum-screen");
    await checkLayout(send, "Curriculum", width, height);

    await evaluate(send, `document.querySelector('[data-open-phase]')?.click()`);
    await waitFor(send, ".phase-screen");
    await checkLayout(send, "Phase", width, height);

    await evaluate(send, `document.querySelector('[data-nav="profile"]').click()`);
    await waitFor(send, ".profile-screen");
    await checkLayout(send, "Profile", width, height);

    await evaluate(send, `document.querySelector('[data-settings]').click()`);
    await waitFor(send, ".settings-screen");
    await checkLayout(send, "Settings", width, height);

    await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
    await waitFor(send, ".home-screen");
    await evaluate(send, `document.querySelector('#startBtn').click()`);
    const started = Date.now();
    while (Date.now() - started < 5000) {
      if (await evaluate(send, `Boolean(document.querySelector('.question-shell'))`)) break;
      if (await evaluate(send, `Boolean(document.querySelector('#lessonTry'))`)) {
        await evaluate(send, `document.querySelector('#lessonTry').click()`);
      }
      await sleep(100);
    }
    const hasQuestion = await evaluate(send, `Boolean(document.querySelector('.question-shell'))`);
    const hasLesson = await evaluate(send, `Boolean(document.querySelector('.lesson-content'))`);
    assert.ok(hasQuestion || hasLesson, `Study flow did not render at ${width}x${height}`);
    await checkLayout(send, hasQuestion ? "Question" : "Lesson", width, height);
    console.log(`responsive smoke OK ${width}x${height}`);
  }
} finally {
  try { client?.ws.close(); } catch {}
  chrome.kill("SIGTERM");
  server.kill("SIGTERM");
  fs.rmSync(tmp, { recursive: true, force: true });
}
