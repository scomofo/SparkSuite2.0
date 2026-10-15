// CI regression checks for the user-facing studio and recovery flow.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8083";
const label = process.argv[3] ?? "dev";
const output = "/workspace/screenshots";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
let page;
try {
  page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "America/Edmonton",
    locale: "en-CA",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.clock.install({ time: new Date("2026-09-05T12:00:00Z") });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Make room for music." }).waitFor();
  assert.equal(await page.getByRole("button", { name: /^Practise / }).count(), 10);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${output}/studio-${label}-desktop.png`, fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `Studio overflow at ${width}px`,
    );
    await page.screenshot({ path: `${output}/studio-${label}-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Progress", exact: true }).click();
  await page.getByRole("heading", { name: "Your progress" }).waitFor();
  for (const instrument of ["piano", "ukulele", "mandolin", "banjo", "violin", "lapsteel", "bass", "drums", "vocals", "guitar"]) {
    await page.getByLabel("Instrument", { exact: true }).selectOption(instrument);
    assert.equal(
      await page
        .getByRole("list", { name: "Practice days", exact: true })
        .getByRole("listitem")
        .count(),
      28,
    );
  }
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    "Progress overflow",
  );
  await page.screenshot({ path: `${output}/progress-${label}-mobile.png`, fullPage: true });
  await page.getByRole("link", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: "Start today's loop", exact: true }).click();
  await page.getByRole("button", { name: "Hear it once", exact: true }).press("Enter");
  assert.equal(
    await page.getByRole("button", { name: "Count me in", exact: true }).isEnabled(),
    false,
    "Enter must activate the focused demo, not start the exercise",
  );
  await page.clock.runFor(4000);
  await page.getByRole("button", { name: "Continue without mic (unscored)", exact: true }).click();
  await page.clock.runFor(3500);
  await page.keyboard.press("6");
  await page.clock.runFor(31000);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .locator("header")
    .getByText(/2 \/ 3/)
    .waitFor();
  await page.getByRole("button", { name: "Pause and leave session", exact: true }).click();
  await page.getByText("0 of 3 exercises finished.", { exact: false }).waitFor();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Resume your loop", exact: true }).waitFor();
  await page.getByRole("link", { name: "Studio", exact: true }).click();
  await page.getByRole("button", { name: "Practise Bass", exact: true }).click();
  await page.getByRole("link", { name: "Studio", exact: true }).click();
  await page.getByRole("button", { name: "Practise Guitar", exact: true }).click();
  await page.getByRole("button", { name: "Resume your loop", exact: true }).click();
  await page
    .locator("header")
    .getByText(/2 \/ 3/)
    .waitFor();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Count me in", exact: true }).waitFor();
  await page
    .locator("header")
    .getByText(/2 \/ 3/)
    .waitFor();
  await page.getByRole("button", { name: "Skip this one", exact: true }).click();
  await page
    .locator("header")
    .getByText(/3 \/ 3/)
    .waitFor();
  await page.getByRole("button", { name: "Skip this one", exact: true }).click();
  await page.getByRole("link", { name: "Back to today", exact: true }).click();
  await page.getByRole("link", { name: "Progress", exact: true }).click();
  const history = page.getByRole("table", { name: "Recent Guitar sessions" });
  assert.equal(
    await history.count(),
    0,
    "Unscored/skipped practice must not create a scored session history entry",
  );
  await page.screenshot({ path: `${output}/progress-${label}-unscored.png`, fullPage: true });
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal(
    await page.getByRole("table", { name: "Recent Guitar sessions" }).count(),
    0,
    "Reload must not turn unscored practice into a completed session",
  );

  // Ukulele strumming is real acoustic input, not a tap on a synthetic Strum button.
  await page.getByLabel("Instrument", { exact: true }).selectOption("ukulele");
  await page.getByRole("link", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: "Start today's loop", exact: true }).click();
  await page.getByRole("button", { name: "Skip this one", exact: true }).click();
  await page.getByRole("button", { name: "Enable microphone", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Strum", exact: true }).count(),
    0,
    "Ukulele strum exercises must not expose a manual Strum scoring button",
  );
  assert.equal(
    await page.getByRole("button", { name: "Count me in", exact: true }).isEnabled(),
    false,
    "A scored ukulele strum exercise requires microphone access",
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          throw new DOMException("denied", "NotAllowedError");
        },
      },
    });
  });
  await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
  await page
    .getByText("Microphone access was blocked or unavailable. Allow access in your browser and try again.", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Continue without mic (unscored)", exact: true }).click();
  await page.clock.runFor(4000);
  await page
    .getByText("Visual-only practice. This attempt will not be scored.", { exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Strum", exact: true }).count(),
    0,
    "The ukulele play phase must never score a button press as a strum",
  );

  // Finish the unscored ukulele item without awarding progress so the instrument picker is available.
  await page.clock.runFor(31000);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Skip this one", exact: true }).click();
  await page.getByRole("link", { name: "Back to today", exact: true }).click();

  // The same physical-input gate must be present for every other instrument.
  const otherInstruments = [
    ["piano", "Piano"],
    ["mandolin", "Mandolin"],
    ["banjo", "Banjo"],
    ["violin", "Violin"],
    ["lapsteel", "Lap steel"],
    ["bass", "Bass"],
    ["drums", "Drums"],
    ["vocals", "Vocals"],
    ["guitar", "Guitar"],
  ];
  for (const [instrument, label] of otherInstruments) {
    await page.goto(new URL("/", url).toString(), { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: `Practise ${label}`, exact: true }).click();
    await page.getByRole("button", { name: /^(Start today's loop|Play it again|Resume your loop)$/ }).click();
    await page.getByRole("button", { name: "Enable microphone", exact: true }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Count me in", exact: true }).isEnabled(),
      false,
      `${instrument} scored practice must wait for real microphone input or the unscored fallback`,
    );
    await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
    await page
      .getByText("Microphone access was blocked or unavailable. Allow access in your browser and try again.", { exact: true })
      .waitFor();
    await page.clock.runFor(4000);
    await page.getByRole("button", { name: "Continue without mic (unscored)", exact: true }).click();
    await page.clock.runFor(3500);
    await page.keyboard.press("6");
    await page.clock.runFor(31000);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Skip this one", exact: true }).click();
    await page.getByRole("link", { name: "Back to today", exact: true }).click();
  }

  assert.deepEqual(errors, [], "Browser console and runtime errors");
  writeFileSync(
    `${output}/studio-${label}-checks.json`,
    JSON.stringify(
      {
        ok: true,
        errors,
        checks: [
          "desktop/mobile/320px studio",
          "ten progress instruments",
          "native keyboard action",
          "completed exercise recovery",
          "instrument switching",
          "direct practice reload",
          "unscored fallback does not award session history",
          "ukulele acoustic-input gating and denied-microphone fallback",
          "microphone-first input for piano, guitar, bass, mandolin, banjo, violin, lap steel, drums, and vocals",
        ],
      },
      null,
      2,
    ),
  );
  console.log(`Studio ${label}: all browser checks passed`);
} catch (error) {
  if (page) {
    await page
      .screenshot({ path: `${output}/studio-${label}-failure.png`, fullPage: true })
      .catch(() => {});
    writeFileSync(
      `${output}/studio-${label}-failure.json`,
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
  }
  throw error;
} finally {
  await browser.close();
}
