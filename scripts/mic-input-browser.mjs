// Verifies that a live MediaStream reaches SparkSuite's microphone analyser.
// The synthetic source avoids relying on the CI runner's physical microphone.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8083";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const mediaDevices = navigator.mediaDevices;
    Object.defineProperty(mediaDevices, "getUserMedia", {
      configurable: true,
      value: async (constraints) => {
        if (!constraints?.audio) {
          throw new Error("Mic acceptance only supports audio capture");
        }
        const context = new AudioContext({ sampleRate: 48000 });
        await context.resume();
        const destination = context.createMediaStreamDestination();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sawtooth";
        oscillator.frequency.value = 329.63;
        gain.gain.value = 0.12;
        oscillator.connect(gain);
        gain.connect(destination);
        oscillator.start();
        window.__sparkMicTest = {
          context,
          oscillator,
          gain,
          setLevel(value) { gain.gain.setTargetAtTime(value, context.currentTime, 0.01); },
        };
        return destination.stream;
      },
    });
  });
  await page.route("**/api/auth/get-session**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "null" }),
  );
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: "Start today's loop", exact: true }).click();
  await page.getByRole("button", { name: "Enable microphone", exact: true }).click();

  const meter = page.getByRole("meter", { name: "Microphone input level" });
  await meter.waitFor();
  const deadline = Date.now() + 8000;
  let level = 0;
  while (Date.now() < deadline) {
    level = Number(await meter.getAttribute("aria-valuenow"));
    if (level > 5) break;
    await page.waitForTimeout(100);
  }
  assert.ok(level > 5, `Synthetic microphone signal did not reach the analyser; meter was ${level}`);
  await page.getByText(
    "Audio is reaching the app. Play in time with the cue; this meter confirms signal, not note accuracy.",
    { exact: true },
  ).waitFor();

  await page.evaluate(() => window.__sparkMicTest?.setLevel(0));
  await page.waitForTimeout(600);
  const quietLevel = Number(await meter.getAttribute("aria-valuenow"));
  assert.ok(quietLevel < level, `Meter did not respond when the input was muted (${level} -> ${quietLevel})`);

  await page.getByRole("button", { name: "Stop microphone", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[role="meter"][aria-label="Microphone input level"]') === null);
  await page.evaluate(async () => {
    const test = window.__sparkMicTest;
    test?.oscillator.stop();
    await test?.context.close();
  });
  assert.deepEqual(pageErrors, [], `unexpected browser errors: ${pageErrors.join("; ")}`);
  console.log(JSON.stringify({ ok: true, level, quietLevel, message: "live mic signal reached and left the analyser" }));
} finally {
  await browser.close();
}
