import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { learningPath } from "../src/lib/spark/curriculum.ts";
import { MUSICAL_MILESTONES } from "../src/lib/spark/milestones.ts";

const url = process.argv[2] ?? "http://127.0.0.1:8080";
const label = process.argv[3] ?? "dev";
const output = "/workspace/screenshots";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
const button = (name) => page.getByRole("button", { name, exact: true });
const link = (name) => page.getByRole("link", { name, exact: true });
const heading = (name) => page.getByRole("heading", { name, exact: true });
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("sparksuite.learning.v1")));
async function capture(name, widths = [1280, 390, 320]) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.evaluate(() => scrollTo(0, 0));
    // Full-page screenshots temporarily resize Chromium; wait for restored layout.
    await page.waitForFunction(
      (expected) => innerWidth === expected && document.documentElement.scrollWidth <= innerWidth,
      width,
      { timeout: 3000 },
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${name}: no overflow at ${width}px: ${JSON.stringify(
        await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
          elements: [...document.querySelectorAll("body *")]
            .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
            .map((e) => ({
              tag: e.tagName,
              cls: e.className,
              right: e.getBoundingClientRect().right,
              text: e.textContent.slice(0, 80),
            }))
            .slice(0, 12),
        })),
      )}`,
    );
    await page.screenshot({
      path: `${output}/personalized-${label}-${name}-${width}.png`,
      fullPage: true,
    });
  }
}
try {
  await page.goto(url, { waitUntil: "networkidle" });
  await link("Choose my starting point").press("Enter");
  await heading("Make room for your kind of practice.").waitFor();
  await capture("setup");
  await page.getByLabel("Setup instrument").selectOption("guitar");
  await page.getByRole("radio", { name: "Starting from zero", exact: true }).check();
  await page.getByRole("radio", { name: "2 min", exact: true }).check();
  await button("Show my next step").press("Enter");
  await link("Start my next lesson").click();
  await heading(learningPath("guitar")[0].title).waitFor();
  await button("Got the idea").click();
  await heading("That step counts.").waitFor();
  await link("Done for now").click();

  // Editing a preference keeps unfinished work ahead of the new starting level.
  await link("Adjust my starting point or time").click();
  await page.getByRole("radio", { name: "Ready for advanced work", exact: true }).check();
  await page.getByText("Your unfinished work stays first.", { exact: false }).waitFor();
  await button("Show my next step").click();
  await link("Resume learning").click();
  await button("I tried it").waitFor();
  assert.equal((await saved()).records["guitar-first-sound"].step, 1);
  await page.goto(`${url}/start`, { waitUntil: "networkidle" });
  await page.getByLabel("Setup instrument").selectOption("piano");
  await page.getByRole("radio", { name: "Ready for advanced work", exact: true }).check();
  await page.getByRole("radio", { name: "10 min", exact: true }).check();
  await button("Show my next step").click();
  await link("Start my next lesson").click();
  await heading(learningPath("piano")[6].title).waitFor();
  assert.equal(
    Object.keys((await saved()).records).length,
    2,
    "Choosing advanced does not award earlier lessons",
  );
  assert.equal(
    (await saved()).profiles.guitar.minutes,
    2,
    "Each instrument keeps its own time preference",
  );
  await button("Got the idea").click();
  await button("I tried it").waitFor();

  // A two-minute milestone has a real first-bar stopping point.
  await page.goto(`${url}/milestone?instrument=guitar`, { waitUntil: "networkidle" });
  await button("Start with the first bar").click();
  assert.equal(await page.getByRole("radio", { name: "First bar", exact: true }).isChecked(), true);
  await page.getByLabel("Piece guide").selectOption("silent");
  await page.getByLabel("Piece tempo").selectOption("100");
  await page.clock.install();
  await button("Play one pass").click();
  await page.clock.fastForward(8000);
  await page
    .getByText("One pass finished. Try it again or check in below.", { exact: true })
    .waitFor();
  assert.equal(
    (await saved()).milestones.guitar.firstBarTried,
    false,
    "Listening alone never records an attempt",
  );
  await button("I tried the first bar").click();
  await heading("That practice counts.").waitFor();
  assert.equal(
    (await saved()).milestones.guitar.saved,
    undefined,
    "One bar is not a completed piece",
  );
  await link("Done for now").click();
  await link("Resume my piece").click();
  assert.equal(
    await page.getByRole("radio", { name: "Whole piece", exact: true }).isChecked(),
    true,
  );
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await button("Stop guide").count(), 0, "Return never starts audio");
  await page.getByLabel("Piece tempo").selectOption("40");
  await page.getByLabel("Piece version").selectOption("variation");
  await capture("piece");
  await button("Play one pass").click();
  await page.keyboard.press("Escape");
  await button("Play one pass").waitFor();
  await button("I tried the whole piece").click();
  assert.equal(await button("Save this version").isDisabled(), true);
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    "H2",
    "Check-in receives keyboard focus",
  );
  await page.getByRole("radio", { name: "Still exploring", exact: true }).check();
  await page
    .getByRole("textbox", { name: /One thing for next time/ })
    .fill("Slow the change to G. Let the final Em ring.");
  await button("Save and stop").click();
  await link("Done for now").click();
  await link("Resume my piece").click();
  assert.equal(
    await page.getByRole("radio", { name: "Still exploring", exact: true }).isChecked(),
    true,
  );
  assert.match(
    await page.getByRole("textbox", { name: /One thing for next time/ }).inputValue(),
    /Slow the change/,
  );
  await capture("reflection", [390]);
  await button("Save this version").click();
  await heading("A piece to come back to.").waitFor();
  const snapshot = (await saved()).milestones.guitar.saved;
  assert.equal(snapshot.bpm, 40);
  assert.equal(snapshot.variation, true);
  await capture("saved", [390]);
  await page.goto(`${url}/progress`, { waitUntil: "networkidle" });
  await page
    .getByRole("region", { name: "Saved music", exact: true })
    .getByRole("link", { name: /Em to G, then home/ })
    .click();
  await button("Replay my saved version").click();
  assert.equal(await page.getByLabel("Piece tempo").inputValue(), "40");
  assert.equal(await page.getByLabel("Piece version").inputValue(), "variation");
  assert.equal(await button("Stop guide").count(), 0);
  await page.getByLabel("Piece tempo").selectOption("90");
  await page.getByLabel("Piece version").selectOption("original");
  await button("I tried the whole piece").click();
  await page
    .getByRole("textbox", { name: /One thing for next time/ })
    .fill("Try a different ending.");
  await page.reload({ waitUntil: "networkidle" });
  assert.deepEqual(
    (await saved()).milestones.guitar.saved,
    snapshot,
    "An unfinished revisit cannot replace the saved version",
  );
  await page.locator("summary", { hasText: "Your saved version" }).click();
  await button("Restore saved settings").click();
  assert.equal(await page.getByLabel("Piece tempo").inputValue(), "40");
  assert.equal((await saved()).milestones.guitar.note, snapshot.note);

  // A five-minute choice creates a whole-piece starting point; returning to another
  // instrument restores its own preference rather than copying this setup.
  await page.goto(`${url}/start`, { waitUntil: "networkidle" });
  await page.getByLabel("Setup instrument").selectOption("ukulele");
  await page.getByRole("radio", { name: "I know a few basics", exact: true }).check();
  await page.getByRole("radio", { name: "5 min", exact: true }).check();
  await button("Show my next step").click();
  assert.equal((await saved()).profiles.ukulele.minutes, 5);
  for (const piece of MUSICAL_MILESTONES.filter((item) => item.instrument !== "guitar")) {
    await page.goto(`${url}/milestone?instrument=${piece.instrument}`, {
      waitUntil: "networkidle",
    });
    await button("Start this piece").click();
    await heading(piece.title).waitFor();
    assert.equal(
      await page.getByRole("radio", { name: "Whole piece", exact: true }).isChecked(),
      true,
    );
    await page.getByLabel("Piece version").selectOption("variation");
    await button(`Bar ${Math.ceil(piece.beats / 4)}`).click();
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem("sparksuite.v2")).active),
      piece.instrument,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${piece.instrument} fits on mobile`,
    );
    await button("Play one pass").click();
    await button("Stop guide").click();
    await button("I tried the whole piece").click();
    await page.getByRole("radio", { name: "Feeling more comfortable", exact: true }).check();
    await button("Save this version").click();
    await heading("A piece to come back to.").waitFor();
  }
  await page.goto(`${url}/progress`, { waitUntil: "networkidle" });
  assert.equal(
    await page.getByRole("region", { name: "Saved music", exact: true }).getByRole("link").count(),
    6,
  );
  await capture("collection", [1280, 390]);
  const suite = await page.evaluate(() => JSON.parse(localStorage.getItem("sparksuite.v2")));
  for (const piece of MUSICAL_MILESTONES) {
    assert.equal(suite.apps[piece.instrument].xp, 0, "Pieces never award timing XP");
    assert.deepEqual(suite.apps[piece.instrument].dailyComplete, {}, "Daily loops stay separate");
  }
  assert.equal(
    Object.keys((await saved()).records).length,
    2,
    "Pieces do not silently complete lessons",
  );
  await page.goto(`${url}/milestone?instrument=piano`, { waitUntil: "networkidle" });
  await button("Replay my saved version").click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota", "QuotaExceededError");
    };
  });
  await page.getByLabel("Piece tempo").selectOption("40");
  await page.getByText("This browser could not save your piece.", { exact: false }).waitFor();
  await button("Pause here").click();
  await heading("That practice counts.").waitFor();
  await button("Continue my piece").click();
  await button("I tried the whole piece").click();
  await page.getByRole("radio", { name: "Still exploring", exact: true }).check();
  assert.equal(
    await button("Save this version").isEnabled(),
    true,
    "In-memory work remains usable",
  );
  assert.deepEqual(errors, [], "Clean browser console and runtime");
  writeFileSync(
    `${output}/personalized-${label}-checks.json`,
    JSON.stringify(
      {
        ok: true,
        errors,
        checks: [
          "skippable/editable setup",
          "2/5/10 minute preferences",
          "advanced entry without false credit",
          "unfinished work precedence",
          "finite first-bar playback",
          "first-bar pause/reload/return",
          "reflection guard and note persistence",
          "snapshot and replay settings",
          "six instruments and saved collection",
          "desktop/390px/320px",
          "keyboard and focus",
          "separate practice scores",
          "storage failure",
        ],
      },
      null,
      2,
    ),
  );
  console.log(`Personalized ${label}: all browser checks passed`);
} catch (error) {
  await page
    .screenshot({ path: `${output}/personalized-${label}-failure.png`, fullPage: true })
    .catch(() => {});
  writeFileSync(
    `${output}/personalized-${label}-failure.json`,
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
