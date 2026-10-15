import assert from "node:assert/strict";
import test from "node:test";
import { CURRICULUM } from "./curriculum.ts";
import { defaultProgress } from "./storage.ts";
import {
  emptyProfileSnapshot,
  mergeProfileSnapshots,
  parseProfileBackup,
  profileBackupText,
  profileSnapshotEqual,
  profileSnapshotHasData,
  sanitizeProfileSnapshot,
} from "./profile-snapshot.ts";

test("an empty learner profile is not mistaken for existing progress", () => {
  assert.equal(profileSnapshotHasData(emptyProfileSnapshot()), false);
});

test("portable backups round-trip and reject unknown formats", () => {
  const snapshot = emptyProfileSnapshot();
  snapshot.suite.active = "piano";
  snapshot.suite.apps.piano = { ...defaultProgress(), xp: 25 };
  const backup = profileBackupText(snapshot);
  const restored = parseProfileBackup(backup);
  assert.ok(restored);
  assert.equal(restored.suite.active, "piano");
  assert.equal(restored.suite.apps.piano?.xp, 25);
  assert.equal(parseProfileBackup(JSON.stringify({ format: "other", version: 2 })), null);
});

test("snapshot sanitization drops unknown instruments and invalid checkpoints", () => {
  const sanitized = sanitizeProfileSnapshot({
    version: 1,
    suite: {
      version: 4,
      active: "guitar",
      apps: { guitar: { xp: 30 }, spaceship: { xp: 9999 } },
    },
    learning: { version: 1, records: {}, active: {}, pace: "step" },
    checkpoints: { guitar: "not-json", spaceship: "not-a-checkpoint" },
  });
  assert.ok(sanitized);
  assert.equal(sanitized.suite.apps.guitar?.xp, 30);
  assert.equal("spaceship" in sanitized.suite.apps, false);
  assert.deepEqual(sanitized.checkpoints, {});
});

test("concurrent device progress merges additive XP and unions independent lesson records", () => {
  const base = emptyProfileSnapshot();
  base.suite.apps.guitar = { ...defaultProgress(), xp: 100 };
  const local = structuredClone(base);
  const cloud = structuredClone(base);
  const guitar = base.suite.apps.guitar ?? defaultProgress();
  local.suite.apps.guitar = {
    ...guitar,
    xp: 130,
    history: [...guitar.history, { date: "2026-10-13", accuracy: 0.9, xp: 30 }],
    mastery: { "guitar-em-to-g": 0.7 },
  };
  cloud.suite.apps.guitar = {
    ...guitar,
    xp: 150,
    history: [...guitar.history, { date: "2026-10-14", accuracy: 0.8, xp: 50 }],
    mastery: { "guitar-em-to-g": 0.5, "guitar-g-to-d": 0.4 },
  };
  const guitarLessons = CURRICULUM.filter((lesson) => lesson.instrument === "guitar");
  assert.ok(guitarLessons.length >= 2);
  local.learning.records[guitarLessons[0].id] = { step: 2, reviews: 0 };
  cloud.learning.records[guitarLessons[1].id] = { step: 1, reviews: 0 };
  local.sharedPhrases.guitar = { stage: 1, note: "Keep the chord ringing." };
  cloud.sharedPhrases.piano = { stage: 2, note: "Relax the wrist." };

  const merged = mergeProfileSnapshots(local, cloud, base);
  const progress = merged.suite.apps.guitar!;
  assert.equal(progress.xp, 180);
  assert.equal(progress.history.length, 2);
  assert.equal(progress.mastery["guitar-em-to-g"], 0.7);
  assert.equal(progress.mastery["guitar-g-to-d"], 0.4);
  assert.ok(merged.learning.records[guitarLessons[0].id]);
  assert.ok(merged.learning.records[guitarLessons[1].id]);
  assert.deepEqual(merged.sharedPhrases.guitar, { stage: 1, note: "Keep the chord ringing." });
  assert.deepEqual(merged.sharedPhrases.piano, { stage: 2, note: "Relax the wrist." });
});

test("snapshot equality ignores object key order", () => {
  const a = emptyProfileSnapshot();
  const b = emptyProfileSnapshot();
  b.suite.apps.guitar = { ...defaultProgress(), mastery: { z: 0.5, a: 0.2 } };
  a.suite.apps.guitar = { ...defaultProgress(), mastery: { a: 0.2, z: 0.5 } };
  assert.equal(profileSnapshotEqual(a, b), true);
});
