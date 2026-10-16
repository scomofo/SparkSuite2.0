/**
 * Stem Lab — WebAudio engine.
 *
 * The timeline invariant from stems.ts is enforced here by construction:
 * a decoded buffer is stored and played exactly as decoded. There is no
 * trim, no alignment, no per-stem offset anywhere in this file — every
 * source starts at the same context time with the same song offset, so
 * sample 0 of every stem is song time 0 and stems cannot drift.
 */
import { unlockAudio } from "./audio.ts";
import {
  effectiveStemGain,
  planSongTimeline,
  type SongTimeline,
  type StemId,
  type StemMix,
  type StemTrackInput,
} from "./stems.ts";

export type LoadedStem = {
  stem: StemId;
  fileName: string;
  durationSec: number;
};

const SILENCE_EPSILON = 1e-4;

/** Index of the first sample above silence across all channels. */
export function firstNonSilentSample(buffer: AudioBuffer): number {
  let first = buffer.length;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < first; i++) {
      if (Math.abs(data[i]) > SILENCE_EPSILON) {
        first = i;
        break;
      }
    }
  }
  return first;
}

export class StemEngine {
  /** Called when playback reaches the end of the song (not on loop wraps). */
  onEnded: (() => void) | null = null;

  private ctx: AudioContext | null = null;
  private masterNode: GainNode | null = null;
  private gainNodes = new Map<StemId, GainNode>();
  private buffers = new Map<StemId, AudioBuffer>();
  private fileNames = new Map<StemId, string>();
  private sources: AudioBufferSourceNode[] = [];
  private startedAtCtx = 0;
  private offsetSec = 0;
  private playing = false;
  private loop: { a: number; b: number } | null = null;
  private ticker: number | null = null;
  private mix: StemMix | null = null;

  timeline: SongTimeline | null = null;

  private ensureCtx(): AudioContext | null {
    const ctx = unlockAudio();
    if (!ctx) return null;
    if (this.ctx !== ctx) {
      this.ctx = ctx;
      this.masterNode = ctx.createGain();
      this.masterNode.connect(ctx.destination);
      this.gainNodes.clear();
      for (const stem of this.buffers.keys()) this.gainNodes.set(stem, this.makeGainNode(stem));
      if (this.mix) this.applyMix(this.mix);
    }
    return ctx;
  }

  private makeGainNode(stem: StemId): GainNode {
    const node = this.ctx!.createGain();
    node.connect(this.masterNode!);
    if (this.mix) node.gain.value = effectiveStemGain(this.mix, stem);
    return node;
  }

  /** Decode and load one stem file, exactly as decoded — never trimmed. */
  async addStem(stem: StemId, file: File): Promise<LoadedStem> {
    const ctx = this.ensureCtx();
    if (!ctx) throw new Error("Audio is unavailable in this browser.");
    const raw = await file.arrayBuffer();
    const buffer = await ctx.decodeAudioData(raw);
    const wasPlaying = this.playing;
    const pos = this.position();
    this.stopSources();
    this.buffers.set(stem, buffer);
    this.fileNames.set(stem, file.name);
    if (!this.gainNodes.has(stem)) this.gainNodes.set(stem, this.makeGainNode(stem));
    this.rebuildTimeline();
    if (wasPlaying) this.startAt(pos);
    return { stem, fileName: file.name, durationSec: buffer.duration };
  }

  removeStem(stem: StemId) {
    const wasPlaying = this.playing;
    const pos = this.position();
    this.stopSources();
    this.buffers.delete(stem);
    this.fileNames.delete(stem);
    const node = this.gainNodes.get(stem);
    if (node) {
      node.disconnect();
      this.gainNodes.delete(stem);
    }
    this.rebuildTimeline();
    if (wasPlaying && this.buffers.size) this.startAt(pos);
    if (!this.buffers.size) {
      this.playing = false;
      this.offsetSec = 0;
    }
  }

  clear() {
    this.stopSources();
    this.playing = false;
    this.offsetSec = 0;
    for (const node of this.gainNodes.values()) node.disconnect();
    this.gainNodes.clear();
    this.buffers.clear();
    this.fileNames.clear();
    this.timeline = null;
  }

  loadedStems(): LoadedStem[] {
    const out: LoadedStem[] = [];
    for (const [stem, buffer] of this.buffers) {
      out.push({ stem, fileName: this.fileNames.get(stem) ?? stem, durationSec: buffer.duration });
    }
    return out;
  }

  get durationSec(): number {
    return this.timeline?.durationSec ?? 0;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  /** Current song-timeline position in seconds. */
  position(): number {
    if (!this.playing || !this.ctx) return this.offsetSec;
    const elapsed = this.ctx.currentTime - this.startedAtCtx;
    return Math.min(this.offsetSec + Math.max(0, elapsed), this.durationSec);
  }

  play() {
    if (!this.buffers.size) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    this.startAt(this.offsetSec >= this.durationSec ? 0 : this.offsetSec);
  }

  pause() {
    this.offsetSec = this.position();
    this.stopSources();
    this.playing = false;
  }

  /** Stop and return to the top of the song. */
  stop() {
    this.stopSources();
    this.playing = false;
    this.offsetSec = 0;
  }

  seek(sec: number) {
    const target = Math.min(Math.max(0, sec), this.durationSec);
    if (this.playing) this.startAt(target);
    else this.offsetSec = target;
  }

  setLoop(loop: { a: number; b: number } | null) {
    this.loop = loop && loop.b > loop.a ? loop : null;
  }

  get loopRange(): { a: number; b: number } | null {
    return this.loop;
  }

  /** Apply a mix: per-stem effective gains plus the master gain. */
  applyMix(mix: StemMix) {
    this.mix = mix;
    if (!this.ctx || !this.masterNode) return;
    const now = this.ctx.currentTime;
    this.masterNode.gain.setTargetAtTime(mix.master, now, 0.03);
    for (const [stem, node] of this.gainNodes) {
      node.gain.setTargetAtTime(effectiveStemGain(mix, stem), now, 0.03);
    }
  }

  dispose() {
    this.clear();
    if (this.ticker !== null) {
      window.clearInterval(this.ticker);
      this.ticker = null;
    }
    if (this.masterNode) {
      this.masterNode.disconnect();
      this.masterNode = null;
    }
  }

  /* ------------------------------ internals ------------------------------ */

  private rebuildTimeline() {
    const tracks: StemTrackInput[] = [];
    for (const [stem, buffer] of this.buffers) {
      tracks.push({
        stem,
        durationSec: buffer.duration,
        firstNonSilentSample: firstNonSilentSample(buffer),
        sampleRate: buffer.sampleRate,
      });
    }
    this.timeline = planSongTimeline(tracks);
  }

  /**
   * Start every loaded stem at one context time with one shared song
   * offset. A stem shorter than the offset has already ended: it is not
   * started, never wrapped or padded to catch up.
   */
  private startAt(offset: number) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.buffers.size) return;
    this.stopSources();
    const when = ctx.currentTime + 0.05;
    for (const [stem, buffer] of this.buffers) {
      if (offset >= buffer.duration) continue;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.gainNodes.get(stem)!);
      src.start(when, offset);
      this.sources.push(src);
    }
    this.startedAtCtx = when;
    this.offsetSec = offset;
    this.playing = true;
    this.startTicker();
  }

  private stopSources() {
    for (const src of this.sources) {
      try {
        src.stop();
      } catch {
        /* Already stopped. */
      }
      src.disconnect();
    }
    this.sources = [];
    if (this.ticker !== null) {
      window.clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  private startTicker() {
    if (this.ticker !== null) window.clearInterval(this.ticker);
    this.ticker = window.setInterval(() => {
      if (!this.playing) return;
      const pos = this.position();
      if (this.loop && pos >= this.loop.b) {
        this.startAt(this.loop.a);
        return;
      }
      if (pos >= this.durationSec) {
        this.stopSources();
        this.playing = false;
        this.offsetSec = 0;
        this.onEnded?.();
      }
    }, 50);
  }
}
