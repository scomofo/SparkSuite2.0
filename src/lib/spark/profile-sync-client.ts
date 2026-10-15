import { getCloudProfile, saveCloudProfile } from "./profile-sync-api";
import {
  applyProfileSnapshot,
  captureProfileSnapshot,
  mergeProfileSnapshots,
  parseProfileBackup,
  profileSnapshotEqual,
  profileSnapshotHasData,
  readProfileSyncMarker,
  sanitizeProfileSnapshot,
  writeProfileSyncMarker,
  type ProfileSnapshot,
} from "./profile-snapshot";
import type { ProfileSyncChoice } from "./profile-events";

export type ProfileSyncResult = {
  status: "synced" | "conflict" | "offline" | "error";
  revision: number;
  updatedAt: string | null;
  applied: boolean;
  message: string;
};

function cloudSnapshot(raw: unknown): ProfileSnapshot | null {
  return sanitizeProfileSnapshot(raw);
}

function applyIfChanged(next: ProfileSnapshot, current: ProfileSnapshot): boolean {
  // Sync calls await the cloud API. If the learner practised in the meantime,
  // never apply a snapshot based on the older local state over their new work.
  const latest = captureProfileSnapshot();
  if (!profileSnapshotEqual(latest, current)) {
    throw new Error("Local progress changed during cloud sync. Your latest work was preserved; sync again to combine it.");
  }
  const changed = !profileSnapshotEqual(next, latest);
  if (changed) applyProfileSnapshot(next);
  return changed;
}

function markerFor(userId: string, revision: number, updatedAt: string | null, snapshot: ProfileSnapshot) {
  return {
    userId,
    revision,
    updatedAt: updatedAt ?? new Date().toISOString(),
    snapshot,
  };
}

async function saveSnapshot(
  snapshot: ProfileSnapshot,
  expectedRevision: number,
) {
  return saveCloudProfile({ data: { payload: snapshot, expectedRevision } });
}

function currentRevision(snapshot: Awaited<ReturnType<typeof getCloudProfile>>) {
  return snapshot.revision;
}

/**
 * Local-first account sync. Every write uses a server revision; stale devices
 * merge against their last synced base instead of silently overwriting newer
 * progress. A first-time account with two non-empty profiles requires a choice.
 */
export async function synchronizeProfile(
  userId: string,
  choice?: ProfileSyncChoice,
): Promise<ProfileSyncResult> {
  try {
    const local = captureProfileSnapshot();
    const marker = readProfileSyncMarker();
    const base = marker?.userId === userId ? marker.snapshot : undefined;
    const cloudRow = await getCloudProfile();
    const cloud = cloudSnapshot(cloudRow.payload);

    if (choice === "use-cloud") {
      if (!cloud) {
        return {
          status: "conflict",
          revision: cloudRow.revision,
          updatedAt: cloudRow.updatedAt,
          applied: false,
          message: "The cloud copy cannot be read safely. Your local progress is preserved; replace the cloud copy with this device to recover.",
        };
      }
      const applied = applyIfChanged(cloud, local);
      writeProfileSyncMarker(markerFor(userId, cloudRow.revision, cloudRow.updatedAt, cloud));
      return {
        status: "synced",
        revision: cloudRow.revision,
        updatedAt: cloudRow.updatedAt,
        applied,
        message: "Cloud progress restored on this computer. A local recovery copy was kept.",
      };
    }

    if (choice === "replace-cloud") {
      const result = await saveSnapshot(local, currentRevision(cloudRow));
      if (!result.ok) {
        return {
          status: "conflict",
          revision: result.current.revision,
          updatedAt: result.current.updatedAt,
          applied: false,
          message: "The cloud profile changed just now. Review the latest version, then confirm replacement again.",
        };
      }
      const saved = cloudSnapshot(result.payload) ?? local;
      const applied = applyIfChanged(saved, local);
      writeProfileSyncMarker(markerFor(userId, result.revision, result.updatedAt, saved));
      return {
        status: "synced",
        revision: result.revision,
        updatedAt: result.updatedAt,
        applied,
        message: "This computer's profile replaced the cloud copy.",
      };
    }

    if (cloudRow.exists && !cloud) {
      return {
        status: "conflict",
        revision: cloudRow.revision,
        updatedAt: cloudRow.updatedAt,
        applied: false,
        message: "The cloud profile could not be read safely. Your local progress is untouched; choose Replace cloud with this device to recover.",
      };
    }

    if (!cloudRow.exists || !cloud) {
      const result = await saveSnapshot(local, 0);
      if (!result.ok) {
        const latest = cloudSnapshot(result.current.payload);
        if (!latest) {
          return {
            status: "conflict",
            revision: result.current.revision,
            updatedAt: result.current.updatedAt,
            applied: false,
            message: "A cloud profile was created on another computer. Choose how to combine it with this device.",
          };
        }
        if (profileSnapshotHasData(local) && profileSnapshotHasData(latest)) {
          return {
            status: "conflict",
            revision: result.current.revision,
            updatedAt: result.current.updatedAt,
            applied: false,
            message: "A cloud profile was created on another computer. Choose merge, restore cloud, or replace cloud.",
          };
        }
        const merged = mergeProfileSnapshots(local, latest);
        const retry = await saveSnapshot(merged, result.current.revision);
        if (!retry.ok) {
          return {
            status: "conflict",
            revision: retry.current.revision,
            updatedAt: retry.current.updatedAt,
            applied: false,
            message: "The cloud profile changed again. Choose a sync option to resolve the conflict.",
          };
        }
        const saved = cloudSnapshot(retry.payload) ?? merged;
        const applied = applyIfChanged(saved, local);
        writeProfileSyncMarker(markerFor(userId, retry.revision, retry.updatedAt, saved));
        return {
          status: "synced",
          revision: retry.revision,
          updatedAt: retry.updatedAt,
          applied,
          message: "Local and cloud progress were combined.",
        };
      }
      const saved = cloudSnapshot(result.payload) ?? local;
      const applied = applyIfChanged(saved, local);
      writeProfileSyncMarker(markerFor(userId, result.revision, result.updatedAt, saved));
      return {
        status: "synced",
        revision: result.revision,
        updatedAt: result.updatedAt,
        applied,
        message: "Your progress is now backed up to your account.",
      };
    }

    const localHasData = profileSnapshotHasData(local);
    const cloudHasData = profileSnapshotHasData(cloud);
    const hasMatchingMarker = marker?.userId === userId;

    if (!hasMatchingMarker) {
      if (!localHasData) {
        const applied = applyIfChanged(cloud, local);
        writeProfileSyncMarker(markerFor(userId, cloudRow.revision, cloudRow.updatedAt, cloud));
        return {
          status: "synced",
          revision: cloudRow.revision,
          updatedAt: cloudRow.updatedAt,
          applied,
          message: "Your cloud progress has been restored on this computer.",
        };
      }
      if (!cloudHasData) {
        const merged = mergeProfileSnapshots(local, cloud);
        const result = await saveSnapshot(merged, cloudRow.revision);
        if (!result.ok) {
          return {
            status: "conflict",
            revision: result.current.revision,
            updatedAt: result.current.updatedAt,
            applied: false,
            message: "The cloud profile changed. Choose how to resolve the sync.",
          };
        }
        const saved = cloudSnapshot(result.payload) ?? merged;
        const applied = applyIfChanged(saved, local);
        writeProfileSyncMarker(markerFor(userId, result.revision, result.updatedAt, saved));
        return {
          status: "synced",
          revision: result.revision,
          updatedAt: result.updatedAt,
          applied,
          message: "Local progress was added to your new cloud profile.",
        };
      }
      if (choice !== "merge") {
        return {
          status: "conflict",
          revision: cloudRow.revision,
          updatedAt: cloudRow.updatedAt,
          applied: false,
          message: "This computer and your account both have progress. Nothing was overwritten; choose how to combine them.",
        };
      }
    }

    if (choice === "merge") {
      const merged = mergeProfileSnapshots(local, cloud, base);
      const result = await saveSnapshot(merged, cloudRow.revision);
      if (!result.ok) {
        return {
          status: "conflict",
          revision: result.current.revision,
          updatedAt: result.current.updatedAt,
          applied: false,
          message: "The cloud profile changed again. Review it and retry the merge.",
        };
      }
      const saved = cloudSnapshot(result.payload) ?? merged;
      const applied = applyIfChanged(saved, local);
      writeProfileSyncMarker(markerFor(userId, result.revision, result.updatedAt, saved));
      return {
        status: "synced",
        revision: result.revision,
        updatedAt: result.updatedAt,
        applied,
        message: "Local and cloud progress were merged.",
      };
    }

    if (marker && marker.userId === userId && cloudRow.revision < marker.revision) {
      return {
        status: "conflict",
        revision: cloudRow.revision,
        updatedAt: cloudRow.updatedAt,
        applied: false,
        message: "The cloud revision is older than this computer's last sync. Local progress was preserved.",
      };
    }

    if (marker && marker.userId === userId && cloudRow.revision === marker.revision) {
      if (profileSnapshotEqual(local, marker.snapshot)) {
        writeProfileSyncMarker(markerFor(userId, cloudRow.revision, cloudRow.updatedAt, cloud));
        return {
          status: "synced",
          revision: cloudRow.revision,
          updatedAt: cloudRow.updatedAt,
          applied: false,
          message: "Your progress is up to date.",
        };
      }
      const result = await saveSnapshot(local, cloudRow.revision);
      if (!result.ok) {
        const latest = cloudSnapshot(result.current.payload);
        if (!latest) {
          return {
            status: "conflict",
            revision: result.current.revision,
            updatedAt: result.current.updatedAt,
            applied: false,
            message: "The cloud profile changed. Choose how to resolve the sync.",
          };
        }
        const merged = mergeProfileSnapshots(local, latest, marker.snapshot);
        const retry = await saveSnapshot(merged, result.current.revision);
        if (!retry.ok) {
          return {
            status: "conflict",
            revision: retry.current.revision,
            updatedAt: retry.current.updatedAt,
            applied: false,
            message: "The cloud profile changed again. Retry sync to preserve both devices' progress.",
          };
        }
        const saved = cloudSnapshot(retry.payload) ?? merged;
        const applied = applyIfChanged(saved, local);
        writeProfileSyncMarker(markerFor(userId, retry.revision, retry.updatedAt, saved));
        return {
          status: "synced",
          revision: retry.revision,
          updatedAt: retry.updatedAt,
          applied,
          message: "Progress from both computers was merged.",
        };
      }
      const saved = cloudSnapshot(result.payload) ?? local;
      const applied = applyIfChanged(saved, local);
      writeProfileSyncMarker(markerFor(userId, result.revision, result.updatedAt, saved));
      return {
        status: "synced",
        revision: result.revision,
        updatedAt: result.updatedAt,
        applied,
        message: "Your latest progress was uploaded.",
      };
    }

    if (marker && marker.userId === userId && cloudRow.revision > marker.revision) {
      if (profileSnapshotEqual(local, marker.snapshot)) {
        const applied = applyIfChanged(cloud, local);
        writeProfileSyncMarker(markerFor(userId, cloudRow.revision, cloudRow.updatedAt, cloud));
        return {
          status: "synced",
          revision: cloudRow.revision,
          updatedAt: cloudRow.updatedAt,
          applied,
          message: "New progress from your other computer was restored.",
        };
      }
      const merged = mergeProfileSnapshots(local, cloud, marker.snapshot);
      const result = await saveSnapshot(merged, cloudRow.revision);
      if (!result.ok) {
        const latest = cloudSnapshot(result.current.payload);
        if (!latest) {
          return {
            status: "conflict",
            revision: result.current.revision,
            updatedAt: result.current.updatedAt,
            applied: false,
            message: "The cloud profile changed. Choose how to resolve the sync.",
          };
        }
        // The original local snapshot and its last-synced base are retained for
        // this retry, so cloud changes are never counted twice in XP.
        const retryMerge = mergeProfileSnapshots(local, latest, marker.snapshot);
        const retry = await saveSnapshot(retryMerge, result.current.revision);
        if (!retry.ok) {
          return {
            status: "conflict",
            revision: retry.current.revision,
            updatedAt: retry.current.updatedAt,
            applied: false,
            message: "The cloud profile changed again. Retry sync to merge both devices safely.",
          };
        }
        const saved = cloudSnapshot(retry.payload) ?? retryMerge;
        const applied = applyIfChanged(saved, local);
        writeProfileSyncMarker(markerFor(userId, retry.revision, retry.updatedAt, saved));
        return {
          status: "synced",
          revision: retry.revision,
          updatedAt: retry.updatedAt,
          applied,
          message: "Progress from both computers was merged.",
        };
      }
      const saved = cloudSnapshot(result.payload) ?? merged;
      const applied = applyIfChanged(saved, local);
      writeProfileSyncMarker(markerFor(userId, result.revision, result.updatedAt, saved));
      return {
        status: "synced",
        revision: result.revision,
        updatedAt: result.updatedAt,
        applied,
        message: "Progress from both computers was merged.",
      };
    }

    // Same revision and same payload, or a safely recovered first sync.
    writeProfileSyncMarker(markerFor(userId, cloudRow.revision, cloudRow.updatedAt, cloud));
    return {
      status: "synced",
      revision: cloudRow.revision,
      updatedAt: cloudRow.updatedAt,
      applied: false,
      message: "Your progress is up to date.",
    };
  } catch (error) {
    return {
      status: "offline",
      revision: 0,
      updatedAt: null,
      applied: false,
      message: error instanceof Error ? error.message : "Cloud sync is unavailable. Your local progress is still saved.",
    };
  }
}

/** Imported backups are validated with the same migration and checkpoint rules. */
export { parseProfileBackup };
