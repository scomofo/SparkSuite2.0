import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { discoverTests, runTests, testSuites } from "./run-tests.mjs";

test("test discovery includes newly added nested TypeScript and script regressions", () => {
  const root = mkdtempSync(join(tmpdir(), "test-discovery-"));
  for (const folder of ["scripts/nested", "src/lib/new"]) mkdirSync(join(root, folder), { recursive: true });
  for (const file of ["scripts/one.test.mjs", "scripts/nested/two.test.mjs", "src/lib/new/engine.test.ts", "src/lib/new/engine.ts"]) writeFileSync(join(root, file), "");
  assert.equal(discoverTests(join(root, "scripts"), ".test.mjs").length, 2);
  assert.equal(testSuites(root)[1].files[0], join(root, "src/lib/new/engine.test.ts"));
});

test("a missing suite fails before any other test process starts", async () => {
  const root = mkdtempSync(join(tmpdir(), "empty-test-suite-"));
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "scripts/test.test.mjs"), 'throw new Error("must not run");');
  await assert.rejects(runTests("all", root), /No src test files discovered/);
  await assert.rejects(runTests("src", root), /zero-test success/);
  await assert.rejects(runTests("unknown", root), /Usage:/);
});
