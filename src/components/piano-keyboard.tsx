import { cn } from "@/lib/utils";

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const START = 48; // C3
const WHITE_COUNT = 15; // C3–C5

function isWhite(pc: number) {
  return WHITE.includes(pc);
}

export function PianoKeyboard({
  activeMidi,
  expectedMidi,
  chordPcs = [],
  onPlay,
  disabled,
}: {
  activeMidi: number | null;
  expectedMidi?: number | null;
  chordPcs?: number[];
  onPlay: (midi: number) => void;
  disabled?: boolean;
}) {
  const whites: number[] = [];
  for (let m = START; whites.length < WHITE_COUNT; m++) {
    if (isWhite(m % 12)) whites.push(m);
  }
  const blacks = whites.flatMap((w, i) => {
    const pc = w % 12;
    if (pc === 4 || pc === 11) return [];
    const black = w + 1;
    if (!isWhite(black % 12)) return [{ midi: black, after: i }];
    return [];
  });
  const chord = new Set(chordPcs.map((p) => ((p % 12) + 12) % 12));

  return (
    <div className="relative w-full select-none" role="group" aria-label="Piano keyboard">
      <div className="flex">
        {whites.map((midi) => {
          const pc = midi % 12;
          const on = activeMidi === midi;
          const exp = expectedMidi === midi;
          const inChord = chord.has(pc);
          return (
            <button
              key={midi}
              type="button"
              disabled={disabled}
              onPointerDown={(e) => {
                e.preventDefault();
                onPlay(midi);
              }}
              className={cn(
                "relative h-28 flex-1 border-r border-border last:border-r-0 first:rounded-l-md last:rounded-r-md",
                on ? "bg-accent text-accent-fg" : exp ? "bg-ember/40 text-fg" : inChord ? "bg-raised text-ember" : "bg-fg text-bg",
              )}
              aria-label={`Key ${midi}`}
            >
              {pc === 0 ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[9px] font-medium opacity-70">
                  C{Math.floor(midi / 12) - 1}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-16">
        {whites.map((midi, i) => {
          const black = blacks.find((b) => b.after === i);
          if (!black) return <div key={midi} className="relative flex-1" />;
          const on = activeMidi === black.midi;
          const exp = expectedMidi === black.midi;
          const inChord = chord.has(black.midi % 12);
          return (
            <div key={midi} className="relative flex-1">
              <button
                type="button"
                disabled={disabled}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onPlay(black.midi);
                }}
                className={cn(
                  "pointer-events-auto absolute top-0 z-10 h-16 w-[70%] -translate-x-1/2 rounded-b-sm border border-border",
                  "left-full",
                  on ? "bg-accent" : exp ? "bg-ember" : inChord ? "bg-raised" : "bg-bg",
                )}
                aria-label={`Black key ${black.midi}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
