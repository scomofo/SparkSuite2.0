import { create } from "zustand";

export type ProfileSyncStatus =
  | "local-only"
  | "checking"
  | "syncing"
  | "synced"
  | "conflict"
  | "offline"
  | "error";

type ProfileSyncData = {
  status: ProfileSyncStatus;
  userId: string | null;
  revision: number;
  lastSyncedAt: string | null;
  message: string;
};

type ProfileSyncState = ProfileSyncData & {
  setSyncState: (next: Partial<ProfileSyncData>) => void;
};

export const useProfileSync = create<ProfileSyncState>((set) => ({
  status: "local-only",
  userId: null,
  revision: 0,
  lastSyncedAt: null,
  message: "Your progress is saved on this computer.",
  setSyncState: (next) => set(next),
}));
