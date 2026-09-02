import { fretNote, fretNoteOn, noteName, roleOfPc, STRING_LABELS } from "@/lib/spark/theory";
import { cn } from "@/lib/utils";

const FRETS = 12;

function toneClass(role: string | null, inScale: boolean) {
  if (role === "1") return "bg-accent text-accent-fg";
  if (role === "3" || role === "b3") return "bg-ember text-accent-fg";
  if (role === "5" || role === "b5" || role === "#5") return "bg-good text-bg";
  if (role === "7" || role === "b7" || role === "bb7") return "bg-fg text-bg";
  if (role) return "bg-raised text-fg ring-1 ring-ember/70";
  if (inScale) return "bg-border text-muted";
  return "";
}

export function TheoryFretboard({
  rootPc,
  qualityId,
  scalePcs = [],
  voicing,
  preferFlats = false,
  labels = STRING_LABELS,
  openPc,
  openFreq,
  onPlay,
}: {
  rootPc: number;
  qualityId: string;
  scalePcs?: number[];
  voicing?: (number | null)[];
  preferFlats?: boolean;
  labels?: readonly string[];
  openPc?: number[];
  openFreq?: number[];
  onPlay?: (stringIndex: number, fret: number) => void;
}) {
  const scaleSet = new Set(scalePcs);
  const n = labels.length;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[20rem]">
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `1.4rem repeat(${FRETS}, minmax(0, 1fr))` }}
          role="grid"
          aria-label={`${n}-string fretboard, 12 frets`}
        >
          <div />
          {Array.from({ length: FRETS }, (_, f) => (
            <div key={`n${f + 1}`} className="pb-1 text-center text-[10px] tabular text-dim">
              {f + 1}
            </div>
          ))}
          {labels.map((_, rev) => {
            const i = n - 1 - rev;
            return (
              <FretRow
                key={`${labels[i]}-${i}`}
                stringIndex={i}
                label={labels[i] ?? ""}
                stringCount={n}
                rootPc={rootPc}
                qualityId={qualityId}
                scaleSet={scaleSet}
                voicingFret={voicing?.[i] ?? null}
                preferFlats={preferFlats}
                openPc={openPc}
                openFreq={openFreq}
                onPlay={onPlay}
              />
            );
          })}
        </div>
        <div
          className="mt-1 grid gap-px"
          style={{ gridTemplateColumns: `1.4rem repeat(${FRETS}, minmax(0, 1fr))` }}
        >
          <div />
          {Array.from({ length: FRETS }, (_, f) => {
            const mark = f + 1;
            const dots = mark === 12 ? 2 : [3, 5, 7, 9].includes(mark) ? 1 : 0;
            return (
              <div key={`m${mark}`} className="flex h-3 items-center justify-center gap-0.5">
                {Array.from({ length: dots }, (_, d) => (
                  <span key={d} className="size-1 rounded-full bg-dim/70" />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FretRow({
  stringIndex,
  label,
  stringCount,
  rootPc,
  qualityId,
  scaleSet,
  voicingFret,
  preferFlats,
  openPc,
  openFreq,
  onPlay,
}: {
  stringIndex: number;
  label: string;
  stringCount: number;
  rootPc: number;
  qualityId: string;
  scaleSet: Set<number>;
  voicingFret: number | null;
  preferFlats: boolean;
  openPc?: number[];
  openFreq?: number[];
  onPlay?: (stringIndex: number, fret: number) => void;
}) {
  const noteAt = (fret: number) =>
    openPc && openFreq
      ? fretNoteOn(openPc, openFreq, stringIndex, fret, preferFlats)
      : fretNote(stringIndex, fret, preferFlats);
  const open = noteAt(0);
  const openRole = roleOfPc(rootPc, qualityId, open.pc);
  return (
    <>
      <button
        type="button"
        onClick={() => onPlay?.(stringIndex, 0)}
        className={cn(
          "flex h-7 items-center justify-center rounded-sm text-[10px] font-medium",
          toneClass(openRole, scaleSet.has(open.pc)) || "text-muted",
          voicingFret === 0 && "ring-1 ring-fg",
        )}
        aria-label={`Open ${open.name}`}
      >
        {label}
      </button>
      {Array.from({ length: FRETS }, (_, f) => {
        const fret = f + 1;
        const note = noteAt(fret);
        const role = roleOfPc(rootPc, qualityId, note.pc);
        const inScale = scaleSet.has(note.pc);
        const painted = Boolean(role || inScale);
        const inVoicing = voicingFret === fret;
        return (
          <button
            key={fret}
            type="button"
            onClick={() => onPlay?.(stringIndex, fret)}
            className={cn(
              "relative flex h-7 items-center justify-center rounded-[3px] border border-border/80 bg-raised/60",
              inVoicing && "ring-1 ring-fg",
            )}
            aria-label={`${note.name} string ${stringCount - stringIndex} fret ${fret}`}
          >
            {painted ? (
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[8px] font-semibold leading-none",
                  toneClass(role, inScale),
                )}
              >
                {role ?? "·"}
              </span>
            ) : null}
          </button>
        );
      })}
    </>
  );
}

export function ChromaticStrip({
  rootPc,
  qualityId,
  preferFlats,
}: {
  rootPc: number;
  qualityId: string;
  preferFlats: boolean;
}) {
  return (
    <div className="grid grid-cols-12 gap-0.5" aria-label="Intervals from the root">
      {Array.from({ length: 12 }, (_, i) => {
        const pc = (rootPc + i) % 12;
        const role = roleOfPc(rootPc, qualityId, pc);
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-sm text-[10px] font-semibold",
                role ? toneClass(role, false) : "bg-raised text-dim",
              )}
            >
              {role ?? ""}
            </div>
            <span className="text-[9px] text-dim">{noteName(pc, preferFlats)}</span>
          </div>
        );
      })}
    </div>
  );
}
