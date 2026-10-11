// Spark branch of adult-curriculum-browser.mjs. Real Chromium, no seeded phrase state.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { checkedUrl, checkedOutputPath } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[3]).replace(/\/$/, "");
const label = process.argv[4] ?? "dev";
assert.match(label, /^[a-zA-Z0-9_-]+$/, "Use a simple evidence label");
const output = checkedOutputPath(`/workspace/screenshots/spark-phrase-${label}`, [
  "/workspace/screenshots",
]);
mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  timezoneId: "America/Edmonton",
});
await context.tracing.start({ screenshots: true, snapshots: true });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const errors = [];
const externalResourceErrors = [];
const checks = [];
function watchErrors(target) {
  target.on("pageerror", (error) => errors.push(error.message));
  target.on("console", (message) => {
    if (message.type() !== "error") return;
    const entry = { text: message.text(), url: message.location().url };
    // Keep sandbox failures for the platform branding resource visible in evidence.
    // Never exempt application modules, hydration failures, or arbitrary console errors.
    if (
      entry.url === "https://grok.com/grok-app-builder/extensions.js" &&
      /^Failed to load resource:/.test(entry.text)
    ) {
      externalResourceErrors.push(entry);
    } else errors.push(entry);
  });
}
watchErrors(page);
// Observe native Web Audio calls; no fake AudioContext, clock, or playback implementation.
await page.addInitScript(() => {
  window.__phraseAudio = { starts: [], disconnects: 0, state: () => "not-created" };
  const createOscillator = BaseAudioContext.prototype.createOscillator;
  BaseAudioContext.prototype.createOscillator = function (...args) {
    window.__phraseAudio.state = () => this.state;
    return createOscillator.apply(this, args);
  };
  const start = OscillatorNode.prototype.start;
  OscillatorNode.prototype.start = function (at) {
    window.__phraseAudio.starts.push({ at, frequency: this.frequency.value });
    return start.call(this, at);
  };
  const disconnect = GainNode.prototype.disconnect;
  GainNode.prototype.disconnect = function (...args) {
    window.__phraseAudio.disconnects += 1;
    return disconnect.apply(this, args);
  };
});
const phrase = page.locator("details").filter({
  has: page.locator("summary", { hasText: "Two-minute option · A pulse with room to breathe" }),
});
const summary = phrase.locator("summary");
const button = (name) => phrase.getByRole("button", { name, exact: true });
const note = phrase.getByRole("textbox", { name: "Phrase observation", exact: true });
async function openPhrase() {
  await summary.waitFor({ state: "visible" });
  if (!(await phrase.evaluate((element) => element.open))) await summary.click();
  await button("Hear").waitFor({ state: "visible" });
}
async function stopped(action, name = "Hear four bars", timeout = 15_000) {
  const before = await page.evaluate(() => window.__phraseAudio.disconnects);
  await action();
  await page.waitForFunction((count) => window.__phraseAudio.disconnects > count, before, {
    timeout,
  });
  assert.equal(await button("Stop phrase").count(), 0, "Stopped playback removes the Stop control");
  if (name) await button(name).waitFor({ state: "visible" });
}
async function play(name, beats, bpm) {
  await page.evaluate(() => {
    window.__phraseAudio.starts = [];
  });
  await button(name).click();
  await button("Stop phrase").waitFor({ state: "visible" });
  const audio = await page.evaluate(() => ({
    starts: window.__phraseAudio.starts,
    state: window.__phraseAudio.state(),
  }));
  assert.equal(audio.state, "running", "The native AudioContext is running");
  // pianoTone uses three oscillators per attack; inspect the fundamental only.
  const attacks = audio.starts.filter((item) => Math.abs(item.frequency - 261.63) < 0.01);
  assert.equal(attacks.length, beats.length, "Every written attack is scheduled exactly once");
  for (let i = 0; i < attacks.length; i += 1) {
    assert.ok(
      Math.abs(attacks[i].at - attacks[0].at - (beats[i] * 60) / bpm) < 0.025,
      `Attack ${i + 1} follows ${bpm} bpm`,
    );
  }
}
const allBeats = [0, 1, 2, 3, 4, 5, 5.5, 6, 7, 8, 9, 10, 11, 12, 13, 13.5, 14];
try {
  await page.goto(`${url}/learn`, { waitUntil: "networkidle" });
  await openPhrase();
  assert.equal(await button("Hear").getAttribute("aria-pressed"), "true");
  assert.equal(await note.inputValue(), "");
  const learningBefore = await page.evaluate(() => localStorage.getItem("sparksuite.learning.v1"));
  await button("Try").press("Enter");
  await note.fill("I kept the final beat silent.");
  await button("Save and pause").click();
  await page.reload({ waitUntil: "networkidle" });
  await openPhrase();
  assert.equal(
    await button("Try").getAttribute("aria-pressed"),
    "true",
    "Selected step survives reload",
  );
  assert.equal(await note.inputValue(), "I kept the final beat silent.");
  assert.equal(await button("Stop phrase").count(), 0, "Reload never autoplays");
  checks.push("clean-context Try/observation save and reload; no autoplay");

  await play("Hear four bars", allBeats, 72);
  await stopped(() => button("Stop phrase").click());
  await button("Practise just bar 2").click();
  await play("Hear bar 2", [0, 1, 1.5, 2, 3], 72);
  await stopped(() => button("Slow it down · 72 bpm").click(), "Hear bar 2");
  assert.equal(await button("Slow it down · 48 bpm").getAttribute("aria-pressed"), "true");
  await play("Hear bar 2", [0, 1, 1.5, 2, 3], 48);
  await stopped(() => summary.click(), null);
  await openPhrase();
  await button("Hear bar 2").waitFor();
  // A real five-second bar ends by itself; the browser clock is not accelerated.
  await play("Hear bar 2", [0, 1, 1.5, 2, 3], 48);
  await stopped(async () => {}, "Hear bar 2", 7_000);
  checks.push(
    "native 17-attack four-bar playback; Stop; five-attack bar 2; 72/48 bpm; collapse cancellation; finite pass",
  );

  await button("Use").click();
  await button("Hide count").click();
  assert.equal(await phrase.getByRole("list", { name: "Four-bar count" }).count(), 0);
  await button("Show count").click();
  await phrase.getByRole("list", { name: "Four-bar count" }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await openPhrase();
  assert.equal(await button("Use").getAttribute("aria-pressed"), "true");
  assert.equal(await note.inputValue(), "I kept the final beat silent.");
  checks.push("Use persists; count can be hidden and restored");

  await play("Hear four bars", allBeats, 72);
  await stopped(
    () => page.getByRole("combobox", { name: "Learning instrument" }).selectOption("piano"),
    null,
  );
  await openPhrase();
  assert.equal(await note.inputValue(), "", "Piano starts with its own observation");
  assert.equal(await button("Hear").getAttribute("aria-pressed"), "true");
  await button("Try").click();
  await phrase
    .getByText("Use one comfortable key with one finger. Keep the same note throughout.", {
      exact: true,
    })
    .waitFor();
  await note.fill("One key, with room to breathe.");
  await button("Save and pause").click();
  await page.getByRole("combobox", { name: "Learning instrument" }).selectOption("guitar");
  await openPhrase();
  assert.equal(await note.inputValue(), "I kept the final beat silent.");
  assert.equal(await button("Use").getAttribute("aria-pressed"), "true");
  await page.getByRole("combobox", { name: "Learning instrument" }).selectOption("piano");
  await page.reload({ waitUntil: "networkidle" });
  await openPhrase();
  assert.equal(await note.inputValue(), "One key, with room to breathe.");
  assert.equal(await button("Try").getAttribute("aria-pressed"), "true");
  checks.push(
    "instrument change stops playback; guitar/piano stage and note remain isolated across reload",
  );

  await play("Hear four bars", allBeats, 72);
  await stopped(
    () => page.getByRole("button", { name: "Start learning", exact: true }).click(),
    null,
  );
  await page.getByRole("button", { name: "Learning path", exact: true }).click();
  await openPhrase();
  assert.equal(
    await button("Stop phrase").count(),
    0,
    "Returning to the overview never resumes audio",
  );
  checks.push("entering a lesson unmounts and cancels the phrase");
  // This is a synthetic lifecycle event, separately labelled from native UI playback.
  await play("Hear four bars", allBeats, 72);
  await stopped(() =>
    page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
      delete document.hidden;
    }),
  );
  checks.push("synthetic tab-hidden event cancels native playback");

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await phrase.scrollIntoViewIfNeeded();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `No overflow at ${width}px`,
    );
    await page.screenshot({ path: `${output}-${width}.png`, fullPage: true });
  }
  // The phrase itself creates no lesson completion or practice XP.
  const progress = await page.evaluate(() => ({
    learning: JSON.parse(localStorage.getItem("sparksuite.learning.v1")),
    practice: JSON.parse(localStorage.getItem("sparksuite.v2")),
  }));
  assert.ok(Object.values(progress.learning.records).every((record) => !record.completedOn));
  for (const instrument of ["guitar", "piano"]) {
    assert.equal(progress.practice.apps[instrument].xp, 0);
    assert.deepEqual(progress.practice.apps[instrument].dailyComplete, {});
  }
  assert.ok(
    learningBefore === null || Object.keys(JSON.parse(learningBefore).records).length === 0,
  );

  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("shared-phrase-v1:"))
        throw new DOMException("Quota", "QuotaExceededError");
      return setItem.call(this, key, value);
    };
  });
  await note.fill("Copy this if saving is unavailable.");
  await button("Save and pause").click();
  await phrase.getByRole("status").filter({ hasText: "Could not save." }).waitFor();
  assert.equal(await note.inputValue(), "Copy this if saving is unavailable.");
  checks.push("phrase awards no mastery/XP; failed storage leaves the note available to copy");

  // Preserve the old script's seeded legacy-review check in a separate context.
  const review = await browser.newPage({ timezoneId: "America/Edmonton" });
  watchErrors(review);
  await review.clock.install({ time: new Date("2026-10-04T18:00:00Z") });
  await review.goto(url, { waitUntil: "networkidle" });
  await review.evaluate(() =>
    localStorage.setItem(
      "sparksuite.learning.v1",
      JSON.stringify({
        version: 1,
        records: {
          "guitar-first-sound": {
            step: 2,
            reviews: 0,
            completedOn: "2026-01-01",
            reviewOn: "2026-01-02",
          },
        },
        active: { guitar: "guitar-first-sound" },
        pace: "lesson",
        profiles: {},
        skippedSetup: {},
        milestones: {},
        focus: {},
      }),
    ),
  );
  await review.goto(`${url}/learn`, { waitUntil: "networkidle" });
  await review.getByRole("radio", { name: "The pitch stays E", exact: true }).check();
  const finish = review.getByRole("button", { name: "Wrap up this lesson", exact: true });
  assert.equal(await finish.isDisabled(), true);
  const correct = review.getByRole("radio", { name: "The pitch rises from E to F", exact: true });
  await correct.check();
  await review.reload({ waitUntil: "networkidle" });
  await correct.waitFor();
  assert.equal(await correct.isChecked(), true);
  await finish.click();
  await review.getByRole("heading", { name: "A useful step forward.", exact: true }).waitFor();
  const record = await review.evaluate(
    () => JSON.parse(localStorage.getItem("sparksuite.learning.v1")).records["guitar-first-sound"],
  );
  assert.equal(record.assisted, true);
  assert.equal(record.reviews, 0);
  assert.equal(record.completedOn, "2026-01-01");
  assert.equal(record.reviewOn, "2026-10-05");
  await review.close();
  checks.push(
    "separate seeded review: wrong-answer guard, reload, preserved completion, assisted next-day spacing",
  );

  const silent = await context.newPage();
  watchErrors(silent);
  await silent.addInitScript(() => {
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
  });
  await silent.goto(`${url}/learn`, { waitUntil: "networkidle" });
  await silent.getByRole("button", { name: "Learning path", exact: true }).click();
  await silent
    .getByText("Two-minute option · A pulse with room to breathe", { exact: true })
    .click();
  await silent.getByRole("button", { name: "Hear four bars", exact: true }).click();
  await silent
    .getByText("Audio is unavailable. Tap the written count instead.", { exact: true })
    .waitFor();
  assert.equal(await silent.getByRole("button", { name: "Stop phrase", exact: true }).count(), 0);
  await silent.close();
  checks.push("missing AudioContext shows a readable written-count fallback");

  assert.deepEqual(errors, [], "No application console or uncaught runtime errors");
  writeFileSync(
    `${output}-checks.json`,
    JSON.stringify(
      { ok: true, url, browser: browser.version(), checks, errors, externalResourceErrors },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ ok: true, label, checks, externalResourceErrors }));
} catch (error) {
  await page.screenshot({ path: `${output}-failure.png`, fullPage: true }).catch(() => {});
  writeFileSync(
    `${output}-failure.json`,
    JSON.stringify(
      {
        error: String(error),
        checks,
        errors,
        externalResourceErrors,
        body: await page
          .locator("body")
          .innerText()
          .catch(() => ""),
      },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await context.tracing.stop({ path: `${output}-trace.zip` });
  await browser.close();
}
