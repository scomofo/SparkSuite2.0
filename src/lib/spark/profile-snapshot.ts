import { INSTRUMENTS, type InstrumentId } from "./instruments.ts";
import { localDayKey } from "../utils.ts";
import { emptyLearning, parseLearning, type LearningState } from "./learning.ts";
import { restoreCheckpoint } from "./checkpoint.ts";
import { defaultProgress, defaultSuite, loadSuite, progressFor, sanitizeSuite, type SuiteState } from "./storage.ts";

export const PROFILE_SNAPSHOT_VERSION = 1;
export const PROFILE_SYNC_MARKER_KEY = "sparksuite.sync.v1";
export const PROFILE_RECOVERY_KEY = "sparksuite.sync.recovery.v1";
export const SUITE_STORAGE_KEY = "sparksuite.v2";
export const LEARNING_STORAGE_KEY = "sparksuite.learning.v1";

export type SharedPhraseKey = InstrumentId | "theory";
export type SharedPhraseState = { stage: number; note: string };

export type ProfileSnapshot = {
  version: 1;
  suite: SuiteState;
  learning: LearningState;
  checkpoints: Partial<Record<InstrumentId, string>>;
  sharedPhrases: Partial<Record<SharedPhraseKey, SharedPhraseState>>;
};

export type ProfileSyncMarker = {
  userId: string;
  revision: number;
  updatedAt: string;
  snapshot: ProfileSnapshot;
};

export function emptyProfileSnapshot(): ProfileSnapshot {
  return {
    version: PROFILE_SNAPSHOT_VERSION,
    suite: defaultSuite(),
    learning: emptyLearning(),
    checkpoints: {},
    sharedPhrases: {},
  };
}

export function captureProfileSnapshot(): ProfileSnapshot {
  const suite = loadSuite();
  let learning = emptyLearning();
  try {
    const text = localStorage.getItem(LEARNING_STORAGE_KEY);
    if (text) learning = parseLearning(text);
  } catch {
    // Keep the safe empty learning state if storage is unavailable.
  }
  const checkpoints: ProfileSnapshot["checkpoints"] = {};
  const sharedPhrases: ProfileSnapshot["sharedPhrases"] = {};
  try {
    for (const instrument of INSTRUMENTS) {
      const text = localStorage.getItem(`sparksuite.loop.${instrument.id}`);
      if (
        text &&
        text.length <= 100_000 &&
        restoreCheckpoint(text, progressFor(suite, instrument.id), instrument.id)
      ) checkpoints[instrument.id] = text;
    }
    for (const key of [...INSTRUMENTS.map((instrument) => instrument.id), "theory"] as SharedPhraseKey[]) {
      const text = localStorage.getItem(`shared-phrase-v1:${key}`);
      if (!text || text.length > 2_000) continue;
      try {
        const value = JSON.parse(text) as { stage?: unknown; note?: unknown };
        if (
          typeof value.stage === "number" &&
          Number.isInteger(value.stage) &&
          value.stage >= 0 &&
          value.stage <= 2 &&
          typeof value.note === "string"
        ) sharedPhrases[key] = { stage: value.stage, note: value.note.slice(0, 240) };
      } catch {
        // Ignore one malformed phrase without discarding the rest of the profile.
      }
    }
  } catch {
    // Progress remains portable even if a browser blocks checkpoint storage.
  }
  return { version: PROFILE_SNAPSHOT_VERSION, suite, learning, checkpoints, sharedPhrases };
}

export function sanitizeProfileSnapshot(raw: unknown): ProfileSnapshot | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (value.version !== PROFILE_SNAPSHOT_VERSION) return null;
  const suite = sanitizeSuite(value.suite);
  let learning: LearningState;
  try {
    learning = parseLearning(JSON.stringify(value.learning) ?? "{}");
  } catch {
    learning = emptyLearning();
  }
  const checkpoints: ProfileSnapshot["checkpoints"] = {};
  if (value.checkpoints && typeof value.checkpoints === "object" && !Array.isArray(value.checkpoints)) {
    const rawCheckpoints = value.checkpoints as Record<string, unknown>;
    for (const instrument of INSTRUMENTS) {
      const text = rawCheckpoints[instrument.id];
      if (
        typeof text === "string" &&
        text.length <= 100_000 &&
        restoreCheckpoint(text, progressFor(suite, instrument.id), instrument.id)
      ) checkpoints[instrument.id] = text;
    }
  }
  const sharedPhrases: ProfileSnapshot["sharedPhrases"] = {};
  if (value.sharedPhrases && typeof value.sharedPhrases === "object" && !Array.isArray(value.sharedPhrases)) {
    const rawPhrases = value.sharedPhrases as Record<string, unknown>;
    const validKeys = new Set<string>([...INSTRUMENTS.map((instrument) => instrument.id), "theory"]);
    for (const [key, rawPhrase] of Object.entries(rawPhrases)) {
      if (!validKeys.has(key) || !rawPhrase || typeof rawPhrase !== "object" || Array.isArray(rawPhrase)) continue;
      const phrase = rawPhrase as Record<string, unknown>;
      if (
        typeof phrase.stage === "number" &&
        Number.isInteger(phrase.stage) &&
        phrase.stage >= 0 &&
        phrase.stage <= 2 &&
        typeof phrase.note === "string"
      ) sharedPhrases[key as SharedPhraseKey] = { stage: phrase.stage, note: phrase.note.slice(0, 240) };
    }
  }
  return { version: PROFILE_SNAPSHOT_VERSION, suite, learning, checkpoints, sharedPhrases };
}

export function applyProfileSnapshot(snapshot: ProfileSnapshot): void {
  if (typeof localStorage === "undefined") throw new Error("Browser storage is unavailable.");
  // Keep a recovery copy before replacing local progress. This key is local-only
  // and is intentionally never included in cloud snapshots or exported backups.
  try {
    const current = captureProfileSnapshot();
    localStorage.setItem(PROFILE_RECOVERY_KEY, JSON.stringify(current));
  } catch {
    // The current state can still be replaced if the browser has no spare quota.
  }
  const previousSuite = localStorage.getItem(SUITE_STORAGE_KEY);
  if (previousSuite && previousSuite !== JSON.stringify(snapshot.suite)) {
    try {
      JSON.parse(previousSuite);
      localStorage.setItem("sparksuite.v2.bak", previousSuite);
    } catch {
      // Do not replace a known-good backup with corrupt data.
    }
  }
  localStorage.setItem(SUITE_STORAGE_KEY, JSON.stringify(snapshot.suite));
  localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(snapshot.learning));
  for (const instrument of INSTRUMENTS) {
    const key = `sparksuite.loop.${instrument.id}`;
    const text = snapshot.checkpoints[instrument.id];
    if (text) localStorage.setItem(key, text);
    else localStorage.removeItem(key);
  }
  for (const key of [...INSTRUMENTS.map((instrument) => instrument.id), "theory"] as SharedPhraseKey[]) {
    const storageKey = `shared-phrase-v1:${key}`;
    const phrase = snapshot.sharedPhrases[key];
    if (phrase) localStorage.setItem(storageKey, JSON.stringify(phrase));
    else localStorage.removeItem(storageKey);
  }
}

export function profileSnapshotHasData(snapshot: ProfileSnapshot): boolean {
  const suite = snapshot.suite;
  const hasPractice = Object.values(suite.apps).some((progress) =>
    !!progress && (
      progress.xp > 0 ||
      progress.streak > 0 ||
      progress.history.length > 0 ||
      Object.keys(progress.mastery).length > 0 ||
      Object.keys(progress.dailyComplete).length > 0 ||
      progress.marks.length > 0 ||
      progress.lastCheckin !== null
    ),
  );
  const learning = snapshot.learning;
  const hasLearning =
    Object.keys(learning.records).length > 0 ||
    Object.keys(learning.profiles).length > 0 ||
    Object.keys(learning.milestones).length > 0 ||
    Object.keys(learning.skippedSetup).length > 0 ||
    Object.keys(learning.active).length > 0 ||
    learning.pace !== "step";
  return hasPractice || hasLearning || suite.active !== "guitar" ||
    Object.keys(snapshot.checkpoints).length > 0 || Object.keys(snapshot.sharedPhrases).length > 0;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>).sort().map((key) => [
      key,
      canonical((value as Record<string, unknown>)[key]),
    ]),
  );
}

export function profileSnapshotEqual(a: ProfileSnapshot, b: ProfileSnapshot): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

function latestDay(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return a >= b ? a : b;
}

function mergeProgress(
  local: ReturnType<typeof defaultProgress>,
  cloud: ReturnType<typeof defaultProgress>,
  base?: ReturnType<typeof defaultProgress>,
) {
  const xp = base
    ? Math.max(0, base.xp) + Math.max(0, local.xp - base.xp) + Math.max(0, cloud.xp - base.xp)
    : Math.max(local.xp, cloud.xp);
  const mastery: Record<string, number> = { ...cloud.mastery };
  for (const [key, value] of Object.entries(local.mastery)) mastery[key] = Math.max(mastery[key] ?? 0, value);
  const dailyComplete = { ...cloud.dailyComplete, ...local.dailyComplete };
  const history = new Map<string, { date: string; accuracy: number; xp: number }>();
  for (const entry of [...cloud.history, ...local.history]) {
    history.set(`${entry.date}|${entry.accuracy}|${entry.xp}`, entry);
  }
  const mergedHistory = [...history.values()].sort((a, b) =>
    a.date.localeCompare(b.date) || a.xp - b.xp,
  ).slice(-60);
  const lastPlayedDay = latestDay(local.lastPlayedDay, cloud.lastPlayedDay);
  const localIsLatest = (local.lastPlayedDay ?? "") >= (cloud.lastPlayedDay ?? "");
  return {
    ...cloud,
    version: Math.max(local.version, cloud.version),
    xp,
    level: Math.max(local.level, cloud.level),
    streak: Math.max(local.streak, cloud.streak),
    lastPlayedDay,
    mastery,
    lastAccuracy: localIsLatest ? local.lastAccuracy : cloud.lastAccuracy,
    history: mergedHistory,
    dailyComplete,
    bestCombo: Math.max(local.bestCombo, cloud.bestCombo),
    marks: [...new Set([...cloud.marks, ...local.marks])],
    lastCheckin: localIsLatest ? (local.lastCheckin ?? cloud.lastCheckin) : (cloud.lastCheckin ?? local.lastCheckin),
  };
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

function chooseChanged<T>(local: T | undefined, cloud: T | undefined, base: T | undefined, hasBase: boolean): T | undefined {
  if (!hasBase) return local ?? cloud;
  const localChanged = !sameValue(local, base);
  const cloudChanged = !sameValue(cloud, base);
  if (localChanged && !cloudChanged) return local;
  if (cloudChanged && !localChanged) return cloud;
  if (localChanged && cloudChanged) return local ?? cloud;
  return cloud ?? local;
}

function mergeLearningRecord(
  local: LearningState["records"][string],
  cloud: LearningState["records"][string],
  base: LearningState["records"][string] | undefined,
  hasBase: boolean,
) {
  const localChanged = hasBase && !sameValue(local, base);
  const cloudChanged = hasBase && !sameValue(cloud, base);
  if (hasBase && localChanged && !cloudChanged) return local;
  if (hasBase && cloudChanged && !localChanged) return cloud;
  if (sameValue(local, cloud)) return local;
  const localScore = local.step * 100 + (local.completedOn ? 30 : 0) + local.reviews;
  const cloudScore = cloud.step * 100 + (cloud.completedOn ? 30 : 0) + cloud.reviews;
  const winner = localScore >= cloudScore ? local : cloud;
  const practice = chooseChanged(local.practice, cloud.practice, base?.practice, hasBase);
  return {
    ...winner,
    ...(latestDay(local.completedOn, cloud.completedOn) ? { completedOn: latestDay(local.completedOn, cloud.completedOn)! } : {}),
    reviews: Math.max(local.reviews, cloud.reviews),
    ...(latestDay(local.lastReviewedOn, cloud.lastReviewedOn) ? { lastReviewedOn: latestDay(local.lastReviewedOn, cloud.lastReviewedOn)! } : {}),
    ...(latestDay(local.reviewOn, cloud.reviewOn) ? { reviewOn: latestDay(local.reviewOn, cloud.reviewOn)! } : {}),
    ...(practice ? { practice } : {}),
  };
}

function mergeLearning(
  local: LearningState,
  cloud: LearningState,
  base?: LearningState,
): LearningState {
  const hasBase = !!base;
  const records: LearningState["records"] = {};
  const recordIds = new Set([...Object.keys(local.records), ...Object.keys(cloud.records)]);
  for (const id of recordIds) {
    const l = local.records[id];
    const c = cloud.records[id];
    if (l && c) records[id] = mergeLearningRecord(l, c, base?.records[id], hasBase);
    else records[id] = l ?? c!;
  }
  const active: LearningState["active"] = {};
  const profiles: LearningState["profiles"] = {};
  const skippedSetup: LearningState["skippedSetup"] = {};
  const milestones: LearningState["milestones"] = {};
  const focus: LearningState["focus"] = {};
  for (const instrument of INSTRUMENTS) {
    const id = instrument.id;
    const activeValue = chooseChanged(local.active[id], cloud.active[id], base?.active[id], hasBase);
    const profileValue = chooseChanged(local.profiles[id], cloud.profiles[id], base?.profiles[id], hasBase);
    const milestoneValue = chooseChanged(local.milestones[id], cloud.milestones[id], base?.milestones[id], hasBase);
    const focusValue = chooseChanged(local.focus[id], cloud.focus[id], base?.focus[id], hasBase);
    if (activeValue) active[id] = activeValue;
    if (profileValue) profiles[id] = profileValue;
    if (milestoneValue) milestones[id] = milestoneValue;
    if (focusValue) focus[id] = focusValue;
    if (local.skippedSetup[id] || cloud.skippedSetup[id]) skippedSetup[id] = true;
  }
  return parseLearning(JSON.stringify({
    version: 1,
    records,
    active,
    pace: chooseChanged(local.pace, cloud.pace, base?.pace, hasBase) ?? cloud.pace,
    profiles,
    skippedSetup,
    milestones,
    focus,
  }));
}

function checkpointIndex(text: string | undefined): number {
  if (!text) return -1;
  try {
    const value = JSON.parse(text) as { index?: unknown; date?: unknown };
    return typeof value.index === "number" && value.date === localDayKey()
      ? value.index
      : -1;
  } catch {
    return -1;
  }
}

export function mergeProfileSnapshots(
  local: ProfileSnapshot,
  cloud: ProfileSnapshot,
  base?: ProfileSnapshot,
): ProfileSnapshot {
  const suite = defaultSuite();
  const ids = new Set<InstrumentId>(INSTRUMENTS.map((item) => item.id));
  const apps: SuiteState["apps"] = {};
  for (const id of ids) {
    const localProgress = local.suite.apps[id] ?? defaultProgress();
    const cloudProgress = cloud.suite.apps[id] ?? defaultProgress();
    const baseProgress = base?.suite.apps[id];
    apps[id] = mergeProgress(localProgress, cloudProgress, baseProgress);
  }
  const active = chooseChanged(local.suite.active, cloud.suite.active, base?.suite.active, !!base) ?? cloud.suite.active;
  const mergedSuite: SuiteState = { ...suite, active, apps };
  const mergedLearning = mergeLearning(local.learning, cloud.learning, base?.learning);
  const sharedPhrases: ProfileSnapshot["sharedPhrases"] = {};
  const phraseKeys = [...INSTRUMENTS.map((instrument) => instrument.id), "theory"] as SharedPhraseKey[];
  for (const key of phraseKeys) {
    const localPhrase = local.sharedPhrases[key];
    const cloudPhrase = cloud.sharedPhrases[key];
    const basePhrase = base?.sharedPhrases[key];
    if (localPhrase && cloudPhrase) {
      const selected = chooseChanged(localPhrase, cloudPhrase, basePhrase, !!base);
      if (selected) sharedPhrases[key] = selected;
    } else {
      const selected = localPhrase ?? cloudPhrase;
      if (selected) sharedPhrases[key] = selected;
    }
  }
  const checkpoints: ProfileSnapshot["checkpoints"] = {};
  for (const instrument of INSTRUMENTS) {
    const id = instrument.id;
    const candidates = [local.checkpoints[id], cloud.checkpoints[id]]
      .filter((text): text is string => !!text)
      .sort((a, b) => checkpointIndex(b) - checkpointIndex(a));
    const valid = candidates.find((text) =>
      !!restoreCheckpoint(text, progressFor(mergedSuite, id), id),
    );
    if (valid) checkpoints[id] = valid;
  }
  return sanitizeProfileSnapshot({
    version: PROFILE_SNAPSHOT_VERSION,
    suite: mergedSuite,
    learning: mergedLearning,
    checkpoints,
    sharedPhrases,
  }) ?? emptyProfileSnapshot();
}

export function readProfileSyncMarker(): ProfileSyncMarker | null {
  try {
    const text = localStorage.getItem(PROFILE_SYNC_MARKER_KEY);
    if (!text || text.length > 1_000_000) return null;
    const value = JSON.parse(text) as Record<string, unknown>;
    const snapshot = sanitizeProfileSnapshot(value.snapshot);
    if (
      typeof value.userId !== "string" ||
      !value.userId ||
      typeof value.revision !== "number" ||
      !Number.isInteger(value.revision) ||
      value.revision < 0 ||
      typeof value.updatedAt !== "string" ||
      !snapshot
    ) return null;
    return { userId: value.userId, revision: value.revision, updatedAt: value.updatedAt, snapshot };
  } catch {
    return null;
  }
}

export function writeProfileSyncMarker(marker: ProfileSyncMarker): void {
  localStorage.setItem(PROFILE_SYNC_MARKER_KEY, JSON.stringify(marker));
}

export function parseProfileBackup(text: string): ProfileSnapshot | null {
  if (text.length > 1_000_000) return null;
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    const snapshot = sanitizeProfileSnapshot(raw.profile ?? raw);
    return snapshot;
  } catch {
    return null;
  }
}

export function profileBackupText(snapshot = captureProfileSnapshot()): string {
  return JSON.stringify({
    format: "sparksuite-profile-backup",
    version: PROFILE_SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: snapshot,
  }, null, 2);
}
