import { useEffect } from "react";
import { useSpark } from "@/store/spark";

export function HydrateSpark() {
  const hydrate = useSpark((s) => s.hydrate);
  const refreshDay = useSpark((s) => s.refreshDay);
  useEffect(() => {
    hydrate();
    const refresh = () => {
      if (!document.hidden) refreshDay();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(timer);
    };
  }, [hydrate, refreshDay]);
  return null;
}
