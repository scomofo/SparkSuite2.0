import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { LESSON_EXERCISES } from "../src/lib/spark/lesson-practice.ts";

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
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("sparksuite.learning.v1")));
assert.equal(LESSON_EXERCISES.length, 48, "Every curriculum lesson has guided practice");
async function noOverflow() {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    `No page overflow at ${page.viewportSize().width}px`,
  );
}

try {
  await page.goto(`${url}/learn`, { waitUntil: "networkidle" });
  await button("Start learning").click();
  await button("Got the idea").click();
  await button("Continue this lesson").click();
  await link("Open guided exercise").press("Enter");
  await page.getByRole("heading", { name: "Open E → F → E", exact: true }).waitFor();
  await page.waitForFunction(() => document.activeElement?.tagName === "H2");
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    "H2",
    "A newly created guided exercise receives keyboard focus",
  );
  await button("Play one pass").waitFor();
  assert.equal(
    await page.getByText("Four minutes. Then stop.", { exact: true }).count(),
    0,
    "Guided practice has an explicit stop instead of the general lab countdown",
  );
  await page.getByLabel("Practice tempo").selectOption("40");
  await page.getByLabel("Practice guide").selectOption("silent");
  await button("Save and stop").click();
  await link("Done for now").click();
  await link("Resume guided exercise").click();
  assert.equal(await page.getByLabel("Practice tempo").inputValue(), "40");
  assert.equal(await page.getByLabel("Practice guide").inputValue(), "silent");
  assert.equal(await button("Stop guide").count(), 0, "Resume never starts audio");

  // Visual-only playback is finite; finishing a guide is not a self-reported attempt.
  await page.getByLabel("Practice tempo").selectOption("100");
  await page.clock.install();
  await button("Play one pass").click();
  await button("Stop guide").waitFor();
  await page.clock.fastForward(12_000);
  await button("Play one pass").waitFor();
  await page
    .getByText("One pass finished. You can try it again or check in below.", { exact: true })
    .waitFor();
  assert.equal((await saved()).records["guitar-first-sound"].practice.phase, "ready");
  await button("Play one pass").click();
  await page.keyboard.press("Escape");
  await button("Play one pass").waitFor();
  await page.getByLabel("Practice guide").selectOption("notes");
  await button("Play one pass").click();
  await button("Stop guide").click();
  await page.clock.fastForward(30_000);
  await button("Play one pass").waitFor();
  assert.equal((await saved()).records["guitar-first-sound"].step, 1);

  await button("I tried the exercise").click();
  await page.getByRole("heading", { name: "What did you notice?", exact: true }).waitFor();
  assert.equal(await button("Continue to lesson check").isDisabled(), true);
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    "H2",
    "Check-in receives keyboard focus",
  );
  await page.getByRole("radio", { name: "I'd like another try", exact: true }).check();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.getByRole("radio", { name: "I'd like another try", exact: true }).isChecked(),
    true,
  );
  assert.equal(await button("Try this adjustment").isDisabled(), true);
  await page.getByRole("radio", { name: "I lost the pulse or my place", exact: true }).check();
  await page.getByText("Try only Bar 1 at 40 BPM with Click only.", { exact: false }).waitFor();
  await button("Try this adjustment").click();
  assert.equal(await page.getByLabel("Practice tempo").inputValue(), "40");
  assert.equal(await page.getByLabel("Practice guide").inputValue(), "pulse");
  assert.equal(await button("Bar 2").count(), 0, "Pulse retry is limited to the first bar");
  assert.equal(await button("Stop guide").count(), 0, "Retry waits for the learner");
  await button("I tried the exercise").click();
  await page.getByRole("radio", { name: "I'm ready to move on", exact: true }).check();
  await button("Continue to lesson check").click();
  await button("Finish this lesson").waitFor();
  assert.equal(await button("Finish this lesson").isDisabled(), true);
  await page.getByRole("radio", { name: "A string pressed at fret twelve", exact: true }).check();
  assert.equal(await button("Finish this lesson").isDisabled(), true);
  await page.getByRole("radio", { name: "A string played without fretting", exact: true }).check();
  await button("Finish this lesson").click();
  await page.getByRole("heading", { name: "A useful step forward.", exact: true }).waitFor();
  const suite = await page.evaluate(() => JSON.parse(localStorage.getItem("sparksuite.v2")));
  assert.equal(suite.apps.guitar.xp, 0, "Guided attempts do not award timing XP");
  assert.deepEqual(suite.apps.guitar.dailyComplete, {}, "Daily practice completion is separate");

  // Every recipe must hydrate with its own instrument, render its pattern, and return to its lesson.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const exercise of LESSON_EXERCISES) {
    await page.goto(`${url}/techniques?lesson=${encodeURIComponent(exercise.lessonId)}`, {
      waitUntil: "networkidle",
    });
    await page.getByRole("heading", { name: exercise.title, exact: true }).waitFor();
    if (exercise.project) {
      const recordBeforeStart = (await saved()).records[exercise.lessonId];
      if (!recordBeforeStart?.practice) {
        await button("Start guided project").click();
      }
    }
    await button("Play one pass").waitFor();
    const instrument = exercise.lessonId.split("-")[0];
    assert.equal(
      await page.evaluate(() => JSON.parse(localStorage.getItem("sparksuite.v2")).active),
      instrument,
      "A direct lesson link selects the matching instrument",
    );
    const barCount = Math.ceil((exercise.project?.buildBeats ?? exercise.beats) / 4);
    await button(`Bar ${barCount}`).click();
    await page.getByRole("heading", { name: new RegExp(`^Bar ${barCount}`) }).waitFor();
    await noOverflow();
    await link("Back to lesson").click();
    await link(exercise.project ? "Resume guided project" : "Resume guided exercise").waitFor();
    assert.equal(
      (await saved()).records[exercise.lessonId].completedOn === undefined,
      exercise.lessonId !== "guitar-first-sound",
    );
  }

  // Advanced projects save each short stage and only unlock the lesson check after Refine.
  const project = LESSON_EXERCISES.find((exercise) => exercise.lessonId === "guitar-arrangement");
  assert.ok(project?.project, "Guitar arrangement has a resumable project");
  const [build, choose, refine] = project.project.stages;
  await page.evaluate((lessonId) => {
    const key = "sparksuite.learning.v1";
    const learning = JSON.parse(localStorage.getItem(key));
    delete learning.records[lessonId];
    delete learning.active.guitar;
    localStorage.setItem(key, JSON.stringify(learning));
  }, project.lessonId);
  await page.goto(`${url}/techniques?lesson=guitar-arrangement`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Build, choose, then refine.", exact: true }).waitFor();
  assert.equal(
    (await saved()).records[project.lessonId],
    undefined,
    "A preview creates no progress",
  );
  await page.screenshot({ path: `${output}/lesson-project-${label}-preview.png`, fullPage: true });
  await button("Start guided project").click();
  await page.getByText("Project stage 1 of 3", { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/lesson-project-${label}-build.png`, fullPage: true });
  assert.equal((await saved()).records[project.lessonId].practice.projectStage, 0);
  assert.equal(
    (await saved()).records[project.lessonId].completedOn,
    undefined,
    "Opening a project never completes its lesson",
  );
  await link("Back to lesson").click();
  await page
    .getByText("Finish Build, Choose, and Refine in the guided project", { exact: false })
    .waitFor();
  assert.equal(await button("I tried it").count(), 0, "A project cannot bypass its three stages");
  assert.equal((await saved()).records[project.lessonId].step, 1);
  await link("Resume guided project").click();
  await page.getByText("Project stage 1 of 3", { exact: true }).waitFor();
  await button(build.button).click();
  await page.getByRole("heading", { name: "That stage counts.", exact: true }).waitFor();
  assert.equal((await saved()).records[project.lessonId].practice.projectStage, 1);
  assert.equal(await button("Stop guide").count(), 0, "A stage transition stops the guide");

  // Leave at the stage break, then resume through the learner's path.
  await link("Done for now").click();
  await link("Learn").click();
  await link("Resume guided project").click();
  await page.getByText("Project stage 2 of 3", { exact: true }).waitFor();
  assert.equal(await button(choose.button).isDisabled(), true, "Choose requires one direction");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Project stage 2 of 3", { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/lesson-project-${label}-choose.png`, fullPage: true });
  assert.equal((await saved()).records[project.lessonId].practice.projectStage, 1);
  assert.equal(await button("Stop guide").count(), 0, "Reloading a project never starts audio");
  await page.locator('input[name="project-choice"]').first().check();
  assert.equal((await saved()).records[project.lessonId].practice.projectChoice, 0);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator('input[name="project-choice"]').first().isChecked(), true);
  await button(choose.button).click();
  await page.getByRole("heading", { name: "That stage counts.", exact: true }).waitFor();
  assert.equal((await saved()).records[project.lessonId].practice.projectStage, 2);
  await button("Continue to refine").click();
  await page.getByText("Project stage 3 of 3", { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/lesson-project-${label}-refine.png`, fullPage: true });
  await button(refine.button).click();
  await page.getByRole("heading", { name: "What did you notice?", exact: true }).waitFor();
  assert.equal((await saved()).records[project.lessonId].practice.projectStage, 2);
  assert.equal((await saved()).records[project.lessonId].completedOn, undefined);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("radio", { name: "I'm ready to move on", exact: true }).check();
  await button("Continue to lesson check").click();
  await button("Finish this lesson").waitFor();
  const projectRecord = (await saved()).records[project.lessonId];
  assert.equal(
    projectRecord.practice.projectStage,
    2,
    "Project stage survives lesson-check return",
  );
  assert.equal(
    projectRecord.practice.projectChoice,
    0,
    "Project choice survives lesson-check return",
  );
  assert.equal(projectRecord.completedOn, undefined, "Project work does not complete the lesson");

  // Inspect the concrete chord-change handoff at desktop and both small widths.
  await page.goto(`${url}/techniques?lesson=guitar-em-to-g`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Em → G, one change at a time", exact: true }).waitFor();
  await page.getByLabel("Practice tempo").selectOption("40");
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `${output}/lesson-practice-${label}-${width}.png`,
      fullPage: true,
    });
    await noOverflow();
  }
  await button("I tried the exercise").click();
  await page.getByRole("radio", { name: "I'd like another try", exact: true }).check();
  await page.locator('input[name="practice-retry-focus"]').nth(1).check();
  await page.screenshot({
    path: `${output}/lesson-practice-${label}-reflection.png`,
    fullPage: true,
  });
  await noOverflow();
  await button("Save and stop").click();
  await link("Done for now").click();
  await link("Learn").click();
  await page.getByLabel("Learning instrument").selectOption("piano");
  await page.getByLabel("Learning instrument").selectOption("guitar");
  await link("Resume guided exercise").click();
  assert.equal(
    await page.getByRole("radio", { name: "I'd like another try", exact: true }).isChecked(),
    true,
    "Check-in survives a pause and instrument switch",
  );
  assert.equal(
    await page.locator('input[name="practice-retry-focus"]').nth(1).isChecked(),
    true,
    "Targeted retry focus survives a pause and instrument switch",
  );
  assert.equal((await saved()).records["guitar-em-to-g"].practice.bpm, 40);

  // Existing labs still work; unknown lesson IDs never show a mismatched lab.
  await page.goto(`${url}/techniques?tab=down&chord=G`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Right hand", exact: true }).waitFor();
  for (const id of ["not-a-lesson"]) {
    await page.goto(`${url}/techniques?lesson=${id}`, { waitUntil: "networkidle" });
    await page
      .getByRole("heading", { name: "This guided exercise is unavailable.", exact: true })
      .waitFor();
    await link("Back to learning").waitFor();
  }

  await page.goto(`${url}/techniques?lesson=bass-fifth-octave`, { waitUntil: "networkidle" });
  await page.getByText("Explore the sounds", { exact: true }).click();
  const bassNote = page.getByRole("button", { name: "E string fret 3 G", exact: true });
  await bassNote.press("Enter");
  assert.match(
    await bassNote.getAttribute("class"),
    /ring-fg/,
    "Keyboard input activates the bass note",
  );
  await page.screenshot({ path: `${output}/lesson-practice-${label}-bass.png`, fullPage: true });
  await noOverflow();

  // Persistence failure remains visible while the in-memory exercise can continue.
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota", "QuotaExceededError");
    };
  });
  await page.getByLabel("Practice tempo").selectOption("40");
  await page.getByText("This browser could not save your practice.", { exact: false }).waitFor();
  await button("Pause here").click();
  await page.getByRole("heading", { name: "A good place to pause.", exact: true }).waitFor();
  await button("Continue this exercise").click();
  await button("I tried the exercise").click();
  await page.getByRole("radio", { name: "I'm ready to move on", exact: true }).check();
  assert.equal(await button("Continue to lesson check").isEnabled(), true);
  // Missing audio support keeps a working visual pass and an explicit stop.
  const silentPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  silentPage.on("pageerror", (error) => errors.push(error.message));
  await silentPage.addInitScript(() => {
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
  });
  await silentPage.goto(`${url}/techniques?lesson=piano-find-c`, { waitUntil: "networkidle" });
  await silentPage.getByRole("button", { name: "Play one pass", exact: true }).click();
  await silentPage.getByText("Audio is unavailable here.", { exact: false }).waitFor();
  await silentPage.getByRole("button", { name: "Stop guide", exact: true }).click();
  await silentPage.getByRole("button", { name: "Play one pass", exact: true }).waitFor();
  await silentPage.close();
  assert.deepEqual(errors, [], "Clean browser console and runtime");
  writeFileSync(
    `${output}/lesson-practice-${label}-checks.json`,
    JSON.stringify(
      {
        ok: true,
        errors,
        checks: [
          "48 matching exercises",
          "resumable Build / Choose / Refine projects",
          "one-variable retry coaching",
          "desktop/390px/320px",
          "keyboard and focus",
          "bounded optional audio and visual-only guide",
          "explicit attempt and feedback",
          "pause/reload/instrument return",
          "tempo and guide persistence",
          "understanding-check guard",
          "unchanged XP and daily completion",
          "legacy and invalid links",
          "storage failure",
        ],
      },
      null,
      2,
    ),
  );
  console.log(`Lesson practice ${label}: all browser checks passed`);
} catch (error) {
  await page
    .screenshot({ path: `${output}/lesson-practice-${label}-failure.png`, fullPage: true })
    .catch(() => {});
  writeFileSync(
    `${output}/lesson-practice-${label}-failure.json`,
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
