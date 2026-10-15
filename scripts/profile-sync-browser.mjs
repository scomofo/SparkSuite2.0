// Portable progress backup acceptance: import a profile, verify local restore, then export it again.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8083";
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
  await page.goto(new URL("/account", url).toString(), { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Account & sync", exact: true }).waitFor();

  const backup = {
    format: "sparksuite-profile-backup",
    version: 1,
    exportedAt: "2026-10-14T18:00:00.000Z",
    profile: {
      version: 1,
      suite: {
        version: 4,
        active: "piano",
        apps: {
          piano: {
            version: 4,
            xp: 123,
            level: 3,
            streak: 2,
            lastPlayedDay: "2026-10-14",
            mastery: { "piano-c-major": 0.8 },
            lastAccuracy: 0.9,
            history: [{ date: "2026-10-14", accuracy: 0.9, xp: 23 }],
            dailyComplete: { "2026-10-14": true },
            bestCombo: 8,
            marks: ["piano-c-major"],
            lastCheckin: null,
          },
        },
      },
      learning: {
        version: 1,
        records: {},
        active: {},
        pace: "step",
        profiles: {},
        skippedSetup: {},
        milestones: {},
        focus: {},
      },
      checkpoints: {},
      sharedPhrases: { guitar: { stage: 1, note: "Keep the chord ringing." } },
    },
  };

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Import backup", exact: true }).waitFor();
  await page.getByLabel("Choose a SparkSuite progress backup").setInputFiles({
    name: "sparksuite-progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByText("Backup restored on this computer.", { exact: false }).waitFor();
  const restored = await page.evaluate(() => {
    const suite = JSON.parse(localStorage.getItem("sparksuite.v2") ?? "{}");
    const phrase = JSON.parse(localStorage.getItem("shared-phrase-v1:guitar") ?? "{}");
    return { active: suite.active, xp: suite.apps?.piano?.xp, mastery: suite.apps?.piano?.mastery?.["piano-c-major"], phrase };
  });
  assert.deepEqual(restored, {
    active: "piano",
    xp: 123,
    mastery: 0.8,
    phrase: { stage: 1, note: "Keep the chord ringing." },
  });

  await page.getByLabel("Choose a SparkSuite progress backup").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ format: "not-a-sparksuite-backup", version: 9 })),
  });
  await page.getByRole("alert").getByText("not a valid SparkSuite progress backup").waitFor();
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem("sparksuite.v2") ?? "{}").apps?.piano?.xp),
    123,
    "Invalid import must not alter the saved profile",
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup", exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  assert.ok(stream, "Export should produce a downloadable file");
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  assert.equal(exported.format, "sparksuite-profile-backup");
  assert.equal(exported.profile.suite.active, "piano");
  assert.equal(exported.profile.suite.apps.piano.xp, 123);
  assert.deepEqual(exported.profile.sharedPhrases.guitar, { stage: 1, note: "Keep the chord ringing." });

  await page.screenshot({ path: `${output}/account-sync-${label}.png`, fullPage: true });
  assert.deepEqual(errors, [], "Account backup UI should not emit browser errors");
} finally {
  await browser.close();
}
