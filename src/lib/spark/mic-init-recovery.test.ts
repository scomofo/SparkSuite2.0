import assert from "node:assert/strict";
import test from "node:test";
import {
  activeInputDeviceId,
  initMicrophone,
  listAudioInputs,
  listedInputDevices,
  selectableDeviceId,
  type MicHandle,
} from "./mic-session.ts";

// Behavior tests for microphone initialization and device selection. The
// analyser starter is injected, so rejection, empty, and superseded outcomes
// are exercised directly; runtime browser smoke remains the integration check.

function fakeHandle() {
  let stopped = false;
  const mic = {
    stop: () => {
      stopped = true;
    },
  } as unknown as MicHandle;
  return { mic, wasStopped: () => stopped };
}

const alwaysCurrent = () => true;

test("rejected initialization resolves to blocked with the recovery message", async () => {
  const result = await initMicrophone({
    startAnalyser: async () => {
      throw new Error("permission denied");
    },
    request: 1,
    isCurrent: alwaysCurrent,
    isSecureContext: true,
  });
  assert.equal(result.status, "blocked");
  if (result.status === "blocked") {
    assert.match(result.error, /Microphone could not start/);
    assert.match(result.error, /retry or continue without scoring/);
  }
});

test("successful initialization returns the live handle and passes fft size and device through", async () => {
  const { mic } = fakeHandle();
  let seenFftSize = 0;
  let seenDeviceId: string | undefined;
  const result = await initMicrophone({
    startAnalyser: async (fftSize, deviceId) => {
      seenFftSize = fftSize;
      seenDeviceId = deviceId;
      return mic;
    },
    deviceId: "mic-2",
    request: 1,
    isCurrent: alwaysCurrent,
    isSecureContext: true,
  });
  assert.equal(result.status, "started");
  if (result.status === "started") assert.equal(result.mic, mic);
  assert.equal(seenFftSize, 8192);
  assert.equal(seenDeviceId, "mic-2");
});

test("a null handle on a secure context reports the permissions message", async () => {
  const result = await initMicrophone({
    startAnalyser: async () => null,
    request: 1,
    isCurrent: alwaysCurrent,
    isSecureContext: true,
  });
  assert.equal(result.status, "blocked");
  if (result.status === "blocked") assert.match(result.error, /Microphone access failed/);
});

test("a null handle on an insecure context reports the HTTPS message", async () => {
  const result = await initMicrophone({
    startAnalyser: async () => null,
    request: 1,
    isCurrent: alwaysCurrent,
    isSecureContext: false,
  });
  assert.equal(result.status, "blocked");
  if (result.status === "blocked") assert.match(result.error, /HTTPS or localhost/);
});

test("a superseded request stops its late handle and reports superseded, not started", async () => {
  const { mic, wasStopped } = fakeHandle();
  let current = 1;
  const pending = initMicrophone({
    startAnalyser: async () => mic,
    request: 1,
    isCurrent: (request) => request === current,
    isSecureContext: true,
  });
  current = 2; // A newer request (or a stop) lands while this one is in flight.
  const result = await pending;
  assert.equal(result.status, "superseded");
  assert.equal(wasStopped(), true);
});

test("a superseded request swallows a late rejection instead of reporting blocked", async () => {
  let current = 1;
  const pending = initMicrophone({
    startAnalyser: async () => {
      throw new Error("permission denied");
    },
    request: 1,
    isCurrent: (request) => request === current,
    isSecureContext: true,
  });
  current = 2;
  const result = await pending;
  assert.equal(result.status, "superseded");
});

const device = (deviceId: string, kind = "audioinput", label = "") =>
  ({ deviceId, kind, label }) as MediaDeviceInfo;

test("device enumeration keeps only audio inputs", async () => {
  const devices = await listAudioInputs(async () => [
    device("mic-1"),
    device("cam-1", "videoinput"),
    device("mic-2"),
    device("spk-1", "audiooutput"),
  ]);
  assert.deepEqual(
    devices.map((d) => d.deviceId),
    ["mic-1", "mic-2"],
  );
});

test("device enumeration failure and an empty device list both read as no devices", async () => {
  const failed = await listAudioInputs(async () => {
    throw new Error("enumeration unavailable");
  });
  assert.deepEqual(failed, []);
  const empty = await listAudioInputs(async () => []);
  assert.deepEqual(empty, []);
});

test("the picker shows the preferred device when it is present", () => {
  const devices = [device("mic-1"), device("mic-2")];
  assert.equal(selectableDeviceId(devices, "mic-2"), "mic-2");
});

test("the picker falls back to the system default when the preferred device is absent", () => {
  const devices = [device("mic-1")];
  assert.equal(selectableDeviceId(devices, "mic-gone"), "");
  assert.equal(selectableDeviceId([], "mic-1"), "");
});

test("the active device id prefers the stream's track, then the request, then empty", () => {
  assert.equal(activeInputDeviceId("track-id", "requested-id"), "track-id");
  assert.equal(activeInputDeviceId(undefined, "requested-id"), "requested-id");
  assert.equal(activeInputDeviceId("", ""), "");
  assert.equal(activeInputDeviceId(undefined, undefined), "");
});

test("the picker lists real inputs only, skipping empty ids and the synthetic default", () => {
  const devices = [device("default"), device(""), device("mic-1"), device("mic-2")];
  assert.deepEqual(
    listedInputDevices(devices).map((d) => d.deviceId),
    ["mic-1", "mic-2"],
  );
});
