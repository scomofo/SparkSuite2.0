/**
 * Microphone session setup for judged practice: starting the analyser with
 * rejected-initialization recovery, and choosing among the available input
 * devices. Extracted from the session player so the behavior is testable
 * without a browser; the starter is injected for the same reason.
 */

export interface MicHandle {
  analyser: AnalyserNode;
  ctx: AudioContext;
  stream: MediaStream;
  stop: () => void;
}

export type MicAnalyserStarter = (fftSize: number, deviceId?: string) => Promise<MicHandle | null>;

/** 8192 samples improves low-note and chord resolution; onset timestamps use the rolling window's newest chunk. */
export const MIC_FFT_SIZE = 8192;

export type MicInitResult =
  | { status: "started"; mic: MicHandle }
  | { status: "blocked"; error: string }
  | { status: "superseded" };

/**
 * Run one microphone initialization request. `isCurrent` mirrors the
 * session's request counter: once a newer request (or a stop) supersedes
 * this one, its outcome must never touch the UI — a late handle is stopped
 * and a late rejection is swallowed.
 */
export async function initMicrophone(options: {
  startAnalyser: MicAnalyserStarter;
  deviceId?: string;
  request: number;
  isCurrent: (request: number) => boolean;
  isSecureContext: boolean;
}): Promise<MicInitResult> {
  let mic: MicHandle | null;
  try {
    mic = await options.startAnalyser(MIC_FFT_SIZE, options.deviceId);
  } catch {
    // Device/browser initialization may reject rather than return null.
    // Never leave the UI locked in 'starting' with both retry and fallback disabled.
    if (!options.isCurrent(options.request)) return { status: "superseded" };
    return {
      status: "blocked",
      error:
        "Microphone could not start. Check browser/device permissions, then retry or continue without scoring.",
    };
  }
  if (!options.isCurrent(options.request)) {
    mic?.stop();
    return { status: "superseded" };
  }
  if (!mic) {
    return {
      status: "blocked",
      error: options.isSecureContext
        ? "Microphone access failed. Check browser permissions, make sure a microphone is connected, then try again."
        : "Microphones require HTTPS or localhost. Open SparkSuite at a secure address, then try again.",
    };
  }
  return { status: "started", mic };
}

/** Audio inputs from a device enumeration; a failed enumeration reads as no known devices. */
export async function listAudioInputs(
  enumerateDevices: () => Promise<MediaDeviceInfo[]>,
): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await enumerateDevices();
    return devices.filter((device) => device.kind === "audioinput");
  } catch {
    return [];
  }
}

/** The device a started stream actually used, falling back to the requested device. */
export function activeInputDeviceId(
  trackDeviceId: string | undefined,
  requestedDeviceId: string | undefined,
): string {
  return trackDeviceId || requestedDeviceId || "";
}

/**
 * The value the device picker can show: the active device when it is among
 * the enumerated inputs, otherwise the system default ("").
 */
export function selectableDeviceId(
  devices: readonly { deviceId: string }[],
  deviceId: string,
): string {
  return devices.some((device) => device.deviceId === deviceId) ? deviceId : "";
}

/** Devices worth listing in the picker: real inputs, not the synthetic default entry. */
export function listedInputDevices<T extends { deviceId: string }>(devices: readonly T[]): T[] {
  return devices.filter((device) => device.deviceId && device.deviceId !== "default");
}
