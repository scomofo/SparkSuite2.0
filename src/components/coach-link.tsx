import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function CoachLink({ className }: { className?: string }) {
  return (
    <Link
      to="/coach"
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-lg border border-border bg-surface px-4 py-4 transition-colors hover:border-ember/50",
        className,
      )}
    >
      <MessageCircle className="size-5 shrink-0 text-ember" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">Ask your coach</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">
          Find a manageable next step in your learning.
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}
