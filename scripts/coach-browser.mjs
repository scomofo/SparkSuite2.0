import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { learningPath } from "../src/lib/spark/curriculum.ts";
import { emptyLearning } from "../src/lib/spark/learning.ts";
import { lessonExercise } from "../src/lib/spark/lesson-practice.ts";
import { beginMilestone, musicalMilestone } from "../src/lib/spark/milestones.ts";
import { defaultSuite } from "../src/lib/spark/storage.ts";

const url = process.argv[2] ?? "http://127.0.0.1:8080";
const label = process.argv[3] ?? "dev";
const output = "/workspace/screenshots";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 1000 },
  reducedMotion: "reduce",
});
page.setDefaultTimeout(10_000);
const errors = [];
const expectedApiErrors = [];
const checks = [];
const posts = [];
const held = [];
let fixturesEnabled = false;
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() !== "error") return;
  if (fixturesEnabled && new URL(message.location().url || url).pathname === "/api/coach") {
    expectedApiErrors.push(message.text());
  } else errors.push(message.text());
});
const button = (name) => page.getByRole("button", { name, exact: true });
const link = (name) => page.getByRole("link", { name, exact: true });
const heading = (name) => page.getByRole("heading", { name, exact: true });
async function choose(name, interaction = "pointer") {
  const radio = page.getByRole("radio", { name, exact: true });
  if (interaction === "keyboard") {
    await radio.focus();
    await page.keyboard.press("Space");
  } else {
    // Custom choices expose a visible label around their visually hidden native input.
    await page.locator("label").filter({ has: radio }).click();
  }
  assert.equal(await radio.isChecked(), true, `${name} can be selected with ${interaction}`);
}
const suggestion = () => page.getByRole("region", { name: "Your coach’s suggestion", exact: true });
const storage = () =>
  page.evaluate(() => ({
    learning: localStorage.getItem("sparksuite.learning.v1"),
    suite: localStorage.getItem("sparksuite.v2"),
  }));
const first = learningPath("guitar")[0];
const project = learningPath("guitar")[6];
const exercise = lessonExercise(project.id);
const testCode = "browser-regression-fixture-only";
const fixtureKey = "sk-proj-browser-fixture-never-valid-1234567890";
const personalKeyError = "OpenAI did not accept your API key. Update it in Settings and try again.";
const rateLimitError = "Browser hourly-limit fixture. Try again after the countdown.";
const privateNote = "PRIVATE MILESTONE NOTE: do not send this to the coach";
const fixtureAdvice = {
  message: 'Browser response fixture: <img src="invalid" onerror="alert(1)"> **plain text**',
  why: "This fixed response checks the interface; it is not a live model evaluation.",
  tryThis: "Follow one short phrase once, using the visual guide if that helps.",
  stopAfter: "Stop after that single phrase. You can come back whenever you choose.",
  checkIn: "What did you notice about keeping your place?",
};
const lessonTarget = (lesson, kind = "lesson") => ({
  kind,
  id: lesson.id,
  title: lesson.title,
  outcome: lesson.outcome,
  reason: "Browser regression fixture for the current learning destination.",
});
let fixtureTarget = lessonTarget(first);
let mode = "success";
let fixtureRetryAfter = "3600";
let fixtureAvailability = { available: true, personalKeyAllowed: true };

async function capture(name, widths = [1280, 390, 320]) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(
      (expected) => innerWidth === expected && document.documentElement.scrollWidth <= innerWidth,
      width,
      { timeout: 3000 },
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${name}: no horizontal overflow at ${width}px`,
    );
    await page.screenshot({
      path: `${output}/coach-${label}-${name}-${width}.png`,
      fullPage: true,
    });
  }
}
async function seed(learning, instrument = "guitar") {
  const suite = defaultSuite();
  suite.active = instrument;
  await page.evaluate(
    ({ learning, suite }) => {
      localStorage.setItem("sparksuite.learning.v1", JSON.stringify(learning));
      localStorage.setItem("sparksuite.v2", JSON.stringify(suite));
    },
    { learning, suite },
  );
  await page.goto(`${url}/coach`, { waitUntil: "networkidle" });
  await heading("What would help right now?").waitFor();
}
async function expectReadyToAsk() {
  await page.waitForFunction(() => {
    const submit = document.querySelector('button[type="submit"]');
    return submit && !submit.disabled;
  });
}
async function finishCooldown() {
  // Advance the browser clock, avoiding a real ten-second wait between fixture requests.
  if (await page.locator("#coach-retry-wait").count()) await page.clock.fastForward(10_000);
  await expectReadyToAsk();
}
async function ask({ wait = true } = {}) {
  if (wait) await finishCooldown();
  await page.getByLabel("Coach access code", { exact: true }).fill(testCode);
  const sent = page.waitForRequest(
    (request) => new URL(request.url()).pathname === "/api/coach" && request.method() === "POST",
  );
  await button("Ask my coach").press("Enter");
  await sent;
}
async function expectFocus(text) {
  await page.waitForFunction((text) => document.activeElement?.textContent === text, text);
}
async function expectKeyAbsentFromStorage(targetPage = page) {
  assert.equal(
    await targetPage.evaluate(
      (key) =>
        JSON.stringify([
          ...Object.entries(localStorage),
          ...Object.entries(sessionStorage),
          document.cookie,
        ]).includes(key),
      fixtureKey,
    ),
    false,
    "A personal key never enters localStorage, sessionStorage, or document cookies",
  );
  assert.equal(
    JSON.stringify(await targetPage.context().cookies()).includes(fixtureKey),
    false,
    "No browser cookie contains the personal key",
  );
}
async function releaseHeld({ rateLimited = false } = {}) {
  for (const request of held.splice(0)) {
    await request.route
      .fulfill(
        rateLimited
          ? {
              status: 429,
              headers: { "Retry-After": "3600" },
              json: { error: "STALE RATE LIMIT FIXTURE — must stay hidden" },
            }
          : {
              json: {
                advice: { ...fixtureAdvice, message: "STALE RESPONSE FIXTURE — must stay hidden" },
                target: request.target,
              },
            },
      )
      .catch(() => {}); // A cancelled fetch may have already closed its route.
  }
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  assert.equal(
    await page.getByText("STALE RESPONSE FIXTURE — must stay hidden", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page.getByText("STALE RATE LIMIT FIXTURE — must stay hidden", { exact: true }).count(),
    0,
  );
}

try {
  // Real application availability, with no key, access code, or model request.
  const availability = await page.request.get(`${url}/api/coach`);
  assert.equal(availability.status(), 200);
  assert.deepEqual(
    await availability.json(),
    { available: false, personalKeyAllowed: true },
    "Run browser QA with the coach disabled",
  );
  const disabled = await page.request.post(`${url}/api/coach`, { data: {} });
  assert.equal(
    disabled.status(),
    503,
    "An unconfigured coach rejects POST before contacting a provider",
  );
  assert.match((await disabled.json()).error, /not available yet/);
  for (const entry of ["/", "/today", "/learn"]) {
    await page.goto(`${url}${entry}`, { waitUntil: "networkidle" });
    const before = await storage();
    await page.getByRole("link", { name: /^Ask your coach/ }).press("Enter");
    await heading("Find your next small step.").waitFor();
    await page
      .getByText("The AI coach is not available yet. Your guided learning is ready below.", {
        exact: true,
      })
      .waitFor();
    await heading(first.title).waitFor();
    assert.equal(
      await button("Ask my coach").count(),
      0,
      "Unavailable state never offers a model request",
    );
    assert.equal(await link("Open my lesson").getAttribute("href"), "/learn");
    assert.equal(await link("Coach settings").getAttribute("href"), "/settings");
    assert.deepEqual(
      await storage(),
      before,
      `Viewing coach from ${entry} leaves progress and XP unchanged`,
    );
  }
  await capture("unavailable", [390]);
  await link("Open my lesson").press("Enter");
  await page
    .getByRole("region", { name: "Current lesson", exact: true })
    .getByRole("heading", { name: first.title, exact: true })
    .waitFor();
  assert.equal(
    JSON.parse((await storage()).learning).records[first.id].step,
    0,
    "Only the explicit destination action starts the lesson",
  );
  checks.push(
    "Real disabled API, Studio/Today/Learn entry points, unchanged progress, usable native fallback",
  );

  // The remainder intercepts this local endpoint with explicit test fixtures.
  // These fixtures exercise UI behavior and do not validate live model quality.
  await page.clock.install();
  fixturesEnabled = true;
  await page.route("**/api/coach", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: fixtureAvailability });
      return;
    }
    assert.equal(route.request().method(), "POST");
    posts.push({ body: route.request().postDataJSON(), headers: route.request().headers() });
    if (mode === "hold") {
      held.push({ route, target: { ...fixtureTarget } });
      return;
    }
    if (mode === "error") {
      await route.fulfill({
        status: 503,
        json: { error: "Browser failure fixture. Please try again." },
      });
      return;
    }
    if (mode === "personal-unauthorized") {
      await route.fulfill({
        status: 401,
        json: { error: personalKeyError },
      });
      return;
    }
    if (mode === "rate-limited") {
      await route.fulfill({
        status: 429,
        headers: { "Retry-After": fixtureRetryAfter },
        json: { error: rateLimitError },
      });
      return;
    }
    const advice =
      mode === "long"
        ? {
            ...fixtureAdvice,
            message: "Long browser response fixture. " + "musicalphrase".repeat(35),
            tryThis: "Follow one phrase, then stop. ".repeat(12),
          }
        : fixtureAdvice;
    await route.fulfill({
      json: {
        advice,
        target: mode === "invalid-target" ? lessonTarget(learningPath("piano")[0]) : fixtureTarget,
      },
    });
  });
  let learning = emptyLearning();
  learning.profiles = {
    guitar: { experience: "new", minutes: 2 },
    piano: { experience: "advanced", minutes: 10 },
  };
  learning.records[first.id] = { step: 0, reviews: 0 };
  learning.records[learningPath("piano")[0].id] = { step: 1, reviews: 0 };
  learning.active = { guitar: first.id, piano: learningPath("piano")[0].id };
  learning.focus.guitar = "lesson";
  learning.milestones.guitar = {
    phase: "saved",
    scope: "whole",
    bpm: 60,
    guide: "silent",
    variation: false,
    firstBarTried: true,
    reflection: "comfortable",
    note: privateNote,
    saved: {
      bpm: 60,
      guide: "silent",
      variation: false,
      reflection: "comfortable",
      note: privateNote,
      savedOn: "2026-09-01",
    },
  };
  await seed(learning);
  const beforeAdvice = await storage();
  assert.equal(posts.length, 0, "Page load and availability checks do not ask the model");
  assert.equal(await page.locator('input[name="coach-intent"]').count(), 4);
  assert.equal(
    await page.getByRole("radio", { name: "What next?", exact: true }).isChecked(),
    true,
  );
  for (const name of ["I'm stuck", "Explain an idea", "I'm coming back", "What next?"]) {
    await choose(name, name === "Explain an idea" ? "keyboard" : "pointer");
  }
  await page.locator("summary").filter({ hasText: "Adjust today’s support" }).press("Enter");
  assert.equal(await page.getByRole("radio", { name: "2 min", exact: true }).isChecked(), true);
  assert.equal(await page.getByRole("radio", { name: "Steady", exact: true }).isChecked(), true);
  await choose("5 min");
  await choose("Low energy", "keyboard");
  await choose("I'm coming back");
  const question = page.getByRole("textbox", { name: /Anything you want help with/ });
  await question.fill("q".repeat(650));
  assert.equal((await question.inputValue()).length, 600);
  await page.getByText("Keep it about your music. 600/600 characters", { exact: true }).waitFor();
  await question.fill("Browser question fixture: help me find my place again.");
  await button("Ask my coach").press("Enter");
  assert.equal(posts.length, 0, "A missing access code cannot submit");
  await capture("form-fixture");
  await ask();
  await suggestion().waitFor();
  await expectFocus(first.title);
  assert.equal(posts.length, 1);
  const request = posts[0];
  assert.deepEqual(
    {
      instrument: request.body.instrument,
      intent: request.body.intent,
      minutes: request.body.minutes,
      energy: request.body.energy,
    },
    { instrument: "guitar", intent: "return", minutes: 5, energy: "low" },
  );
  assert.deepEqual(Object.keys(request.body.learning.records), [first.id]);
  assert.deepEqual(Object.keys(request.body.learning.profiles), ["guitar"]);
  assert.equal(
    JSON.stringify(request.body).includes(privateNote),
    false,
    "Personal milestone notes stay out of requests",
  );
  assert.equal(
    JSON.stringify(request.body).includes("piano"),
    false,
    "Other instrument progress stays out of requests",
  );
  assert.equal(
    JSON.stringify(request.body).includes(testCode),
    false,
    "The access code is not model context",
  );
  assert.equal(request.headers["x-spark-coach-code"], testCode);
  assert.equal(
    await suggestion().locator("img, strong").count(),
    0,
    "Reply text cannot create HTML or markdown elements",
  );
  await page.getByText(fixtureAdvice.message, { exact: true }).waitFor();
  assert.deepEqual(
    await storage(),
    beforeAdvice,
    "Questions and suggestions award no XP and change no learning progress",
  );
  assert.equal(
    await page.evaluate(
      (code) =>
        [...Object.values(localStorage), ...Object.values(sessionStorage)].some((value) =>
          value.includes(code),
        ),
      testCode,
    ),
    false,
  );
  checks.push(
    "Fixture: opt-in request, four intents, support defaults, 600-character bound, scoped data, plain-text reply, focus, no progress or credential persistence",
  );

  await button("Ask another question").press("Enter");
  await expectFocus("What would help right now?");
  mode = "error";
  await ask();
  await page.getByRole("alert").waitFor();
  await expectFocus("Browser failure fixture. Please try again.");
  assert.equal(
    await question.inputValue(),
    request.body.question,
    "Failure preserves the learner’s question",
  );
  const failurePosts = posts.length;
  assert.equal(await button("Ask my coach").isDisabled(), true);
  await page.locator("#coach-retry-wait").waitFor();
  const initialCountdown = await page.locator("#coach-retry-wait").innerText();
  await page.locator("form").evaluate((form) => form.requestSubmit());
  await page.clock.fastForward(1_000);
  await page.waitForFunction(
    (previous) => document.querySelector("#coach-retry-wait")?.textContent !== previous,
    initialCountdown,
  );
  assert.equal(posts.length, failurePosts, "Forced form submission cannot bypass the cooldown");
  assert.equal(
    await page.getByRole("alert").innerText(),
    "Browser failure fixture. Please try again.",
    "Waiting preserves the first provider error instead of replacing it with a pause message",
  );
  await capture("retry-countdown-fixture", [390]);
  await page.clock.fastForward(9_000);
  await expectReadyToAsk();
  assert.equal(await page.locator("#coach-retry-wait").count(), 0);
  assert.equal(posts.length, failurePosts, "Cooldown expiry never automatically retries");
  assert.equal(
    await page.getByRole("alert").innerText(),
    "Browser failure fixture. Please try again.",
  );
  mode = "success";
  await ask({ wait: false });
  await suggestion().waitFor();
  await button("Ask another question").click();
  mode = "invalid-target";
  await ask();
  await expectFocus("Your coach could not return a clear next step. Please try again.");
  assert.equal(await suggestion().count(), 0, "A mismatched destination cannot render an action");
  checks.push(
    "Fixture: first failure and question remain visible during countdown, forced submit is guarded, expiry requires manual retry, different-instrument destination rejected",
  );

  mode = "rate-limited";
  await ask();
  await expectFocus(rateLimitError);
  const hourlyPosts = posts.length;
  await page.clock.fastForward(59 * 60_000);
  assert.equal(
    await button("Ask my coach").isDisabled(),
    true,
    "A numeric hourly Retry-After is honored",
  );
  assert.equal(await page.locator("#coach-retry-wait").count(), 1);
  await page.clock.fastForward(60_000);
  await expectReadyToAsk();
  assert.equal(posts.length, hourlyPosts, "An hourly cooldown also never retries automatically");
  assert.equal(await page.getByRole("alert").innerText(), rateLimitError);
  for (const invalidHeader of ["not-a-number", "99999999"]) {
    fixtureRetryAfter = invalidHeader;
    await ask({ wait: false });
    await expectFocus(rateLimitError);
    assert.equal(await button("Ask my coach").isDisabled(), true);
    await page.clock.fastForward(10_000);
    await expectReadyToAsk();
    assert.equal(
      await page.locator("#coach-retry-wait").count(),
      0,
      `Invalid Retry-After ${invalidHeader} keeps the bounded ten-second fallback`,
    );
  }
  checks.push(
    "Fixture: hourly Retry-After honored, malformed/oversized headers bounded, no automatic retries",
  );

  mode = "hold";
  await ask();
  await button("Cancel").waitFor();
  assert.equal(
    await page.getByRole("radio", { name: "What next?", exact: true }).isDisabled(),
    true,
  );
  assert.equal(await question.isDisabled(), true);
  await button("Cancel").press("Enter");
  await expectFocus("What would help right now?");
  await page
    .getByText("Stopped waiting. Your guided learning is still available.", { exact: true })
    .waitFor();
  assert.equal(
    await button("Ask my coach").isDisabled(),
    true,
    "Cancel preserves the original cooldown",
  );
  await finishCooldown();
  await releaseHeld({ rateLimited: true });
  assert.equal(
    await button("Ask my coach").isEnabled(),
    true,
    "A canceled response cannot add an hourly cooldown",
  );
  assert.equal(await suggestion().count(), 0);
  await ask();
  await button("Cancel").waitFor();
  await page.getByLabel("Coach instrument", { exact: true }).selectOption("piano");
  await heading("What would help right now?").waitFor();
  assert.equal(await question.inputValue(), "", "Changing instrument clears the earlier question");
  assert.equal(await page.getByLabel("Coach access code", { exact: true }).inputValue(), "");
  assert.equal(
    await button("Ask my coach").isDisabled(),
    true,
    "Instrument changes preserve the original cooldown",
  );
  await finishCooldown();
  await releaseHeld();
  assert.equal(
    await button("Ask my coach").isEnabled(),
    true,
    "An old instrument’s response cannot disable requests",
  );
  assert.equal(await suggestion().count(), 0);
  checks.push(
    "Fixture: cancel and instrument change retain the initial wait but discard stale hourly limits and advice",
  );

  fixtureTarget = lessonTarget(project, "practice");
  mode = "long";
  learning = emptyLearning();
  learning.profiles.guitar = { experience: "advanced", minutes: 10 };
  learning.records[project.id] = {
    step: 1,
    reviews: 0,
    practice: { bpm: 60, guide: "silent", phase: "ready", projectStage: 2, projectChoice: 0 },
  };
  learning.active.guitar = project.id;
  learning.focus.guitar = "lesson";
  await seed(learning);
  const projectBefore = await storage();
  await ask();
  await suggestion().waitFor();
  assert.deepEqual(await storage(), projectBefore);
  await capture("long-response-fixture");
  const destination = new URL(await link("Open guided practice").getAttribute("href"), url);
  assert.equal(destination.pathname, "/techniques");
  assert.equal(destination.searchParams.get("lesson"), project.id);
  await link("Open guided practice").press("Enter");
  await heading(exercise.project.stages[2].title).waitFor();
  assert.match(
    await page.locator('ol[aria-label="Project stages"] [aria-current="step"]').innerText(),
    /Refine/,
  );
  assert.equal(await button("Stop guide").count(), 0, "A coach destination never autoplays audio");
  assert.equal(
    JSON.parse((await storage()).learning).records[project.id].practice.projectChoice,
    0,
  );
  checks.push(
    "Fixture: long replies fit 1280/390/320px and guided action resumes the saved Refine stage and choice without playback",
  );

  learning = beginMilestone(emptyLearning(), "guitar");
  const piece = musicalMilestone("guitar");
  learning.milestones.guitar.phase = "reflect";
  learning.milestones.guitar.reflection = "exploring";
  fixtureTarget = {
    kind: "milestone",
    id: "guitar",
    title: piece.title,
    outcome: piece.goal,
    reason: "Browser milestone fixture",
  };
  mode = "success";
  await seed(learning);
  await ask();
  await suggestion().waitFor();
  await link("Open my piece").press("Enter");
  await heading("A little piece of your own.").waitFor();
  assert.equal(
    await page.getByRole("radio", { name: "Still exploring", exact: true }).isChecked(),
    true,
  );
  assert.equal(await button("Stop guide").count(), 0);
  checks.push("Fixture: milestone action opens the current saved reflection");

  // A deliberately invalid credential stays entirely inside intercepted browser requests.
  // Saving it checks session handling, never whether OpenAI accepts the credential.
  fixtureTarget = lessonTarget(first);
  mode = "success";
  await seed(emptyLearning());
  fixtureAvailability = { available: false, personalKeyAllowed: true };
  const personalKeyRequests = [];
  const forbiddenProviderRequests = [];
  page.on("request", (request) => {
    if (
      Object.values(request.headers()).includes(fixtureKey) ||
      request.postData()?.includes(fixtureKey) ||
      request.url().includes(fixtureKey)
    ) {
      personalKeyRequests.push({ url: request.url(), method: request.method() });
    }
  });
  await page.route("https://api.openai.com/**", async (route) => {
    forbiddenProviderRequests.push(route.request().url());
    await route.abort();
  });
  await page.setViewportSize({ width: 1280, height: 600 });
  const shellSettings = link("Settings").first();
  await shellSettings.scrollIntoViewIfNeeded();
  assert.equal(
    await shellSettings.evaluate((element) => {
      const settings = element.getBoundingClientRect();
      return [...document.querySelectorAll('nav[aria-label="Main navigation"] a')].some((item) => {
        const nav = item.getBoundingClientRect();
        return (
          nav.width > 0 &&
          nav.height > 0 &&
          nav.left < settings.right &&
          nav.right > settings.left &&
          nav.top < settings.bottom &&
          nav.bottom > settings.top
        );
      });
    }),
    false,
    "Settings does not overlap navigation at a short desktop height",
  );
  await shellSettings.click();
  const keyInput = page.getByLabel("OpenAI API key", { exact: true });
  await keyInput.waitFor();
  await shellSettings.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${output}/coach-${label}-settings-short-desktop-fixture.png`,
  });
  assert.equal(await keyInput.getAttribute("type"), "password", "The key input is masked");
  const beforePersonalKey = await storage();
  const beforePersonalPosts = posts.length;
  await keyInput.fill(fixtureKey);
  await button("Use for this session").press("Enter");
  await button("Remove key").waitFor();
  await page
    .getByText("Ready to try your coach. Your key has not been verified with OpenAI.", {
      exact: true,
    })
    .waitFor();
  await expectFocus("Ready to try your coach. Your key will be checked when you ask.");
  assert.equal(await keyInput.inputValue(), "", "Saving clears the key from the textbox");
  assert.equal((await page.locator("body").innerText()).includes(fixtureKey), false);
  assert.equal(posts.length, beforePersonalPosts, "Saving a key never asks the coach");
  assert.deepEqual(personalKeyRequests, [], "Saving a key sends no request containing it");
  assert.deepEqual(forbiddenProviderRequests, [], "Saving does not contact OpenAI");
  await expectKeyAbsentFromStorage();
  assert.deepEqual(await storage(), beforePersonalKey, "Key setup does not change progress or XP");
  await capture("settings-session-key-fixture");
  await link("Open coach").press("Enter");
  await heading("What would help right now?").waitFor();
  await page.getByText("Using your OpenAI key for this session.", { exact: true }).waitFor();
  assert.equal(await page.getByLabel("Coach access code", { exact: true }).count(), 0);
  assert.equal(
    posts.length,
    beforePersonalPosts,
    "Client navigation retains the key without asking",
  );
  await expectKeyAbsentFromStorage();
  await capture("personal-key-ready-fixture", [390]);

  // A separate browser context cannot inherit a key from this page’s memory.
  const isolatedContext = await browser.newContext();
  try {
    const isolatedPage = await isolatedContext.newPage();
    isolatedPage.on("pageerror", (error) => errors.push(error.message));
    let isolatedPosts = 0;
    await isolatedPage.route("**/api/coach", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: fixtureAvailability });
      } else {
        isolatedPosts += 1;
        await route.fulfill({
          status: 503,
          json: { error: "Isolated browser fixture has no key." },
        });
      }
    });
    await isolatedPage.goto(`${url}/coach`, { waitUntil: "networkidle" });
    await isolatedPage
      .getByText("The AI coach is not available yet. Your guided learning is ready below.", {
        exact: true,
      })
      .waitFor();
    assert.equal(
      await isolatedPage.getByRole("button", { name: "Ask my coach", exact: true }).count(),
      0,
    );
    await isolatedPage.getByRole("link", { name: "Coach settings", exact: true }).press("Enter");
    assert.equal(await isolatedPage.getByLabel("OpenAI API key", { exact: true }).inputValue(), "");
    assert.equal(
      await isolatedPage.getByRole("button", { name: "Remove key", exact: true }).count(),
      0,
    );
    assert.equal(isolatedPosts, 0);
    await expectKeyAbsentFromStorage(isolatedPage);
  } finally {
    await isolatedContext.close();
  }

  mode = "personal-unauthorized";
  const personalSent = page.waitForRequest(
    (request) => new URL(request.url()).pathname === "/api/coach" && request.method() === "POST",
  );
  await button("Ask my coach").press("Enter");
  await personalSent;
  await expectFocus(personalKeyError);
  assert.equal(posts.length, beforePersonalPosts + 1);
  const personalRequest = posts.at(-1);
  assert.equal(personalRequest.headers["x-spark-openai-key"], fixtureKey);
  assert.equal(personalRequest.headers["x-spark-coach-code"], undefined);
  assert.equal(JSON.stringify(personalRequest.body).includes(fixtureKey), false);
  assert.deepEqual(personalKeyRequests, [{ url: `${url}/api/coach`, method: "POST" }]);
  assert.deepEqual(forbiddenProviderRequests, []);
  await expectKeyAbsentFromStorage();
  assert.deepEqual(
    await storage(),
    beforePersonalKey,
    "A provider error changes no progress or XP",
  );
  checks.push(
    "Fixture: masked Settings key, cleared textbox, no save-time request, memory-only client navigation, isolated browser context, personal header only on explicit ask, actionable 401",
  );

  mode = "hold";
  await finishCooldown();
  const pendingPersonal = page.waitForRequest(
    (request) => new URL(request.url()).pathname === "/api/coach" && request.method() === "POST",
  );
  await button("Ask my coach").press("Enter");
  await pendingPersonal;
  await button("Cancel").waitFor();
  await link("Coach settings").press("Enter");
  await button("Remove key").press("Enter");
  await expectFocus("Key removed from this session.");
  assert.equal(await keyInput.inputValue(), "");
  assert.equal(await button("Remove key").count(), 0);
  await releaseHeld({ rateLimited: true });
  await expectKeyAbsentFromStorage();
  const afterRemovalPosts = posts.length;
  await link("Open coach").press("Enter");
  await page
    .getByText("The AI coach is not available yet. Your guided learning is ready below.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await button("Ask my coach").count(),
    0,
    "Removing the key disables personal requests",
  );
  assert.equal(await suggestion().count(), 0, "The removed key’s delayed response stays hidden");
  assert.equal(posts.length, afterRemovalPosts);

  await link("Coach settings").press("Enter");
  await keyInput.fill(fixtureKey);
  await button("Use for this session").press("Enter");
  await button("Remove key").waitFor();
  await link("Open coach").press("Enter");
  await heading("What would help right now?").waitFor();
  assert.equal(
    await button("Ask my coach").isDisabled(),
    true,
    "Settings navigation and key replacement preserve the original wait",
  );
  await finishCooldown();
  assert.equal(
    await button("Ask my coach").isEnabled(),
    true,
    "An old key’s stale response cannot disable the replacement key",
  );
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByText("The AI coach is not available yet. Your guided learning is ready below.", {
      exact: true,
    })
    .waitFor();
  assert.equal(await button("Ask my coach").count(), 0, "A refresh clears the session key");
  assert.equal(
    posts.length,
    afterRemovalPosts,
    "Removing, replacing, and refreshing do not ask the model",
  );
  await link("Coach settings").press("Enter");
  assert.equal(await keyInput.inputValue(), "");
  assert.equal(await button("Remove key").count(), 0);
  await expectKeyAbsentFromStorage();
  assert.deepEqual(forbiddenProviderRequests, []);
  checks.push(
    "Fixture: removing the key discards pending advice, disables personal requests, and refresh clears the key; Settings fits 1280/390/320px",
  );
  assert.deepEqual(errors, [], "No unexpected browser errors");
  const verdict = {
    label,
    url,
    passed: true,
    liveModelCalls: 0,
    evidence:
      "Real disabled API plus explicitly intercepted browser response fixtures; no live model quality claim.",
    checks,
    fixturePosts: posts.length,
    expectedApiErrors,
    errors,
  };
  writeFileSync(`${output}/coach-${label}.json`, JSON.stringify(verdict, null, 2));
  console.log(JSON.stringify(verdict, null, 2));
} finally {
  await browser.close();
}
