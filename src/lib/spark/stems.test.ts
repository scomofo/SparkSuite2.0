import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STEM_IDS,
  classifyStemFiles,
  effectiveStemGain,
  emptyStemMix,
  formatStemTime,
  loadStemMix,
  parseStemMix,
  planSongTimeline,
  saveStemMix,
  serializeStemMix,
  songKeyFor,
  stemForFileName,
  stemPresetById,
  type StemId,
  type StemMixStorage,
} from "./stems.ts";

describe("stemForFileName", () => {
  it("matches the exact file names Demucs writes", () => {
    assert.equal(stemForFileName("vocals.wav"), "vocals");
    assert.equal(stemForFileName("drums.mp3"), "drums");
    assert.equal(stemForFileName("bass.ogg"), "bass");
    assert.equal(stemForFileName("guitar.wav"), "guitar");
    assert.equal(stemForFileName("piano.wav"), "piano");
    assert.equal(stemForFileName("other.wav"), "other");
  });

  it("matches inside paths and decorated names", () => {
    assert.equal(stemForFileName("htdemucs_6s/My Song/vocals.wav"), "vocals");
    assert.equal(stemForFileName("01 - Drums (take 2).wav"), "drums");
    assert.equal(stemForFileName("song_VOCALS.flac"), "vocals");
  });

  it("maps common aliases, including the two-stems accompaniment file", () => {
    assert.equal(stemForFileName("vox.mp3"), "vocals");
    assert.equal(stemForFileName("accompaniment.wav"), "other");
    assert.equal(stemForFileName("no_vocals.wav"), "other");
    assert.equal(stemForFileName("keys.wav"), "piano");
  });

  it("returns null for names it cannot place, so the tray decides", () => {
    assert.equal(stemForFileName("full_mix.wav"), null);
    assert.equal(stemForFileName("song.mp3"), null);
    assert.equal(stemForFileName("click-track.wav"), null);
  });
});

describe("classifyStemFiles", () => {
  it("reads a 6-stem Demucs folder: every file placed, song named", () => {
    const paths = STEM_IDS.map((id) => `htdemucs_6s/Blue in Green/${id}.wav`);
    const result = classifyStemFiles(paths);
    assert.equal(result.song, "Blue in Green");
    assert.deepEqual(
      result.files.map((f) => f.stem),
      [...STEM_IDS],
    );
  });

  it("reads a 4-stem Demucs folder: guitar and piano simply absent", () => {
    const result = classifyStemFiles([
      "htdemucs/Blue in Green/vocals.wav",
      "htdemucs/Blue in Green/drums.wav",
      "htdemucs/Blue in Green/bass.wav",
      "htdemucs/Blue in Green/other.wav",
    ]);
    assert.equal(result.song, "Blue in Green");
    assert.deepEqual(
      result.files.map((f) => f.stem),
      ["vocals", "drums", "bass", "other"],
    );
  });

  it("places loose files by name and leaves the unknown for the tray", () => {
    const result = classifyStemFiles(["vocals.mp3", "drums.mp3", "mystery-take.wav"]);
    assert.equal(result.song, null);
    assert.deepEqual(
      result.files.map((f) => f.stem),
      ["vocals", "drums", null],
    );
  });
});

describe("planSongTimeline — the no-shift invariant", () => {
  it("preserves leading silence exactly: length and first sound untouched", () => {
    // A drums stem that stays silent for the first 3 seconds at 44.1 kHz,
    // as decoded — preparation must not eat any of it.
    const plan = planSongTimeline([
      { stem: "drums", durationSec: 182.4, firstNonSilentSample: 132_300, sampleRate: 44_100 },
    ]);
    assert.equal(plan.durationSec, 182.4);
    assert.equal(plan.tracks[0].offsetSec, 0);
    assert.equal(plan.tracks[0].durationSec, 182.4);
    assert.equal(plan.tracks[0].firstNonSilentSample, 132_300);
    assert.equal(plan.tracks[0].firstSoundSec, 3);
  });

  it("never front-pads or shifts a shorter stem; the song is the longest stem", () => {
    const plan = planSongTimeline([
      { stem: "vocals", durationSec: 200, firstNonSilentSample: 0, sampleRate: 48_000 },
      { stem: "guitar", durationSec: 180, firstNonSilentSample: 96_000, sampleRate: 48_000 },
    ]);
    assert.equal(plan.durationSec, 200);
    const guitar = plan.tracks.find((t) => t.stem === "guitar")!;
    assert.equal(guitar.offsetSec, 0);
    assert.equal(guitar.durationSec, 180);
    assert.equal(guitar.firstNonSilentSample, 96_000);
    assert.equal(guitar.firstSoundSec, 2);
  });

  it("an all-silent stem keeps its full length and reports no early sound", () => {
    const plan = planSongTimeline([
      { stem: "other", durationSec: 60, firstNonSilentSample: 2_646_000, sampleRate: 44_100 },
    ]);
    assert.equal(plan.tracks[0].durationSec, 60);
    assert.equal(plan.tracks[0].firstNonSilentSample, 2_646_000);
  });

  it("empty input plans an empty song", () => {
    assert.deepEqual(planSongTimeline([]), { durationSec: 0, tracks: [] });
  });
});

describe("presets resolve to exactly the mix they promise", () => {
  const audible = (presetId: string, stem: StemId) => {
    const preset = stemPresetById(presetId)!;
    return effectiveStemGain(preset.mix, stem);
  };

  it("full mix: every stem at unity, master at unity", () => {
    const preset = stemPresetById("full")!;
    for (const id of STEM_IDS) assert.equal(effectiveStemGain(preset.mix, id), 1);
    assert.equal(preset.mix.master, 1);
  });

  it("each minus preset silences only its own stem", () => {
    for (const target of ["guitar", "bass", "drums", "vocals", "piano"] as StemId[]) {
      for (const id of STEM_IDS) {
        assert.equal(audible(`minus-${target}`, id), id === target ? 0 : 1, `minus-${target} vs ${id}`);
      }
    }
  });

  it("band only: vocals out, the whole band at unity", () => {
    for (const id of STEM_IDS) assert.equal(audible("band-only", id), id === "vocals" ? 0 : 1);
  });

  it("vocals only: a solo — vocals at unity, everything else silent", () => {
    for (const id of STEM_IDS) assert.equal(audible("vocals-only", id), id === "vocals" ? 1 : 0);
  });

  it("solo beats gain, mute beats solo", () => {
    const mix = emptyStemMix();
    mix.soloed.drums = true;
    mix.gains.vocals = 0.5;
    assert.equal(effectiveStemGain(mix, "drums"), 1);
    assert.equal(effectiveStemGain(mix, "vocals"), 0);
    mix.muted.drums = true;
    assert.equal(effectiveStemGain(mix, "drums"), 0);
  });
});

describe("custom-mix persistence", () => {
  function fakeStorage(): StemMixStorage & { map: Map<string, string> } {
    const map = new Map<string, string>();
    return {
      map,
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => {
        map.set(k, v);
      },
    };
  }

  it("song key is stable regardless of drop order", () => {
    const a = songKeyFor([
      { name: "vocals.wav", durationSec: 182.4 },
      { name: "drums.wav", durationSec: 182.4 },
    ]);
    const b = songKeyFor([
      { name: "drums.wav", durationSec: 182.4 },
      { name: "vocals.wav", durationSec: 182.4 },
    ]);
    assert.equal(a, b);
    assert.notEqual(a, songKeyFor([{ name: "vocals.wav", durationSec: 90 }]));
  });

  it("round-trips a custom mix through storage unchanged", () => {
    const storage = fakeStorage();
    const mix = emptyStemMix();
    mix.gains.guitar = 0.4;
    mix.muted.vocals = true;
    mix.soloed.drums = true;
    mix.master = 0.8;
    const key = songKeyFor([{ name: "vocals.wav", durationSec: 182.4 }]);
    saveStemMix(key, mix, storage);
    assert.deepEqual(loadStemMix(key, storage), mix);
  });

  it("serialize/parse round-trips and rejects foreign data", () => {
    const mix = emptyStemMix();
    mix.gains.bass = 0.25;
    assert.deepEqual(parseStemMix(serializeStemMix(mix)), mix);
    assert.equal(parseStemMix(null), null);
    assert.equal(parseStemMix("not json"), null);
    assert.equal(parseStemMix(JSON.stringify({ v: 2, mix })), null);
    assert.equal(parseStemMix(JSON.stringify({ hello: true })), null);
  });

  it("a missing key loads as no saved mix", () => {
    assert.equal(loadStemMix("sparksuite.stems.v1:nothing", fakeStorage()), null);
  });
});

describe("formatStemTime", () => {
  it("formats transport times", () => {
    assert.equal(formatStemTime(0), "0:00");
    assert.equal(formatStemTime(65.9), "1:05");
    assert.equal(formatStemTime(600), "10:00");
  });
});
