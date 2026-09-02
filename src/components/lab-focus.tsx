import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { formatFocus, LAB_FOCUS_SEC } from "@/lib/spark/psychology";

/** Visible time-box on labs and theory. Hyperfocus protection. */
export function LabFocus() {
  const [left, setLeft] = useState(LAB_FOCUS_SEC);

  useEffect(() => {
    const t0 = Date.now();
    const id = window.setInterval(() => {
      setLeft(Math.max(0, LAB_FOCUS_SEC - Math.floor((Date.now() - t0) / 1000)));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const done = left <= 0;
  const pct = (left / LAB_FOCUS_SEC) * 100;

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-surface/95 px-5 py-3 backdrop-blur-sm">
      {done ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-pretty text-sm">That's enough. The day is the loop.</p>
          <Button asChild size="sm">
            <Link to="/today">Today</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-dim">Four minutes. Then stop.</p>
            <p className="tabular text-sm text-ember">{formatFocus(left)}</p>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-raised">
            <div
              className="h-full bg-accent transition-[width] duration-(--motion-quick)"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
