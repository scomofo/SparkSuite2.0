import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  PROFILE_CHANGED_EVENT,
  PROFILE_SYNC_REQUEST_EVENT,
  type ProfileSyncChoice,
} from "@/lib/spark/profile-events";
import { synchronizeProfile } from "@/lib/spark/profile-sync-client";
import { useLearning } from "@/store/learning";
import { useProfileSync } from "@/store/profile-sync";
import { useSpark } from "@/store/spark";

export function HydrateSpark() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id ?? null;
  const userIsDevFallback = user?.isDevFallback ?? false;
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hydrate = useSpark((s) => s.hydrate);
  const reload = useSpark((s) => s.reloadFromStorage);
  const refreshDay = useSpark((s) => s.refreshDay);
  const hydrateLearning = useLearning((s) => s.hydrate);
  const reloadLearning = useLearning((s) => s.reloadFromStorage);
  const setSyncState = useProfileSync((s) => s.setSyncState);
  const [booted, setBooted] = useState(false);
  const [bootedUserId, setBootedUserId] = useState<string | null>(null);
  const pendingAutoSync = useRef(false);
  const readyForCurrentUser = booted && bootedUserId === userId;

  useEffect(() => {
    if (authEnabled && isPending) return;
    let cancelled = false;

    async function initialize() {
      if (authEnabled && userId && !userIsDevFallback) {
        setSyncState({
          status: "checking",
          userId,
          message: "Checking your cloud progress…",
        });
        const result = await synchronizeProfile(userId!);
        if (cancelled) return;
        setSyncState({
          status: result.status,
          userId,
          revision: result.revision,
          lastSyncedAt: result.status === "synced" ? result.updatedAt : useProfileSync.getState().lastSyncedAt,
          message: result.message,
        });
        if (result.applied) {
          reload();
          reloadLearning();
        }
      } else {
        setSyncState({
          status: "local-only",
          userId: null,
          revision: 0,
          lastSyncedAt: null,
          message: authEnabled
            ? "Sign in to sync progress across computers. This device's progress remains available."
            : "Progress is saved locally in this development session.",
        });
      }
      if (cancelled) return;
      hydrate();
      hydrateLearning();
      setBootedUserId(userId);
      setBooted(true);
    }

    void initialize().catch((error: unknown) => {
      if (cancelled) return;
      setSyncState({
        status: "offline",
        userId: userId,
        message: error instanceof Error ? error.message : "Cloud sync is unavailable. Local progress is still saved.",
      });
      hydrate();
      hydrateLearning();
      setBootedUserId(userId);
      setBooted(true);
    });
    return () => {
      cancelled = true;
    };
  }, [
    isPending,
    userId,
    userIsDevFallback,
    hydrate,
    hydrateLearning,
    reload,
    reloadLearning,
    setSyncState,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    function refresh() {
      if (!document.hidden) refreshDay();
    }
    window.addEventListener("focus", refresh, { signal: controller.signal });
    document.addEventListener("visibilitychange", refresh, { signal: controller.signal });
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [refreshDay]);

  useEffect(() => {
    const currentUserId = userId;
    const currentUserIsDevFallback = userIsDevFallback;
    if (!readyForCurrentUser || !authEnabled || !currentUserId || currentUserIsDevFallback) return;
    let timer: number | undefined;
    let running = false;
    let rerun = false;

    async function sync(choice?: ProfileSyncChoice) {
      if (running) {
        rerun = true;
        return;
      }
      running = true;
      setSyncState({
        status: "syncing",
        userId: currentUserId,
        message: "Syncing your progress…",
      });
      try {
        const result = await synchronizeProfile(currentUserId!, choice);
        if (result.applied) {
          reload();
          reloadLearning();
        }
        setSyncState({
          status: result.status,
          userId: currentUserId,
          revision: result.revision,
          lastSyncedAt: result.status === "synced" ? result.updatedAt : useProfileSync.getState().lastSyncedAt,
          message: result.message,
        });
      } catch (error) {
        setSyncState({
          status: "offline",
          userId: currentUserId,
          message: error instanceof Error ? error.message : "Cloud sync failed. Local progress is still saved.",
        });
      } finally {
        running = false;
        if (rerun) {
          rerun = false;
          void sync();
        }
      }
    }

    function onProfileChanged() {
      if (pathname === "/session") {
        pendingAutoSync.current = true;
        return;
      }
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => void sync(), 700);
    }

    function onSyncRequest(event: Event) {
      if (timer !== undefined) window.clearTimeout(timer);
      const choice = (event as CustomEvent<{ choice?: ProfileSyncChoice }>).detail?.choice;
      void sync(choice);
    }

    window.addEventListener(PROFILE_CHANGED_EVENT, onProfileChanged);
    window.addEventListener(PROFILE_SYNC_REQUEST_EVENT, onSyncRequest);
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === "sparksuite.v2" ||
        event.key === "sparksuite.learning.v1" ||
        event.key?.startsWith("sparksuite.loop.")
      ) onProfileChanged();
    };
    window.addEventListener("storage", onStorage);

    if (pathname !== "/session" && pendingAutoSync.current) {
      pendingAutoSync.current = false;
      void sync();
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener(PROFILE_CHANGED_EVENT, onProfileChanged);
      window.removeEventListener(PROFILE_SYNC_REQUEST_EVENT, onSyncRequest);
      window.removeEventListener("storage", onStorage);
    };
  }, [
    pathname,
    readyForCurrentUser,
    userId,
    userIsDevFallback,
    reload,
    reloadLearning,
    setSyncState,
  ]);

  return null;
}
