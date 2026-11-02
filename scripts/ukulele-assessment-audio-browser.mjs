// Exercise the real browser FFT, including off-bin peaks and rolled attacks.
// No microphone recording or manually manufactured spectrum is used here.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import ts from "typescript";
import { instrumentById, UKE_CHORDS } from "../src/lib/spark/instruments.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function moduleUrl(file) {
  let source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  source = source.replace(
    /from "(\.[^"]+)"/g,
    (_, path) => `from "${moduleUrl(resolve(dirname(file), path))}"`,
  );
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}
const acousticUrl = moduleUrl(resolve(root, "src/lib/spark/acoustic-input.ts"));
const strumUrl = moduleUrl(resolve(root, "src/lib/spark/strum-detection.ts"));
const openMidi = instrumentById("ukulele").openFreq.map((hz) =>
  Math.round(69 + 12 * Math.log2(hz / 440)),
);
const chords = Object.fromEntries(
  Object.entries(UKE_CHORDS).map(([id, shape]) => [
    id,
    shape.frets.flatMap((fret, index) => (fret === null ? [] : [openMidi[index] + fret])),
  ]),
);
const cases = [];
for (const sampleRate of [44100, 48000]) {
  for (const [name, expected] of Object.entries(chords)) {
    for (const quiet of [false, true]) {
      cases.push({ name, expected, played: expected, sampleRate, quiet, status: "match" });
    }
  }
}
cases.push(
  {
    name: "wrong adjacent fret",
    expected: chords.C,
    played: [67, 60, 65, 72],
    sampleRate: 48000,
    status: "mismatch",
  },
  {
    name: "wrong chord",
    expected: chords.C,
    played: chords.Am,
    sampleRate: 48000,
    status: "mismatch",
  },
  {
    name: "all strings one fret high",
    expected: chords.C,
    played: chords.C.map((midi) => midi + 1),
    sampleRate: 48000,
    status: "mismatch",
  },
  {
    name: "one string only",
    expected: chords.C,
    played: [60],
    sampleRate: 48000,
    status: "uncertain",
  },
  {
    name: "masked chord tone",
    expected: chords.Am,
    played: [60, 64],
    sampleRate: 48000,
    status: "uncertain",
  },
  { name: "silence", expected: chords.C, played: [], sampleRate: 48000, expectedEvents: 0 },
  {
    name: "metronome tone",
    expected: chords.C,
    played: [81],
    sampleRate: 48000,
    harmonics: 1,
    expectedEvents: 0,
  },
  {
    name: "broadband noise",
    expected: chords.C,
    played: [],
    sampleRate: 48000,
    noise: true,
    expectedEvents: 0,
  },
);

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const results = await page.evaluate(
    async ({ acousticUrl, strumUrl, cases }) => {
      const { analyzeChordSpectrum, assessChordPitches } = await import(acousticUrl);
      const { StrumOnsetDetector, UKULELE_STRUM_OPTIONS } = await import(strumUrl);
      const results = [];
      for (const test of cases) {
        const { sampleRate, played, expected, quiet } = test;
        const context = new OfflineAudioContext(1, sampleRate, sampleRate);
        const analyser = context.createAnalyser();
        analyser.fftSize = 8192;
        analyser.smoothingTimeConstant = 0.2;
        analyser.connect(context.destination);
        if (test.noise) {
          const buffer = context.createBuffer(1, sampleRate, sampleRate);
          const samples = buffer.getChannelData(0);
          let seed = 17;
          for (let i = Math.ceil(sampleRate * 0.1); i < sampleRate * 0.5; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            samples[i] = (seed / 2 ** 31 - 1) * 0.03;
          }
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.connect(analyser);
          source.start();
        }
        played.forEach((midi, index) => {
          const start = 0.1 + index * 0.012;
          const amplitude = quiet ? [0.005, 0.003, 0.004, 0.006][index] : 0.02;
          for (let harmonic = 1; harmonic <= (test.harmonics ?? 5); harmonic++) {
            const oscillator = context.createOscillator();
            oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12) * harmonic;
            const gain = context.createGain();
            gain.gain.setValueAtTime(amplitude / harmonic ** 1.7, start);
            gain.gain.exponentialRampToValueAtTime(
              (amplitude * 0.05) / harmonic ** 1.7,
              start + 0.4,
            );
            oscillator.connect(gain).connect(analyser);
            oscillator.start(start);
            oscillator.stop(start + 0.5);
          }
        });
        const detector = new StrumOnsetDetector(UKULELE_STRUM_OPTIONS);
        const events = [];
        const suspensions = [];
        for (let at = 0.08; at < 0.43; at += 0.016) {
          const time = at;
          suspensions.push(
            context.suspend(time).then(() => {
              const spectrum = new Float32Array(analyser.frequencyBinCount);
              const samples = new Float32Array(analyser.fftSize);
              analyser.getFloatFrequencyData(spectrum);
              analyser.getFloatTimeDomainData(samples);
              const onset = detector.process(
                samples,
                spectrum,
                sampleRate,
                analyser.fftSize,
                time * 1000,
              );
              if (onset) {
                const analysis = analyzeChordSpectrum(spectrum, sampleRate, analyser.fftSize);
                events.push({
                  onsetMs: onset.onsetMs,
                  deliveredMs: time * 1000,
                  detected: analysis.midiNotes,
                  status: assessChordPitches(analysis, expected).status,
                });
              }
              return context.resume();
            }),
          );
        }
        await context.startRendering();
        await Promise.all(suspensions);
        results.push({
          name: test.name,
          sampleRate,
          quiet: !!quiet,
          expectedStatus: test.status,
          expectedEvents: test.expectedEvents ?? 1,
          events,
        });
      }
      return results;
    },
    { acousticUrl, strumUrl, cases },
  );
  const failures = results.filter(
    (result) =>
      result.events.length !== result.expectedEvents ||
      (result.expectedEvents > 0 && result.events[0].status !== result.expectedStatus),
  );
  assert.deepEqual(failures, [], JSON.stringify(failures));
  for (const result of results) {
    assert.equal(
      result.events.length,
      result.expectedEvents,
      `${JSON.stringify(result)}: only strums create attacks`,
    );
    if (result.expectedEvents === 0) continue;
    const event = result.events[0];
    assert.equal(event.status, result.expectedStatus, JSON.stringify(result));
    assert.ok(
      Math.abs(event.onsetMs - 100) < 25,
      "Rhythm uses the original attack, not the settled spectrum time",
    );
    assert.ok(event.deliveredMs - event.onsetMs >= 160, "The chord has time to fill the FFT");
  }
  assert.deepEqual(errors, []);
  const verdict = { passed: true, engine: "OfflineAudioContext + native AnalyserNode", results };
  mkdirSync("/workspace/screenshots", { recursive: true });
  writeFileSync(
    "/workspace/screenshots/ukulele-assessment-audio.json",
    JSON.stringify(verdict, null, 2),
  );
  console.log(
    JSON.stringify({
      passed: true,
      cases: results.length,
      checks:
        "six voicings, two sample rates, quiet uneven strings, wrong frets, wrong chords, masking, original rhythm timing",
    }),
  );
} finally {
  await browser.close();
}
