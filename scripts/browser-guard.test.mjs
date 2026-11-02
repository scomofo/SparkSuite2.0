import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { checkedOutputPath, checkedUrl } from "./browser-guard.mjs";

test("evidence guards work in checkout paths containing spaces and reject siblings/traversal", () => {
  const root = mkdtempSync(join(tmpdir(), "evidence with spaces-"));
  const output = join(root, "screenshots");
  mkdirSync(output);
  assert.equal(checkedOutputPath(join(output, "nested/test.png"), [output]), resolve(output, "nested/test.png"));
  assert.throws(() => checkedOutputPath(join(output, "../secret.png"), [output]), /must be under/);
  assert.throws(() => checkedOutputPath(`${output}-other/test.png`, [output]), /must be under/);
  assert.throws(() => checkedOutputPath(output, [output]), /must be under/);
});

test("an existing evidence symlink cannot write outside the allowed directory", () => {
  const root = mkdtempSync(join(tmpdir(), "evidence-link-"));
  const output = join(root, "screenshots");
  const outside = join(root, "outside");
  mkdirSync(output); mkdirSync(outside);
  symlinkSync(outside, join(output, "escape"), process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => checkedOutputPath(join(output, "escape/secret.png"), [output]), /must be under/);
});

test("the browser target rejects local-file and non-loopback data access", () => {
  assert.throws(() => checkedUrl("file:///secret.json"), /only http/);
  assert.throws(() => checkedUrl("https://example.com/"), /not a loopback/);
  assert.equal(checkedUrl("http://127.0.0.1:8083/"), "http://127.0.0.1:8083/");
});
