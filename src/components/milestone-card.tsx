import { Link } from "@tanstack/react-router";
import { CheckCircle2, Music2 } from "lucide-react";
import { INSTRUMENTS, instrumentById, type InstrumentId } from "@/lib/spark/instruments";
import { musicalMilestone } from "@/lib/spark/milestones";
import { useLearning } from "@/store/learning";

export function MilestoneCard({ instrument }: { instrument: InstrumentId }) {
  const record = useLearning((s) => s.data.milestones[instrument]);
  const piece = musicalMilestone(instrument);
  return (
    <section
      aria-label="Musical milestone"
      className="mt-6 rounded-xl border border-ember/40 bg-surface p-5 sm:p-6"
    >
      <p className="studio-label flex items-center gap-2 text-ember">
        <Music2 className="size-4" aria-hidden="true" />{" "}
        {record?.saved ? "Your saved piece" : "First musical milestone"}
      </p>
      <h2 className="mt-3 font-display text-xl font-semibold">{piece.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{piece.goal}</p>
      <Link
        to="/milestone"
        search={{ instrument }}
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ember"
      >
        {record && record.phase !== "saved"
          ? "Resume my piece"
          : record?.saved
            ? "Open my saved piece"
            : "Explore this milestone"}
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}

export function SavedMusic() {
  const { data, hydrated } = useLearning();
  if (!hydrated) return null;
  const pieces = INSTRUMENTS.filter((item) => data.milestones[item.id]?.saved);
  return (
    <section
      aria-label="Saved music"
      className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <p className="studio-label text-ember">Your musical milestones</p>
      <h2 className="mt-2 font-display text-2xl font-semibold">Music to come back to</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {pieces.length
          ? "Your arrangements, tempo choices, and notes for another day. Saved in this browser."
          : "Try a short piece, make it your own, and save a version with a note for next time."}
      </p>
      {pieces.length ? (
        <ul className="mt-4 divide-y divide-border">
          {pieces.map(({ id }) => {
            const piece = musicalMilestone(id);
            const version = data.milestones[id]!.saved!;
            return (
              <li key={id}>
                <Link
                  to="/milestone"
                  search={{ instrument: id }}
                  className="flex min-h-16 items-center gap-3 py-4"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-good" aria-hidden="true" />
                  <span>
                    <span className="block font-medium">{piece.title}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {instrumentById(id).name} · {version.bpm} BPM · Saved {version.savedOn}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Link
          to="/milestone"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-ember"
        >
          Explore a first piece →
        </Link>
      )}
    </section>
  );
}
