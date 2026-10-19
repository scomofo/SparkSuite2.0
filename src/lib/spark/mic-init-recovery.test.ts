import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// Guard against removing rejected-permission recovery when refactoring the
// browser-only microphone hook. Runtime browser smoke remains the integration check.
test("mic initialization rejects safely and releases the disabled controls", () => {
  const source = readFileSync(new URL("../../components/session-player.tsx", import.meta.url), "utf8");
  const start = source.indexOf("mic = await startMicAnalyser(8192, selectedDeviceId)");
  const recovery = source.slice(start, source.indexOf("if (request !== micRequestRef.current)", start));
  assert.ok(start >= 0, "expected microphone initialization");
  assert.match(recovery, /catch\s*\{/);
  assert.match(recovery, /request === micRequestRef\.current/);
  assert.match(recovery, /setMicStatus\("blocked"\)/);
  assert.match(recovery, /setMicError\(/);
});
