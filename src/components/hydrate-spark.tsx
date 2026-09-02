import { useEffect } from "react";
import { useSpark } from "@/store/spark";

export function HydrateSpark() {
  const hydrate = useSpark((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}
