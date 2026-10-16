import { createFileRoute } from "@tanstack/react-router";
import { StemLab } from "@/components/labs/stem-lab";

export const Route = createFileRoute("/stems")({ component: StemLabPage });

function StemLabPage() {
  return <StemLab />;
}
