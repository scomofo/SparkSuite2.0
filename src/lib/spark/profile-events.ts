export const PROFILE_CHANGED_EVENT = "sparksuite:profile-changed";
export const PROFILE_SYNC_REQUEST_EVENT = "sparksuite:profile-sync-request";

export type ProfileSyncChoice = "merge" | "use-cloud" | "replace-cloud";

export function notifyProfileChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
}

export function requestProfileSync(choice?: ProfileSyncChoice) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PROFILE_SYNC_REQUEST_EVENT, {
      detail: choice ? { choice } : {},
    }),
  );
}
