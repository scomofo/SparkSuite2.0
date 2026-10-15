import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Cloud, ShieldCheck } from "lucide-react";
import { authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const [error, setError] = useState("");

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <p role="status" className="text-sm text-muted">Checking your account…</p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-7">
          <p className="studio-label">SparkSuite account</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">You're signed in.</h1>
          <p className="mt-3 text-muted">{user.displayName ?? user.primaryEmail ?? "Your learner account"} is ready.</p>
          <Link to="/account" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 font-medium text-white">
            Continue to account & sync
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-5 sm:p-8">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl sm:p-8">
        <Link to="/" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to SparkSuite
        </Link>
        <div className="mt-7 grid size-12 place-items-center rounded-xl bg-raised text-accent">
          <Cloud className="size-6" aria-hidden="true" />
        </div>
        <p className="studio-label mt-5">Your music, wherever you practise</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Keep your progress with you.</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Sign in to sync lesson completion, instrument profiles, practice history and resumable sessions across your computers.
        </p>
        {authEnabled ? (
          <div className="mt-6 grid gap-3">
            {GROK_PROVIDERS.map((provider) => (
              <button
                key={provider.providerId}
                type="button"
                onClick={() => {
                  setError("");
                  void signIn(provider.providerId, { callbackURL: "/account" }).catch((cause: unknown) => {
                    setError(cause instanceof Error ? cause.message : "Sign-in could not be completed. Please try again.");
                  });
                }}
                className="min-h-12 cursor-pointer rounded-lg border border-border bg-raised px-4 text-left font-medium transition hover:border-accent"
              >
                Continue with {provider.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-lg bg-raised p-3 text-sm text-muted">
            Account sign-in is disabled in this build. Your progress remains saved locally.
          </p>
        )}
        {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Your progress is private to your account. Instrument audio is never recorded or uploaded.
        </p>
      </section>
    </main>
  );
}
