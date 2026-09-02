import type { InstrumentId } from "@/lib/spark/instruments";
import { cn } from "@/lib/utils";

const SRC: Record<InstrumentId, string> = {
  guitar: "/instruments/guitar.jpg",
  piano: "/instruments/piano.jpg",
  ukulele: "/instruments/ukulele.jpg",
  bass: "/instruments/bass.jpg",
  drums: "/instruments/drums.jpg",
  vocals: "/instruments/vocals.jpg",
};

export function InstrumentMark({ id, className }: { id: InstrumentId; className?: string }) {
  return (
    <img
      src={SRC[id]}
      alt=""
      aria-hidden
      width={128}
      height={128}
      crossOrigin="anonymous"
      className={cn("size-16 shrink-0 rounded-md object-cover ring-1 ring-border", className)}
    />
  );
}
