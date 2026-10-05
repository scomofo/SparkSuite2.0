import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import ts from "typescript";

// Exercise the production scheduler and synthesizer in Chromium's native audio
// engine. Offline rendering makes the entire final rest inspectable without a
// microphone, real-time waits, or a mocked oscillator/gain implementation.
function moduleUrl(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  return ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
}
const dataUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const audioUrl = dataUrl(moduleUrl("../src/lib/spark/audio.ts"));
const phraseUrl = dataUrl(
  moduleUrl("../src/lib/spark/shared-phrase.ts").replace('"./audio.ts"', JSON.stringify(audioUrl)),
);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const results = [];
try {
  for (const slow of [false, true]) {
    for (const oneBar of [false, true]) {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const result = await page.evaluate(
        async ({ phraseUrl, slow, oneBar }) => {
          const sampleRate = 48_000;
          const beat = 60 / (slow ? 48 : 72);
          const beats = oneBar ? 4 : 16;
          const context = new OfflineAudioContext(
            1,
            Math.ceil((beats * beat + 0.25) * sampleRate),
            sampleRate,
          );
          window.AudioContext = function () {
            return context;
          };
          const voices = [];
          const createOscillator = context.createOscillator.bind(context);
          context.createOscillator = () => {
            const oscillator = createOscillator();
            const voice = {};
            const start = oscillator.start.bind(oscillator);
            const stop = oscillator.stop.bind(oscillator);
            oscillator.start = (when) => {
              voice.start = when;
              start(when);
            };
            oscillator.stop = (when) => {
              voice.stop = when;
              stop(when);
            };
            voices.push(voice);
            return oscillator;
          };
          const { playSharedPhrase, sharedPhrasePattern } = await import(phraseUrl);
          const phrase = sharedPhrasePattern({ slow, oneBar });
          const run = playSharedPhrase(phrase);
          if (!run) throw new Error("Native phrase audio did not initialize");
          const samples = (await context.startRendering()).getChannelData(0);
          function peak(from, until) {
            let value = 0;
            for (let i = Math.ceil(from * sampleRate); i < Math.ceil(until * sampleRate); i++)
              value = Math.max(value, Math.abs(samples[i] ?? 0));
            return value;
          }
          return {
            bpm: slow ? 48 : 72,
            oneBar,
            phrase,
            voices,
            minimumAttackPeak: Math.min(
              ...phrase.onsets.map((onset) => peak(onset * beat, onset * beat + 0.05)),
            ),
            // Bar 2 ends on a played beat 4; only the full phrase has a final rest.
            silentTailPeak: peak((oneBar ? beats : beats - 1) * beat, samples.length / sampleRate),
          };
        },
        { phraseUrl, slow, oneBar },
      );
      assert.deepEqual(errors, [], "Native audio render has no uncaught errors");
      const expectedOnsets = oneBar
        ? [0, 1, 1.5, 2, 3]
        : [0, 1, 2, 3, 4, 5, 5.5, 6, 7, 8, 9, 10, 11, 12, 13, 13.5, 14];
      assert.deepEqual(result.phrase.onsets, expectedOnsets);
      assert.equal(result.phrase.beats, oneBar ? 4 : 16);
      assert.equal(result.phrase.beat, 60 / result.bpm);
      assert.equal(result.voices.length, expectedOnsets.length * 3, "Three harmonics per attack");
      expectedOnsets.forEach((onset, index) => {
        const nextBeat = expectedOnsets[index + 1] ?? onset + 1;
        for (const voice of result.voices.slice(index * 3, index * 3 + 3)) {
          assert.equal(
            voice.start,
            onset * result.phrase.beat,
            "Audio starts on the written count",
          );
          assert.ok(voice.stop > voice.start, "Every attack has a positive duration");
          assert.ok(
            voice.stop < nextBeat * result.phrase.beat,
            "Release before the next attack/rest",
          );
        }
      });
      assert.ok(result.minimumAttackPeak > 0.05, "Every written attack produces audible samples");
      assert.equal(result.silentTailPeak, 0, "The final rest/end is silent throughout");
      results.push({
        bpm: result.bpm,
        oneBar,
        attacks: expectedOnsets.length,
        minimumAttackPeak: result.minimumAttackPeak,
        silentTailPeak: result.silentTailPeak,
      });
      await page.close();
    }
  }

  // The optional duration must leave other piano callers at their existing length.
  const page = await browser.newPage();
  const defaultStops = await page.evaluate(async (audioUrl) => {
    const context = new OfflineAudioContext(1, 96_000, 48_000);
    window.AudioContext = function () {
      return context;
    };
    const stops = [];
    const createOscillator = context.createOscillator.bind(context);
    context.createOscillator = () => {
      const oscillator = createOscillator();
      const stop = oscillator.stop.bind(oscillator);
      oscillator.stop = (when) => {
        stops.push(when);
        stop(when);
      };
      return oscillator;
    };
    const { pianoTone } = await import(audioUrl);
    pianoTone(261.63);
    await context.startRendering();
    return stops;
  }, audioUrl);
  assert.deepEqual(
    defaultStops,
    [1.5, 1.5, 1.5],
    "Other piano callers retain their default duration",
  );
  const verdict = { passed: true, nativeAudio: "OfflineAudioContext", results, defaultStops };
  mkdirSync("/workspace/screenshots", { recursive: true });
  writeFileSync(
    "/workspace/screenshots/shared-phrase-audio.json",
    JSON.stringify(verdict, null, 2),
  );
  console.log(JSON.stringify(verdict, null, 2));
} finally {
  await browser.close();
}
