import { useEffect, useRef, type MutableRefObject } from "react";
import type { NoteEvent } from "@/lib/spark/practice";

type Props = {
  notesRef: MutableRefObject<NoteEvent[]>;
  consumedRef: MutableRefObject<Set<number>>;
  nowRef: MutableRefObject<number>;
  lookAhead: number;
  flash?: "perfect" | "good" | "ok" | "miss" | null;
};

export function RhythmHighway({ notesRef, consumedRef, nowRef, lookAhead, flash }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef(flash);
  flashRef.current = flash;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    let raf = 0;
    let running = true;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = parent?.clientWidth ?? 360;
      const h = parent?.clientHeight ?? 280;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (parent && ro) ro.observe(parent);

    const draw = () => {
      if (!running) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = "#160f0b";
      ctx.fillRect(0, 0, w, h);

      const hitY = h * 0.82;
      const laneX = w / 2;
      const now = nowRef.current;

      ctx.strokeStyle = "rgba(237,230,218,0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const x = laneX - 48 + i * 24;
        ctx.beginPath();
        ctx.moveTo(x, 12);
        ctx.lineTo(x, h - 8);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,123,58,0.18)";
      ctx.fillRect(laneX - 56, hitY - 10, 112, 20);
      ctx.strokeStyle = "#ff7b3a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laneX - 58, hitY);
      ctx.lineTo(laneX + 58, hitY);
      ctx.stroke();

      const notes = notesRef.current;
      const consumed = consumedRef.current;
      for (let i = 0; i < notes.length; i++) {
        if (consumed.has(i)) continue;
        const n = notes[i];
        const dt = n.t - now;
        if (dt < -0.25 || dt > lookAhead) continue;
        const y = hitY - (dt / lookAhead) * (hitY - 24);
        const isUp = n.kind === "up";
        const r = isUp ? 8 : 12;
        ctx.beginPath();
        if (isUp) {
          ctx.fillStyle = "#ede6da";
          ctx.moveTo(laneX, y - r);
          ctx.lineTo(laneX + r, y + r * 0.6);
          ctx.lineTo(laneX - r, y + r * 0.6);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = "#ff7b3a";
          ctx.arc(laneX, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (n.chord && Math.abs(dt) < 0.45) {
          ctx.fillStyle = "#ede6da";
          ctx.font = "600 13px 'Plus Jakarta Sans Variable', sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(n.chord, laneX + 22, y + 4);
        }
      }

      const f = flashRef.current;
      if (f) {
        const color =
          f === "miss" ? "rgba(196,80,64,0.28)" : f === "perfect" ? "rgba(111,191,115,0.32)" : "rgba(255,170,106,0.28)";
        ctx.fillStyle = color;
        ctx.fillRect(0, hitY - 28, w, 56);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [consumedRef, lookAhead, notesRef, nowRef]);

  return <canvas ref={canvasRef} className="h-full w-full touch-none rounded-lg" />;
}
