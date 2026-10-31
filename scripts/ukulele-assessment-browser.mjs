// Drive the shipped practice controls. Synthetic strings feed a real
// MediaStream, capture graph, FFT, detector, cue lookup, and score display.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { defaultProgress } from "../src/lib/spark/storage.ts";
import { generateDailyPlan } from "../src/lib/spark/daily-plan.ts";
import { countInBeats } from "../src/lib/spark/practice.ts";
import { instrumentById, UKE_CHORDS } from "../src/lib/spark/instruments.ts";
import { checkedUrl, checkedOutputPath } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[2] ?? "http://127.0.0.1:8083");
const label = process.argv[3] ?? "dev";
assert.match(label, /^[a-zA-Z0-9_-]+$/);
const output = checkedOutputPath(`/workspace/screenshots/ukulele-assessment-${label}`, [
  "/workspace/screenshots",
]);
mkdirSync("/workspace/screenshots", { recursive: true });
const openMidi = instrumentById("ukulele").openFreq.map((hz) =>
  Math.round(69 + 12 * Math.log2(hz / 440)),
);
const voicing = (id) => UKE_CHORDS[id].frets.map((fret, index) => openMidi[index] + fret);
const scenarios = [
  {
    id: "c-late",
    target: "C",
    played: voicing("C"),
    delay: 0.17,
    hits: 1,
    misses: 0,
    feedback: "Expected chord pitches detected.",
  },
  {
    id: "am-unisons",
    target: "Am",
    played: voicing("Am"),
    delay: 0.05,
    hits: 1,
    misses: 0,
    feedback: "Expected chord pitches detected.",
  },
  {
    id: "wrong-chord",
    target: "C",
    played: voicing("Am"),
    delay: 0.05,
    hits: 0,
    misses: 1,
    feedback: "Chord check: I heard pitches outside the target chord. Check the shape and tuning.",
  },
  {
    id: "uncertain",
    target: "Am",
    played: [60, 64],
    delay: 0.05,
    hits: 1,
    misses: 0,
    feedback:
      "Timing counted; the microphone could not hear all target chord pitches clearly enough to grade the chord.",
  },
];
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const results = [];
try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 950 },
      timezoneId: "America/Edmonton",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(25_000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      // The external preview overlay is unrelated to the instrument graph.
      if (
        message.location().url === "https://grok.com/grok-app-builder/extensions.js" &&
        /^Failed to load resource:/.test(message.text())
      )
        return;
      errors.push(message.text());
    });
    await page.route("**/api/auth/get-session**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "null" }),
    );
    await page.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => {
          const context = new AudioContext({ sampleRate: 48000 });
          await context.resume();
          const destination = context.createMediaStreamDestination();
          window.__ukuleleInput = { context, destination };
          return destination.stream;
        },
      });
    });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Practise Ukulele", exact: true }).click();
    await page.getByRole("button", { name: "Start today's loop", exact: true }).click();
    await page.getByRole("button", { name: "Skip this one", exact: true }).click();
    if (scenario.target === "Am")
      await page.getByRole("button", { name: "Skip this one", exact: true }).click();
    await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
    await page.getByRole("button", { name: "Stop microphone", exact: true }).waitFor();
    await page.getByText(/Strum direction and individual string clarity are not scored/).waitFor();
    const day = await page.evaluate(() => {
      const date = new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    });
    const plan = generateDailyPlan(defaultProgress(), day, "ukulele");
    const item = plan.items.find((item) => item.chords[0] === scenario.target);
    assert.ok(item, "Scenario uses a real first-day lesson");
    const countInSec = (countInBeats(item) * 60) / item.bpm;
    await page.evaluate(
      ({ played, delay, countInSec }) => {
        const button = [...document.querySelectorAll("button")].find(
          (button) => button.textContent.trim() === "Count me in",
        );
        button.addEventListener(
          "click",
          () => {
            const { context, destination } = window.__ukuleleInput;
            const first = context.currentTime + countInSec + delay;
            played.forEach((midi, index) => {
              const start = first + index * 0.012;
              for (let harmonic = 1; harmonic <= 5; harmonic++) {
                const oscillator = context.createOscillator();
                oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12) * harmonic;
                const gain = context.createGain();
                gain.gain.setValueAtTime(0.02 / harmonic ** 1.7, start);
                gain.gain.exponentialRampToValueAtTime(0.001 / harmonic ** 1.7, start + 0.4);
                oscillator.connect(gain).connect(destination);
                oscillator.start(start);
                oscillator.stop(start + 0.5);
              }
            });
          },
          { capture: true, once: true },
        );
      },
      { played: scenario.played, delay: scenario.delay, countInSec },
    );
    await page.getByRole("button", { name: "Count me in", exact: true }).click();
    await page.getByText(scenario.feedback, { exact: true }).waitFor();
    // Let the cue expire too: an incorrect chord must not incur a second miss.
    await page.waitForTimeout(550);
    const score = `${scenario.hits} hit · ${scenario.misses} miss`;
    await page.getByText(score, { exact: true }).waitFor();
    await page
      .getByText(
        "The input is quiet right now. Play a note, chord, or drum hit to test the microphone.",
        { exact: true },
      )
      .waitFor();
    assert.deepEqual(errors, [], "Practice has no uncaught browser errors");
    await page.screenshot({ path: `${output}-${scenario.id}.png`, fullPage: true });
    results.push({ id: scenario.id, score, feedback: scenario.feedback });
    await context.close();
    console.log(JSON.stringify({ label, ...results.at(-1) }));
  }
  writeFileSync(`${output}.json`, JSON.stringify({ passed: true, results }, null, 2));
} finally {
  await browser.close();
}
