import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isDayKey } from "../utils.ts";
import { recentSessions, suiteActivity } from "./activity.ts";
import { checkpointText, loadCheckpoint, restoreCheckpoint, saveCheckpoint } from "./checkpoint.ts";
import { generateDailyPlan } from "./daily-plan.ts";
import { INSTRUMENTS } from "./instruments.ts";
import { completeItem, recordHit, skipItem, startSession } from "./session.ts";
import { defaultProgress, defaultSuite, loadSuite, saveSuite } from "./storage.ts";

const TODAY = "2026-09-05";
function memoryStorage() {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  return {
    data,
    storage,
    restore: () => {
      if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
      else Reflect.deleteProperty(globalThis, "localStorage");
    },
  };
}

describe("exercise recovery", () => {
  it("preserves finished exercises and discards unfinished hits for every instrument", () => {
    for (const instrument of INSTRUMENTS) {
      const progress = defaultProgress();
      let session = startSession(progress, generateDailyPlan(progress, TODAY, instrument.id));
      session = completeItem(recordHit(recordHit(session)));
      session = recordHit(session);
      const recovered = restoreCheckpoint(
        checkpointText(session, progress),
        progress,
        instrument.id,
        TODAY,
      );
      assert.ok(recovered, instrument.id);
      assert.equal(recovered.index, 1);
      assert.deepEqual(recovered.results, session.results);
      assert.equal(recovered.itemHits, 0);
      assert.equal(recovered.currentCombo, 0);
      assert.deepEqual(progress.dailyComplete, {});
      assert.equal(progress.xp, 0);
    }
  });

  it("retains skipped positions without awarding them a result", () => {
    const p = defaultProgress();
    const session = completeItem(recordHit(skipItem(startSession(p, generateDailyPlan(p, TODAY)))));
    const recovered = restoreCheckpoint(checkpointText(session, p), p, "guitar", TODAY);
    assert.equal(recovered?.index, 2);
    assert.equal(recovered?.results.length, 1);
    assert.equal(recovered?.results[0].itemId, session.plan.items[1].id);
  });

  it("does not reuse checkpoints after rollover, another instrument, changed curriculum, or a finalized zero-XP session", () => {
    const p = defaultProgress();
    const session = startSession(p, generateDailyPlan(p, TODAY));
    const text = checkpointText(session, p);
    assert.equal(restoreCheckpoint(text, p, "guitar", "2026-09-06"), null);
    assert.equal(restoreCheckpoint(text, p, "piano", TODAY), null);
    assert.equal(
      restoreCheckpoint(text, { ...p, dailyComplete: { [TODAY]: true } }, "guitar", TODAY),
      null,
    );
    const changed = JSON.parse(text);
    changed.fingerprint = "different curriculum";
    assert.equal(restoreCheckpoint(JSON.stringify(changed), p, "guitar", TODAY), null);
  });

  it("recomputes scores and rejects duplicate or out-of-order results", () => {
    const p = defaultProgress();
    const session = completeItem(recordHit(startSession(p, generateDailyPlan(p, TODAY))));
    const saved = JSON.parse(checkpointText(session, p));
    saved.results[0].xp = 999999;
    saved.results[0].accuracy = 999999;
    const recovered = restoreCheckpoint(JSON.stringify(saved), p, "guitar", TODAY);
    assert.equal(recovered?.results[0].xp, session.results[0].xp);
    saved.index = 2;
    saved.results.push(saved.results[0]);
    assert.equal(restoreCheckpoint(JSON.stringify(saved), p, "guitar", TODAY), null);
  });

  it("handles corrupt, oversized, and unavailable storage without crashing", () => {
    const p = defaultProgress();
    for (const text of ["null", "{}", "not json", "x".repeat(100001)])
      assert.equal(restoreCheckpoint(text, p, "guitar", TODAY), null);
    const mem = memoryStorage();
    try {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        get() {
          throw new Error("Blocked");
        },
      });
      assert.deepEqual(loadSuite(), defaultSuite());
      assert.equal(loadCheckpoint(p, "guitar"), null);
      assert.equal(saveCheckpoint(startSession(p), p, "guitar"), false);
    } finally {
      mem.restore();
    }
  });
});

describe("practice activity and saved history", () => {
  it("counts a suite day once across instruments and excludes dates outside the last seven days", () => {
    const activity = suiteActivity(
      {
        guitar: {
          ...defaultProgress(),
          dailyComplete: { "2026-09-05": true, "2026-09-03": true, "2026-08-28": true },
        },
        bass: {
          ...defaultProgress(),
          dailyComplete: { "2026-09-05": true, "2026-09-01": true, "2026-09-06": true },
        },
      },
      TODAY,
    );
    assert.equal(activity.count, 3);
    assert.equal(activity.held, true);
    assert.equal(activity.days[0].key, "2026-08-30");
    assert.equal(activity.days[6].key, TODAY);
  });

  it("combines recent history without changing instrument histories", () => {
    const history = [
      { date: "2026-09-04", xp: 1, accuracy: 0.8 },
      { date: TODAY, xp: 2, accuracy: 0.9 },
    ];
    const entries = recentSessions(
      {
        guitar: { ...defaultProgress(), history },
        bass: { ...defaultProgress(), history: [{ date: "2026-09-03", xp: 3, accuracy: 1 }] },
      },
      2,
    );
    assert.deepEqual(
      entries.map((entry) => entry.xp),
      [2, 1],
    );
    assert.equal(history[0].xp, 1);
  });

  it("validates calendar dates and filters corrupt history before rendering", () => {
    assert.equal(isDayKey("2024-02-29"), true);
    for (const value of ["2026-02-29", "2026-09-31", "not a date", null, "2026-09-01T00:00:00Z"])
      assert.equal(isDayKey(value), false);
    const mem = memoryStorage();
    try {
      mem.data.set(
        "sparksuite.v2",
        JSON.stringify({
          apps: {
            guitar: {
              history: [{ date: "bad" }, { date: TODAY, xp: 2, accuracy: 0.8 }],
              dailyComplete: { bad: true, [TODAY]: true },
            },
          },
        }),
      );
      const progress = loadSuite().apps.guitar!;
      assert.equal(progress.history.length, 1);
      assert.deepEqual(progress.dailyComplete, { [TODAY]: true });
    } finally {
      mem.restore();
    }
  });

  it("saves the latest state even when writing the backup fails", () => {
    const mem = memoryStorage();
    try {
      mem.data.set("sparksuite.v2", JSON.stringify(defaultSuite()));
      mem.storage.setItem = (key, value) => {
        if (key.endsWith(".bak")) throw new Error("Quota");
        mem.data.set(key, value);
      };
      const next = { ...defaultSuite(), apps: { guitar: { ...defaultProgress(), xp: 123 } } };
      saveSuite(next);
      assert.equal(loadSuite().apps.guitar?.xp, 123);
    } finally {
      mem.restore();
    }
  });
});
