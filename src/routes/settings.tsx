import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { isCoachKeyTransportSecure, normalizeCoachKey } from "@/lib/spark/coach-key";
import {
  clearCoachSessionKey,
  setCoachSessionKey,
  useCoachKeySession,
} from "@/lib/spark/coach-key-session";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

type Availability = "checking" | "allowed" | "unavailable" | "offline";

function SettingsPage() {
  const { hasKey } = useCoachKeySession();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [secure, setSecure] = useState<boolean | null>(null);
  const [availability, setAvailability] = useState<Availability>("checking");
  const [attempt, setAttempt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const errorText = useRef<HTMLParagraphElement>(null);
  const statusText = useRef<HTMLParagraphElement>(null);
  const canUseKey = secure === true && availability === "allowed";

  useEffect(() => {
    setSecure(isCoachKeyTransportSecure(window.location.href));
    function clearDraft() {
      if (input.current) input.current.value = "";
      setDraft("");
      setError("");
      setNotice("");
    }
    window.addEventListener("pagehide", clearDraft);
    return () => window.removeEventListener("pagehide", clearDraft);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setAvailability("checking");
    fetch("/api/coach", { signal: controller.signal, cache: "no-store", redirect: "error" })
      .then(async (response) => {
        if (!response.ok) throw new Error("availability");
        const value: unknown = await response.json();
        if (controller.signal.aborted) return;
        if (
          !value ||
          typeof value !== "object" ||
          !("available" in value) ||
          typeof value.available !== "boolean"
        )
          throw new Error("availability");
        const personalAllowed = "personalKeyAllowed" in value && value.personalKeyAllowed === true;
        setAvailability(personalAllowed ? "allowed" : "unavailable");
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailability("offline");
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (error) errorText.current?.focus();
  }, [error]);
  useEffect(() => {
    if (notice) statusText.current?.focus();
  }, [notice]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if (!canUseKey) return;
    if (!normalizeCoachKey(draft)) {
      setError(
        "Enter an OpenAI API key beginning with sk-. Check that you copied the complete key.",
      );
      errorText.current?.focus();
      return;
    }
    if (!setCoachSessionKey(draft)) {
      setError(
        "Your key could not be held safely on this connection. Open SparkSuite using HTTPS and try again.",
      );
      errorText.current?.focus();
      return;
    }
    setDraft("");
    if (input.current) input.current.value = "";
    setError("");
    setNotice("Ready to try your coach. Your key will be checked when you ask.");
  }

  function remove() {
    clearCoachSessionKey();
    setDraft("");
    if (input.current) input.current.value = "";
    setError("");
    setNotice("Key removed from this session.");
  }

  return (
    <AppShell wide>
      <div className="mx-auto max-w-2xl px-5 pt-8 md:px-8">
        <header>
          <p className="studio-label flex items-center gap-2">
            <Settings className="size-4 text-ember" aria-hidden="true" /> Your studio
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Settings
          </h1>
        </header>
        <section
          aria-labelledby="coach-settings-title"
          className="mt-7 rounded-xl border border-border bg-surface p-5 sm:p-7"
        >
          <p className="studio-label flex items-center gap-2">
            <KeyRound className="size-4 text-ember" aria-hidden="true" /> Your connection
          </p>
          <h2 id="coach-settings-title" className="mt-3 font-display text-2xl font-semibold">
            AI coach
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Use your own OpenAI API key for personal coaching. Requests are billed to your OpenAI
            account.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Your key stays in this tab’s memory. Refreshing or closing the page clears it. When you
            ask the coach, the key is sent through SparkSuite’s server to OpenAI.
          </p>

          {secure === false ? (
            <p
              role="status"
              className="mt-5 rounded-md border border-warn p-4 text-sm leading-relaxed"
            >
              An HTTPS connection is needed to use your key. Open SparkSuite using HTTPS to
              continue.
            </p>
          ) : availability === "checking" ? (
            <p role="status" className="mt-5 text-sm text-muted">
              Checking coach availability…
            </p>
          ) : availability === "unavailable" ? (
            <p
              role="status"
              className="mt-5 rounded-md border border-border bg-bg p-4 text-sm leading-relaxed text-muted"
            >
              The AI coach is not available for personal keys on this site yet. Your guided learning
              is still available.
            </p>
          ) : availability === "offline" ? (
            <div className="mt-5 rounded-md border border-border bg-bg p-4">
              <p role="status" className="text-sm leading-relaxed text-muted">
                We couldn’t check coach availability. Check again before adding a key.
              </p>
              <Button
                variant="ghost"
                className="mt-2"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Check again
              </Button>
            </div>
          ) : null}

          {hasKey ? (
            <div className="mt-5 rounded-lg border border-ember/40 bg-bg p-4">
              <p className="text-sm font-medium">Key held for this session</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {canUseKey
                  ? "Ready to try your coach. Your key has not been verified with OpenAI."
                  : "Your key is in this tab’s memory. Coach access is not available right now."}
              </p>
              <Button variant="secondary" className="mt-3" onClick={remove}>
                Remove key
              </Button>
            </div>
          ) : null}

          <form onSubmit={save} autoComplete="off" className="mt-6">
            <label htmlFor="coach-personal-key" className="block text-sm font-medium">
              OpenAI API key
            </label>
            <input
              ref={input}
              id="coach-personal-key"
              type="password"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={512}
              disabled={!canUseKey}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError("");
                setNotice("");
              }}
              aria-describedby="coach-key-hint"
              aria-invalid={!!error}
              className="mt-3 block min-h-11 w-full rounded-md border border-border bg-bg px-3 text-sm disabled:opacity-50"
            />
            <p id="coach-key-hint" className="mt-2 text-xs leading-relaxed text-muted">
              Adding a key does not make a request or verify the key. It is only used when you
              choose “Ask my coach.”
            </p>
            {error ? (
              <p
                ref={errorText}
                tabIndex={-1}
                role="alert"
                className="mt-4 rounded-md border border-warn p-3 text-sm leading-relaxed"
              >
                {error}
              </p>
            ) : null}
            {notice ? (
              <p
                ref={statusText}
                tabIndex={-1}
                role="status"
                className="mt-4 text-sm leading-relaxed text-muted"
              >
                {notice}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={!canUseKey}
              className="mt-5 h-auto min-h-11 whitespace-normal py-3"
            >
              Use for this session
            </Button>
          </form>
          <Link
            to="/coach"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ember"
          >
            Open coach <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
