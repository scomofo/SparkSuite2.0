// Real lesson controls, saved answers, help lifecycle, and supported recall.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { checkedUrl, checkedOutputPath } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[2] ?? "http://127.0.0.1:8083").replace(/\/$/, "");
const label = process.argv[3] ?? "dev";
assert.match(label, /^[a-zA-Z0-9_-]+$/);
const output = checkedOutputPath(`/workspace/screenshots/learning-ux-${label}`, [
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
  viewport: { width: 1280, height: 900 },
  timezoneId: "America/Edmonton",
  reducedMotion: "reduce",
});
await context.tracing.start({ screenshots: true, snapshots: true });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const errors = [];
const externalResourceErrors = [];
const checks = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const entry = { text: message.text(), url: message.location().url };
  if (
    entry.url === "https://grok.com/grok-app-builder/extensions.js" &&
    /^Failed to load resource:/.test(entry.text)
  )
    externalResourceErrors.push(entry);
  else errors.push(entry);
});
await page.route("**/api/auth/get-session**", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: "null" }),
);
// Observe the real run's gain disconnection; keep the native audio implementation.
await page.addInitScript(() => {
  window.__lessonAudioStops = 0;
  const disconnect = AudioNode.prototype.disconnect;
  AudioNode.prototype.disconnect = function (...args) {
    if (this instanceof GainNode) window.__lessonAudioStops++;
    return disconnect.apply(this, args);
  };
});
const button = (name) => page.getByRole("button", { name, exact: true });
const record = (id) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem("sparksuite.learning.v1")).records[key],
    id,
  );
const help = () =>
  page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "Look back at the explanation" }) });
async function playAndCollapse(expander) {
  await expander.locator("summary").press("Enter");
  await button("Play reference").click();
  await button("Stop reference").waitFor();
  const before = await page.evaluate(() => window.__lessonAudioStops);
  await expander.locator("summary").click();
  await page.waitForFunction((count) => window.__lessonAudioStops > count, before);
  assert.equal(await button("Stop reference").count(), 0, "Collapsing removes and silences audio");
  await expander.locator("summary").click();
  await button("Play reference").waitFor();
  assert.equal(await button("Stop reference").count(), 0, "Reopening never autoplays");
}

try {
  await page.clock.install({ time: new Date("2026-10-29T18:00:00Z") });
  await page.goto(`${url}/learn`, { waitUntil: "networkidle" });
  const start = button("Start learning");
  await start.waitFor();
  const recommendation = await page
    .getByRole("region", { name: "Your next learning step" })
    .boundingBox();
  const phrase = await page
    .getByText("Two-minute option · A pulse with room to breathe", { exact: true })
    .boundingBox();
  const coach = await page.getByRole("link", { name: /Ask your coach/ }).boundingBox();
  assert.ok(
    recommendation.y < phrase.y && recommendation.y < coach.y,
    "Recommendation comes before optional activities",
  );
  assert.ok(
    (await start.boundingBox()).y < 900,
    "Desktop next action is visible without scrolling",
  );
  await page.screenshot({ path: `${output}-overview.png`, fullPage: true });
  await page.getByRole("radio", { name: /A whole lesson/ }).check();
  await start.press("Enter");
  await button("Let me try it").click();
  await page.getByRole("complementary", { name: "Listening focus" }).waitFor();
  const example = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "Show the example again" }) });
  await playAndCollapse(example);
  assert.equal(
    (await record("guitar-first-sound")).assisted,
    undefined,
    "Practice help does not count as recall assistance",
  );
  await page.screenshot({ path: `${output}-practice.png`, fullPage: true });
  await button("I tried it").click();
  assert.equal(await button("Wrap up this lesson").isDisabled(), true);
  await page.getByRole("radio", { name: "A string played without fretting", exact: true }).check();
  await page
    .getByText("You identified the idea. Try noticing it in your next play-through.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page.getByText(/Recalled independently/).count(),
    0,
    "A first check does not claim delayed recall",
  );
  await playAndCollapse(help());
  const assisted = await record("guitar-first-sound");
  assert.equal(assisted.assisted, true);
  assert.equal(
    assisted.answer,
    assisted.firstAnswer,
    "Help preserves the first and current answers",
  );
  await page
    .getByText("You used the example to work it out. That counts as supported practice.", {
      exact: true,
    })
    .waitFor();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page
      .getByRole("radio", { name: "A string played without fretting", exact: true })
      .isChecked(),
    true,
  );
  assert.equal(await help().getAttribute("open"), null, "Help returns collapsed on reload");
  await button("Learning path").click();
  await page.getByText("Next: Check it", { exact: true }).waitFor();
  await page.getByText("In progress · Check it", { exact: true }).waitFor();
  await button("Continue where I left off").click();
  await help().locator("summary").click();
  await button("Play reference").click();
  const beforeSwitch = await page.evaluate(() => window.__lessonAudioStops);
  await page.getByLabel("Learning instrument", { exact: true }).selectOption("piano");
  await page.waitForFunction((count) => window.__lessonAudioStops > count, beforeSwitch);
  await button("Start learning").click();
  await button("Let me try it").click();
  await button("I tried it").click();
  assert.equal(
    await help().getAttribute("open"),
    null,
    "Another instrument starts with help collapsed",
  );
  assert.equal(
    (await record("piano-find-c")).assisted,
    undefined,
    "Assistance does not leak between instruments",
  );
  await page.getByLabel("Learning instrument", { exact: true }).selectOption("guitar");
  assert.equal((await record("guitar-first-sound")).assisted, true);
  await button("Wrap up this lesson").click();
  await page.getByRole("heading", { name: "A useful step forward.", exact: true }).waitFor();
  assert.equal((await record("guitar-first-sound")).completedOn, "2026-10-29");
  checks.push(
    "recommendation hierarchy",
    "listening focus",
    "keyboard help",
    "native audio stops on collapse and instrument change",
    "no autoplay",
    "first-check wording",
    "answers survive help and reload",
    "resume step",
    "instrument isolation",
  );

  // A due review with established spacing must reset to tomorrow when help is used.
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("sparksuite.learning.v1"));
    const saved = data.records["guitar-first-sound"];
    Object.assign(saved, {
      step: 3,
      completedOn: "2026-10-01",
      lastReviewedOn: "2026-10-20",
      reviewOn: "2026-10-27",
      reviews: 2,
    });
    localStorage.setItem("sparksuite.learning.v1", JSON.stringify(data));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Ready for a short review", { exact: true }).waitFor();
  await button("Review this idea").click();
  await help().locator("summary").click();
  await page.getByRole("radio", { name: "The pitch rises from E to F", exact: true }).check();
  await button("Wrap up this lesson").click();
  await page.getByRole("heading", { name: "A useful step forward.", exact: true }).waitFor();
  const reviewed = await record("guitar-first-sound");
  assert.equal(
    reviewed.completedOn,
    "2026-10-01",
    "Original completion survives a supported review",
  );
  assert.equal(reviewed.reviewOn, "2026-10-30", "Supported due recall returns tomorrow");
  assert.equal(reviewed.reviews, 0, "Help cannot earn independent spacing credit");
  checks.push("due-review status", "supported spacing", "original completion preserved");
  await page.screenshot({ path: `${output}-review.png`, fullPage: true });

  // The same due review without help still earns its existing independent interval.
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("sparksuite.learning.v1"));
    Object.assign(data.records["guitar-first-sound"], {
      step: 3,
      lastReviewedOn: "2026-10-20",
      reviewOn: "2026-10-27",
      reviews: 2,
    });
    localStorage.setItem("sparksuite.learning.v1", JSON.stringify(data));
  });
  await page.reload({ waitUntil: "networkidle" });
  await button("Review this idea").click();
  await page.getByRole("radio", { name: "The pitch rises from E to F", exact: true }).check();
  await page
    .getByText("Recalled independently. Carry this idea into the next play-through.", {
      exact: true,
    })
    .waitFor();
  await button("Wrap up this lesson").click();
  await page.getByRole("heading", { name: "A useful step forward.", exact: true }).waitFor();
  const independent = await record("guitar-first-sound");
  assert.equal(independent.assisted, false);
  assert.equal(independent.reviews, 3);
  assert.equal(independent.reviewOn, "2026-11-12");
  checks.push("independent review wording and spacing");
  assert.deepEqual(errors, [], "No application console errors or uncaught runtime errors");
  writeFileSync(
    `${output}.json`,
    JSON.stringify({ ok: true, checks, errors, externalResourceErrors }, null, 2),
  );
  console.log(`Learning UX ${label}: ${checks.length} checks passed`);
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
