import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildTimeline,
  consumeHit,
  isPluckDrill,
  judgeHit,
  starsFor,
  summarizeItem,
  type NoteEvent,
} from "./practice.ts";
import { chordsFromCreatePick } from "./nafme.ts";
import {
  chordLabel,
  flatsForKey,
  listVoicings,
  parseNumeral,
  prefersFlats,
  QUALITIES,
  SHAPE_TEMPLATES,
} from "./theory.ts";
import { instrumentById, lessonsFor, withSurface, type InstrumentId } from "./instruments.ts";
import type { PlanItem } from "./types.ts";
import { defaultProgress, loadSuite, saveProgress } from "./storage.ts";
import { finalizeSession } from "./progress.ts";
import { localDayKey } from "../utils.ts";
import { closeSession, skipItem, startSession } from "./session.ts";
import { analyserSizeFor, nearestString, yinPitch, yinPitchFast } from "./tuner.ts";
import { isTonalStrumSpectrum, isHarmonicStrumSpectrum, StrumOnsetDetector } from "./strum-detection.ts";
import { acousticInputModeFor, frequencyToMidi, PercussionOnsetDetector, PitchOnsetDetector, PitchTracker } from "./acoustic-input.ts";
import type { DailyPlan } from "./types.ts";

function withMemoryStorage() {
  const store = new Map<string, string>();
  const g = globalThis as unknown as Record<string, unknown>;
  const prev = g.localStorage;
  g.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  return () => {
    if (prev === undefined) delete g.localStorage;
    else g.localStorage = prev;
  };
}

describe("practice scoring thresholds", () => {
  it("stars step at 0.4 / 0.7 / 0.9", () => {
    assert.equal(starsFor(0.95), 3);
    assert.equal(starsFor(0.7), 2);
    assert.equal(starsFor(0.4), 1);
    assert.equal(starsFor(0.39), 0);
  });

  it("empty item summarizes to zero, not NaN", () => {
    const r = summarizeItem(
      {
        id: "x",
        lessonId: "l",
        type: "song",
        title: "t",
        subtitle: "",
        durationSec: 1,
        chords: [],
        pattern: "D",
        bars: 1,
        bpm: 60,
      } as never,
      0,
      0,
    );
    assert.equal(r.accuracy, 0);
    assert.equal(r.stars, 0);
    assert.equal(r.xp, 0);
  });

  it("judgeHit respects perfect/good/ok windows", () => {
    assert.equal(judgeHit(10), "perfect");
    assert.equal(judgeHit(100), "good");
    assert.equal(judgeHit(200), "ok");
    assert.equal(judgeHit(500), "miss");
  });

  it("consumeHit matches nearest note inside the window only", () => {
    const notes: NoteEvent[] = [
      { t: 1, kind: "down", bar: 0, beat: 0 },
      { t: 2, kind: "down", bar: 0, beat: 1 },
    ];
    const hit = consumeHit(notes, 1.05, 230);
    assert.equal(hit.hit, true);
    const miss = consumeHit(notes, 5, 230);
    assert.equal(miss.hit, false);
  });
});

describe("create-pick parsing", () => {
  it("splits en-dash and hyphen forms", () => {
    assert.deepEqual(chordsFromCreatePick("C–G", ["C"]), ["C", "G"]);
    assert.deepEqual(chordsFromCreatePick("C-G", ["C"]), ["C", "G"]);
    assert.deepEqual(chordsFromCreatePick("C", ["G"]), ["C"]);
  });

  it("falls back for free-text picks", () => {
    assert.deepEqual(chordsFromCreatePick("Kick on one", ["K"]), ["K"]);
  });
});

describe("theory spelling", () => {
  it("prefers flats for flat keys, sharps for C", () => {
    assert.equal(prefersFlats(5, "major"), true);
    assert.equal(prefersFlats(0, "major"), false);
  });

  it("a key named with an accidental keeps that spelling", () => {
    assert.equal(flatsForKey("Eb", "minor"), true);
    assert.equal(flatsForKey("Bb", "minor"), true);
    assert.equal(flatsForKey("C#", "major"), false);
    assert.equal(flatsForKey("F#", "minor"), false);
    assert.equal(flatsForKey("D", "minor"), true);
    assert.equal(flatsForKey("A", "minor"), false);
  });

  it("Eb minor is spelled in flats, not A# minor", () => {
    const i = parseNumeral("i", 3, "minor", flatsForKey("Eb", "minor"));
    assert.equal(i.label, "Ebm");
  });

  it("voicing cards follow the root's spelling", () => {
    const [eb] = listVoicings(3, "maj", true);
    assert.ok(eb.name.startsWith("Eb"));
    assert.ok(eb.notes.every((n) => !n.includes("#")));
    assert.equal(chordLabel(3, "maj", true), "Eb");
  });

  it("every shape template spells the quality it is labelled with", () => {
    const openPcs = [4, 9, 2, 7, 11, 4];
    for (const t of SHAPE_TEMPLATES) {
      const q = QUALITIES.find((x) => x.id === t.quality);
      assert.ok(q, `unknown quality ${t.quality}`);
      const want = q.ivs.map((iv) => iv % 12);
      const ivs = new Set<number>();
      t.frets.forEach((f, i) => {
        if (f != null) ivs.add((openPcs[i] + f - t.openRootPc + 12) % 12);
      });
      const label = `${t.caged}-shape ${t.quality}`;
      for (const iv of ivs)
        assert.ok(
          want.includes(iv),
          `${label} sounds interval ${iv} outside ${q.formula.join(" ")}`,
        );
      assert.ok(ivs.has(0), `${label} has no root`);
      assert.ok(ivs.has(want[1]), `${label} has no ${q.formula[1]}`);
    }
  });
});

describe("listen and make passes are playable with the generic control", () => {
  const ids: InstrumentId[] = [
    "guitar",
    "piano",
    "ukulele",
    "bass",
    "drums",
    "vocals",
    "mandolin",
    "banjo",
    "violin",
    "lapsteel",
  ];
  const items = ids.flatMap((id) =>
    lessonsFor(id)
      .filter((l) => l.process === "respond" || l.process === "create")
      .map((l) =>
        withSurface(
          {
            id: l.id,
            type: l.type,
            title: l.title,
            subtitle: "",
            durationSec: 1,
            lessonId: l.id,
            chords: l.chords,
            pattern: l.pattern,
            bars: l.bars,
            bpm: l.bpm,
            process: l.process,
          } satisfies PlanItem,
          instrumentById(id),
        ),
      ),
  );

  it("covers every instrument", () => {
    assert.ok(items.length >= 10);
  });

  it("a respond/create item is never a pluck drill", () => {
    for (const item of items) assert.equal(isPluckDrill(item), false, item.lessonId);
  });

  it("their timelines never demand a specific string, so a plain strum on the beat is a hit", () => {
    for (const item of items) {
      if (item.surface === "pads") continue;
      const notes = buildTimeline(item);
      assert.ok(notes.length > 0, item.lessonId);
      for (const n of notes)
        assert.equal(n.string, undefined, `${item.lessonId} expects string ${n.string}`);
      const res = consumeHit(notes, notes[0].t, 230);
      assert.equal(res.hit, true, item.lessonId);
    }
  });

  it("warmup drills still expect a specific string", () => {
    const warm = withSurface(
      {
        id: "w",
        type: "warmup",
        title: "",
        subtitle: "",
        durationSec: 1,
        lessonId: "lesson_guitar_open_strings_01",
        chords: [],
        pattern: "D",
        bars: 2,
        bpm: 70,
      } satisfies PlanItem,
      instrumentById("guitar"),
    );
    assert.equal(isPluckDrill(warm), true);
    assert.ok(buildTimeline(warm).every((n) => n.string !== undefined));
  });
});

describe("empty sessions do not complete the day", () => {
  it("finalizeSession with no items leaves progress untouched", () => {
    const before = defaultProgress();
    const next = finalizeSession(
      before,
      { date: "2026-01-01", accuracy: 0, stars: 0, xp: 0, items: [] },
      "guitar",
    );
    assert.deepEqual(next.dailyComplete, {});
    assert.equal(next.streak, 0);
    assert.equal(next.history.length, 0);
  });

  it("skipping every item yields no dailyComplete", () => {
    const plan: DailyPlan = {
      date: "2026-01-01",
      minutes: 10,
      promise: "p",
      items: [
        {
          id: "a",
          type: "song",
          title: "a",
          subtitle: "",
          durationSec: 10,
          lessonId: "lesson_guitar_em_chord_01",
          chords: ["Em"],
          pattern: "D",
          bars: 4,
          bpm: 70,
        },
      ],
    };
    let s = startSession(defaultProgress(), plan);
    s = skipItem(s);
    const { progress, result } = closeSession(defaultProgress(), s, "guitar");
    assert.equal(result.items.length, 0);
    assert.deepEqual(progress.dailyComplete, {});
  });
});

describe("dailyComplete pruning", () => {
  it("finalizeSession drops dailyComplete entries older than 60 days", () => {
    const restore = withMemoryStorage();
    try {
      const day = 86_400_000;
      const oldKey = localDayKey(new Date(Date.now() - 90 * day));
      const recentKey = localDayKey(new Date(Date.now() - 10 * day));
      const todayKey = localDayKey();
      const before = {
        ...defaultProgress(),
        dailyComplete: { [oldKey]: true, [recentKey]: true },
      };
      const next = finalizeSession(
        before,
        {
          date: todayKey,
          accuracy: 1,
          stars: 3,
          xp: 10,
          items: [
            { itemId: "i", lessonId: "l", hits: 4, misses: 0, accuracy: 1, stars: 3, xp: 10 },
          ],
        },
        "guitar",
      );
      assert.equal(next.dailyComplete[oldKey], undefined);
      assert.equal(next.dailyComplete[recentKey], true);
      assert.equal(next.dailyComplete[todayKey], true);
    } finally {
      restore();
    }
  });
});

describe("multi-instrument slot save (review P1)", () => {
  it("saveProgress(state, instrument) honors the explicit slot, not suite.active", () => {
    const restore = withMemoryStorage();
    try {
      const guitar = { ...defaultProgress(), xp: 10 };
      const piano = { ...defaultProgress(), xp: 99 };
      saveProgress(guitar, "guitar");
      const suite = saveProgress(piano, "piano");
      assert.equal(suite.apps.guitar?.xp, 10);
      assert.equal(suite.apps.piano?.xp, 99);
      assert.equal(loadSuite().apps.piano?.xp, 99);
    } finally {
      restore();
    }
  });

  it("finalizeSession persists to the passed instrument slot", () => {
    const restore = withMemoryStorage();
    try {
      saveProgress(defaultProgress(), "guitar");
      const next = finalizeSession(
        defaultProgress(),
        {
          date: "2026-02-02",
          accuracy: 1,
          stars: 3,
          xp: 50,
          items: [
            { itemId: "i", lessonId: "l", hits: 4, misses: 0, accuracy: 1, stars: 3, xp: 50 },
          ],
        },
        "piano",
      );
      assert.equal(next.xp, 50);
      assert.equal(loadSuite().apps.piano?.xp, 50);
    } finally {
      restore();
    }
  });
});

describe("tuner guards (review P4)", () => {
  it("yinPitch rejects short/silent/invalid input", () => {
    assert.equal(yinPitch(new Float32Array(16), 44100), -1);
    assert.equal(yinPitch(new Float32Array(2048), 44100), -1);
    assert.equal(yinPitch(new Float32Array(2048).fill(0.0000001), 44100), -1);
    assert.equal(yinPitch(new Float32Array(2048).fill(0.5), Number.NaN), -1);
  });

  it("nearestString rejects non-finite freq", () => {
    const r = nearestString(0);
    assert.equal(r.index, -1);
    assert.equal(r.name, "-");
  });

  it("yinPitchFast handles short buffers via the full path", () => {
    const r = yinPitchFast(new Float32Array(128).fill(0.5), 44100);
    assert.equal(typeof r, "number");
  });
});


describe("acoustic strum detection", () => {
  const sampleRate = 48000;
  const fftSize = 2048;

  function chordFrame() {
    return Float32Array.from({ length: fftSize }, (_, i) => {
      const t = (2 * Math.PI * i) / sampleRate;
      return (
        0.06 * Math.sin(196 * t) +
        0.05 * Math.sin(261.63 * t) +
        0.04 * Math.sin(329.63 * t) +
        0.03 * Math.sin(440 * t)
      );
    });
  }

  function chordSpectrum() {
    const spectrum = new Float32Array(fftSize / 2).fill(-100);
    for (const hz of [196, 261.63, 329.63, 392, 440, 523.25, 659.25, 784, 880, 1046.5]) {
      const center = Math.round((hz * fftSize) / sampleRate);
      for (let offset = -1; offset <= 1; offset++) {
        const index = center + offset;
        if (index >= 0 && index < spectrum.length) {
          spectrum[index] = Math.max(spectrum[index], offset === 0 ? -24 : -36);
        }
      }
    }
    return spectrum;
  }

  it("confirms a sustained harmonic strum and preserves its original attack time", () => {
    const detector = new StrumOnsetDetector();
    const frame = chordFrame();
    const spectrum = chordSpectrum();
    assert.equal(isTonalStrumSpectrum(spectrum, sampleRate, fftSize), true);
    assert.equal(isHarmonicStrumSpectrum(spectrum, sampleRate, fftSize), true);
    assert.equal(detector.process(frame, spectrum, sampleRate, fftSize, 100), null);
    const event = detector.process(frame, spectrum, sampleRate, fftSize, 132);
    assert.ok(event);
    assert.equal(event.onsetMs, 100);
    assert.ok(event.level > 0.008);
  });

  it("rejects a short broadband click without sustained harmonic energy", () => {
    const detector = new StrumOnsetDetector();
    const flatSpectrum = new Float32Array(fftSize / 2).fill(-30);
    const clickSpectrum = new Float32Array(fftSize / 2).fill(-100);
    clickSpectrum[Math.round((880 * fftSize) / sampleRate)] = -25;
    const attack = new Float32Array(fftSize).fill(0.1);
    const quiet = new Float32Array(fftSize).fill(0.001);
    assert.equal(isTonalStrumSpectrum(flatSpectrum, sampleRate, fftSize), false);
    assert.equal(isHarmonicStrumSpectrum(clickSpectrum, sampleRate, fftSize), false);
    assert.equal(detector.process(attack, flatSpectrum, sampleRate, fftSize, 100), null);
    assert.equal(detector.process(quiet, flatSpectrum, sampleRate, fftSize, 140), null);
    assert.equal(detector.process(quiet, flatSpectrum, sampleRate, fftSize, 220), null);
  });

  it("ignores invalid timestamps and empty frames", () => {
    const detector = new StrumOnsetDetector();
    const frame = new Float32Array(fftSize);
    const spectrum = new Float32Array(fftSize / 2).fill(-100);
    assert.equal(detector.process(frame, spectrum, sampleRate, fftSize, Number.NaN), null);
    assert.equal(detector.process(new Float32Array(0), spectrum, sampleRate, fftSize, 100), null);
  });
});


describe("instrument microphone routing", () => {
  const mode = (
    instrument: string,
    surface: "strings" | "keys" | "pads" | "voice",
    pluckDrill = false,
    hasPattern = false,
    lessonId?: string,
  ) => acousticInputModeFor({ instrument, surface, pluckDrill, hasPattern, lessonId });

  it("routes each instrument family to a suitable acoustic detector", () => {
    assert.equal(mode("guitar", "strings"), "strum");
    assert.equal(mode("ukulele", "strings"), "strum");
    assert.equal(mode("ukulele", "strings", true), "pitch");
    assert.equal(mode("bass", "strings"), "pitch");
    assert.equal(mode("mandolin", "strings", false, true), "pitch");
    assert.equal(mode("mandolin", "strings", false, true, "lesson_mandolin_chop_01"), "attack");
    assert.equal(mode("banjo", "strings", false, true), "pitch");
    assert.equal(mode("violin", "strings"), "pitch");
    assert.equal(mode("lapsteel", "strings", false, true), "pitch");
    assert.equal(mode("piano", "keys", true), "pitch");
    assert.equal(mode("piano", "keys"), "strum");
    assert.equal(mode("drums", "pads"), "percussion");
    assert.equal(mode("vocals", "voice"), "pitch");
  });
});

describe("general acoustic instrument input", () => {
  const sampleRate = 48000;
  const fftSize = 4096;

  function tone(hz: number, amplitude = 0.2) {
    return Float32Array.from(
      { length: fftSize },
      (_, i) => amplitude * Math.sin((2 * Math.PI * hz * i) / sampleRate),
    );
  }

  it("converts detected frequencies to equal-tempered MIDI notes", () => {
    assert.equal(frequencyToMidi(261.63), 60);
    assert.equal(frequencyToMidi(440), 69);
    assert.equal(frequencyToMidi(41.2), 28);
    assert.equal(frequencyToMidi(0), -1);
  });

  it("detects a plucked pitch once, avoids repeats while sustained, and follows a new note", () => {
    const detector = new PitchOnsetDetector();
    const first = detector.process(tone(220), sampleRate, 100, 2, 35, 1200);
    assert.ok(first);
    assert.equal(first.midi, 57);
    assert.ok(first.onsetMs < 100);
    assert.equal(detector.process(tone(220), sampleRate, 260, 2, 35, 1200), null);

    const next = detector.process(tone(329.63), sampleRate, 420, 2, 35, 1200);
    assert.ok(next);
    assert.equal(next.midi, 64);
  });

  it("rejects silence for pitched input", () => {
    const detector = new PitchOnsetDetector();
    assert.equal(detector.process(new Float32Array(fftSize), sampleRate, 100, 2), null);
  });

  it("tracks sustained pitches repeatedly for voice and held-note lessons", () => {
    const tracker = new PitchTracker();
    const heldC = tone(261.63);
    assert.equal(tracker.process(heldC, sampleRate, 100, 2, 70, 900)?.midi, 60);
    assert.equal(tracker.process(heldC, sampleRate, 160, 2, 70, 900)?.midi, 60);
  });

  it("classifies low kick-like and bright snare-like acoustic attacks", () => {
    function attackAt(hz: number) {
      const samples = new Float32Array(fftSize);
      for (let i = fftSize - 512; i < fftSize; i++) {
        samples[i] = 0.2 * Math.sin((2 * Math.PI * hz * i) / sampleRate);
      }
      const spectrum = new Float32Array(fftSize / 2).fill(-100);
      for (const peakHz of (hz < 200 ? [hz, hz * 2] : [hz, hz * 1.4, hz * 1.8])) {
        const index = Math.round((peakHz * fftSize) / sampleRate);
        if (index < spectrum.length) spectrum[index] = -18;
      }
      return { samples, spectrum };
    }

    const kickDetector = new PercussionOnsetDetector();
    const kick = attackAt(80);
    const kickEvent = kickDetector.process(kick.samples, kick.spectrum, sampleRate, fftSize, 100);
    assert.ok(kickEvent);
    assert.equal(kickEvent.padIndex, 0);

    const snareDetector = new PercussionOnsetDetector();
    const snare = attackAt(1800);
    const snareEvent = snareDetector.process(snare.samples, snare.spectrum, sampleRate, fftSize, 100);
    assert.ok(snareEvent);
    assert.equal(snareEvent.padIndex, 1);
  });
});

describe("bass tuner range", () => {
  function tone(hz: number, sr: number, n: number) {
    const buf = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      buf[i] =
        0.5 * Math.sin((2 * Math.PI * hz * i) / sr) +
        0.2 * Math.sin((2 * Math.PI * 2 * hz * i) / sr);
    }
    return buf;
  }
  const cents = (a: number, b: number) => Math.abs(1200 * Math.log2(a / b));

  it("a 2048-sample window cannot resolve low E at 48 kHz (the bug)", () => {
    assert.equal(yinPitchFast(tone(41.2, 48000, 2048), 48000), -1);
  });

  it("sizes the analyser so the lowest reference is in range", () => {
    assert.equal(analyserSizeFor(82.41), 2048);
    assert.equal(analyserSizeFor(41.2), 4096);
    assert.equal(analyserSizeFor(20), 8192);
  });

  it("the sized window hears every bass string within 5 cents", () => {
    const size = analyserSizeFor(41.2);
    for (const sr of [44100, 48000]) {
      for (const hz of [41.2, 55, 73.42, 98]) {
        const got = yinPitchFast(tone(hz, sr, size), sr, 0.12, size >= 8192 ? 4 : 2);
        assert.ok(got > 0, `${hz} Hz at ${sr}: no pitch`);
        assert.ok(cents(got, hz) < 5, `${hz} Hz at ${sr}: got ${got.toFixed(2)}`);
      }
    }
  });

  it("guitar keeps the cheap path and still hears low E", () => {
    const got = yinPitchFast(tone(82.41, 48000, 2048), 48000);
    assert.ok(cents(got, 82.41) < 5);
  });
});
