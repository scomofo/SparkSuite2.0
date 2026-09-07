// Regression coverage for the lesson workflow, using the same browser as studio-browser.mjs.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8080";
const label = process.argv[3] ?? "dev";
const output = "/workspace/screenshots";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  timezoneId: "America/Edmonton",
  reducedMotion: "reduce",
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`${message.text()} (${message.location().url})`);
});
try {
  await page.clock.install({ time: new Date("2026-09-05T18:00:00Z") });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Skip setup", exact: true }).click();
  await page.getByRole("link", { name: "Open learning path", exact: true }).click();
  await page.getByRole("heading", { name: "Guitar learning", exact: true }).waitFor();
  await page.screenshot({ path: `${output}/learning-${label}-desktop.png`, fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.screenshot({ path: `${output}/learning-${label}-${width}.png`, fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `Learning overflow at ${width}: ${JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll("body *")]
            .filter((e) => e.getBoundingClientRect().right > innerWidth)
            .map((e) => ({
              tag: e.tagName,
              cls: e.className,
              right: e.getBoundingClientRect().right,
            }))
            .slice(0, 12),
        ),
      )}`,
    );
  }
  await page.getByRole("button", { name: "Start learning", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Play reference", exact: true }).click();
  await page.getByRole("button", { name: "Stop reference", exact: true }).click();
  await page.getByRole("button", { name: "Got the idea", exact: true }).click();
  await page.getByRole("heading", { name: "That step counts.", exact: true }).waitFor();
  await page.getByRole("link", { name: "Done for now", exact: true }).click();
  await page.getByRole("link", { name: "Resume learning", exact: true }).click();
  await page.getByRole("button", { name: "I tried it", exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "I tried it", exact: true }).waitFor();
  await page.getByLabel("Learning instrument", { exact: true }).selectOption("piano");
  await page.getByRole("button", { name: "Start learning", exact: true }).click();
  await page.getByRole("button", { name: "Got the idea", exact: true }).click();
  await page.getByLabel("Learning instrument", { exact: true }).selectOption("guitar");
  await page.getByRole("button", { name: "I tried it", exact: true }).click();
  await page.getByRole("button", { name: "Continue this lesson", exact: true }).click();
  const finish = page.getByRole("button", { name: "Finish this lesson", exact: true });
  assert.equal(await finish.isDisabled(), true, "An unanswered check cannot finish");
  await page.getByRole("radio", { name: "A string pressed at fret twelve", exact: true }).check();
  assert.equal(await finish.isDisabled(), true, "A wrong answer cannot finish");
  await page.getByText("Take another look. You can try again.", { exact: true }).waitFor();
  await page.getByRole("radio", { name: "A string played without fretting", exact: true }).check();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page
      .getByRole("radio", { name: "A string played without fretting", exact: true })
      .isChecked(),
    true,
    "Answer resumes on reload",
  );
  await finish.click();
  await page.getByRole("heading", { name: "A useful step forward.", exact: true }).waitFor();
  await page.screenshot({ path: `${output}/learning-${label}-finished.png`, fullPage: true });
  const state = await page.evaluate(() => ({
    learning: JSON.parse(localStorage.getItem("sparksuite.learning.v1")),
    practice: JSON.parse(localStorage.getItem("sparksuite.v2")),
  }));
  assert.equal(state.learning.records["guitar-first-sound"].completedOn, "2026-09-05");
  assert.equal(state.practice.apps.guitar.xp, 0, "Learning does not award timing XP");
  assert.deepEqual(
    state.practice.apps.guitar.dailyComplete,
    {},
    "Learning does not finalize a practice loop",
  );
  assert.equal(
    state.learning.records["piano-find-c"].step,
    1,
    "Each instrument keeps its own place",
  );

  // Returning on another day suggests one review and still offers new material.
  await page.clock.setSystemTime(new Date("2026-09-08T18:00:00Z"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Review this idea", exact: true }).waitFor();
  await page.getByRole("button", { name: "Learn something new instead", exact: true }).click();
  await page.getByRole("heading", { name: "Give four beats a home", exact: true }).waitFor();
  await page.getByRole("button", { name: "Learning path", exact: true }).click();
  await page.getByRole("radio", { name: /A whole lesson/ }).check();
  await page.getByRole("button", { name: "Continue where I left off", exact: true }).click();
  await page.getByRole("button", { name: "Got the idea", exact: true }).click();
  await page.getByRole("button", { name: "I tried it", exact: true }).waitFor();

  // Every instrument exposes advanced work without pretending the earlier lessons are mastered.
  for (const instrument of ["piano", "ukulele", "bass", "drums", "vocals", "guitar"]) {
    await page.getByLabel("Learning instrument", { exact: true }).selectOption(instrument);
    const pathButton = page.getByRole("button", { name: "Learning path", exact: true });
    if (await pathButton.isVisible()) await pathButton.click();
    const advanced = page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: "Create and refine" }) });
    await advanced.locator("summary").click();
    await advanced.getByRole("button").last().click();
    await page.getByRole("button", { name: "Got the idea", exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${instrument} lesson overflow at 320px`,
    );
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `${output}/learning-${label}-lesson-mobile.png`, fullPage: true });
  await page.getByRole("button", { name: "Save and stop", exact: true }).click();
  await page.getByRole("heading", { name: "That step counts.", exact: true }).waitFor();
  await page.getByRole("link", { name: "Done for now", exact: true }).click();
  await page.getByRole("link", { name: "Learn", exact: true }).click();
  await page.getByRole("button", { name: "Got the idea", exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    "H2",
    "Resume puts focus on the lesson heading",
  );

  // Storage errors are visible and the lesson remains usable in memory.
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Got the idea", exact: true }).click();
  await page.getByText("This browser could not save your learning.", { exact: false }).waitFor();
  await page.getByRole("link", { name: "Open guided project", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "I tried it", exact: true }).count(),
    0,
    "Advanced projects cannot skip stages when storage is unavailable",
  );
  assert.deepEqual(errors, [], "Clean browser console and runtime");
  writeFileSync(
    `${output}/learning-${label}-checks.json`,
    JSON.stringify(
      {
        ok: true,
        errors,
        checks: [
          "desktop/390px/320px",
          "keyboard and focus",
          "optional audio stop",
          "one-step and full-lesson pacing",
          "pause/reload/return",
          "six instruments and advanced access",
          "feedback and completion guard",
          "separate practice progress",
          "review/new choice",
          "storage failure",
        ],
      },
      null,
      2,
    ),
  );
  console.log(`Learning ${label}: all browser checks passed`);
} catch (error) {
  await page
    .screenshot({ path: `${output}/learning-${label}-failure.png`, fullPage: true })
    .catch(() => {});
  writeFileSync(
    `${output}/learning-${label}-failure.json`,
    JSON.stringify(
      {
        error: String(error),
        errors,
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
  await browser.close();
}
