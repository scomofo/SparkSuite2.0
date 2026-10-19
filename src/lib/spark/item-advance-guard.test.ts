import assert from "node:assert/strict";
import test from "node:test";
import { createItemAdvanceGuard } from "./item-advance-guard.ts";

test("a double click on Next can only advance the same exercise once", () => {
  const guard = createItemAdvanceGuard();
  assert.equal(guard.claim("first"), true);
  assert.equal(guard.claim("first"), false);
  assert.equal(guard.claim("second"), true);
});

test("Skip and Next share the same per-item claim", () => {
  const guard = createItemAdvanceGuard();
  assert.equal(guard.claim("first"), true);
  assert.equal(guard.claim("first"), false);
  assert.equal(guard.claim("second"), true);
  assert.equal(guard.claim(""), false);
});

test("stale callbacks cannot advance previously handled exercises", () => {
  const guard = createItemAdvanceGuard();
  assert.equal(guard.claim("first"), true);
  assert.equal(guard.claim("second"), true);
  assert.equal(guard.claim("first"), false);
});
