#!/usr/bin/env node
import { spawn } from "node:child_process";
import { evidencePath } from "./evidence-paths.mjs";
import { projectRoot } from "./with-app-env.mjs";

async function run(script, ...args) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: projectRoot(), stdio: "inherit", shell: false, windowsHide: true });
    child.once("error", reject); child.once("exit", resolve);
  });
  if (code !== 0) throw new Error(`${script} failed (${code})`);
}

async function waitForApp(url) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(2000) }); if (response.ok && (await response.text()).includes("SparkSuite")) return; }
    catch { /* Dev startup is asynchronous. */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`SparkSuite did not answer successfully at ${url}`);
}

async function suites(url, label) {
  for (const name of ["studio", "microphone", "learning", "learning-ux", "profile-sync", "lesson-practice", "personalized", "coach"]) {
    await run(`scripts/${name}-browser.mjs`, url, label);
  }
  await run("scripts/adult-curriculum-browser.mjs", "spark", url, label);
}

let previewStarted = false;
try {
  await run("scripts/smoke-gate-browser.mjs");
  await run("scripts/dev-server.mjs");
  await waitForApp("http://127.0.0.1:8083/");
  await run("scripts/mic-input-browser.mjs", "http://127.0.0.1:8083");
  await suites("http://127.0.0.1:8083", "dev");
  await run("scripts/shared-phrase-audio-browser.mjs");
  await run("scripts/browser-smoke.mjs", "http://127.0.0.1:8083/", evidencePath("dev.png"));
  await run("scripts/preview.mjs", "restart");
  previewStarted = true;
  await suites("http://127.0.0.1:8081", "built");
  await run("scripts/browser-smoke.mjs", "http://127.0.0.1:8081/", evidencePath("built.png"), "--baseline", evidencePath("dev.json"));
} finally {
  if (previewStarted) await run("scripts/preview.mjs", "stop");
}
