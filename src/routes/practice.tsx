import { createFileRoute, Link } from "@tanstack/react-router";
import { SessionPlayer } from "@/components/session-player";
import { Button } from "@/components/ui/button";
import { useSpark } from "@/store/spark";

export const Route = createFileRoute("/practice")({ component: PracticePage });

function PracticePage() {
  const session = useSpark((s) => s.session);
  const hydrated = useSpark((s) => s.hydrated);
  if (!hydrated) return <p role="status" className="p-8 text-muted">Loading your loop…</p>;
  if (!session) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-5">
        <p className="text-muted">The loop is on Today.</p>
        <Button asChild>
          <Link to="/today">Back to today</Link>
        </Button>
      </div>
    );
  }
  return <SessionPlayer />;
}
