// CI regression checks for the user-facing studio and recovery flow.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8080";
const label = process.argv[3] ?? "dev";
const output = "/workspace/screenshots";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({
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
  assert.equal(await page.getByRole("button", { name: /^Practise / }).count(), 6);
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
  for (const instrument of ["piano", "ukulele", "bass", "drums", "vocals", "guitar"]) {
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
  await page.getByRole("button", { name: "Count me in", exact: true }).click();
  await page.clock.runFor(3500);
  await page.keyboard.press("6");
  await page.clock.runFor(31000);
  await page
    .locator("header")
    .getByText(/2 \/ 3/)
    .waitFor();
  await page.getByRole("button", { name: "Pause and leave session", exact: true }).click();
  await page.getByText("1 of 3 exercises finished.", { exact: false }).waitFor();
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
  await page.getByRole("table", { name: "Recent Guitar sessions" }).waitFor();
  const rows = await page
    .getByRole("table", { name: "Recent Guitar sessions" })
    .getByRole("row")
    .count();
  assert.equal(rows, 2, "Finishing the recovered loop awards one history entry");
  await page.screenshot({ path: `${output}/progress-${label}-earned.png`, fullPage: true });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("table", { name: "Recent Guitar sessions" }).waitFor();
  assert.equal(
    await page.getByRole("table", { name: "Recent Guitar sessions" }).getByRole("row").count(),
    rows,
    "Reload cannot award the loop twice",
  );
  assert.deepEqual(errors, [], "Browser console and runtime errors");
  writeFileSync(
    `${output}/studio-${label}-checks.json`,
    JSON.stringify(
      {
        ok: true,
        errors,
        checks: [
          "desktop/mobile/320px studio",
          "six progress instruments",
          "native keyboard action",
          "completed exercise recovery",
          "instrument switching",
          "direct practice reload",
          "single finalization",
        ],
      },
      null,
      2,
    ),
  );
  console.log(`Studio ${label}: all browser checks passed`);
} finally {
  await browser.close();
}
