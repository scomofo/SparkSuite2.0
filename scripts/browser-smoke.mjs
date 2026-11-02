#!/usr/bin/env node
import { mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";
import { checkedOutputPath, checkedUrl } from "./browser-guard.mjs";
import { evidenceDirectory } from "./evidence-paths.mjs";
import { projectRoot } from "./with-app-env.mjs";
import { computeBrandWarnings } from "./brand-check.mjs";
import {
  authInvariantWarnings,
  buildAuthEnabled,
  compareAuthInvariant,
  probeDevAuthEnabled,
  probeBuildAuthEnabled,
} from "./check-auth-invariant.mjs";
import {
  baselineComparison,
  bodyTextPrefix,
  derivedPaths,
  exitCodeFor,
  normalizeBodyText,
  normalizedBodyTextHash,
  parseSmokeArgs,
} from "./browser-smoke-verdict.mjs";

const args = parseSmokeArgs(process.argv.slice(2), process.env);
if (args.error) {
  console.error(JSON.stringify({ ok: false, error: args.error }, null, 2));
  process.exit(1);
}

const url = checkedUrl(args.url);
const outputDirs = [evidenceDirectory()];
const outPng = checkedOutputPath(args.outPng, outputDirs);
const derived = derivedPaths(outPng);
const mobilePng = checkedOutputPath(derived.mobilePng, outputDirs);
const outJson = checkedOutputPath(derived.verdictJson, outputDirs, "verdict JSON");

const MAX_BASELINE_BYTES = 1024 * 1024;
const baselineRequested = Boolean(args.baseline);
let baselinePath = null;
let baselineResolveError = null;
if (baselineRequested) {
  try {
    baselinePath = checkedOutputPath(realpathSync(args.baseline), outputDirs, "baseline");
  } catch (err) {
    baselineResolveError = err?.code ?? "unresolvable path";
  }
  if (baselinePath === outJson) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error:
            `--baseline ${args.baseline} is this run's own verdict output; ` +
            "pass a distinct output PNG (e.g. app-builder-built.png) so the baseline is not overwritten",
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }
}

const timeoutMs = Number(process.env.BROWSER_SMOKE_TIMEOUT_MS || 45000);

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800, screenshot: outPng },
  { name: "mobile", width: 390, height: 844, screenshot: mobilePng },
];

mkdirSync(dirname(outPng), { recursive: true });

function compareAgainstBaseline(verdict) {
  if (!baselinePath) {
    return {
      divergesFromBaseline: true,
      reasons: [`baseline unreadable: ${baselineResolveError ?? "unresolvable path"}`],
    };
  }
  try {
    if (statSync(baselinePath).size > MAX_BASELINE_BYTES) {
      return { divergesFromBaseline: true, reasons: ["baseline unreadable: too large"] };
    }
    return baselineComparison(verdict, readFileSync(baselinePath, "utf8"));
  } catch (err) {
    return {
      divergesFromBaseline: true,
      reasons: [`baseline unreadable: ${err?.code ?? "read error"}`],
    };
  }
}

let browser = null;
try {
  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  });

  const viewports = {};
  for (const vp of VIEWPORTS) {
    const errors = { consoleErrors: [], pageErrors: [], externalResourceErrors: [] };
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      // Keep a blocked platform-branding download visible, while application
      // errors and every other resource failure still fail the gate.
      if (msg.location().url === "https://grok.com/grok-app-builder/extensions.js" && /^Failed to load resource:/.test(msg.text())) {
        errors.externalResourceErrors.push(msg.text());
      } else errors.consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.pageErrors.push(String(err?.message || err)));
    // `domcontentloaded`, not `networkidle`: Vite keeps an HMR websocket open, so
    // networkidle never settles and would burn the whole timeout.
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    const status = resp?.status() ?? 0;
    // Wait for rendered application content, not just the SSR opening shell.
    const ready = await page.waitForFunction(() => {
      const root = document.querySelector("main") ?? document.body;
      const visible = (element) => element && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0 && getComputedStyle(element).visibility !== "hidden" && getComputedStyle(element).display !== "none";
      if (root.querySelector('[aria-busy="true"]')) return false;
      const heading = [...root.querySelectorAll("h1, h2")].some((element) => visible(element) && element.textContent.trim());
      const controls = [...root.querySelectorAll("button, a[href], input, select, textarea")].some(visible);
      const canvas = [...root.querySelectorAll("canvas")].some(visible);
      const pending = [...root.querySelectorAll('[role="status"]')].some((element) => visible(element) && /opening|loading|starting/i.test(element.textContent));
      return !pending && ((heading && controls) || canvas);
    }, null, { timeout: timeoutMs }).then(() => true, () => false);
    await page.evaluate(() => document.fonts.ready);

    const title = await page.title();
    const hasCanvas = (await page.locator("canvas").count()) > 0;
    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");
    const horizontalOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth + 1;
    });
    await page.screenshot({ path: vp.screenshot, fullPage: false });
    await page.close();

    viewports[vp.name] = {
      width: vp.width,
      height: vp.height,
      status,
      ready,
      title,
      hasCanvas,
      bodyTextLen: normalizeBodyText(bodyText).length,
      bodyTextHash: normalizedBodyTextHash(bodyText),
      bodyTextPrefix: bodyTextPrefix(bodyText),
      horizontalOverflow,
      consoleErrors: errors.consoleErrors,
      pageErrors: errors.pageErrors,
      externalResourceErrors: errors.externalResourceErrors,
      screenshot: vp.screenshot,
    };
  }

  const brandWarnings = computeBrandWarnings({ hasCanvas: viewports.desktop.hasCanvas, workspaceRoot: projectRoot() });
  // Only a dev server answers /__app-env, so smoking the built output reads as
  // indeterminate — report a divergence, never the absence of an observation.
  const authEnabled = await probeDevAuthEnabled(url) ?? await probeBuildAuthEnabled(url);
  const authWarnings = authEnabled === null ? ["[auth-invariant] could not observe the running app's sign-in flag"] : authInvariantWarnings(
    compareAuthInvariant({
      devAuthEnabled: authEnabled,
      buildAuthEnabled: buildAuthEnabled(),
    }),
  );
  const verdict = { url, authEnabled, viewports, brandWarnings, authWarnings, verdictFile: outJson };
  if (baselineRequested) {
    const { divergesFromBaseline, reasons } = compareAgainstBaseline(verdict);
    verdict.divergesFromBaseline = divergesFromBaseline;
    verdict.baselineReasons = reasons;
  }

  writeFileSync(outJson, JSON.stringify(verdict, null, 2));
  console.log(JSON.stringify(verdict, null, 2));
  for (const w of [...brandWarnings, ...authWarnings]) console.error(w);
  // Set the code rather than aborting the process so the `finally` browser
  // teardown always runs (agents typically smoke twice per turn; leaking
  // Chromium accumulates across retries).
  process.exitCode = exitCodeFor(viewports, verdict);
} catch (err) {
  const failure = { ok: false, url, error: String(err?.message || err) };
  try {
    writeFileSync(outJson, JSON.stringify(failure, null, 2));
  } catch (writeErr) {
    failure.verdictWriteError = String(writeErr?.message || writeErr);
  }
  console.error(JSON.stringify(failure, null, 2));
  process.exitCode = 1;
} finally {
  await browser?.close();
}
