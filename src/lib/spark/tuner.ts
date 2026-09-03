import { OPEN_FREQ, STRING_NAMES } from "./guitar.ts";

/** YIN pitch detection. Returns Hz or -1. */
export function yinPitch(buf: Float32Array, sampleRate: number, threshold = 0.12): number {
  const n = buf.length;
  if (n < 64 || !Number.isFinite(sampleRate) || sampleRate <= 0) return -1;
  // Silence gate: skip O(n²) work on quiet frames (mic idle).
  let energy = 0;
  for (let i = 0; i < n; i += 4) energy += buf[i] * buf[i];
  if (energy / (n / 4) < 1e-6) return -1;
  const half = Math.floor(n / 2);
  const d = new Float32Array(half);
  for (let tau = 1; tau < half; tau++) {
    let sum = 0;
    for (let i = 0; i < half; i++) {
      const diff = buf[i] - buf[i + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }
  const cmnd = new Float32Array(half);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau < half; tau++) {
    running += d[tau];
    cmnd[tau] = (d[tau] * tau) / running;
  }
  let tau = 2;
  for (; tau < half; tau++) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 < half && cmnd[tau + 1] < cmnd[tau]) tau++;
      break;
    }
  }
  if (tau === half || cmnd[tau] >= threshold) return -1;
  const x0 = tau < 1 ? tau : tau - 1;
  const x2 = tau + 1 < half ? tau + 1 : tau;
  const s0 = cmnd[x0];
  const s1 = cmnd[tau];
  const s2 = cmnd[x2];
  const denom = 2 * (2 * s1 - s2 - s0);
  if (!Number.isFinite(denom) || denom === 0) return sampleRate / tau;
  const better = tau + (s2 - s0) / denom;
  if (!Number.isFinite(better) || better <= 0) return -1;
  return sampleRate / better;
}

export function nearestString(
  freq: number,
  freqs: number[] = OPEN_FREQ,
  names: readonly string[] = STRING_NAMES,
) {
  if (!Number.isFinite(freq) || freq <= 0 || freqs.length === 0) {
    return { index: -1, name: "-", cents: Number.NaN, target: Number.NaN };
  }
  let best = 0;
  let bestC = Infinity;
  for (let i = 0; i < freqs.length; i++) {
    const ref = freqs[i];
    if (!Number.isFinite(ref) || ref <= 0) continue;
    const cents = 1200 * Math.log2(freq / ref);
    if (Math.abs(cents) < Math.abs(bestC)) {
      bestC = cents;
      best = i;
    }
  }
  return { index: best, name: names[best] ?? "-", cents: bestC, target: freqs[best] ?? Number.NaN };
}

/**
 * Downsampled YIN for per-frame tuner ticks (review 2026-09).
 * Halves the buffer (2x fewer taus AND 2x fewer samples ≈ 4x cheaper) then
 * rescales. Call sites should ALSO throttle to ~10-15Hz, not every rAF.
 */
export function yinPitchFast(buf: Float32Array, sampleRate: number, threshold = 0.12): number {
  if (buf.length <= 256) return yinPitch(buf, sampleRate, threshold);
  const halfLen = Math.floor(buf.length / 2);
  const down = new Float32Array(halfLen);
  for (let i = 0; i < halfLen; i++) down[i] = (buf[i * 2] + buf[i * 2 + 1]) * 0.5;
  const hz = yinPitch(down, sampleRate / 2, threshold);
  return hz;
}

export async function startMicAnalyser(): Promise<{
  analyser: AnalyserNode;
  ctx: AudioContext;
  stream: MediaStream;
  stop: () => void;
} | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC({ latencyHint: "interactive" });
    if (ctx.state === "suspended") await ctx.resume();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    return {
      analyser,
      ctx,
      stream,
      stop() {
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
      },
    };
  } catch {
    return null;
  }
}
