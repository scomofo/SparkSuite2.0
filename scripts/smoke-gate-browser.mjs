// Real-browser regression: an HTTP 200 is insufficient evidence of a working UI.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-paths.mjs";
import { buildAuthEnabled } from "./check-auth-invariant.mjs";
import { projectRoot } from "./with-app-env.mjs";

let scenario = "ready";
const server = createServer((request, response) => {
  if (request.url === "/__app-env") {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ VITE_AUTH_ENABLED: String(scenario === "auth" ? !buildAuthEnabled() : buildAuthEnabled()) }));
    return;
  }
  response.setHeader("content-type", "text/html");
  const ready = '<main><h1>Fixture studio</h1><button>Start practice</button><p>Visible practice content</p></main>';
  const content = scenario === "empty" ? "" : scenario === "loading" ? '<main><p role="status">Opening your studio…</p></main>' : scenario === "overflow" ? ready + '<div style="width:2500px">Overflow</div>' : scenario === "changed" ? ready.replace("Fixture studio", "A completely different error page") : ready;
  // The clean fixture hydrates after DOMContentLoaded; fixed sleeps must not
  // mistake its opening shell for the finished page.
  response.end(`<html><head><title>Smoke fixture</title></head><body>${scenario === "ready" ? '<main><p role="status">Opening your studio…</p></main><script>setTimeout(()=>document.body.innerHTML='+JSON.stringify(content)+',300)</script>' : content}</body></html>`);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const output = join(evidenceDirectory(), "smoke-fixtures");
mkdirSync(output, { recursive: true });

async function check(name, expected, baseline = false) {
  scenario = name;
  const args = [join(projectRoot(), "scripts/browser-smoke.mjs"), url, join(output, `${name}.png`)];
  if (baseline) args.push("--baseline", join(output, "ready.json"));
  let diagnostic = "";
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: projectRoot(), env: { ...process.env, BROWSER_SMOKE_TIMEOUT_MS: "1800" }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.on("data", (chunk) => { diagnostic += chunk; });
    child.stderr.on("data", (chunk) => { diagnostic += chunk; });
    child.once("error", reject);
    child.once("exit", resolve);
  });
  assert.equal(code, expected, `${name}: expected ${expected}, got ${code}\n${diagnostic}`);
  console.log(`[smoke-gate] ${name}: expected exit ${code}`);
}

try {
  await check("ready", 0);
  await check("empty", 3);
  await check("loading", 3);
  await check("overflow", 3);
  await check("changed", 4, true);
  await check("auth", 4);
} finally { await new Promise((resolve) => server.close(resolve)); }
