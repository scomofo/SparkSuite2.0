// Real browser-to-WebAudio capture regression. Chrome's fake microphone
// supplies an actual MediaStream to the AnalyserNode, not a mocked React state.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8083";
const label = process.argv[3] ?? "dev";
const output = "/workspace/screenshots";
mkdirSync(output, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
await context.grantPermissions(["microphone"]);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Practise Ukulele", exact: true }).click();
  await page.getByRole("button", { name: /^(Start today's loop|Resume your loop|Play it again)$/ }).click();
  const countIn = page.getByRole("button", { name: "Count me in", exact: true });
  assert.equal(await countIn.isEnabled(), false, "A silent/unconnected mic cannot be counted as scored input");
  await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
  await page.getByRole("button", { name: "Stop microphone", exact: true }).waitFor();
  const meter = page.getByRole("progressbar", { name: "Live microphone signal level", exact: true });
  await meter.waitFor();
  await page.waitForFunction(() => {
    const meter = document.querySelector('[role="progressbar"][aria-label="Live microphone signal level"]');
    return Number(meter?.getAttribute("aria-valuenow") ?? 0) > 0;
  }, { timeout: 10000 });
  const observed = Number(await meter.getAttribute("aria-valuenow"));
  assert.ok(observed > 0 && observed <= 100, `Microphone analyser should expose real captured audio, got ${observed}`);
  assert.equal(await countIn.isEnabled(), true, "Scored practice should become available with an active capture stream");
  await page.getByText("Using:", { exact: false }).waitFor();
  await page.screenshot({ path: `${output}/microphone-${label}.png`, fullPage: true });

  await page.getByRole("button", { name: "Stop microphone", exact: true }).click();
  assert.equal(await meter.count(), 0, "Input meter must disappear once capture stops");
  assert.deepEqual(errors, [], "Microphone capture should not produce browser runtime errors");
} finally {
  await browser.close();
}
