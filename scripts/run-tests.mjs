#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { exitStatusFromChild, isMainModule, projectRoot } from "./with-app-env.mjs";

export function discoverTests(directory, suffix) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? discoverTests(path, suffix) : entry.isFile() && entry.name.endsWith(suffix) ? [path] : [];
  }).sort();
}

export function testSuites(root = projectRoot()) {
  return [
    { name: "scripts", files: discoverTests(join(root, "scripts"), ".test.mjs"), flags: [] },
    { name: "src", files: discoverTests(join(root, "src"), ".test.ts"), flags: ["--experimental-strip-types"] },
  ];
}

export async function runTests(selection = "all", root = projectRoot()) {
  if (!["all", "scripts", "src"].includes(selection)) throw new Error("Usage: node scripts/run-tests.mjs [all|scripts|src]");
  const suites = testSuites(root).filter((suite) => selection === "all" || suite.name === selection);
  for (const suite of suites) {
    if (suite.files.length === 0) throw new Error(`No ${suite.name} test files discovered; refusing a zero-test success.`);
  }
  for (const suite of suites) {
    console.log(`[test] ${suite.name}: ${suite.files.length} test files`);
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [...suite.flags, "--test", ...suite.files], {
        cwd: root, stdio: "inherit", shell: false, windowsHide: true,
      });
      child.once("error", reject);
      child.once("exit", (status, signal) => resolve(exitStatusFromChild(status, signal)));
    });
    if (code !== 0) return code;
  }
  return 0;
}

if (isMainModule(import.meta.url)) {
  try { process.exitCode = await runTests(process.argv[2]); }
  catch (error) { console.error(`[test] ${error.message}`); process.exitCode = 1; }
}
