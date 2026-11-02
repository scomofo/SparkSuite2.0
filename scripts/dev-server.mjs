#!/usr/bin/env node
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveLaunch } from "./command-launch.mjs";
import { workspaceIdentity } from "./app-env-plugin.mjs";
import { cmdlineOf, cwdOf, portOwners, projectServerProcess } from "./preview.mjs";
import { isMainModule, projectRoot } from "./with-app-env.mjs";

const ROOT = projectRoot();
const PORT = 8083;
const PID_FILE = join(ROOT, ".grok/dev-port");

export async function startDevServer() {
  if (process.env.PORT && process.env.PORT !== String(PORT)) throw new Error("SparkSuite's preview requires port 8083; refusing a different PORT.");
  const before = portOwners(PORT);
  if (before.pids.length) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/__app-env`, { signal: AbortSignal.timeout(5000) });
      const value = await response.json();
      if (response.ok && value.workspaceId === workspaceIdentity(ROOT)) {
        console.log("[dev] SparkSuite is already running on 0.0.0.0:8083.");
        return;
      }
    } catch { /* Corroborate a warming server by its process identity below. */ }
  }
  if (before.unattributed || before.pids.some((pid) => !projectServerProcess(cmdlineOf(pid), cwdOf(pid), ROOT, "dev"))) {
    throw new Error("Port 8083 is held by an unrelated or unverified process; leaving it running.");
  }
  if (before.pids.length) {
    console.log("[dev] This checkout's dev server is still warming up on 0.0.0.0:8083.");
    return;
  }
  try {
    const state = JSON.parse(readFileSync(PID_FILE, "utf8"));
    if (projectServerProcess(cmdlineOf(state.pid), cwdOf(state.pid), ROOT, "dev")) {
      console.log("[dev] SparkSuite is still starting on 0.0.0.0:8083.");
      return;
    }
  } catch { /* No current launch record. */ }
  mkdirSync(join(ROOT, ".grok"), { recursive: true });
  const log = openSync(join(ROOT, "spark-startup.log"), "a");
  const launch = resolveLaunch("npm", ["--prefix", ROOT, "run", "dev", "--", ROOT]);
  const child = spawn(launch.command, launch.args, {
    cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, detached: true,
    stdio: ["ignore", log, log], shell: false, windowsHide: true,
  });
  closeSync(log);
  child.once("error", (error) => { console.error(`[dev] ${error.message}`); process.exitCode = 1; });
  if (child.pid) writeFileSync(PID_FILE, JSON.stringify({ pid: child.pid }));
  child.unref();
  console.log("[dev] Starting SparkSuite on 0.0.0.0:8083.");
}

if (isMainModule(import.meta.url)) {
  try { await startDevServer(); }
  catch (error) { console.error(`[dev] ${error.message}`); process.exitCode = 1; }
}
