import { useSyncExternalStore } from "react";
import { isCoachKeyTransportSecure, normalizeCoachKey } from "./coach-key.ts";

type KeySnapshot = { hasKey: boolean; revision: number };
type BrowserSession = {
  key: string | null;
  snapshot: KeySnapshot;
  listeners: Set<() => void>;
};

const EMPTY_SNAPSHOT: KeySnapshot = Object.freeze({ hasKey: false, revision: 0 });
// This container is created only in the browser. Server renders always see EMPTY_SNAPSHOT.
let session: BrowserSession | undefined;

function browserSession(): BrowserSession | undefined {
  if (typeof window === "undefined") return undefined;
  if (!session) {
    session = { key: null, snapshot: EMPTY_SNAPSHOT, listeners: new Set() };
    window.addEventListener("pagehide", clearCoachSessionKey);
  }
  return session;
}

function updateSession(current: BrowserSession, key: string | null) {
  current.key = key;
  current.snapshot = { hasKey: key !== null, revision: current.snapshot.revision + 1 };
  for (const listener of current.listeners) listener();
}

function subscribe(listener: () => void) {
  const current = browserSession();
  if (!current) return () => {};
  current.listeners.add(listener);
  return () => {
    current.listeners.delete(listener);
  };
}

function getSnapshot() {
  return browserSession()?.snapshot ?? EMPTY_SNAPSHOT;
}

/** Exposes presence only. Credentials never enter React render state or server snapshots. */
export function useCoachKeySession(): KeySnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);
}

export function setCoachSessionKey(raw: string): boolean {
  if (typeof window === "undefined" || !isCoachKeyTransportSecure(window.location.href))
    return false;
  const key = normalizeCoachKey(raw);
  if (!key) return false;
  const current = browserSession();
  if (!current) return false;
  updateSession(current, key);
  return true;
}

export function clearCoachSessionKey(): void {
  if (typeof window === "undefined" || !session) return;
  updateSession(session, null);
}

/** Read only at the explicit Ask action, never while rendering or writing progress. */
export function getCoachSessionKey(): string | null {
  if (typeof window === "undefined" || !isCoachKeyTransportSecure(window.location.href))
    return null;
  return session?.key ?? null;
}
