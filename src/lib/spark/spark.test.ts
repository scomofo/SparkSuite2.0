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
import { classifyStrumDirection, isTonalStrumSpectrum, isHarmonicStrumSpectrum, rmsLevel, StrumOnsetDetector } from "./strum-detection.ts";
import { AcousticAttackDetector, acousticInputModeFor, analyzeChordSpectrum, assessChordPitches, classifyDrumSpectrum, frequencyToMidi, PercussionOnsetDetector, PitchOnsetDetector, PitchTracker } from "./acoustic-input.ts";
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

  function chordSpectrum(size = fftSize) {
    const spectrum = new Float32Array(size / 2).fill(-100);
    for (const hz of [196, 261.63, 329.63, 392, 440, 523.25, 659.25, 784, 880, 1046.5]) {
      const center = Math.round((hz * size) / sampleRate);
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
    assert.equal(event.onsetMs, 100 - (512 / sampleRate) * 500);
    assert.ok(event.level > 0.008);
  });

  it("finds a real attack in the newest chunk even when the long-window RMS is quiet", () => {
    const detector = new StrumOnsetDetector();
    const longSize = 8192;
    const samples = new Float32Array(longSize);
    for (let i = longSize - 512; i < longSize; i++) {
      const t = (2 * Math.PI * i) / sampleRate;
      samples[i] =
        0.02 * Math.sin(196 * t) +
        0.02 * Math.sin(261.63 * t) +
        0.02 * Math.sin(329.63 * t) +
        0.02 * Math.sin(440 * t);
    }
    assert.ok(rmsLevel(samples) < 0.008, "the rolling-window RMS is below the old attack threshold");
    const spectrum = chordSpectrum(longSize);
    assert.equal(detector.process(samples, spectrum, sampleRate, longSize, 100), null);
    const event = detector.process(samples, spectrum, sampleRate, longSize, 132);
    assert.ok(event, "the short, fresh chord attack should be recognized");
    assert.equal(event.onsetMs, 100 - (512 / sampleRate) * 500);
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
    hasChordCues = false,
    hasSingleNoteCues = false,
  ) => acousticInputModeFor({
    instrument,
    surface,
    pluckDrill,
    hasPattern,
    lessonId,
    hasChordCues,
    hasSingleNoteCues,
  });

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
    assert.equal(mode("piano", "keys", false, true, undefined, true), "strum");
    assert.equal(mode("piano", "keys", false, true, undefined, false, true), "pitch");
    assert.equal(mode("ukulele", "strings", false, true, undefined, true), "strum");
    assert.equal(mode("guitar", "strings", false, true, undefined, false, true), "pitch");
    assert.equal(mode("banjo", "strings", false, true, undefined, true), "strum");
    assert.equal(mode("drums", "pads"), "percussion");
    assert.equal(mode("vocals", "voice"), "pitch");
  });
});

describe("generic acoustic attack detection", () => {
  it("detects a fresh short attack without requiring a drum-like spectrum", () => {
    const detector = new AcousticAttackDetector();
    const sampleRate = 48000;
    const samples = new Float32Array(8192);
    for (let i = samples.length - 512; i < samples.length; i++) {
      samples[i] = 0.08 * Math.sin((2 * Math.PI * 740 * i) / sampleRate);
    }
    const onset = detector.process(samples, sampleRate, 100);
    assert.ok(onset);
    assert.equal(onset.onsetMs, 100 - (512 / sampleRate) * 500);
    assert.ok(onset.level > 0.003);
    assert.equal(detector.process(samples, sampleRate, 150), null, "cooldown suppresses the same transient");
    detector.reset();
    assert.equal(detector.process(new Float32Array(8192), sampleRate, 300), null);
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

  it("classifies kick, snare, hi-hat, and tom spectra and rejects silence", () => {
    function attackAt(peaks: number[], broadbandHat = false) {
      const samples = new Float32Array(fftSize);
      for (let i = fftSize - 512; i < fftSize; i++) {
        samples[i] = 0.2 * Math.sin((2 * Math.PI * (peaks[0] ?? 80) * i) / sampleRate);
      }
      const spectrum = new Float32Array(fftSize / 2).fill(-110);
      if (broadbandHat) {
        for (let i = Math.ceil(500 * fftSize / sampleRate); i < Math.floor(12000 * fftSize / sampleRate); i++) {
          spectrum[i] = -43 - (i % 5);
        }
      }
      for (const peakHz of peaks) {
        const index = Math.round((peakHz * fftSize) / sampleRate);
        if (index < 2 || index >= spectrum.length - 1) continue;
        spectrum[index] = -18;
        spectrum[index - 1] = -29;
        spectrum[index + 1] = -29;
      }
      return { samples, spectrum };
    }

    const kick = attackAt([80, 160]);
    const kickEvent = new PercussionOnsetDetector().process(kick.samples, kick.spectrum, sampleRate, fftSize, 100);
    assert.ok(kickEvent);
    assert.equal(kickEvent.drumClass, "kick");
    assert.equal(kickEvent.padIndex, 0);

    const snare = attackAt([1800, 2520, 3240]);
    const snareEvent = new PercussionOnsetDetector().process(snare.samples, snare.spectrum, sampleRate, fftSize, 100);
    assert.ok(snareEvent);
    assert.equal(snareEvent.drumClass, "snare");
    assert.equal(snareEvent.padIndex, 1);

    const hat = attackAt([5500, 6800, 8200], true);
    const hatClass = classifyDrumSpectrum(hat.spectrum, sampleRate, fftSize);
    assert.equal(hatClass.drumClass, "hat");
    assert.equal(hatClass.padIndex, 2);

    const tom = attackAt([160, 240, 320, 420]);
    const tomClass = classifyDrumSpectrum(tom.spectrum, sampleRate, fftSize);
    assert.equal(tomClass.drumClass, "tom");
    assert.equal(tomClass.padIndex, 3);

    assert.equal(classifyDrumSpectrum(new Float32Array(fftSize / 2).fill(-110), sampleRate, fftSize).drumClass, "unknown");
  });
});

describe("strum direction assessment", () => {
  it("classifies clear low-first and high-first attacks, but leaves close timing uncertain", () => {
    assert.equal(classifyStrumDirection(100, 140).direction, "down");
    assert.equal(classifyStrumDirection(140, 100).direction, "up");
    assert.equal(classifyStrumDirection(100, 112).direction, "unknown");
    assert.equal(classifyStrumDirection(null, 120).direction, "unknown");
  });
});

describe("polyphonic chord assessment", () => {
  const sampleRate = 48000;
  const fftSize = 8192;
  const em = [40, 47, 52, 55, 59, 64];

  function spectrumFor(notes: number[]) {
    const spectrum = new Float32Array(fftSize / 2).fill(-110);
    for (const midi of notes) {
      const fundamental = 440 * Math.pow(2, (midi - 69) / 12);
      for (let harmonic = 1; harmonic <= 5; harmonic++) {
        const hz = fundamental * harmonic;
        const bin = Math.round(hz * fftSize / sampleRate);
        if (bin < 2 || bin >= spectrum.length - 1) continue;
        const db = -18 - 12 * Math.log2(harmonic);
        spectrum[bin] = Math.max(spectrum[bin], db);
        spectrum[bin - 1] = Math.max(spectrum[bin - 1], db - 9);
        spectrum[bin + 1] = Math.max(spectrum[bin + 1], db - 9);
      }
    }
    return spectrum;
  }

  it("recognizes a multi-note E-minor chord from its independent fundamentals", () => {
    const analysis = analyzeChordSpectrum(spectrumFor(em), sampleRate, fftSize);
    assert.ok(analysis.midiNotes.length >= 5, `found pitches: ${analysis.midiNotes.join(",")}`);
    assert.equal(assessChordPitches(analysis, em).status, "match");
  });

  it("does not mistake harmonics from one low string for a complete chord", () => {
    const analysis = analyzeChordSpectrum(spectrumFor([40]), sampleRate, fftSize);
    assert.deepEqual(analysis.midiNotes, [40]);
    assert.equal(assessChordPitches(analysis, em).status, "uncertain");
  });

  it("can verify a clear two-note chord without inventing extra notes", () => {
    const analysis = analyzeChordSpectrum(spectrumFor([40, 47]), sampleRate, fftSize);
    assert.ok(analysis.midiNotes.includes(40));
    assert.ok(analysis.midiNotes.includes(47));
    assert.equal(assessChordPitches(analysis, [40, 47]).status, "match");
  });

  it("requires every expected chord tone and rejects a confident partial voicing", () => {
    const wrong = analyzeChordSpectrum(spectrumFor([42, 49, 54, 57, 61, 66]), sampleRate, fftSize);
    assert.equal(assessChordPitches(wrong, em).status, "mismatch");

    const fiveOfSix = analyzeChordSpectrum(spectrumFor([40, 47, 52, 59, 64]), sampleRate, fftSize);
    const partial = assessChordPitches(fiveOfSix, em);
    assert.equal(partial.status, "mismatch");
    assert.deepEqual(partial.missingMidi, [55]);

    const weak = analyzeChordSpectrum(new Float32Array(fftSize / 2).fill(-110), sampleRate, fftSize);
    assert.equal(assessChordPitches(weak, em).status, "uncertain");
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
