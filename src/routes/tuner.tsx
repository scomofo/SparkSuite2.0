import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { TunerPanel } from "@/components/tuner-panel";
import { instrumentById } from "@/lib/spark/instruments";
import { useSpark } from "@/store/spark";

export const Route = createFileRoute("/tuner")({ component: TunerPage });

function TunerPage() {
  const instrument = useSpark((s) => s.instrument);
  const inst = instrumentById(instrument);
  const kicker =
    inst.surface === "pads"
      ? "Kick · snare · hat · tom"
      : inst.surface === "keys" || inst.surface === "voice"
        ? "C3 · C4 · C5"
        : inst.stringNames.join(" ");
  return (
    <AppShell>
      <header className="px-5 pb-6 pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-dim">{kicker}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          {inst.surface === "pads" ? "Kit" : "Tuner"}
        </h1>
        <p className="mt-3 text-muted">
          {inst.surface === "pads"
            ? "Reference hits for the four pads. Tap to hear the kit."
            : inst.surface === "voice"
              ? "YIN pitch on the mic, or tap C for a drone."
              : "YIN pitch on the mic, or tap a reference pitch."}
        </p>
      </header>
      <div className="px-5">
        <TunerPanel />
      </div>
    </AppShell>
  );
}
