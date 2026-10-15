import { useRef, useState, type ChangeEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Cloud, Download, FileUp, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { authEnabled } from "@/lib/auth/client";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { requestProfileSync } from "@/lib/spark/profile-events";
import {
  applyProfileSnapshot,
  captureProfileSnapshot,
  parseProfileBackup,
  profileBackupText,
  PROFILE_SYNC_MARKER_KEY,
} from "@/lib/spark/profile-snapshot";
import { useLearning } from "@/store/learning";
import { useProfileSync } from "@/store/profile-sync";
import { useSpark } from "@/store/spark";

export const Route = createFileRoute("/account")({ component: AccountPage });

function syncLabel(status: string) {
  switch (status) {
    case "checking": return "Checking your account";
    case "syncing": return "Syncing progress";
    case "synced": return "Synced";
    case "conflict": return "Action needed";
    case "offline": return "Cloud unavailable";
    case "error": return "Could not sync";
    default: return "Saved on this computer";
  }
}

function AccountPage() {
  const { user, isPending } = useCurrentUserState();
  const sync = useProfileSync();
  const reload = useSpark((s) => s.reloadFromStorage);
  const reloadLearning = useLearning((s) => s.reloadFromStorage);
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const busy = sync.status === "checking" || sync.status === "syncing";

  function exportBackup() {
    try {
      const blob = new Blob([profileBackupText(captureProfileSnapshot())], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sparksuite-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setError("");
      setNotice("Progress backup exported. Keep it somewhere you control.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The backup could not be exported.");
    }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setNotice("");
    setError("");
    try {
      if (file.size > 1_000_000) throw new Error("This backup is larger than the 1 MB import limit.");
      const snapshot = parseProfileBackup(await file.text());
      if (!snapshot) throw new Error("This file is not a valid SparkSuite progress backup.");
      if (!window.confirm("Restore this backup onto this computer? Current local progress will be kept in a recovery copy first.")) return;
      applyProfileSnapshot(snapshot);
      try {
        localStorage.removeItem(PROFILE_SYNC_MARKER_KEY);
      } catch {
        // A marker is only a sync optimization; the restored local progress remains usable.
      }
      reload();
      reloadLearning();
      setNotice(
        user
          ? "Backup restored locally. Choose Merge to combine it with the cloud, or Replace cloud only if you intend this backup to become the account copy."
          : "Backup restored on this computer. Sign in when you want to sync it with other computers.",
      );
      if (user && authEnabled) {
        useProfileSync.getState().setSyncState({
          status: "conflict",
          userId: user.id,
          message: "A backup was imported locally. Choose how to combine it with the cloud copy.",
        });
      } else {
        useProfileSync.getState().setSyncState({
          status: "local-only",
          userId: null,
          message: "Backup restored locally. Sign in to sync across computers.",
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The backup could not be imported.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <AppShell wide>
      <div className="mx-auto max-w-3xl px-5 pt-8 md:px-8 lg:pt-10">
        <header>
          <p className="studio-label flex items-center gap-2">
            <Cloud className="size-4 text-ember" aria-hidden="true" /> Your learner account
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Account & sync
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Keep your lesson progress, instrument profiles and practice history available on every computer you use.
          </p>
        </header>

        <section className="mt-7 rounded-xl border border-border bg-surface p-5 sm:p-7" aria-labelledby="account-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="studio-label">Account</p>
              <h2 id="account-title" className="mt-2 font-display text-xl font-semibold">
                {isPending ? "Checking sign-in…" : user ? "Signed in" : "Not signed in"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {user
                  ? `Progress is associated with ${user.displayName ?? user.primaryEmail ?? "your account"}.`
                  : "Your current progress stays on this computer until you sign in and sync it."}
              </p>
            </div>
            {user && authEnabled ? <UserButton /> : null}
            {!isPending && !user && authEnabled ? (
              <Link to="/login" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 font-medium text-white">
                Sign in to sync
              </Link>
            ) : null}
          </div>
          {!authEnabled ? (
            <p className="mt-4 rounded-lg bg-raised p-3 text-sm text-muted">
              Account sync is disabled in this build. Local practice and backups still work.
            </p>
          ) : null}
        </section>

        <section className="mt-5 rounded-xl border border-border bg-surface p-5 sm:p-7" aria-labelledby="sync-title">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-raised text-accent">
              {sync.status === "synced" ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <Cloud className="size-5" aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="studio-label">Cloud progress</p>
              <h2 id="sync-title" className="mt-1 font-display text-xl font-semibold">{syncLabel(sync.status)}</h2>
              <p role="status" aria-live="polite" className="mt-2 text-sm leading-relaxed text-muted">
                {sync.message}
              </p>
              {sync.lastSyncedAt ? (
                <p className="mt-2 text-xs text-muted">
                  Last successful sync: {new Date(sync.lastSyncedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>

          {user && authEnabled && !user.isDevFallback ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => requestProfileSync()} disabled={busy}>
                <RefreshCw className="mr-2 size-4" aria-hidden="true" /> {busy ? "Syncing…" : "Sync now"}
              </Button>
            </div>
          ) : null}

          {sync.status === "conflict" && user && authEnabled ? (
            <div className="mt-5 rounded-lg border border-border bg-raised p-4">
              <h3 className="font-semibold">Choose how to resolve this</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Both this computer and your account have progress. Nothing was overwritten. Merge is the safest default; the other options deliberately replace one copy.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => requestProfileSync("merge")} disabled={busy}>
                  Merge local + cloud
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (window.confirm("Restore the cloud copy onto this computer? A local recovery copy will be kept, but this device's current progress will no longer be active.")) {
                      requestProfileSync("use-cloud");
                    }
                  }}
                  disabled={busy}
                >
                  Use cloud copy
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm("Replace the cloud profile with the progress currently on this computer? Other computers will receive this version on their next sync.")) {
                      requestProfileSync("replace-cloud");
                    }
                  }}
                  disabled={busy}
                >
                  Replace cloud with this device
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-5 rounded-xl border border-border bg-surface p-5 sm:p-7" aria-labelledby="backup-title">
          <p className="studio-label flex items-center gap-2">
            <ShieldCheck className="size-4 text-ember" aria-hidden="true" /> Backup & recovery
          </p>
          <h2 id="backup-title" className="mt-2 font-display text-xl font-semibold">Keep your own copy, too.</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Export a portable JSON backup for safekeeping or import one on a new computer. Backups include learner progress, profiles, milestones, shared-phrase notes/stages, practice history and valid resumable checkpoints—not microphone audio or temporary API keys.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportBackup}>
              <Download className="mr-2 size-4" aria-hidden="true" /> Export backup
            </Button>
            <Button variant="ghost" onClick={() => fileInput.current?.click()}>
              <FileUp className="mr-2 size-4" aria-hidden="true" /> Import backup
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              aria-label="Choose a SparkSuite progress backup"
              className="sr-only"
              onChange={(event) => void importBackup(event)}
            />
          </div>
          {notice ? <p role="status" aria-live="polite" className="mt-4 text-sm text-muted">{notice}</p> : null}
          {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
        </section>

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <Upload className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Sync requires an account and an internet connection. Local progress remains usable offline, and cloud updates are revision-checked to avoid silently overwriting changes from another computer.
        </p>
      </div>
    </AppShell>
  );
}
