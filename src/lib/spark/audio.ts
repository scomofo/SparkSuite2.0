/** Web Audio guitar pluck + metronome. Unlock on first gesture. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let music: GainNode | null = null;
let muted = false;
let visibilityBound = false;
/** Where new voices connect. Normally the sfx bus; a `scheduleRun` gain while one is open. */
let dest: GainNode | null = null;

function out(): AudioNode {
  // Every caller checks `sfx` before scheduling, so this is never null there.
  return dest ?? (sfx as GainNode);
}

export type AudioRun = {
  /** Silence everything scheduled in this run, including notes still in the future. */
  stop: () => void;
};

/**
 * Run `fn` (which schedules voices, possibly far into the future) through one
 * private gain node, and return a handle that can silence all of it at once.
 * Web Audio sources cannot be un-started, so a lab that pre-schedules a whole
 * line needs this to stop on a second tap, a tab switch or unmount.
 */
export function scheduleRun(fn: () => void): AudioRun | null {
  const ac = safeCtx();
  if (!ac || !sfx) return null;
  const bus = ac.createGain();
  bus.connect(sfx);
  const prev = dest;
  dest = bus;
  try {
    fn();
  } finally {
    dest = prev;
  }
  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      const t = ac.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setTargetAtTime(0, t, 0.012);
      window.setTimeout(() => bus.disconnect(), 150);
    },
  };
}

export function getCtx() {
  return ctx;
}

function bindVisibility() {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resumeIfNeeded();
  });
}

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC({ latencyHint: "interactive" });
      master = ctx.createGain();
      sfx = ctx.createGain();
      music = ctx.createGain();
      sfx.gain.value = 0.9;
      music.gain.value = 0.7;
      master.gain.value = muted ? 0 : 0.85;
      sfx.connect(master);
      music.connect(master);
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    bindVisibility();
    return ctx;
  } catch {
    return null;
  }
}

function safeCtx(): AudioContext | null {
  try {
    return unlockAudio();
  } catch {
    return null;
  }
}

export function setMuted(next: boolean) {
  muted = next;
  if (master && ctx) master.gain.setTargetAtTime(next ? 0 : 0.85, ctx.currentTime, 0.02);
}

export function isMuted() {
  return muted;
}

const noiseCache = new Map<number, AudioBuffer>();

function noiseBuffer(length: number) {
  if (!ctx) return null;
  const key = Math.max(24, Math.floor(length));
  const hit = noiseCache.get(key);
  if (hit && hit.sampleRate === ctx.sampleRate) return hit;
  // Cap cache: rapid strums reuse a handful of lengths; evict oldest.
  if (noiseCache.size >= 8) {
    const oldest = noiseCache.keys().next().value;
    if (oldest !== undefined) noiseCache.delete(oldest);
  }
  const buf = ctx.createBuffer(1, key, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < key; i++) data[i] = Math.random() * 2 - 1;
  noiseCache.set(key, buf);
  return buf;
}

function validFreq(freq: number): boolean {
  return typeof freq === "number" && Number.isFinite(freq) && freq > 0;
}

/** Karplus–Strong-ish pluck at `freq` Hz. */
export function pluck(freq: number, when?: number, gain = 0.45) {
  if (!validFreq(freq)) return;
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const period = Math.max(20, Math.round(ac.sampleRate / freq));
  const burst = noiseBuffer(period);
  if (!burst) return;
  const src = ac.createBufferSource();
  src.buffer = burst;
  const comb = ac.createDelay();
  comb.delayTime.value = 1 / freq;
  const fb = ac.createGain();
  fb.gain.value = 0.96;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = Math.min(4200, freq * 8);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 1.6);
  src.connect(comb);
  comb.connect(fb);
  fb.connect(lp);
  lp.connect(comb);
  lp.connect(g);
  g.connect(out());
  src.start(t);
  src.stop(t + 0.04);
}

export function strum(freqs: number[], when?: number) {
  const ac = safeCtx();
  if (!ac) return;
  const t = when ?? ac.currentTime;
  freqs.forEach((f, i) => pluck(f, t + i * 0.012, 0.32));
}

export function strumUp(freqs: number[], when?: number) {
  const ac = safeCtx();
  if (!ac) return;
  const t = when ?? ac.currentTime;
  [...freqs].reverse().forEach((f, i) => pluck(f, t + i * 0.01, 0.26));
}

/** Soft piano-like tone (sine + quiet odd harmonic). */
export function pianoTone(freq: number, when?: number, gain = 0.28) {
  if (!validFreq(freq)) return;
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 1.4);
  g.connect(out());
  ([1, 2, 3] as const).forEach((h, i) => {
    const o = ac.createOscillator();
    o.type = i === 0 ? "sine" : "triangle";
    o.frequency.value = freq * h;
    const hg = ac.createGain();
    hg.gain.value = i === 0 ? 1 : 0.18 / h;
    o.connect(hg);
    hg.connect(g);
    o.start(t);
    o.stop(t + 1.5);
  });
}

export function pianoChord(freqs: number[], when?: number) {
  const ac = safeCtx();
  if (!ac) return;
  const t = when ?? ac.currentTime;
  freqs.forEach((f, i) => pianoTone(f, t + i * 0.008, 0.2));
}

/** Longer piano tone for vocal holds. */
export function pianoHold(freq: number, seconds = 4, when?: number, gain = 0.22) {
  if (!validFreq(freq)) return;
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.08);
  g.gain.setValueAtTime(gain, t + Math.max(0.2, seconds - 0.4));
  g.gain.exponentialRampToValueAtTime(0.0008, t + seconds);
  g.connect(out());
  const o = ac.createOscillator();
  o.type = "sine";
  o.frequency.value = freq;
  o.connect(g);
  o.start(t);
  o.stop(t + seconds + 0.05);
}

/** Round bass note — sine floor, quiet octave, short click. */
export function bassTone(freq: number, when?: number, gain = 0.46) {
  if (!validFreq(freq)) return;
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 1.9);
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = Math.min(720, freq * 8);
  g.connect(lp);
  lp.connect(out());

  const fund = ac.createOscillator();
  fund.type = "sine";
  fund.frequency.value = freq;
  fund.connect(g);
  fund.start(t);
  fund.stop(t + 2);

  const h2 = ac.createOscillator();
  h2.type = "triangle";
  h2.frequency.value = freq * 2;
  const hg = ac.createGain();
  hg.gain.value = 0.14;
  h2.connect(hg);
  hg.connect(g);
  h2.start(t);
  h2.stop(t + 1.3);

  const burst = noiseBuffer(Math.max(24, Math.floor(ac.sampleRate * 0.01)));
  if (burst) {
    const src = ac.createBufferSource();
    src.buffer = burst;
    const cg = ac.createGain();
    cg.gain.setValueAtTime(0.16, t);
    cg.gain.exponentialRampToValueAtTime(0.0008, t + 0.028);
    const clickLp = ac.createBiquadFilter();
    clickLp.type = "lowpass";
    clickLp.frequency.value = 380;
    src.connect(clickLp);
    clickLp.connect(cg);
    cg.connect(out());
    src.start(t);
    src.stop(t + 0.04);
  }
}

/** Hammer-on / pull-off — same pitch engine, no pick click, soft swell. */
export function bassLegato(freq: number, when?: number, gain = 0.4) {
  if (!validFreq(freq)) return;
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.028);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 1.35);
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = Math.min(720, freq * 8);
  g.connect(lp);
  lp.connect(out());

  const fund = ac.createOscillator();
  fund.type = "sine";
  fund.frequency.value = freq;
  fund.connect(g);
  fund.start(t);
  fund.stop(t + 1.5);

  const h2 = ac.createOscillator();
  h2.type = "triangle";
  h2.frequency.value = freq * 2;
  const hg = ac.createGain();
  hg.gain.value = 0.12;
  h2.connect(hg);
  hg.connect(g);
  h2.start(t);
  h2.stop(t + 1.1);
}

/** Muted thud — no pitch. The space between notes. */
export function ghostNote(when?: number) {
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const burst = noiseBuffer(Math.floor(ac.sampleRate * 0.05));
  if (!burst) return;
  const src = ac.createBufferSource();
  src.buffer = burst;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 220;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.28, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.08);
  src.connect(lp);
  lp.connect(g);
  g.connect(out());
  src.start(t);
  src.stop(t + 0.09);
}

export function kick(when?: number) {
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.28);
  o.connect(g);
  g.connect(out());
  o.start(t);
  o.stop(t + 0.3);
}

export function snare(when?: number) {
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const burst = noiseBuffer(Math.floor(ac.sampleRate * 0.12));
  if (!burst) return;
  const src = ac.createBufferSource();
  src.buffer = burst;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.45, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.16);
  src.connect(bp);
  bp.connect(g);
  g.connect(out());
  src.start(t);
  src.stop(t + 0.18);
}

export function hat(when?: number) {
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const burst = noiseBuffer(Math.floor(ac.sampleRate * 0.04));
  if (!burst) return;
  const src = ac.createBufferSource();
  src.buffer = burst;
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7000;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.22, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.05);
  src.connect(hp);
  hp.connect(g);
  g.connect(out());
  src.start(t);
  src.stop(t + 0.06);
}

export function tom(when?: number) {
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(110, t + 0.16);
  g.gain.setValueAtTime(0.4, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.22);
  o.connect(g);
  g.connect(out());
  o.start(t);
  o.stop(t + 0.24);
}

export function drumHit(pad: number, when?: number) {
  if (pad === 0) kick(when);
  else if (pad === 1) snare(when);
  else if (pad === 2) hat(when);
  else tom(when);
}

export function click(accent: boolean, when?: number) {
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = when ?? ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "square";
  o.frequency.value = accent ? 1320 : 880;
  g.gain.setValueAtTime(accent ? 0.12 : 0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g);
  g.connect(out());
  o.start(t);
  o.stop(t + 0.07);
}

export function hitSfx(kind: "perfect" | "good" | "ok" | "miss") {
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = ac.currentTime;
  if (kind === "miss") {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g);
    g.connect(out());
    o.start(t);
    o.stop(t + 0.15);
    return;
  }
  const freq = kind === "perfect" ? 880 : kind === "good" ? 660 : 520;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.07, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  o.connect(g);
  g.connect(out());
  o.start(t);
  o.stop(t + 0.1);
}

export function comboSting(combo: number) {
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = ac.currentTime;
  const root = combo >= 12 ? 523.25 : combo >= 8 ? 392 : 329.63;
  const steps = combo >= 12 ? [0, 4, 7, 12] : combo >= 8 ? [0, 7, 12] : [0, 7];
  steps.forEach((semi, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o.frequency.value = root * Math.pow(2, semi / 12);
    const at = t + i * 0.055;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.07, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
    o.connect(g);
    g.connect(out());
    o.start(at);
    o.stop(at + 0.2);
  });
}

export function markSting() {
  const ac = safeCtx();
  if (!ac || !sfx) return;
  const t = ac.currentTime;
  ;[392, 523.25, 659.25].forEach((freq, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    const at = t + i * 0.07;
    g.gain.setValueAtTime(0.06, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    o.connect(g);
    g.connect(out());
    o.start(at);
    o.stop(at + 0.24);
  });
}

export function resumeIfNeeded() {
  if (ctx?.state === "suspended") void ctx.resume();
}
